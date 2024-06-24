const { app } = require('../../app')
const prisma = require('../../prisma-client')
const { client } = app


const updateCandidate = async ({candidate, channelId, savedCandidate}) => {
    const payload = {
        text: `Created candidate :: ${candidate.id} ::\n
            Name: ${candidate.name}
            Position: ${candidate.position}
            City: ${candidate.city}
            Salary: $${candidate.salary}
            Assignees: ${candidate.assignees}
            `
    }
    try {
        let post
        if (savedCandidate && channelId === savedCandidate.channelId) {
            post = await client.chat.update({
                channel: channelId,
                ts: savedCandidate.ts,
                ...payload,
            })
        } else {
            post = await client.chat.postMessage({
                channel: channelId,
                ...payload,
            })
        }
        const candidateUp = await prisma.candidate.upsert({
            update: {
                ...candidate,
                channelId,
                ts: post.ts,
            },
            where: {
                id: candidate.id,
            },
            create: {
                ...candidate,
                channelId,
                ts: post.ts,
            }
        })
        // console.log('candidateUp===========', candidateUp)
    }
    catch(e) {
        console.log('error:', e);
    }
}

module.exports = {
    updateCandidate
}
