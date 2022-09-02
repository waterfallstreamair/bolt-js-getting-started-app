const { App, ExpressReceiver } = require('@slack/bolt')
const bodyParser = require('body-parser')
const moment = require('moment')
const cTable = require('console.table')
const { isArray, min, max, mean } = require('lodash')
const cors = require('cors')
const NodeCache = require( "node-cache" )
const cache = new NodeCache( { stdTTL: 100, checkperiod: 120 } )

const { validateUserInfo, validateUsersLog } = require('./validator')
const { getSyncData, checkSyncedChannels, checkSyncedThread } = require('./bot-utils')

const prisma = require('./prisma-client')
const { updateUser, getUsers: getSavedUsers } = require('./user')
const { setClient, getUsers, getChannels, getHistory } = require('./api')

const channelsMap = {
  'moneybag': 'money',
  'dart': 'target'
}
const REACTIONS = [
  'moneybag',
  'dart'
]

let users = null
let channels = null

const config = require("dotenv").config().parsed;
// Overwrite env variables anyways
for (const k in config) {
  process.env[k] = config[k];
}
//console.log(process.env)

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: false
})
receiver.router.use(bodyParser.urlencoded({ extended: true }))
receiver.router.use(bodyParser.json())
receiver.router.use(cors())


receiver.router.get('/hello', (req, res) => {
  res.json({ hello: 'hello'})
})

receiver.router.get('/api/v1/users', async (req, res) => {
  const allUsers = await getSavedUsers()
  console.log({ allUsers })
  res.json({ users: allUsers })
})

receiver.router.get('/api/v1/channels', async (req, res) => {
  console.log({ channels })
  res.json({ channels: channels.map(e => e.name) })
})

receiver.router.put('/api/v1/user', async (req, res) => {
  const { userName, channelName } = req.body
  console.log({ userName, channelName })
  const user = users.find(e => e.name == userName).id
  const channel = channels.find(e => e.name == channelName).id
  console.log({ user, channel })
  const updatedUser = await getUserInfo({ user, channel, userName, channelName })
  console.log({ updatedUser })
  res.json({ updatedUser })
})

// Initializes the app with bot token and app token
const app = new App({
  /* receiver, */
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  /*customRoutes: [
    {
      path: '/health-check',
      method: ['GET'],
      handler: (req, res) => {
        console.log({ req, res })
        app.client.chat.postMessage({
          token: process.env.SLACK_BOT_TOKEN,
          channel: 'C03HN1SFFAL',
          text: 'Health check test'
        })
        res.writeHead(200);
        res.end('Health check information displayed here!');
      },
    },
    {
      path: '/api/v1/users',
      method: ['GET'],
      handler: (req, res) => {
        //console.log({ req, res })
        res.writeHead(200);
        //res.end('Health check information displayed here!');
        //res.json(users)
        res.end(JSON.stringify(users.map(e => e.name)))
      },
    },
  ],*/
});

//let cache = {}

/*const getUsers = async () => {
  const result = await app.client.users.list()
  return result.members
}*/

/*const getChannels = async () => {
  const result = await app.client.conversations.list()
  return result.channels
}*/

const getResponses = async ({
  userId, start, end, channelId, messages }) => {

  let responses = []
  let prevTs = null

  const cacheId =
    `${channelId}-${userId}-${start.format('DD-MM-yyyy')}-${end.format('DD-MM-yyyy')}`
  const cached = cache.get(cacheId)
  //console.log({ cached })
  if (cached && isArray(cached)) {
    console.log({ cached })
    if (moment().diff(end, 'days') > 0) {
      return cached
    }
  }

  await Promise.all(messages.map(async r => {
    if (r.text.includes(`@${userId}`)) {
      prevTs = r.ts
    } else if (r.user == userId && prevTs) {
      const rt = +r.ts - prevTs
      prevTs = null
      responses.push({ user: userId, rt, text: r.text, ts: r.ts })
    }
  }))
  cache.set(cacheId, responses)
  //console.log({ cache })

  return responses
}

