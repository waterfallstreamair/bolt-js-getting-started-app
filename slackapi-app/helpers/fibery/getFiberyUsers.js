const { fibery } = require('../../fibery')
const prisma = require('../../prisma-client')


const getFiberyUsers = async () => {
    try {
        const schema = await fibery.getSchema()
        const fiberyUserId = await schema.filter((u) => u['fibery/name'] === 'fibery/user')[0]['fibery/id']
        const users = await fibery.entity.query({
            "q/from": "fibery/user",
            "q/select": ["fibery/id","user/name"],
            "q/limit": 50
        })

        for await (const user of users) {
            const id = user['fibery/id']
            const name = user['user/name']
            await prisma.fiberyUser.upsert({
                update: {
                    name,
                    fiberyUserId
                },
                where: {
                    id,
                },
                create: {
                    id,
                    name,
                    fiberyUserId
                }
            })
        }
    }
    catch(e) {
        console.log('error:', e)
    }
}

module.exports = {
    getFiberyUsers
}
