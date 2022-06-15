const Ajv = require("ajv")
const ajv = new Ajv({ allErrors: true }) // options can be passed, e.g. {allErrors: true}

const schema = {
  type: "object",
  properties: {
    user: { type: "string" },
    channel: { type: "string" }
  },
  required: ["user", "channel"],
  additionalProperties: false
}

const validateUserInfo = ajv.compile(schema)

module.exports = {
    validateUserInfo
}
/*
const data = {
  user: "",
  channel: ""
}

const valid = validate(data)
if (!valid) console.log(validate.errors)
*/