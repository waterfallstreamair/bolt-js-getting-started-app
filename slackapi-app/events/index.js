const { syncReactionAdded } = require('./conbot/syncReactionAdded')
const { syncNewMessage } = require('./conbot/syncNewMessage')

const initEvents = ({users, getReactionAddedMode}) => {
    syncReactionAdded({users, getReactionAddedMode})
    syncNewMessage({users})
}

module.exports = {
    initEvents
}
