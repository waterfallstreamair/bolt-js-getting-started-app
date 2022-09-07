const { cache } = require('../cach')
const { getHistory } = require('../slack-api')


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

module.exports = {
  getMessages
}
