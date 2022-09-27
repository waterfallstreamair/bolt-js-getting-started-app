const { randomUUID } = require('crypto')
const config = require("dotenv").config().parsed
const { fibery } = require('../../fibery')
const { transformSlackComment } = require('./transformSlackComment')
const { transformUser } = require('./transformUser')


const COMMENT_AUTHOR_NAME = config.COMMENT_AUTHOR_NAME

const sendCommentToFiberyCandidate = async (candidateId, _comment, author) => {
    const PARENT_ENTITY_ID = candidateId
    const COMMENT_ID = randomUUID()
    const DOCUMENT_SECRET_ID = randomUUID()

    try {
        //const author = await transformUser('toFibery', _author, true)
        //console.log('author:', author)

        let comment = _comment
        if (comment.includes('<@')) {
            comment = await transformSlackComment(_comment)
        }
        // console.log('comment:', comment)
        let authorId = null
        if (COMMENT_AUTHOR_NAME) {
            const users = await fibery.entity.query({
                "q/from": "fibery/user",
                "q/select": ["fibery/id","user/name"],
                "q/limit": 50
            })

            const filtredWithOriginAuthor = users.length && users.filter(u => u['user/name'] === author)
            authorId = filtredWithOriginAuthor.length && filtredWithOriginAuthor[0]['fibery/id']
            if (!authorId) {
                const filtredWithAdmin = users.length && users.filter(u => u['user/name'] === COMMENT_AUTHOR_NAME)
                authorId = filtredWithAdmin.length && filtredWithAdmin[0]['fibery/id']
            }

        }
        const COMMENT_AUTHOR_ID = authorId || config.COMMENT_AUTHOR_ID
        if (!COMMENT_AUTHOR_ID || !PARENT_ENTITY_ID) {
            console.log('Comment params error!')
            return
        }

        const commentCreate = await fibery.entity.createBatch([
            {
              'type': 'comments/comment',
              'entity': {
                'fibery/id': COMMENT_ID,
                'comment/document-secret': DOCUMENT_SECRET_ID,
                'comment/author': { 'fibery/id': COMMENT_AUTHOR_ID }
              }
            }
        ])

        const emptyCommentAdd = await fibery.entity.addToEntityCollectionFieldBatch([{
            'type': 'hiring/Candidate',
            'field': 'comments/comments',
            'entity': { 'fibery/id': PARENT_ENTITY_ID },
            'items': [
              { 'fibery/id': COMMENT_ID }
            ]
        }]);
/*
        const content = `
        :: Copy from Slack ::
        Author: ${author}

${comment}
        `
*/
        const content = `

:: Copy from Slack ::
        Author: ${author}

${comment}
        `
       // console.log('content:', JSON.stringify(content))
        const doc = await fibery.document.update(DOCUMENT_SECRET_ID, content, 'md')
    }
    catch(e) {
        console.log('error:', e);
    }
}

module.exports = {
    sendCommentToFiberyCandidate
}
