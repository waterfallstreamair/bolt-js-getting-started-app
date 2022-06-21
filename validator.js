const Ajv = require("ajv")
const ajv = new Ajv({ allErrors: true }) 

const schemaUserInfo = {
  type: "object",
  properties: {
    user: { type: "string", maxLength: 100 },
    channel: { type: "string", maxLength: 100 }
  },
  required: ["user", "channel"],
  additionalProperties: false
}

const validateUserInfo = ajv.compile(schemaUserInfo)

const schemaUsersLog = {
  type: "object",
  properties: {
    channel: { type: "string", maxLength: 100 },
    seconds: { type: "number", minimum: 0 }
  },
  required: ["channel", "seconds"],
  additionalProperties: false
}

const validateUsersLog = ajv.compile(schemaUsersLog)

module.exports = {
    validateUserInfo,
    validateUsersLog
}
