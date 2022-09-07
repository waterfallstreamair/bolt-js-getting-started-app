let client

const setClientToSlackApi = appClient => client = appClient

const getUsers = async () => {
  const result = await client.users.list()
  return result.members
}

const getChannels = async () => {
  const result = await client.conversations.list({
    types: 'public_channel, private_channel'
  })
  return result.channels
}


const getHistory = async ({ start, end, channel }) => {
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
    }
    replies.messages.map(r => messages.push(r))
  }))
  messages.sort((a, b) => +a.ts - b.ts)
  return messages
}


module.exports = {
    setClientToSlackApi,
    getUsers,
    getChannels,
    getHistory
}