const { onClickSetChannelSignButton } = require('./conbot/onClickSetChannelSignButton')
const { onClickSetChannelButton } = require('./conbot/onClickSetChannelButton')
const { onSelectChannel } = require('./conbot/onSelectChannel')
const { onClickManageChannelButton } = require('./conbot/onClickManageChannelButton')

const initActions = ({channels, setReactionAddedMode}) => {
    onClickSetChannelSignButton(channels)
    onSelectChannel(setReactionAddedMode)
    onClickSetChannelButton(channels)
    onClickManageChannelButton(channels)
}

module.exports = {
    initActions
}
