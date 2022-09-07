const moment = require('moment')
const { app } = require('../app')
const { validateUserInfo, validateUsersLog } = require('../validator')
const { getUserInfo } = require('../helpers/getUserInfo')
const { updateUser, getUsers: getSavedUsers } = require('../prisma-api/user')


const showUserInfo = (users, channels) => {
    app.command('/show-user-info',
    async ({ command, ack, say, client, ...r }) => {
    await ack();
    const message = await client.chat.postMessage({
        text: 'Show user info: ',
        channel: command.channel_id
    })
    const thread_ts = message.ts

    const [user, channel, startDate, endDate] = command.text.split(' ')
    const valid = validateUserInfo({ user, channel })
    if (!valid) {
        /*validateUserInfo.errors.map(e => {
        console.log({ message: e.message, params: e.params })
        })*/
        await say({ text: `Please use this command format:
        /show-user-info [user] [channel]

        \`${JSON.stringify(validateUserInfo.errors)}\`
        `, thread_ts })
        //return
    }

    const userName = valid ? user.replace('@', '') : command.user_name
    const userId = valid ? users.filter(item => item.name === userName)[0].id : command.user_id

    //let userId = valid ? (user.split('|')[0]).replace('<@', '') : command.user_id
    //let userName = valid ? (user.split('|')[1]).replace('>', '') : command.user_name

    if (!valid) {
        await say({
        text: 'Using current user ' +
            command.user_name,
            thread_ts
        })
    }

    // console.log('channels===============', channels);
    const channelName = valid ? channel.replace('#', '') : command.channel_name
    const channelId = valid ? channels.filter(item => item.name === channelName)[0].id : command.channel_id

    //let channelId = valid ? (channel.split('|')[0]).replace('<#', '') : command.channel_id
    //let channelName = valid ? (channel.split('|')[1]).replace('>', '') : command.channel_name

    if (!valid) {
        await say({
        text: 'Using current channel ' +
            command.channel_name,
            thread_ts
        })
    }

    await say({ text: `Analyzing...`, thread_ts })
    const { start, end, min, max, avg } = await getUserInfo({
        user: userId, channel: channelId, userName, channelName })
    /*
    const start = startDate ? moment(startDate) : moment().subtract(90, 'days')
    const end = endDate ? moment(endDate) : moment()
    const messages = await getMessages({ client, start, end, channel: channelId })
    const responses = await getResponses({
        userId, channelId, start, end, messages
    })
    const { min, max, avg, minNum, maxNum, avgNum, } = getStatistics({ responses })
    const updatedUser = await updateUser({
        user: userName,
        min: min || '',
        max: max || '',
        avg: avg || '',
        start: start.format('DD-MM-yyyy'), end: end.format('DD-MM-yyyy') })
    console.log({ updatedUser })
    */
    await say({
        text: `
        User id ${userId}
        User name ${userName}
        Statistics for period
            from ${start}
            to ${end}:
        Min response = ${min || 'no data'}
        Max response = ${max || 'no data'}
        Avg response = ${avg || 'no data'}
        `,
        thread_ts
    });
    await say({ text: `Done.`, thread_ts })
    });


}

module.exports = {
    showUserInfo
}
