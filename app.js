const { App } = require('@slack/bolt');
const moment = require('moment')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  /*log: [
    {
      emit: 'stdout',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],*/
  log: ['query', 'info', 'warn', 'error'],
})
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

let db = []
let channels = []
let users = []
let cache = {}

const getChannels = async ({ client }) => {
  if (!channels.length) {
    const result = await client.conversations.list()
    channels = result.channels
  }
  return channels
}

const getUsers = async ({ client }) => {
  if (!users.length) {
    const result = await client.users.list()
    users = result.members
  }
  return users
}

const channelToId = async ({ channel, client }) => {
  const result = await client.conversations.list()
  return (result.channels.find(e => e.name == channel) || {}).id
}

const getResponses = async ({ 
  userId, seconds, start, end, channelId, client, say, event }) => {
    console.log({ start, end })
  let responses = []
  let prevTs = 0
  
  /*const allResponses = await prisma.response.findMany()
  console.log({ allResponses })*/
  
  const cacheId = `${channelId}-${userId}-${start.format('DD-MM-yyyy')}-${end.format('DD-MM-yyyy')}`
  console.log({ cacheId })
  console.log({ cache })
  const cached = cache[cacheId]
  Object.keys(cache).map(id => {
    console.log({ key: id, value: cache[id] })
  })
  let latest = end.unix()
  let oldest = start.unix()
  if (cached && cached.length) {
    if (moment().diff(end, 'days') !== 0) { 
      return cached
    }
    const maxTs = Math.max(...cached.map(e => +e.ts))
    oldest = maxTs || oldest
    responses = cached
  }
  db = await client.conversations.history({
    channel: channelId,
    latest,
    oldest,
    inclusive: false,
    limit: 999,
    include_all_metadata: true
  })
  db.messages.sort((a, b) => +a.ts - b.ts)
  
  await Promise.all(db.messages.map(async e => {
    let replies = {}
    if (e.reply_count) {
      replies = await client.conversations.replies({
        channel: channelId,
        latest: end.unix(),
        oldest: start.unix(),
        inclusive: true,
        limit: 999,
        ts: e.ts
      })
      replies.messages.sort((a, b) => +a.ts - b.ts)
    } else {
      replies = { messages: [e] }
    }
    
    await Promise.all(replies.messages.map(async r => {
      if (r.text.includes(`@${userId}`)) {
        prevTs = r.ts
        //console.log({ mentioned: r })
      } else if (r.user == userId && prevTs) {
        const rt = +r.ts - prevTs
        prevTs = null
        //console.log({ responced: r })
       
        responses.push({ user: userId, rt, text: r.text, ts: r.ts })
        //console.log({ responses })
        /*const createOne = await prisma.response.create({
          data: { user: userId, rt: `${rt}`, text: r.text, ts: r.ts },
          //skipDuplicates: true, 
        })
        console.log({ createOne })*/
      } 
    }))
    
  }))
  responses.sort((a, b) => a.rt - b.rt)
  //if (responses && responses.length) {
    cache[cacheId] = responses
  //}
  /*const createMany = await prisma.user.createMany({
    data: [
      { name: '1', email: 'hello@hello.localhost' },
      { name: '2', email: 'hello@hello.localhost' }, // Duplicate unique key!
      { name: '3', email: 'hello2@hello.localhost' },
      { name: '4', email: 'hello3@hello.localhost' },
    ],
    skipDuplicates: true, // Skip '2'
  })*/
  /*const createMany = await prisma.response.createMany({
    data: responses,
    //skipDuplicates: true, 
  })
  console.log({ createMany })*/
  
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

const userToId = async ({ userName, client }) => {
  //const result = await client.users.list();
  /*console.log({ result })
  console.log({ members: result.members })
  //console.log(result.members.map(e => e.profile))*/
  /*return (result.members.find(item => 
    [item.name, item.profile.display_name].includes(userName)) || {}).id*/
    const found = (await getUsers({ client })).find(item => 
      [item.name, item.profile.display_name].includes(userName))
  return (found || {}).id
}

const idToUser = async ({ userId, client }) => {
  /*const result = await client.users.list();
  const user = result.members.find(item => item.id == userId) || {}*/
  const user = (await getUsers({ client })).find(item => item.id == userId) || {}
  return (user.profile || {}).display_name || user.name
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
    const responses = await getResponses({ 
      userId, channelId, start, end, client, say 
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
  console.log({ command })
  const message = await client.chat.postMessage({ 
    text: 'Show users log: ',
    channel: command.channel_id
  })
  const thread_ts = message.ts
  
  const [channel, seconds, startDate, endDate] = command.text.split(' ')
  
    let channelId = (channel.split('|')[0]).replace('<#', '')
    console.log({ channel, channelId })
    if (!channelId) {
      await say({ 
        text: 'Channel not found. Using current channel ' + 
          command.channel_name,
          thread_ts 
      })
      channelId = command.channel_id
    } 
    
    await say({ text: `Analyzing...`, thread_ts })
    const start = startDate ? moment(startDate) : moment().subtract(14, 'days')
    const end = endDate ? moment(endDate) : moment()
    
    /*const usersList = await client.users.list()
    const users = usersList.members*/
    //const channelId = await channelToId({ channel, client })
    const allUsers = await getUsers({ client })
    
    await Promise.all(allUsers.map(async e => {
      
        const responses = await getResponses({ 
          userId: e.id, channelId, start, end, client, say 
        })
       
        if (!responses || !responses.length) {
          return
        }
        
        await Promise.all(responses.filter(r => r.rt > seconds)
          .map(async responce => {
            const link = await client.chat.getPermalink({ 
              channel: channelId, message_ts: responce.ts
            })
            //console.log({ link })
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