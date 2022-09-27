const { transformUser } = require('./transformUser')

const transformSlackComment = async (oldComment) => {
    //console.log('oldComment:', oldComment)
    const placer = oldComment.replace(/</g, ' <').replace(/>/g, '> ')
    const splited = placer.split(' ')

    let newSplited = []
    for await ( const item of splited) {
        if (item.includes('<@')) {
            const newItem = await transformUser('toFibery', item)
            newSplited.push(newItem)
        } else {
            newSplited.push(item)
        }
    }

    return newSplited.join(' ')
}

module.exports = {
    transformSlackComment
}
