const prisma = require('../../prisma-client')
const { getUsers } = require('../../slack-api')

// mode: 'toSlack' | 'toFibery'
// isClearName: boolean
const transformUser = async (mode, oldUser, isClearName = false) => {
    // console.log('oldUser:', oldUser)
    const slackUsers = await getUsers()
    const fiberyUsers = await prisma.fiberyUser.findMany()
    const fiberyUserMap = {}
    if (mode === 'toSlack') {
        fiberyUsers.forEach(u => {
            fiberyUserMap[`[[#@${u.fiberyUserId}/${u.id}]]`] = u.name
        })
        const userName = fiberyUserMap[oldUser]
        const filtred = slackUsers.filter(u => u.name === userName)
        if (filtred.length) {
            return `<@${filtred[0].id}>`
        } else {
            return userName
        }
    } else if (mode === 'toFibery') {
        fiberyUsers.forEach(u => {
            fiberyUserMap[u.name] = `[[#@${u.fiberyUserId}/${u.id}]]`
        })

        if (isClearName) {
            const user = fiberyUserMap[oldUser]
            return user || 'Unknown user'
        }

        const userId = oldUser.slice(2, -1)
        const filtred = slackUsers.filter(u => u.id === userId)
        if (filtred.length) {
            const userName = filtred[0].name
            console.log('userName:', userName)
            return fiberyUserMap[userName]
        } else {
            return 'Unknown user'
        }
    }
}

module.exports = {
    transformUser
}