const humanizeDuration = d => {
  const s = d.get('seconds') ? `${d.get('seconds')}s ` : ''
  const m = d.get('minutes') ? `${d.get('minutes')}m ` : ''
  const h = d.get('hours') ? `${d.get('hours')}h ` : ''
  const days = d.get('days') ? `${d.get('days')} days ` : ''
  const months = d.get('months') ? `${d.get('months')} months ` : ''
  return `${months}${days}${h}${m}${s}`
}

const getStatistics = ({ responses }) => {
  if (responses && isArray(responses)) {
    const nums = responses.map(e => Math.floor(e.rt))
    const minNum = min(nums)
    const maxNum = max(nums)
    const avgNum = mean(nums)
    return {
      min: humanizeDuration(moment.duration(minNum, 'seconds')),
      max: humanizeDuration(moment.duration(maxNum, 'seconds')),
      avg: humanizeDuration(moment.duration(avgNum, 'seconds')),
      minNum,
      maxNum,
      avgNum,
    }
  }
  return {}
}

const getMessages = async ({ start, end, channel }) => {
  console.log('getMessages')
  const cachedMessages = cache.get('messages')
  if (cachedMessages) {
    return cachedMessages
  }
  /*const { client } = app
  let messages = []
  const h = await client.conversations.history({
    channel,
    latest: end.unix(),
    oldest: start.unix(),
    inclusive: true,
    limit: 999,
    include_all_metadata: true
  })
  h.messages.sort((a, b) => +a.ts - b.ts)
  await Promise.all(h.messages.map(async e => {
    let replies = { messages: [e] }
    if (e.reply_count) {
      replies = await client.conversations.replies({
        channel,
        latest: end.unix(),
        oldest: start.unix(),
        inclusive: true,
        limit: 999,
        ts: e.ts
      })
      //replies.messages.sort((a, b) => +a.ts - b.ts)
    }
    replies.messages.map(r => messages.push(r))
  }))
  messages.sort((a, b) => +a.ts - b.ts)*/
  const messages = await getHistory({ start, end, channel })
  cache.set('messages', messages, 15)
  return messages
}

app.message('', async ({ message, say, client, event, ...r }) => {
  //console.log('message1', message)
  const { ts, thread_ts, user, text } = message

  if (thread_ts && ts !== thread_ts) {
    try {
      const replies = await client.conversations.replies({
        channel: event.channel,
        ts: thread_ts,
      })
      const threadSynced = checkSyncedThread(replies.messages)
      //console.log('isThreadSynced=========:', threadSynced)
      if (threadSynced) {
        const userName = users.filter(u => u.id === user)[0].name
        for await (const thread of threadSynced) {
            //console.log('thread=========:', thread)
            const postToTarget = await client.chat.postMessage({
              channel: thread.id,
              thread_ts: thread.ts,
              text: `
              From user: <@${userName}>\n
              Message: ${text}
              `,
            })
        }
      }
    }
    catch(e) {
      console.log('error:', e);
    }
  }
})


app.event('reaction_added', async ({client, event}) => {
  const { reaction } = event;
  // console.log('reaction', reaction)
  // console.log('channels', channels)

  if (REACTIONS.includes(reaction)) {
    const targetChannelName = channelsMap[reaction]
    const targetChannelId = channels.filter(item => item.name === targetChannelName).length && channels.filter(item => item.name === targetChannelName)[0].id

    try {
      // const sourceChannelName = channels.filter(item => item.id === event.item.channel).length && channels.filter(item => item.id === event.item.channel)[0].name
      const replies = await client.conversations.replies({
        channel: event.item.channel,
        ts: event.item.ts,
      })
      const isReactionSynced = checkSyncedChannels(targetChannelId, replies.messages)
      // console.log('isReactionSynced=========:', isReactionSynced)

      if (!isReactionSynced) {
        const parentMessage = replies.messages[0];
        const parentUserName = users.filter(u => u.id === parentMessage.user)[0].name
        const postToTarget = await client.chat.postMessage({
          channel: targetChannelId,
          text: `
          Synced::${event.item.channel}::${event.item.ts}::\n
          From user: <@${parentUserName}>\n
          Message: ${parentMessage.text}
          `,
        })

        const sync = await client.chat.postMessage({
          channel: event.item.channel,
          thread_ts: event.item.ts,
          text: `Synced::${targetChannelId}::${postToTarget.ts}`,
        })

        const threadTs = postToTarget.ts;
        for await (const [i, reply] of replies.messages.entries()) {
          if (i > 0) {
            //console.log('reply=========:', reply)
            const userName = users.filter(u => u.id === reply.user)[0].name
            const post = await client.chat.postMessage({
              channel: targetChannelId,
              text: `From: <@${userName}>

              Message: ${reply.text}
              `,
              thread_ts: threadTs
            });
          }
        }
      }
    }
    catch(e) {
      console.log('error:', e);
    }
  }
});




