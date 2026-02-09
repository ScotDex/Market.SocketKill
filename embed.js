const { EmbedBuilder } = require (`discord.js`)

/**
 * Creates a formatted Market Embed
 * @param {string} itemName - The name of the item
 * @param {number} typeId - The EVE typeID for the icon
 * @param {Array} results - The array of hub price data
 */

function createMarketEmbed(itemName, typeId, results){
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Market Analysis: ${itemName}`)
        .setThumbnail(`https://images.evetech.net/types/${typeId}/icon?size=64`)
        .setTimestamp()
        .setFooter({ text: `Eve Market Data Services`});

    let hubList = "";
    let sellList = "";
    let buyList = "";

    results.forEach(res => {
        hubList += `**${res.hub}**\n`;
        sellList += `${res.lowestSell?.toLocaleString() || 'N/A'} Ƶ\n`;
        buyList += `${res.highestBuy?.toLocaleString() || 'N/A'} Ƶ\n`;
    });

    embed.addFields(
        { name: 'Market Hub', value: hubList, inline: true },
        { name: 'Lowest Sell', value: sellList, inline: true },
        { name: 'Highest Buy', value: buyList, inline: true }
    );

    return embed;

}

function createHelpEmbed() {
    return new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('📖 ISK-O-Meter')
        .setDescription('Market prices without the guess work!')
        .setThumbnail('https://images.evetech.net/corporations/1000132/logo?size=64')
        .addFields(
            { 
                name: '📊 Checking Prices', 
                value: '`/price [item]` — Trade hub prices.\n\n*Note: PLEX is excluded. Its a Global Market now; arbitrage is dead. Check your Vault.*' 
            },
                        { 
                name: '🔗 Useful Links', 
                value: '[Source Code & Support](https://github.com/ScotDex)' 
            },
        )
        .setFooter({ text: 'ISK-O-Meter | Fly Smart not Hopeful' })
        .setTimestamp();

}

module.exports = { createMarketEmbed, createHelpEmbed }