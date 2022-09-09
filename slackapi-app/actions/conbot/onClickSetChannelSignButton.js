const { app } = require('../../app')


const onClickSetChannelSignButton = (channels) => {
    app.action('on_click_set_channel_sign_button', async ({ payload, ack, say, client, body, logger }) => {
        console.log('payload', payload)
        console.log('body', body)

        await ack()
        const { ts } = body.message
        const { id } = body.channel
        const update = await client.chat.update({
            channel: id,
            ts,
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
                  text: 'What should be tagged'
                },
              }
            ]
        })

        logger.info(update)

    })
}


module.exports = {
    onClickSetChannelSignButton
}
