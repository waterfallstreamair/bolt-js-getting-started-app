const { app } = require('../../app')
const prisma = require('../../prisma-client')
const { checkSyncedChannels } = require('../../bot-utils')


const syncReactionAdded = ({users, getReactionAddedMode }) => {
    app.event('reaction_added', async ({client, event}) => {
        const { reaction } = event;
        // console.log('event-reaction_added1', event)
        const targetChannel = await prisma.channel.findFirst({
          where: {
            emojiName: reaction
          }
        })
        //console.log('targetChannel', targetChannel)
        const reactionAddedMode = getReactionAddedMode()
        if (targetChannel && reactionAddedMode === 'watch') {
          const targetChannelId = targetChannel.id

          try {
            const replies = await client.conversations.replies({
              channel: event.item.channel,
              ts: event.item.ts,
            })
            const isReactionSynced = checkSyncedChannels(targetChannelId, replies.messages)
            // console.log('isReactionSynced=========:', isReactionSynced)

            if (!isReactionSynced) {
              const parentMessage = replies.messages[0];
              const parentUserName = users.filter(u => u.id === parentMessage.user)[0].name
              const postToTarget = await client.chat.postMessage({
                channel: targetChannelId,
                text: `
                Synced::${event.item.channel}::${event.item.ts}::\n
                From user: <@${parentUserName}>\n
                Message: ${parentMessage.text}
                `,
              })

              const sync = await client.chat.postMessage({
                channel: event.item.channel,
                thread_ts: event.item.ts,
                text: `Synced::${targetChannelId}::${postToTarget.ts}`,
              })

              const threadTs = postToTarget.ts;
              for await (const [i, reply] of replies.messages.entries()) {
                if (i > 0) {
                  const userName = users.filter(u => u.id === reply.user)[0].name
                  const post = await client.chat.postMessage({
                    channel: targetChannelId,
                    text: `From: <@${userName}>

                    Message: ${reply.text}
                    `,
                    thread_ts: threadTs
                  });
                }
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
    syncReactionAdded
}
