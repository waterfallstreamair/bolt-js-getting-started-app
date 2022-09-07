const { isArray, min, max, mean } = require('lodash')
const { cache } = require('../cach')


const getResponses = async ({
    userId, start, end, channelId, messages }) => {

    let responses = []
    let prevTs = null

    const cacheId =
      `${channelId}-${userId}-${start.format('DD-MM-yyyy')}-${end.format('DD-MM-yyyy')}`
    const cached = cache.get(cacheId)
    //console.log({ cached })
    if (cached && isArray(cached)) {
      console.log({ cached })
      if (moment().diff(end, 'days') > 0) {
        return cached
      }
    }

    await Promise.all(messages.map(async r => {
      if (r.text.includes(`@${userId}`)) {
        prevTs = r.ts
      } else if (r.user == userId && prevTs) {
        const rt = +r.ts - prevTs
        prevTs = null
        responses.push({ user: userId, rt, text: r.text, ts: r.ts })
      }
    }))
    cache.set(cacheId, responses)
    //console.log({ cache })

    return responses
}

module.exports = {
    getResponses
}