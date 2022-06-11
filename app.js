const { App } = require('@slack/bolt');
const moment = require('moment')
//const { PrismaClient } = require('@prisma/client')

/*const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})*/
/*
prisma.$on('query', (e) => {
  console.log('Query: ' + e.query)
  console.log('Params: ' + e.params)
  console.log('Duration: ' + e.duration + 'ms')
})
*/
const config = require("dotenv").config().parsed;
// Overwrite env variables anyways
for (const k in config) {
  process.env[k] = config[k];
}
//console.log(process.env)

// Initializes the app with bot token and app token
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  customRoutes: [
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
    
  ],
});

//let db = []
let users = null
let cache = {}

const getUsers = async ({ client }) => {
  const result = await client.users.list()
  return result.members
}

const getResponses = async ({ 
  userId, start, end, channelId, client, say, /*event,*/ messages }) => {
    
  let responses = []
  let prevTs = 0
 
  const cacheId = `${channelId}-${userId}-${start.format('DD-MM-yyyy')}-${end.format('DD-MM-yyyy')}`
  console.log({ cacheId })
  console.log({ cache })
  const cached = cache[cacheId]
  Object.keys(cache).map(id => {
    console.log({ key: id, value: cache[id] })
  })
  /*let latest = end.unix()
  let oldest = start.unix()*/
  if (cached && (cached.length > 0 || cached.length === 0)) {
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
  responses.sort((a, b) => a.rt - b.rt)
  cache[cacheId] = responses
  
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
  if (responses && responses.length) {
    const nums = responses.map(e => e.rt)
    const min = Math.min(...nums)
    const max = Math.max(...nums)
    const avg = (nums.reduce((a, b) => a + b) / nums.length)
    /*const threshold = { d: 7, h: 24, m: 60, s: 60, ss: 0 }
    console.log({ 
      min: humanizeDuration(moment.duration(min, 'seconds'))
    })*/
    return {
      min: humanizeDuration(moment.duration(min, 'seconds')),
      max: humanizeDuration(moment.duration(max, 'seconds')),
      avg: humanizeDuration(moment.duration(avg, 'seconds')),
    }
  } 
  return {
    min: null, max: null, avg: null
  }
}

const getMessages = async ({ client, start, end, channel }) => {
  console.log('getMessages: ')
  console.log({ start, end })
  console.log({ channel })
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
      replies.messages.sort((a, b) => +a.ts - b.ts)
    }
    replies.messages.map(r => messages.push(r))
  }))
  return messages
}

app.message('', async ({ message, say, client, event, ...r }) => {
  //console.log({ r })
  //console.log({ message, /* say */ })
  const thread_ts = message.thread_ts || message.ts;
  
  /*await say({
    text: `Hello <@${message.user}>!`,
    thread_ts
  });*/
  
  if (message.text.includes('show-user-info')) {

  }

  if (message.text.includes('show-users-log')) {
 
  }
});

app.command('/show-user-info', 
  async ({ command, ack, say, client, ...r }) => {
    
  await ack();
  //console.log({ command, ack, respond, r })
  console.log({ command })
  const message = await client.chat.postMessage({ 
    text: 'Show user info: ',
    channel: command.channel_id
  })
  const thread_ts = message.ts
  
  const [user, channel, startDate, endDate] = command.text.split(' ')
  
  let userId = (user.split('|')[0]).replace('<@', '')
  let userName = (user.split('|')[1]).replace('>', '')
  console.log({ user, userId })
  console.log({ userName})
  if (!userId) {
    await say({ 
      text: 'User not found. Using current user ' + 
        command.user,
        thread_ts 
    })
    userId = command.user_id
  } 
  
  let channelId = (channel.split('|')[0]).replace('<#', '')
  console.log({ channel, channelId })
  if (!channelId) {
    await say({ 
      text: 'Channel not found. Using current channel ' + 
        command.channel,
        thread_ts 
    })
    channelId = command.channel_id
  } 
  
  await say({ text: `Analyzing...`, thread_ts })
  const start = startDate ? moment(startDate) : moment().subtract(14, 'days')
  const end = endDate ? moment(endDate) : moment()
  const messages = await getMessages({ client, start, end, channel: channelId })
  const responses = await getResponses({ 
    userId, channelId, start, end, client, say, messages
  })
  const { min, max, avg } = getStatistics({ responses })
  await say({
    text: `
      User id ${userId}
      Statistics for period 
        from ${start.format('DD-MM-yyyy')} 
        to ${end.format('DD-MM-yyyy')}:
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
  let channelId = (channel.split('|')[0]).replace('<#', '')
  await say({ text: `Analyzing...`, thread_ts })
  const start = startDate ? moment(startDate) : moment().subtract(14, 'days')
  const end = endDate ? moment(endDate) : moment()
  const allUsers = users || (await getUsers({ client }))
  const messages = await getMessages({ client, start, end, channel: channelId })
  
  await Promise.all(allUsers.map(async e => {
    
      const responses = await getResponses({ 
        userId: e.id, channelId, start, end, client, say, messages 
      })
     
      if (!responses || !responses.length) {
        return
      }
      
      await Promise.all(responses.filter(r => r.rt > seconds)
        .map(async responce => {
          const link = await client.chat.getPermalink({ 
            channel: channelId, message_ts: responce.ts
          })
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
  await say({ text: `Done.`, thread_ts })
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();