const getSyncData = text => {
    if (!text) return null
    const src = text.split('::')
    if (src.length < 3) return null
    const key = src[0].trim()
    if (key === 'Synced') {
        return {
            id: src[1].trim(),
            ts: src[2].trim()
        }
    } else {
        return null
    }
}

const checkCopyFromSlackComment = (text) => {
    if (!text) return true
    const src = text.split('::')
    if (src.length < 3) return false
    const key = src[1].trim()
    return key === 'Copy from Slack'
}

const checkSyncedChannels = (channelId, messages) => {
    if (!channelId || !messages.length) {
        console.log('checkSyncedChannels input error')
        return false
    }
    const botMess = messages.filter(m => m.bot_id && getSyncData(m.text) && getSyncData(m.text).id === channelId)
    if (!botMess.length) return false
    return getSyncData(botMess[0].text)
}
//for synced Slack channels
const checkSyncedThread = (messages) => {
    if (!messages.length) {
        console.log('checkSyncedThread input error')
        return false
    }
    const botMess = messages.filter(m => m.bot_id && getSyncData(m.text))
    if (!botMess.length) return false
    //return getSyncData(botMess[0].text)
    return botMess.map(mess => getSyncData(mess.text))
}

const checkSyncedThreadWithFiberyCandidate = (messages) => {
    if (!messages.length) {
        console.log('checkSyncedThread input error')
        return false
    }
    const parentMess = messages[0]
    if (!parentMess.bot_id || !parentMess.text) return false
    const src = parentMess.text.split('::')
    if (src.length < 3) return false
    const key = src[0].trim()
    const candidateId = src[1].trim()
    if (key === 'Created candidate' && candidateId) {
        return candidateId
    } else {
        return false
    }
}

module.exports = {
    getSyncData,
    checkSyncedChannels,
    checkSyncedThread,
    checkCopyFromSlackComment,
    checkSyncedThreadWithFiberyCandidate
}