const getUserInfo = async ({ user, channel, userName, channelName }) => {
  console.log({ user, channel, userName, channelName })
  const start = moment().subtract(90, 'days')
  const end = moment()
  const messages = await getMessages({ start, end, channel })
  const responses = await getResponses({
    userId: user, channelId: channel, start, end, messages
  })
  const { min, max, avg, } = getStatistics({ responses })
  const updatedUser = await updateUser({
    user: userName,
    channel: channelName,
    min: min || '',
    max: max || '',
    avg: avg || '',
    start: start.format('DD-MM-yyyy hh:mm:ss'),
    end: end.format('DD-MM-yyyy hh:mm:ss') })
  console.log({ updatedUser })
  return {
   // min, max, avg, start, end, user: userName, channel: channelName
   ...updatedUser
  }
}

app.command('/show-user-info',
  async ({ command, ack, say, client, ...r }) => {
  await ack();
  const message = await client.chat.postMessage({
    text: 'Show user info: ',
    channel: command.channel_id
  })
  const thread_ts = message.ts

  const [user, channel, startDate, endDate] = command.text.split(' ')
  const valid = validateUserInfo({ user, channel })
  if (!valid) {
    /*validateUserInfo.errors.map(e => {
      console.log({ message: e.message, params: e.params })
    })*/
    await say({ text: `Please use this command format:
      /show-user-info [user] [channel]

      \`${JSON.stringify(validateUserInfo.errors)}\`
    `, thread_ts })
    //return
  }

  const userName = valid ? user.replace('@', '') : command.user_name
  const userId = valid ? users.filter(item => item.name === userName)[0].id : command.user_id

  //let userId = valid ? (user.split('|')[0]).replace('<@', '') : command.user_id
  //let userName = valid ? (user.split('|')[1]).replace('>', '') : command.user_name

  if (!valid) {
    await say({
      text: 'Using current user ' +
        command.user_name,
        thread_ts
    })
  }

 // console.log('channels===============', channels);
  const channelName = valid ? channel.replace('#', '') : command.channel_name
  const channelId = valid ? channels.filter(item => item.name === channelName)[0].id : command.channel_id

  //let channelId = valid ? (channel.split('|')[0]).replace('<#', '') : command.channel_id
  //let channelName = valid ? (channel.split('|')[1]).replace('>', '') : command.channel_name

  if (!valid) {
    await say({
      text: 'Using current channel ' +
        command.channel_name,
        thread_ts
    })
  }

  await say({ text: `Analyzing...`, thread_ts })
  const { start, end, min, max, avg } = await getUserInfo({
    user: userId, channel: channelId, userName, channelName })
  /*
  const start = startDate ? moment(startDate) : moment().subtract(90, 'days')
  const end = endDate ? moment(endDate) : moment()
  const messages = await getMessages({ client, start, end, channel: channelId })
  const responses = await getResponses({
    userId, channelId, start, end, messages
  })
  const { min, max, avg, minNum, maxNum, avgNum, } = getStatistics({ responses })
  const updatedUser = await updateUser({
    user: userName,
    min: min || '',
    max: max || '',
    avg: avg || '',
    start: start.format('DD-MM-yyyy'), end: end.format('DD-MM-yyyy') })
  console.log({ updatedUser })
  */
  await say({
    text: `
      User id ${userId}
      User name ${userName}
      Statistics for period
        from ${start}
        to ${end}:
      Min response = ${min || 'no data'}
      Max response = ${max || 'no data'}
      Avg response = ${avg || 'no data'}
    `,
    thread_ts
  });
  await say({ text: `Done.`, thread_ts })
});

