const { onClickSetChannelSignButton } = require('./conbot/onClickSetChannelSignButton')
const { onSelectChannel } = require('./conbot/onSelectChannel')
const { onClickManageChannelButton } = require('./conbot/onClickManageChannelButton')
const { onClickFiberyTest } = require('./conbot/onClickFiberyTest')

const initActions = ({channels, setReactionAddedMode}) => {
    onClickSetChannelSignButton(channels)
    onSelectChannel(setReactionAddedMode)
    onClickManageChannelButton(channels)
    onClickFiberyTest()
}

module.exports = {
    initActions
}
