const { app } = require('../app')

const conbot = () => {
    app.command('/conbot',
        async ({ command, ack, say, client, logger }) => {
        // console.log('command', command)
        await ack()
        const ask = await say({
            text: 'bot menu',
            blocks: [
            {
                type: 'actions',
                elements: [
                {
                    type: 'button',
                    action_id: 'on_click_set_channel_sign_button',

                    text: {
                        type: 'plain_text',
                        text: 'Set channel sign',
                        emoji: true
                    },
                    value: `1`
                },
                {
                    type: 'button',
                    action_id: 'on_click_manage_channels_button',
                    text: {
                        type: 'plain_text',
                        text: 'Manage Channels',
                        emoji: true
                    },
                    value: '2',
                },
                ]
            }
            ]
        })
        logger.info(ask)
    })
}
//onClickManageChannelButton
module.exports = {
    conbot
}
