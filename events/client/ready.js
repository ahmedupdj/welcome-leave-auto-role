const { Events } = require('discord.js');
const connectToDatabase = require ('../../Database/Connection')

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}! 
        dev by @niro0353 
        dev by @niro0353
        dev by @niro0353
        dev by @niro0353
        dev by @niro0353
        dev by @niro0353
        dev by @niro0353
        `);


        await connectToDatabase()
    }
}