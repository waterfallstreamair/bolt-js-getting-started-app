const { app } = require('../../app')
const { fibery } = require('../../fibery')
const { checkCopyFromSlackComment } = require('../../bot-utils')


const getCommentFromFibery = async ({ comment, candidateId}) => {
    // console.log('comment===lastComment============', comment)
    const documentId = comment['Document Secret']
    const commentId = comment['Id']

    try {
        if (documentId && commentId) {
            const json = await fibery.document.get(documentId, 'md')
            const text = JSON.parse(json)
            const isCopyFromSlack = checkCopyFromSlackComment(text.content)
            if (isCopyFromSlack) {
                return false
            }
            const commentMeta = await fibery.entity.query({
                'q/from': 'comments/comment',
                'q/select': ['fibery/creation-date', {'comment/author': ['user/name']}],
                'q/where': ['=', ['fibery/id'], '$id_value'],
                'q/limit': 2
            }, {$id_value: commentId});

            //console.log('commentMeta:', commentMeta)
            const authorName = commentMeta[0]['comment/author']['user/name'];
            const creationDate = commentMeta[0]['fibery/creation-date']
            if (text && creationDate && authorName) {
                return {
                    id: commentId,
                    candidateId,
                    content: text.content,
                    authorName,
                    creationDate
                }
            }
        } else {
            return false
        }
    }
    catch(e) {
        console.log('error:', e);
    }
}

module.exports = {
    getCommentFromFibery
}
