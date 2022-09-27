const config = require("dotenv").config().parsed
const prisma = require('../../prisma-client')
const { updateCandidate } = require('./updateCandidate')
const { addComment } = require('./addComment')

const channelName = config.HIRING_CHANNEL_NAME

// type: 'update' | 'add_comment'
const handlingCandidate = async (type, entity, channels) => {
    const comments = entity['comments/comments']
    let lastComment = null
    if (comments && comments.length) {
        lastComment = comments[comments.length -1]
    }

    const candidate = {
        id: entity['fibery/id'],
        name: entity['hiring/name'],
        position: entity['hiring/position'].Name,
        city: entity['hiring/City'].Name,
        salary: `${entity['hiring/Salary']}`,
        assignees: entity['hiring/Assignees'].Name,
    }
    const channelId = channels.filter(item => item.name === channelName)[0].id

    try {
        const savedCandidate = await prisma.candidate.findUnique({
          where: {
            id: candidate.id,
          },
        })

        if (type === 'update') {
            await updateCandidate({candidate, channelId, savedCandidate})
        } else if (type === 'add_comment') {
            await addComment({candidate, channelId, savedCandidate, lastComment})
        }
    }
    catch(e) {
        console.log('error:', e);
    }
}

module.exports = {
    handlingCandidate
}
