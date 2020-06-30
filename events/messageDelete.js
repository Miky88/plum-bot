module.exports = async (client, message) => {
  if (!message.content.trim()) return
  var msg = message;
  let logs, modlogs;
  
  const entry = await message.guild.fetchAuditLogs({type: 'MESSAGE_DELETE'}).then(audit => audit.entries.first());
  let user = ""
  let av = ""
  if (entry.extra.channel.id === message.channel.id
      && (entry.target.id === message.author.id)
      && (entry.createdTimestamp > (Date.now() - 5000))
      && (entry.extra.count >= 1)) {
    user = entry.executor.tag
    av = entry.executor.displayAvatarURL()
  } else { 
    user = "themselves"
    av = message.author.displayAvatarURL()
  }
  
  const embed = client.utils.embed()
        // We set the color to a nice yellow here.
        .setColor(15844367)
        .setTitle("🗑️ A message by " + message.author.tag + " was deleted")
        .setThumbnail(av)
        .setDescription(message.cleanContent) 
        .addField(":blue_book: Channel", `**#${message.channel.name}** (<#${message.channel.id}>) [${message.channel.id}]`)
        .addField("🆔 Message ID", message.id)
        .setTimestamp(Date.now() - 5000)
        .setFooter(`What a waste!`)
  
  message.guild.log(embed);
};