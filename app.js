const { App } = require('@slack/bolt');
const moment = require('moment')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

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

const getResponses = async ({ 
  userId, seconds, start, end, channel, client, say }) => {
    console.log({ start, end })
  let responses = []
  let prevTs = 0
 
  const result = await client.conversations.list()
  let channelId = (result.channels.find(e => e.name == channel) || {}).id
  
  if (!channelId) {
    say('Channel not found. Using current channel')
    channelId = event.channel
    //return []
  }
  
  db = await client.conversations.history({
    channel: channelId,
    latest: end.unix(),
    oldest: start.unix(),
    inclusive: true,
    limit: 999,
    include_all_metadata: true
  })
  //console.log({ messages: db.messages })
  
  db.messages.sort((a, b) => +a.ts - b.ts)
  //console.log({ messages })
  
  await Promise.all(db.messages.map(async e => {
    
    const replies = await client.conversations.replies({
      channel: channelId,
      latest: end.unix(),
      oldest: start.unix(),
      inclusive: true,
      limit: 999,
      ts: e.ts
    })
    
    replies.messages.sort((a, b) => +a.ts - b.ts)
    //console.log({ replies: replies.messages })
    
    replies.messages.forEach(r => {
      if (r.text.includes(`@${userId}`)) {
        prevTs = r.ts
        //console.log({ mentioned: r })
      } else if (r.user == userId && prevTs) {
        const rt = +r.ts - prevTs
        prevTs = null
        //console.log({ responced: r })
       
        responses.push({ user: userId, rt, text: r.text, ts: r.ts })
        console.log({ responses })
      } 
    })
    
  }))
  
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
  const result = await client.users.list();
  /*console.log({ result })
  console.log({ members: result.members })
  //console.log(result.members.map(e => e.profile))*/
  return (result.members.find(item => 
    [item.name, item.profile.display_name].includes(userName)) || {}).id
}

const idToUser = async ({ userId, client }) => {
  const result = await client.users.list();
  const user = result.members.find(item => item.id == userId) || {}
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
    //console.log({ message, client, r})
    const [text, userName, channel, startDate, endDate] = message.text.split(' ')
    let userId = await userToId({ userName, client }) 
    if (!userId) {
      await say({ 
        text: 'User not found. Using current user ' + 
          await idToUser({ userId: message.user, client }),
          thread_ts 
      })
      userId = message.user
    } 
    await say({ text: `Analyzing...`, thread_ts })
    const start = startDate ? moment(startDate) : moment().subtract(14, 'days')
    const end = endDate ? moment(endDate) : moment()
    const responses = await getResponses({ 
      userId, channel, start, end, client, say 
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
  }
  
  
  if (message.text.includes('show-users-log')) {
    const [text, channel, seconds, startDate, endDate] =
      message.text.split(' ')
    console.log({ text, channel, seconds, startDate, endDate })
    await say({ text: `Analyzing...`, thread_ts })
    const start = startDate ? moment(startDate) : moment().subtract(14, 'days')
    const end = endDate ? moment(endDate) : moment()
    
    const usersList = await client.users.list()
    const users = usersList.members
    
    await Promise.all(users.map(async e => {
      
        const responses = await getResponses({ 
          userId: e.id, channel, start, end, client, say 
        })
       
        if (!responses || !responses.length) {
          return
        }
        
        await Promise.all(responses.filter(r => r.rt > seconds)
          .map(async responce => {
            await say({
              text: `
                User: ${e.name || 'name not found'}: 
                Date: ${moment(+responce.ts).format('DD-MM-yyyy hh:mm:ss') || 'time stamp not found'}
                Response: ${humanizeDuration(moment.duration(responce.rt, 'seconds')) || 'responce time not found'}
                Text: ${responce.text || 'text not found'}
                Link: ${'...'}
                ===================================
            `,
              thread_ts
            })
          })
        )
      })
    )
    
    await say({ text: `Done.`, thread_ts })
  }
  
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();