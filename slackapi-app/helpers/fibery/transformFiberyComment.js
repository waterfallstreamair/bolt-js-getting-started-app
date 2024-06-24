const prisma = require('../../prisma-client')


const transformFiberyComment = async (_oldContent) => {
    //console.log('_oldContent:', _oldContent)
    const oldContent = _oldContent.replace(/\\/g, ' ')
    const fiberyUsers = await prisma.fiberyUser.findMany()
    const userMap = {}
    fiberyUsers.forEach(u => {
        userMap[`#@${u.fiberyUserId}/${u.id}`] = u.name
    })
    //console.log('userMap:', userMap)
    const placer = oldContent.replace(/\[\[|\]\]/g, ' ')
    const splited = placer.split(' ')

    const newSplited = splited.map(item => {
        if (item.includes('#@')) {
            if (!userMap[item]) return 'Unknown user'
            return `<@${userMap[item]}>`
        }
        return item
    })

    console.log('newSplited:', newSplited)
    return newSplited.join(' ')
}

module.exports = {
    transformFiberyComment
}