app.command('/show-users-log',
  async ({ command, ack, say, client, ...r }) => {
  await ack();
  const message = await client.chat.postMessage({
    text: 'Show users log: ',
    channel: command.channel_id
  })
  const thread_ts = message.ts
  const [channel, seconds, startDate, endDate] = command.text.split(' ')

  const valid = validateUsersLog({ channel, seconds: +seconds })
  if (!valid) {
    /*validateUsersLog.errors.map(e => {
      console.log({ message: e.message, params: e.params })
    })*/
    await say({ text: `Please use this command format:
      /show-users-log [channel] [seconds]

      \`${JSON.stringify(validateUsersLog.errors)}\`
    `, thread_ts })
    //return
  }

  const channelName = valid ? channel.replace('#', '') : command.channel_name
  const channelId = valid ? channels.filter(item => item.name === channelName)[0].id : command.channel_id

  //let channelId = valid ? (channel.split('|')[0]).replace('<#', '') : command.channel_id
  //let channelName = valid ? (channel.split('|')[1]).replace('>', '') : command.channel_name

  await say({ text: `Analyzing...`, thread_ts })
  if (!valid) {
    await say({ text: `
      Using current channel: ${command.channel_name}
      Using parameter seconds: 0`, thread_ts })
  }
  const start = startDate ? moment(startDate) : moment().subtract(90, 'days')
  const end = endDate ? moment(endDate) : moment()
  await say({ text: `
    Statistics for period
        from ${start.format('DD-MM-yyyy')}
        to ${end.format('DD-MM-yyyy')}:
  `, thread_ts })

  //const allUsers = await client.conversations.members({ channel: channelId })
  const messages = await getMessages({ client, start, end, channel: channelId })
  let rows = []
  await Promise.all(users.filter(u => !u.is_bot)
    .map(async e => {

      const responses = await getResponses({
        userId: e.id, channelId, start, end, messages
      })

      if (!responses || !isArray(responses)) {
        return
      }

      await Promise.all(responses.filter(r => r.rt > (seconds || 0))
        .map(async responce => {
          const link = await client.chat.getPermalink({
            channel: channelId, message_ts: responce.ts
          })
          const info = {
            user: e.name || 'name not found',
            response:
                humanizeDuration(moment.duration(responce.rt, 'seconds'))
                || 'response time not found',
            channel: channelName,
            link: `<${link.permalink}|Link>`,
          }
          rows.push(info)
          //rows.push([info.user, info.response, info.link])

          await say({
            text: `
              User: ${e.name || 'name not found'}:
              Date: ${moment.unix(+responce.ts).format('DD-MM-yyyy hh:mm:ss') || 'time stamp not found'}
              Response: ${humanizeDuration(moment.duration(responce.rt, 'seconds')) || 'responce time not found'}
              Text: ${responce.text || 'text not found'}
              Link: ${`<${link.permalink}|...>`}
              =================

          `,
            thread_ts
          })

        })
      )
    })
  )
  //console.log({ rows })

  const t = cTable.getTable(rows)

  const text = t.split('\n').slice(2).join('\n')
  //console.log({ text })
  await say({ text: `Result as a table: \n${text}`, thread_ts })
  await say({ text: `Done.`, thread_ts })
});

const init = async () => {
  const { client } = app
  setClient(client)
  users = await getUsers()
  console.log(cTable.getTable(users.map(u => ({ id: u.id, name: u.name }))))
  channels = await getChannels()
  console.log(cTable.getTable(channels.map(c => ({ id: c.id, name: c.name }))))
}

(async () => {
  try {
    await init()
    await app.start(process.env.PORT || 3000);
    await receiver.start(3002);

    console.log('⚡️ Bolt app is running!');
   } catch(e) {
     console.error({ e })
     process.exit(1)
   } finally {
     prisma.$disconnect()
   }
})();