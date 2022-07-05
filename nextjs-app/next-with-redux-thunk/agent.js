import useSwr from 'swr'
import axios from 'axios'
import { API_URL, USERS_URL, USER_UPDATE_URL } from './config'

console.log({ API_URL })
console.log({ USERS_URL })

const get = async (url) => {
    const res = await axios.get(url)
    console.log({ res })
    return res.data
}

const put = async (url, body) => {
    const res = await axios.put(url, body)
    console.log({ res })
    return res.data
}

export const hello = async () => {
    return get(API_URL + '/hello')
}

export const getUsers = async () => {
    return get(USERS_URL)
}

export const updateUser = async ({ userName, channelName }) => {
    return put(USER_UPDATE_URL, { userName, channelName })
}

//export default url => useSwr(url, fetcher)