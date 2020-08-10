const SRACanvasCommand = require('../../classes/commands/SRACanvasCommand.js');

module.exports = class GayCommand extends SRACanvasCommand {
    constructor(client) {
        super(client, {
            name: "greyscale",
            aliases: ["grayscale", "gs"],
            punchline: "Here's your black and white image."
        })
    }
}