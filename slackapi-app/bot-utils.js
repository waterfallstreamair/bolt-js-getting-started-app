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

const checkSyncedChannels = (channelId, messages) => {
    if (!channelId || !messages.length) {
        console.log('checkSyncedChannels input error')
        return false
    }
    const botMess = messages.filter(m => m.bot_id && getSyncData(m.text) && getSyncData(m.text).id === channelId)
    if (!botMess.length) return false
    return getSyncData(botMess[0].text)
}

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

module.exports = {
    getSyncData,
    checkSyncedChannels,
    checkSyncedThread
}