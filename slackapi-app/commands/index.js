const { showUserInfo } = require('./showUserInfo')
const { showUsersLog } = require('./showUsersLog')
const { conbot } = require('./conbot')


const initCommands = ({users, channels}) => {
    showUserInfo(users, channels)
    showUsersLog(users, channels)
    conbot()
}

module.exports = {
    initCommands
}
