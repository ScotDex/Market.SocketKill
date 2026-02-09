require('dotenv').config();
const { Client, GatewayIntentBits } = require(`discord.js`);
const { HUBS, getTypeId, fetchHubPrice } = require(`./market.js`);
const { createMarketEmbed } = require('./embedFactory.js'); 


const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
});

client.once(`ready`, () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on(`interactionCreate`, async (interaction)  => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (interaction.commandName === `price`) {
        const itemName = interaction.options.getString(`item`);

        console.log(`[Command] ${interaction.user.tag} requested price for: ${itemName}`);

        await interaction.deferReply();
        try {
            const typeId = await getTypeId(itemName);
            if (!typeId) {
                return interaction.editReply(`❌ Could not find an item named: **${itemName}**`);
            }

            console.log(`[Market] Fetching prices for TypeID: ${typeId}...`);
            
            const results = await Promise.all(HUBS.map(hub => fetchHubPrice(hub, typeId)));
            const embed = createMarketEmbed(itemName, typeId, results);
            await interaction.editReply({ embeds: [embed]});
            

        } catch (error) {
            console.error(error);
            await interaction.editReply("⚠️ An error occurred while fetching EVE market data.");
            
        }
    }

    else if (commandName === `help`) {
        const { createHelpEmbed } = require('./embedFactory.js');
        const embed = createHelpEmbed();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN)

