const { showUserInfo } = require('./showUserInfo')
const { showUsersLog } = require('./showUsersLog')
const { conbot } = require('./conbot')
const { conbot2 } = require('./conbot2')


const initCommands = ({users, channels}) => {
    showUserInfo(users, channels)
    showUsersLog(users, channels)
    conbot()
    conbot2()
}

module.exports = {
    initCommands
}
