const { ExpressReceiver } = require('@slack/bolt')
const bodyParser = require('body-parser')
const cTable = require('console.table')
const cors = require('cors')

const { app } = require('./app')
const prisma = require('./prisma-client')
const { getUsers: getSavedUsers } = require('./prisma-api/user')
const { setClientToSlackApi, getUsers, getChannels, getHistory } = require('./slack-api')
const { initCommands } = require('./commands')
const { initActions } = require('./actions')
const { initEvents } = require('./events')
const { updateCandidate } = require('./events/fibery/updateCandidate')
const { handlingCandidate } = require('./events/fibery/handlingCandidate')
const { getUserInfo } = require('./helpers/getUserInfo')
const { getFiberyUsers } = require('./helpers/fibery/getFiberyUsers')



let users = null
let channels = null
let reactionAddedMode = 'watch' // type: 'set' | 'watch'
const setReactionAddedMode = mode => {
  reactionAddedMode = mode
  return reactionAddedMode
}
const getReactionAddedMode = () => reactionAddedMode

const config = require("dotenv").config().parsed;
//console.log('config', config)

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

receiver.router.put('/api/fibery/candidate', (req, res) => {
  // console.log('body put', req.body)
  const { candidate, type } = req.body
  handlingCandidate(type, candidate[0], channels)
  res.json({ update_candidate: 'candidate'})
})


const init = async () => {
  const { client } = app
  setClientToSlackApi(client)
  users = await getUsers()
  console.log(cTable.getTable(users.map(u => ({ id: u.id, name: u.name }))))
  channels = await getChannels()
  console.log(cTable.getTable(channels.map(c => ({ id: c.id, name: c.name }))))
  initCommands({users, channels})
  initActions({channels, setReactionAddedMode})
  initEvents({users, getReactionAddedMode})
  getFiberyUsers()
}

(async () => {
  try {
    await init()
    await app.start(process.env.PORT || 3000);
    await receiver.start(process.env.API_PORT || 3002);

    console.log('⚡️ Bolt app is running!');
   } catch(e) {
     console.error({ e })
     process.exit(1)
   } finally {
     prisma.$disconnect()
   }
})();
