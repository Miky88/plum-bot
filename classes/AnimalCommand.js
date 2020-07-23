const Command = require('./Command.js');
const { api } = require("some-random-api");

module.exports = class AnimalCommand extends Command {
    constructor(client, name, mem = name, api = name) {
        super(client, {
            name,
            group: 'fun',
            memberName: mem || name,
            description: `Sends a cute image of a ${name}.`,
            details: "Doesn't display a fun fact if either the `--nf` or the `--no-fact` flags are present.",
            format: "[--nf|--no-fact]",
        });

        this.name = name;
        this.api = api || name;
    }

    async run(msg) {
        let nf = ["nf", "no-fact"].some(thing => msg.flags[thing]);
        let { link } = await api.img[this.api]();
        let fact;
        if (!nf) {
            let body = await api.facts[this.api == "birb" ? "bird" : this.api]();
            fact = body.fact;
        }

        let embed = this.client.utils.embed()
            .setImage(link)
            .setTitle(`Here's your ${this.name}!`)
        if (fact)
            embed.setFullFooter(`Did you know? ${fact}`);
        msg.channel.send(embed);
    }
};