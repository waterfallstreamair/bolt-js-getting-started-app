const { app } = require('../../app')
const prisma = require('../../prisma-client')


const onSelectChannel = (setReactionAddedMode) => {
    app.action('on_select_channel', async ({ body, payload, ack, say, client, logger }) => {
        //console.log('payload2', payload)
        //console.log('body2', body)
        await ack()
        const { ts } = body.message
        const { id } = body.channel
        const labledChannel = payload.selected_option.text.text
        const update = await client.chat.update({
            channel: id,
            ts,
            text: `Add reaction emoji to #${labledChannel}`,
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "plain_text",
                        text: `Add reaction emoji to #${labledChannel}`,
                        emoji: true
                    }
                }
            ]
        })
        logger.info(update)

        const addedMode = setReactionAddedMode('set')
        setTimeout(() => {
            app.event('reaction_added', async ({event}) => {
                console.log('event-reaction_added2-event', event)
                const { reaction, item } = event
                if (addedMode === 'set' && item.ts === ts) {
                    try {
                        const channel = await prisma.channel.upsert({
                            update: {
                                emojiName: reaction,
                            },
                            where: {
                                id: payload.selected_option.value,
                            },
                            create: {
                                id: payload.selected_option.value,
                                name: payload.selected_option.text.text,
                                emojiName: reaction,
                                synced: true
                            },
                        })
                        setReactionAddedMode('watch')

                        if (channel) {
                            const del = await client.chat.delete({
                                channel: id,
                                ts
                            })

                            const upd = await client.chat.postMessage({
                                channel: id,
                                text: `Channel #${labledChannel} tagged successfully!`,
                                blocks: [
                                    {
                                        type: "section",
                                        text: {
                                            type: "plain_text",
                                            text: `Channel #${labledChannel} tagged successfully!`,
                                            emoji: true
                                        }
                                    }
                                ]
                            })
                            console.log('upd', upd)
                        }
                    }
                    catch(e) {
                        console.log('error:', e);
                    }
                }
            })
        }, 1000)
    })
}

module.exports = {
    onSelectChannel
}
