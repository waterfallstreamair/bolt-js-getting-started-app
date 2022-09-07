const { app } = require('../../app')
const prisma = require('../../prisma-client')


const onSelectChannel = (setReactionAddedMode) => {
    app.action('on_select_channel', async ({ payload, ack, say, client }) => {
        //console.log('payload2', payload)
        await ack()
        const res = await say(`Add reaction emoji to #${payload.selected_option.text.text}`)
        const { ts } = res.message
        const addedMode = setReactionAddedMode('set')

        setTimeout(() => {
            app.event('reaction_added', async ({event}) => {
                //console.log('event-reaction_added2-event', event)
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
                        //console.log('channel', channel)
                        setReactionAddedMode('watch')
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
