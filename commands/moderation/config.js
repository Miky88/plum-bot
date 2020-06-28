const Command = require("../../classes/Command");
const { RichEmbed } = require("discord.js");
const { inspect } = require("util");
const { findType, settingProps } = require('../../settings/index.js');

module.exports = class ConfigCommand extends Command {
  constructor(client) {
    super(client, {
      name: "config",
      aliases: ["conf", "settings", "sets"],
      group: "moderation",
      memberName: "config",
      description: "Changes the client configuration for the server",
      examples: ["conf set welcomeMessage Welcome, {{user}}, to this server!"],
      guildOnly: true,
      args: [
        {
          key: "action",
          label: "action flag",
          prompt: "what action do you want to follow?",
          type: "string",
          default: "view",
          oneOf: ["view", "set", "clear", "get"]
        },
        {
          key: "key",
          label: "property",
          prompt: "what key do you want to edit?",
          type: "string",
          default: ""
        },
        {
          key: "value",
          prompt: "what should the value be?",
          type: "string",
          default: ""
        }
      ],
      minPerm: 3
    });
    this.actions = ["view", "set", "clear", "reset", "add", "get"];
  }

  getTitles() {
    return {
      logchan: "Log channel",
      welcomechan: "Welcome channel",
      welcomemessage: "Welcome messages",
      leavemessage: "Leave message",
      prefix: "Prefix",
      makerboard: "MakerBoard URL",
      starboardchannel: "Starboard channel",
      levelup: "Level UP",
      levelupmsgs: "Level UP messages",
      mutedrole: "Muted role"
    };
  }

  async run(msg, { action, key, value }) {
		let data = msg.guild.config.data;

    switch (action) {
      case "view":
        let titles = this.getTitles();
        let embed = this.client.util
          .embed()
          .setTitle(`Server configuration for ${msg.guild.name}`)
          .setDescription(`You can use \`${this.handler.prefix(msg)}config set <key> null\` to set a value to an empty state.`)

        for (let k in data) {
          if (["meta", "$loki", "guildID"].includes(k)) continue;

          let v = data[k];
          let type = findType(k);
          console.log(k, v, type ? type.id : type);

          let embedValue;

          try {
            let deserializedValue = type.render(this.client, msg, v);
            if (
              deserializedValue == type.nullValue ||
              deserializedValue == undefined ||
              (deserializedValue == [] || deserializedValue[0] == undefined)
            )
              embedValue = "This value is empty";
            else embedValue = deserializedValue;
          } catch (e) {
            embedValue = "This field has an error";
          }

          embed.addField(titles[k] + " [`" + k + "`]", embedValue);
        }

        return msg.util.send(embed);
        break;
      case "get":
        if (!key) return msg.util.send("You didn't specify a key!");

        let type = findType(settingProps[key]);
        let deserializedValue = type.render(this.client, msg, data[key]);

        return msg.util.send(
          deserializedValue == type.nullValue ||
            deserializedValue == undefined ||
            (deserializedValue == [] || deserializedValue[0] == undefined)
            ? "This value is empty"
            : deserializedValue
        );
        break;
      case "set":
        if (!key) return msg.util.send("You didn't specify a key!");
        if (!settingProps[key])
          return msg.util.send(`The key \`${key}\` does not exist.`);
        if (settingProps[key].extendable)
          return await this.setArray(msg, data, key, value);

        if (!value) return msg.util.send("You didn't specify a value!");
        let t = findType(key);

        if (!t)
          return msg.util.send(
            
              `An error occurred: There's no type with ID \`${data[key].type}\`.\nAlert the bot owners to let them fix this error`
            
          );
        if (!t.validate(this.client, msg, value))
          return msg.util.send(
            `The input \`${value}\` is not valid for the type \`${t.id}\`.`
          );

        if (value != "null") {
          let newValue = t.serialize(this.client, msg, value);
          msg.guild.config.set(key, newValue);
        } else msg.guild.config.set(key, t.nullValue);

        return msg.util.send(import("util").inspect(data[key]), { code: "js" });
        break;
      case "clear":
      case "reset":
        let resp = await this.awaitReply(
          msg,
          
            "Are you ___**100%**___ sure you want to reset the configuration? [Y/N]"
          ,
          30000
        );

        if (resp && typeof resp == "string" && resp.toLowerCase() == "y") {
          console.log(
            msg.author.tag +
              " accepted to clear " +
              msg.guild.name +
              "'s settings"
          );
          try {
            await msg.guild.config.setDefaultSettings(false, false);
            return msg.util.reply(
              "I have successfully cleared the configuration"
            );
          } catch (e) {
            console.error(e);
            console.log(msg.guild.config.data);
            return msg.util.send(
              
                `There has been an error while clearing the configuration. Please report this bug to the ${this.client.user.username} Developers`
              
            );
          }
        }
        return msg.util.reply("action cancelled");
        break;
      default:
        return msg.util.send(
          "The action must be one of [view, get, set, clear]!"
        );
        break;
    }
  }

  async setArray(msg, data, key, value, recursionDepth = 0) {
		const __ = (k, ...v) => global.translate(msg.author.lang, k, ...v);
		let t = findType(key);

		let action = await this.awaitReply(msg, __("What do you want to do with the values? [`add` a value/`clear` the values]"), 30000);

		if (!action)
			return msg.util.reply(__("action cancelled"));

		action = action.toLowerCase();
		if (action == "clear") {
			let resp = await this.awaitReply(msg, __("Are you ___**100%**___ sure you want to reset the array? [Y/N]"), 30000);

			if (resp && typeof resp == "string" && resp.toLowerCase() == "y") {
				msg.guild.config.set(key, []);

				return msg.util.reply(__("I have successfully cleared the array"));
			}

			return msg.util.reply(__("action cancelled"));
		} else if (action == "add") {
			let resp = ""
			let arr = [];
			while (typeof resp == "string" && resp.toLowerCase() != "stop") {
				if (resp) {
					let actualValue = findType(key).serialize(this.client, msg, resp);
					arr.push(actualValue);
				}
				resp = await this.awaitReply(msg, __("Enter the value you want to add, or type `stop` (or wait 30 seconds) to stop"), 30000);
			}

			// console.log(arr);
			msg.guild.config.set(key, arr.concat(data[key]));

			// await this.client.db.serverconfig.update(data);
			msg.util.send(import("util").inspect(data[key]), {code: 'js'});
		} else {
			msg.util.send(__("The action must be one of [{0}]!", "add, clear"));
		}

		/* if (recursionDepth < 5) {
			let otheract = await this.awaitReply(msg, __("Do something else? [`y`/`n`]"), 30000);

			if (otheract && typeof otheract == "string" && otheract.toLowerCase() == "y") {
				return this.setArray(msg, data, key, value, ++recursionDepth);
			} else {
				return msg.util.reply(__("action cancelled"));
			}
		} */
	}

	async awaitReply(msg, question, limit = 60000) {
		const filter = m => m.author.id == msg.author.id;
		await msg.channel.send(question);
		try {
			const collected = await msg.channel.awaitMessages(filter, { max: 1, time: limit, errors: ["time"] });
			return collected.first().content;
		} catch (e) {
			return false;
		}
	};
};