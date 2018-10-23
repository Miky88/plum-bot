const { CommandoClient, SQLiteProvider } = require("discord.js-commando")
const sqlite = require('sqlite')
const path = require("path")
const fs = require("fs")

// ======== REQUIRED
const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

const client = new CommandoClient({
  commandPrefix: "!",
  unknownCommandResponse: false,
  owner: ["307980990587076608", "280399026749440000"],
  invite: "https://discord.gg/UgdQhV5",
  disableEveryone: true,
})

client.registry
    .registerDefaultTypes()
    .registerDefaultGroups()
    .registerGroups([
        ["moderation", "Moderation"],
        ["fun", "Fun"]
    ])
    .registerDefaultCommands()
    .registerCommandsIn(path.join(__dirname, 'commands'));

sqlite.open(path.join(__dirname, "settings.sqlite3")).then((db) => {
    client.setProvider(new SQLiteProvider(db));
});

fs.readdir('./events/', (err, files) => {
  if (err) console.error(err);
  console.log(`Loading a total of ${files.length} events.`);
  files.forEach(file => {
    const eventName = file.split(".")[0];
    const event = require(`./events/${file}`);
    client.on(eventName, event.bind(null, client));
    delete require.cache[require.resolve(`./events/${file}`)];
    client.emit("eventLoaded", eventName)
  });
});

const perms = require("./perms.js")
client.permissionLevels = []
perms.forEach(perm => client.permissionLevels.push(new perm(client)))
client.permissions = (member) => {
  var p = client.permissionLevels[0]
  try {
  client.permissionLevels.forEach(perm => {
    if (perm.validate(member)) p = perm
  })
  } catch (e) {console.error(e)}
  return p
}

client.login(process.env.TOKEN)