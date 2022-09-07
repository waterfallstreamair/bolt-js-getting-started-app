const { app } = require('../../app')
//const prisma = require('../../prisma-client')
const { checkSyncedThread } = require('../../bot-utils')


const syncNewMessage = ({users}) => {
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
            if (threadSynced) {
              const userName = users.filter(u => u.id === user)[0].name
              for await (const thread of threadSynced) {
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
}

module.exports = {
    syncNewMessage
}
