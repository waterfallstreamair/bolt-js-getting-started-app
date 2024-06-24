const { app } = require('../../app')
//const prisma = require('../../prisma-client')
const { checkSyncedThread, checkSyncedThreadWithFiberyCandidate } = require('../../bot-utils')
const { sendCommentToFiberyCandidate } = require('../../helpers/fibery/sendCommentToFiberyCandidate')


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

            const threadSyncedWithFiberyCandidate = checkSyncedThreadWithFiberyCandidate(replies.messages)
            const threadSyncedWithInternalChannels = checkSyncedThread(replies.messages)

            if (threadSyncedWithInternalChannels) {
              const userName = users.filter(u => u.id === user)[0].name
              for await (const thread of threadSyncedWithInternalChannels) {
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

            if (threadSyncedWithFiberyCandidate) {
              const userName = users.filter(u => u.id === user)[0].name
              sendCommentToFiberyCandidate(threadSyncedWithFiberyCandidate, text, userName)
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
