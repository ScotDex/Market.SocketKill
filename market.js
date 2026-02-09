const axios = require('axios');
const fs = require(`fs`);
const path = require(`path`);

const CACHE_FILE = path.join(__dirname, `itemCache.json`)


function loadCache() {
    if (fs.existsSync(CACHE_FILE)) {
        console.log("Loading Cache File");
        const data = fs.readFileSync(CACHE_FILE, `utf8`);
        return JSON.parse(data);
    }
    console.log("No cache file found, creating a new one")
    return {};
}

function saveCache(cache) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log("[system] cache file updated");
}

let itemCache = loadCache();

// Define Region Hubs
const HUBS = [
    { name: 'Jita', region: 10000002 },
    { name: 'Amarr', region: 10000043 },
    { name: 'Dodixie', region: 10000032 },
    { name: 'Rens', region: 10000030 },
    { name: 'Hek', region: 10000042 }
];

/**
 * Type ID resolution 
 */
async function getTypeId(itemName) {

    const nameKey = itemName.toLowerCase();

    if (itemCache[nameKey]) {
        console.log(`[Cache Hit] Found ${itemName} (ID: ${itemCache[nameKey]}) in local file.`);
        return itemCache[nameKey];
    }
    console.log(`[Cache Miss] ${itemName} not known. Asking ESI...`);
    console.log(`Searching for ID for: ${itemName}...`);
    try {
        // We use the ESI universe/ids endpoint
        const response = await axios.post('https://esi.evetech.net/latest/universe/ids/', [itemName]);
        
        // ESI returns an object. We look inside 'inventory_types'
        if (response.data.inventory_types && response.data.inventory_types.length > 0) {
            const id = response.data.inventory_types[0].id;
            const officialName = response.data.inventory_types[0].name;

            itemCache[nameKey] = id;
            saveCache(itemCache);
            console.log(`[Cache Update] Added ${officialName} to local SDE.`);
            return id;
        }

        return null;
    } catch (error) {
        console.error("ID Search Error:", error.message);
        return null;
    }
}

/**
 * Step C: The "Main" function to run the logic
 */
async function fetchHubPrice(hub, typeId) {
    const url = `https://esi.evetech.net/latest/markets/${hub.region}/orders/`;
    try {
        const response = await axios.get(url, { params: { type_id: typeId } });
        const orders = response.data;

        // Separate orders
        const sellOrders = orders.filter(o => !o.is_buy_order);
        const buyOrders = orders.filter(o => o.is_buy_order);

        // If no orders exist, return "N/A" instead of breaking
        return {
            hub: hub.name,
            lowestSell: sellOrders.length ? Math.min(...sellOrders.map(o => o.price)) : "N/A",
            highestBuy: buyOrders.length ? Math.max(...buyOrders.map(o => o.price)) : "N/A"
        };
    } catch (error) {
        // Return a safe object if the API times out or fails
        return { hub: hub.name, lowestSell: "Err", highestBuy: "Err" };
    }
}

module.exports = {
    HUBS,
    getTypeId,
    fetchHubPrice

};
