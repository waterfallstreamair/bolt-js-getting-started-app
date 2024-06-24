const { showUserInfo } = require('./showUserInfo')
const { showUsersLog } = require('./showUsersLog')
const { conbot } = require('./conbot')
const { fibery } = require('./fibery')


const initCommands = ({users, channels}) => {
    showUserInfo(users, channels)
    showUsersLog(users, channels)
    conbot()
    fibery()
}

module.exports = {
    initCommands
}
