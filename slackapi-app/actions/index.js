const { onClickSetChannelSignButton } = require('./conbot/onClickSetChannelSignButton')
const { onSelectChannel } = require('./conbot/onSelectChannel')

const initActions = ({channels, setReactionAddedMode}) => {
    onClickSetChannelSignButton(channels)
    onSelectChannel(setReactionAddedMode)
}

module.exports = {
    initActions
}
