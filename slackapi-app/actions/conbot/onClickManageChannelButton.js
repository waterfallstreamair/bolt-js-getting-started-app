const { app } = require('../../app')
const prisma = require('../../prisma-client')


const onClickManageChannelButton = (_channels) => {
    app.action('on_click_manage_channels_button', async ({ payload, ack, say, client, body, logger }) => {
        console.log('payload', payload)
        console.log('body', body)

        await ack()
        const { ts } = body.message
        const { id } = body.channel

        try {

            const channels = await prisma.channel.findMany()
            logger.info(channels)

           const names = channels.map(({name}) => name).sort((a, b) => b.length - a.length)
           const maxLength = names[0].length

           const modChanels = channels.map(({name, emojiName}) => {
                const add = maxLength - name.length
                let dots = ''
                if (add) {
                    dots = '-'.repeat(add -1)
                }
                return {
                    name: `${name} ${dots}`,
                    emojiName
                }
           })

            const update = await client.chat.update({
                channel: id,
                ts,
                text: 'Channels',
                blocks: modChanels.map(({ name, emojiName}) => ({
                    type: 'context',
                    elements: [
                        {
                            type: 'plain_text',
                            text: `#${name}`,
                            emoji: true
                        },
                        {
                            type: 'plain_text',
                            text: '-->',
                            emoji: true
                        },
                        {
                            type: 'plain_text',
                            text: `:${emojiName}:`,
                            emoji: true
                        },
                    ]
                }))
            })

            logger.info(update)

        }
        catch(e) {
            console.log('error:', e);
        }
    })
}


module.exports = {
    onClickManageChannelButton
}
