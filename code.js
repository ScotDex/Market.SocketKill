require('dotenv').config();
console.log("DEBUG: Token length is:", process.env.DISCORD_TOKEN?.length || "UNDEFINED");
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

// 1. You MUST define clientId from your .env file
const clientId = process.env.CLIENT_ID; 
const token = process.env.DISCORD_TOKEN;

const rest = new REST({ version: '10' }).setToken(token);

const commands = [
    new SlashCommandBuilder()
        .setName('price')
        .setDescription('Check EVE Online market prices')
        .addStringOption(opt => 
            opt.setName('item')
               .setDescription('Item Name')
               .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get info on how to use ISK-O-Meter')
].map(c => c.toJSON());

(async () => {
    try {
        console.log('Started refreshing global application (/) commands.');

        // 2. Now clientId is defined and valid!
        await rest.put(
            Routes.applicationCommands(clientId), 
            { body: commands }
        );

        console.log('Successfully registered commands GLOBALLY!');
        console.log('Note: It may take up to an hour for global commands to appear in all servers.');
    } catch (error) {
        // This will tell you EXACTLY what is wrong if it fails again
        console.error(error);
    }
})();