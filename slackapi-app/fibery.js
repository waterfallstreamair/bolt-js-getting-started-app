const Fibery = require('fibery-unofficial')
const config = require("dotenv").config().parsed

const fibery = new Fibery({
    host: config.FIBERY_HOST || process.env.FIBERY_HOST,
    token: config.FIBERY_TOKEN || process.env.FIBERY_TOKEN
})

module.exports = {
    fibery
}
