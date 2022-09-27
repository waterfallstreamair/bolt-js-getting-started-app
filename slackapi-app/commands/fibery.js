const { app } = require('../app')

// Test command for Fibery
const fibery = () => {
    app.command('/fibery',
        async ({ ack, say, logger }) => {
        await ack()
        const ask = await say({
            text: 'fibery test',
            blocks: [
            {
                type: 'actions',
                elements: [
                {
                    type: 'button',
                    action_id: 'on_click_fibery_test',

                    text: {
                        type: 'plain_text',
                        text: 'Fibery test',
                        emoji: true
                    },
                    value: `1`
                }
                ]
            }
            ]
        })
        logger.info(ask)
    })
}

module.exports = {
    fibery
}
