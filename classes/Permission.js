class Permission {
  constructor(client, level, name, desc) {
    this.client = client
    this.level = level
    this.name = name
    this.description = desc
  }
  
  validate(member) {
    return true
  }
}

module.exports = Permission