const { app } = require('../../app')
const moment = require('moment')
const prisma = require('../../prisma-client')
const { getCommentFromFibery } = require('./getCommentFromFibery')
const { transformFiberyComment } = require('../../helpers/fibery/transformFiberyComment')
const { client } = app


const addComment = async ({candidate, lastComment, channelId, savedCandidate}) => {
    try {
        const fullComment = await getCommentFromFibery({ comment: lastComment, candidateId: candidate.id })
        if (!fullComment) {
            console.log('Empty comment!')
            return false
        }
        let commentContent = fullComment.content
       // console.log('fullComment.content', fullComment.content)

        if (commentContent.includes('[[#@')) {
            commentContent = await transformFiberyComment(fullComment.content)
        }
        //console.log('commentContent', commentContent)
        const createdAt = moment(fullComment.creationDate).format('DD-MM-YYYY HH:mm')
        const payload = {
            text: `
            :: Copy From Fibery ::
            Author: ${fullComment.authorName}
            Created: ${createdAt}

            ${commentContent}
            `
        }

        post = await client.chat.postMessage({
            channel: channelId,
            thread_ts: savedCandidate.ts,
            ...payload,
        })

        if (post.ok) {
            const data = {
                id: fullComment.id,
                candidateId: fullComment.candidateId,
                parentTs: savedCandidate.ts,
                ts: post.ts,
                author: fullComment.authorName,
                text: commentContent
            }
            const commentCreate = await prisma.candidateComment.create({
                data
            })
            // console.log('commentCreate', commentCreate)
        }
    }
    catch(e) {
        console.log('error:', e);
    }
}

module.exports = {
    addComment
}
