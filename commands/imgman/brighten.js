const SRACanvasCommand = require('./../../classes/SRACanvasCommand.js');

module.exports = class GayCommand extends SRACanvasCommand {
    constructor(client) {
        super(client, {
            name: "brighten",
            punchline: "Here's your brightened image.",
        })
    }
}