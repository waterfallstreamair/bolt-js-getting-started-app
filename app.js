const { App } = require('@slack/bolt');
//import moment from 'moment'
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
//let responses = []
const saveToDatabase = params => {
  db.push(params)
}

const getResponses = ({ userId, seconds, startDate, endDate }) => {
  let responses = []
  let prevTs = 0
  let step = 0
  db.forEach(e => {
    if (e.text.includes(userId) && step == 0) {
      //say(e.text)
      if (!startDate && !endDate) {
        step = 1
        prevTs = e.ts
      }
      if (startDate && endDate && 
        Date.parse(startDate) < Date.parse(e.ts) &&
        Date.parse(endDate) > Date.parse(e.ts)
      ) {
        step = 1
        prevTs = e.ts
      }
    } else if (e.user == userId && step == 1) {
      console.log({ ts: e.ts, prevTs })
      const rt = +e.ts - prevTs
      if ((seconds && rt < seconds) || !seconds) {
        responses.push({ user: userId, rt, text: e.text, ts: e.ts })
        step = 0
        console.log({ responses })
      }
    }
  })
  return responses
}

const getStatistics = ({ responses }) => {
  const nums = responses.map(e => e.rt)
  if (nums.length > 0) {
    return {
      min: Math.floor(Math.min(...nums)),
      max: Math.floor(Math.max(...nums)),
      avg: Math.floor(nums.reduce((a, b) => a + b) / nums.length)
    }
  } 
  return {
    min: null, max: null, avg: null
  }
}

const userToId = async ({ userName, client }) => {
  const result = await client.users.list();
  //console.log({ result })
  //console.log({ members: result.members })
  return (result.members.find(item => item.name == userName) || {}).id
}

app.message('', async ({ message, say, client, ...r }) => {
  
  //console.log({ r })
  console.log({ message, /* say */ })
  
  const thread_ts = message.thread_ts || message.ts;
  /*await say({
    text: `Hello <@${message.user}>!`,
    thread_ts
  });*/
  
  const { user, ts, channel, client_msg_id, text } = message
  saveToDatabase({
    client_msg_id, user, ts, thread_ts, channel, text
  })
  console.log({ db })
  
  if (message.text.includes('show-user-info')) {
    const [text, userName, channel] = message.text.split(' ')
    const userId = await userToId({ userName, client })
    if (!userId) {
      say('User not found')
    } else {
      await say({
        text: `Analyzing...`,
        thread_ts
      })
      const responses = getResponses({ userId })
      const { min, max, avg } = getStatistics({ responses })
      await say({
        text: `
          User id ${userId}
          Statistics in seconds:
          Min response = ${min || 'no data'} 
          Max response = ${max || 'no data'} 
          Avg response = ${avg || 'no data'} 
        `,
        thread_ts
      });
      await say({
        text: `Done.`,
        thread_ts
      })
    }
  }
  
  if (message.text.includes('show-users-log')) {
    const [text, seconds, startDate, endDate] =
      message.text.split(' ')
    console.log({ text, seconds, startDate, endDate })
    const usersList = await client.users.list()
    const users = usersList.members
    console.log({ users })
    await say({
        text: `Analyzing...`,
        thread_ts
      })
    users.forEach(async e => {
      const responses = getResponses({ 
        userId: e.id, seconds, startDate, endDate 
      })
      if (responses.length) {
        const { min, max, avg } = getStatistics({ responses })
        await say({
          text: `User: ${e.name || 'no data'}
            Min response: ${min || 'no data'}
            Max response: ${max || 'no data'}
            Avg response: ${avg || 'no data'}
        `,
          thread_ts
        })
        responses.map(async responce => {
          await say({
          text: `User: ${e.name || 'no data'}
            Date: ${responce.ts || ''}
            Text: ${responce.text || ''}
            Link: ${''}
        `,
          thread_ts
        })
        })
      }
    })
  }
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();