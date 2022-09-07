const { app } = require('../app')

const conbot = () => {
    app.command('/conbot',
        async ({ command, ack, say, client, ...r }) => {
            console.log('command', command)
        await ack()
        await say({
            text: 'bot menu',
            blocks: [
            {
                "type": "actions",
                "elements": [
                {
                    "type": "button",
                    "action_id": "on_click_set_channel_sign_button",

                    "text": {
                    "type": "plain_text",
                    "text": "Set channel sign",
                    "emoji": true
                    },
                    "value": `1234`
                },
                {
                    "type": "button",
                    "text": {
                    "type": "plain_text",
                    "text": "Manage Channels",
                    "emoji": true
                    },
                    "value": "click_me_123",
                },
                ]
            }
            ]
        })
    })
}

module.exports = {
    conbot
}
