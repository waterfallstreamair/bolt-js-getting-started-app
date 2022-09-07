const moment = require('moment')
const { isArray, min, max, mean } = require('lodash')
const { getMessages } = require('./getMessages')
const { getResponses } = require('./getResponses')
const { updateUser, getUsers: getSavedUsers } = require('../prisma-api/user')



const humanizeDuration = d => {
    const s = d.get('seconds') ? `${d.get('seconds')}s ` : ''
    const m = d.get('minutes') ? `${d.get('minutes')}m ` : ''
    const h = d.get('hours') ? `${d.get('hours')}h ` : ''
    const days = d.get('days') ? `${d.get('days')} days ` : ''
    const months = d.get('months') ? `${d.get('months')} months ` : ''
    return `${months}${days}${h}${m}${s}`
}

const getStatistics = ({ responses }) => {
    if (responses && isArray(responses)) {
        const nums = responses.map(e => Math.floor(e.rt))
        const minNum = min(nums)
        const maxNum = max(nums)
        const avgNum = mean(nums)
        return {
        min: humanizeDuration(moment.duration(minNum, 'seconds')),
        max: humanizeDuration(moment.duration(maxNum, 'seconds')),
        avg: humanizeDuration(moment.duration(avgNum, 'seconds')),
        minNum,
        maxNum,
        avgNum,
        }
    }
    return {}
}

const getUserInfo = async ({ user, channel, userName, channelName }) => {
    console.log({ user, channel, userName, channelName })
    const start = moment().subtract(90, 'days')
    const end = moment()
    const messages = await getMessages({ start, end, channel })
    const responses = await getResponses({
        userId: user, channelId: channel, start, end, messages
    })
    const { min, max, avg, } = getStatistics({ responses })
    const updatedUser = await updateUser({
        user: userName,
        channel: channelName,
        min: min || '',
        max: max || '',
        avg: avg || '',
        start: start.format('DD-MM-yyyy hh:mm:ss'),
        end: end.format('DD-MM-yyyy hh:mm:ss') })
    console.log({ updatedUser })
    return {
        // min, max, avg, start, end, user: userName, channel: channelName
        ...updatedUser
    }
}

module.exports = {
    getUserInfo,
    getStatistics,
    humanizeDuration
}
