const { app } = require('../app')

const conbot2 = () => {
    app.command('/conbot2',
        async ({ body, command, ack, say, client, logger }) => {
            console.log('command', command)
        await ack()
        // onClickSetChannelButton
        try {
            const result = await client.views.open({
                trigger_id: body.trigger_id,
                view: {
                    type: 'modal',
                    callback_id: 'view_conbot_menu',
                    title: {
                        type: 'plain_text',
                        text: 'ConBot menu'
                    },
                    blocks: [
                        {
                            "type": "divider"
                        },
                        {
                            "type": "section",
                            "text": {
                                "type": "plain_text",
                                "text": "This is a plain text section block.",
                                "emoji": true
                            }
                        },
                        {
                            "type": "divider"
                        },
                        {
                            type: 'actions',
                            elements: [
                            {
                                type: 'button',
                                action_id: 'on_click_set_channel_button',
                                text: {
                                    type: 'plain_text',
                                    text: "Set channel sign",
                                    emoji: true
                                },
                                value: 'aa'
                            },
                            {
                                type: 'button',
                                action_id: 'on_click_manage_channels_button',
                                text: {
                                    type: 'plain_text',
                                    text: "View Channels",
                                    emoji: true
                                },
                                value: 'ss',
                            },
                            ]
                        }
                    ]
                }
            });
            logger.info(result)
        }
          catch (error) {
            logger.error(error)
        }

    })
}

module.exports = {
    conbot2
}
