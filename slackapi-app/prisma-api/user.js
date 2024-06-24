const prisma = require('../prisma-client')

const updateUser = async ({ user, channel, min, max, avg, start, end }) => {
  return prisma.user.upsert({
    where: { user },
    update: { user, channel, min, max, avg, start, end },
    create: {
      user, channel, min, max, avg, start, end
    }
  })
}

const getUsers = async () => prisma.user.findMany()

module.exports = {
  updateUser,
  getUsers
}
