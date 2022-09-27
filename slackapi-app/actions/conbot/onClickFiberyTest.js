const { app } = require('../../app')
const { fibery } = require('../../fibery')

const onClickFiberyTest = () => {
    app.action('on_click_fibery_test', async ({ payload, ack, say, client, body, logger }) => {
        await ack()

        try {
            const users = await fibery.entity.query({
                "q/from": "fibery/user",
                "q/select": ["fibery/id","user/name"],
                "q/limit": 50
            })

          //  console.log('users:', users)

           /*
            users: [
                {
                    'fibery/id': '19655419-832a-45a1-a91e-984ed4a1534d',
                    'user/name': 'kposidelov'
                },
                {
                    'fibery/id': 'de0e86d3-51c4-4c8b-aa33-a67fb49df345',
                    'user/name': 'sdemakov@reaktivate.com'
                }
            ]
           */

           // const schema = await fibery.getSchema()
            //console.log('schema:', schema)

            //const commentFields = await schema.filter((u) => u['fibery/name'] === 'comments/comment')[0]['fibery/fields']
           // const commentFields = await schema.filter((u) => u['fibery/name'] === 'fibery/user')[0]['fibery/fields']
            //console.log('commentFields===:', commentFields)
            /*
            const comment = await fibery.entity.query({
                'q/from': 'comments/comment',
                'q/select': ['fibery/creation-date', {'comment/author': ['user/name']}],
                'q/where': ['=', ['fibery/id'], '$id_value'],
                'q/limit': 2
            }, {$id_value: 'eab53514-83f2-4046-a524-cdfda9d5a268'});
            */
           // console.log('comment:', comment)

            /*
            const PARENT_ENTITY_ID = 'e00627c0-399a-11ed-ade9-2b2996a8ff46'
            const COMMENT_AUTHOR_ID = '19655419-832a-45a1-a91e-984ed4a1534d'

            const COMMENT_ID = 'b88626cb-9f08-4821-9d5f-4edb9b624c39' // newly generated
            const DOCUMENT_SECRET_ID = 'bf18d349-05da-44dc-5f21-603b2e744b19' // newly generated

            const comment1 = await fibery.entity.createBatch([
                {
                'type': 'comments/comment',
                'entity': {
                    'fibery/id': COMMENT_ID,
                    'comment/document-secret': DOCUMENT_SECRET_ID,
                    'comment/author': { 'fibery/id': COMMENT_AUTHOR_ID }
                }
                }
            ])
            console.log('comment1:', comment1);

            const add = await fibery.entity.addToEntityCollectionFieldBatch([{
                'type': 'hiring/Candidate',
                'field': 'comments/comments',
                'entity': { 'fibery/id': PARENT_ENTITY_ID },
                'items': [
                    { 'fibery/id': COMMENT_ID }
                ]
            }]);

            const content = 'Message from Slack3'
            const doc = await fibery.document.update(DOCUMENT_SECRET_ID, content, 'md')
            */
        }
        catch(e) {
            console.log('error:', e)
        }
    })
}


module.exports = {
    onClickFiberyTest
}
