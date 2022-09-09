const { app } = require('../../app')


const onClickSetChannelButton = (channels) => {
    app.action('on_click_set_channel_button', async ({ payload, ack, say, client, logger, body }) => {
        console.log('payload', payload)
        //console.log('context', context)
        console.log('body', body)
        await ack()
        try {
            const result = await client.views.update({
                // Pass the view_id
                view_id: body.view.id,
                // Pass the current hash to avoid race conditions
                hash: body.view.hash,
                view: {
                    type: 'modal',
                    callback_id: 'view_conbot_menu',
                    title: {
                        type: 'plain_text',
                        text: 'ConBot menu'
                    },
                    blocks: [
                        {
                            type: 'actions',
                            elements: [
                            {
                                type: 'button',
                                action_id: 'on_click_set_channel_button',
                                text: {
                                    type: 'plain_text',
                                    text: 'Set channel sign',
                                    emoji: true
                                },
                                value: 'aa'
                            },
                            {
                                type: 'button',
                                action_id: 'on_click_manage_channels_button',
                                text: {
                                    type: 'plain_text',
                                    text: 'Manage Channels',
                                    emoji: true
                                },
                                value: 'ss',
                            },
                            ]
                        },
                        {
                            type: 'actions',
                            elements: [
                                {
                                    type: 'button',
                                    action_id: 'on_click1',
                                    text: {
                                        type: 'plain_text',
                                        text: 'Return to main menu',
                                        emoji: true
                                    },
                                    value: 'aa'
                                }
                            ]
                        }
                    ]
                }


            })
            logger.info(result)
        }
        catch (error) {
            logger.error(error)
        }
    })
}


module.exports = {
    onClickSetChannelButton
}
