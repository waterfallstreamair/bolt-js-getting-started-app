const Ajv = require("ajv")
const ajv = new Ajv({ allErrors: true }) // options can be passed, e.g. {allErrors: true}

const schemaUserInfo = {
  type: "object",
  properties: {
    user: { type: "string" },
    channel: { type: "string" }
  },
  required: ["user", "channel"],
  additionalProperties: false
}

const validateUserInfo = ajv.compile(schemaUserInfo)

const schemaUsersLog = {
  type: "object",
  properties: {
    channel: { type: "string" },
    seconds: { type: "number" }
  },
  required: ["channel", "seconds"],
  additionalProperties: false
}

const validateUsersLog = ajv.compile(schemaUsersLog)

module.exports = {
    validateUserInfo,
    validateUsersLog
}
/*
const data = {
  user: "",
  channel: ""
}

const valid = validate(data)
if (!valid) console.log(validate.errors)
*/