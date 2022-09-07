const moment = require('moment')
const cTable = require('console.table')
const { isArray, min, max, mean } = require('lodash')
const { app } = require('../app')
const { validateUsersLog } = require('../validator')
const { getMessages } = require('../helpers/getMessages')
const { getResponses } = require('../helpers/getResponses')
const { humanizeDuration } = require('../helpers/getUserInfo')



const showUsersLog = (users, channels) => {
    app.command('/show-users-log',
        async ({ command, ack, say, client, ...r }) => {
        await ack();
        const message = await client.chat.postMessage({
            text: 'Show users log: ',
            channel: command.channel_id
        })
        const thread_ts = message.ts
        const [channel, seconds, startDate, endDate] = command.text.split(' ')

        const valid = validateUsersLog({ channel, seconds: +seconds })
        if (!valid) {
            /*validateUsersLog.errors.map(e => {
            console.log({ message: e.message, params: e.params })
            })*/
            await say({ text: `Please use this command format:
            /show-users-log [channel] [seconds]

            \`${JSON.stringify(validateUsersLog.errors)}\`
            `, thread_ts })
            //return
        }

        const channelName = valid ? channel.replace('#', '') : command.channel_name
        const channelId = valid ? channels.filter(item => item.name === channelName)[0].id : command.channel_id

        //let channelId = valid ? (channel.split('|')[0]).replace('<#', '') : command.channel_id
        //let channelName = valid ? (channel.split('|')[1]).replace('>', '') : command.channel_name

        await say({ text: `Analyzing...`, thread_ts })
        if (!valid) {
            await say({ text: `
            Using current channel: ${command.channel_name}
            Using parameter seconds: 0`, thread_ts })
        }
        const start = startDate ? moment(startDate) : moment().subtract(90, 'days')
        const end = endDate ? moment(endDate) : moment()
        await say({ text: `
            Statistics for period
                from ${start.format('DD-MM-yyyy')}
                to ${end.format('DD-MM-yyyy')}:
        `, thread_ts })

        //const allUsers = await client.conversations.members({ channel: channelId })
        const messages = await getMessages({ client, start, end, channel: channelId })
        let rows = []
        await Promise.all(users.filter(u => !u.is_bot)
            .map(async e => {

            const responses = await getResponses({
                userId: e.id, channelId, start, end, messages
            })

            if (!responses || !isArray(responses)) {
                return
            }

            await Promise.all(responses.filter(r => r.rt > (seconds || 0))
                .map(async responce => {
                const link = await client.chat.getPermalink({
                    channel: channelId, message_ts: responce.ts
                })
                const info = {
                    user: e.name || 'name not found',
                    response:
                        humanizeDuration(moment.duration(responce.rt, 'seconds'))
                        || 'response time not found',
                    channel: channelName,
                    link: `<${link.permalink}|Link>`,
                }
                rows.push(info)
                //rows.push([info.user, info.response, info.link])

                await say({
                    text: `
                    User: ${e.name || 'name not found'}:
                    Date: ${moment.unix(+responce.ts).format('DD-MM-yyyy hh:mm:ss') || 'time stamp not found'}
                    Response: ${humanizeDuration(moment.duration(responce.rt, 'seconds')) || 'responce time not found'}
                    Text: ${responce.text || 'text not found'}
                    Link: ${`<${link.permalink}|...>`}
                    =================

                `,
                    thread_ts
                })

                })
            )
            })
        )
        //console.log({ rows })

        const t = cTable.getTable(rows)

        const text = t.split('\n').slice(2).join('\n')
        //console.log({ text })
        await say({ text: `Result as a table: \n${text}`, thread_ts })
        await say({ text: `Done.`, thread_ts })
    })

}

module.exports = {
    showUsersLog
}
