const Permission = require("./classes/Permission.js")

class PermissionZero extends Permission {
  constructor(client) {
    super(client, 0, "Bot", "Insert useful description for bots...")
  }
  
  validate(member) {
    return member.user.bot
  }
}

class PermissionOne extends Permission {
  constructor(client) {
    super(client, 1, "User", "Insert useful description for users...")
  }
  
  validate(member) {
    if (member.user.bot) return false
    return true
  }
}

class PermissionTwo extends Permission {
  constructor(client) {
    super(client, 2, "Server moderator", "Insert useful description for server moderators...")
  }
  
  validate(member) {
    if (member.user.bot) return false
    return true
  }
}

module.exports = [ PermissionZero, PermissionOne, PermissionTwo ]