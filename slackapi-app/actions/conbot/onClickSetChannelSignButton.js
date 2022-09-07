const { app } = require('../../app')


const onClickSetChannelSignButton = (channels) => {
    app.action('on_click_set_channel_sign_button', async ({ payload, ack, say, client, context, body }) => {
        console.log('payload', payload)
        console.log('context', context)
        console.log('body', body)
        await ack()
        await say({
          text: 'Select channel',
          blocks: [
            {
              type: 'section',
              accessory: {
                "type": "static_select",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select channel",
                  "emoji": true
                },
                options: channels.map(({name, id}) => ({
                  text: {
                    type: 'plain_text',
                    text: `${name}`,
                    emoji: false
                  },
                  value: id
                })),
                action_id: 'on_select_channel'
              },
              text: {
                type: 'mrkdwn',
                text: 'What should be labeled'
              },
            }
          ]
        })
    })
}


module.exports = {
    onClickSetChannelSignButton
}
