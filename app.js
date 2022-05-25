const { App } = require('@slack/bolt');
//import moment from 'moment'

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
  appToken: process.env.SLACK_APP_TOKEN
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
        responses.push({ user: userId, rt })
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
      min: Math.min(...nums),
      max: Math.max(...nums),
      avg: nums.reduce((a, b) => a + b) / nums.length
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
  
  /*if (message.text == 'show-info') {
    say('info')
  }*/
  if (message.text.includes('show-user-info')) {
    const [text, userName, channel] = message.text.split(' ')
    const userId = await userToId({ userName, client })
    if (!userId) {
      say('User not found')
    } else {
      await say({
        text: `User id ${userId}`,
        thread_ts
      });
      const responses = getResponses({ userId })
      const { min, max, avg } = getStatistics({ responses })
      await say(`Min response: ${min || 'no data'}`)
      await say(`Max response: ${max || 'no data'}`)
      await say(`Avg response: ${avg || 'no data'}`)
      /*const nums = responses.map(e => e.rt)
      if (nums.length > 0) {
        await say(`Min response = ${Math.min(...nums)}`)
        await say(`Max response = ${Math.max(...nums)}`)
        await say(`Avg response = ${nums.reduce((a, b) => a + b) / nums.length}`)
      } else {
        say('No responces from this user.')
      }*/
    }
  }
  
  if (message.text.includes('show-users-log')) {
    const [text, seconds, startDate, endDate] =
      message.text.split(' ')
    console.log({ text, seconds, startDate, endDate })
    const usersList = await client.users.list()
    const users = usersList.members
    console.log({ users })
    users.forEach(async e => {
      //getResponses({ user: e.id, seconds, startDate, endDate })
      const responses = getResponses({ 
        userId: e.id, seconds, startDate, endDate 
      })
      const { min, max, avg } = getStatistics({ responses })
      await say(`User: ${e.name || 'no data'}`)
      await say(`Min response: ${min || 'no data'}`)
      await say(`Max response: ${max || 'no data'}`)
      await say(`Avg response: ${avg || 'no data'}`)
    })
  }
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();