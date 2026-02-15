const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// Define Region Hubs
const HUBS = [
    { name: 'Jita', region: 10000002 },
    { name: 'Amarr', region: 10000043 },
    { name: 'Dodixie', region: 10000032 },
    { name: 'Rens', region: 10000030 },
    { name: 'Hek', region: 10000042 }
];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const CACHE_FILE = path.join(__dirname, 'itemCache.json');
const PRICE_CACHE = new Map(); // In-memory price cache
const PRICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Item name -> ID cache
function loadCache() {
    if (fs.existsSync(CACHE_FILE)) {
        console.log("Loading item cache file");
        const data = fs.readFileSync(CACHE_FILE, 'utf8');
        return JSON.parse(data);
    }
    console.log("No cache file found, creating new one");
    return {};
}

function saveCache(cache) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log("[system] Item cache updated");
}

let itemCache = loadCache();

// Get Type ID from item name
async function getTypeId(itemName) {
    const nameKey = itemName.toLowerCase();

    if (itemCache[nameKey]) {
        console.log(`[Cache Hit] ${itemName} (ID: ${itemCache[nameKey]})`);
        return itemCache[nameKey];
    }

    console.log(`[Cache Miss] Querying ESI for: ${itemName}`);
    try {
        const response = await axios.post('https://esi.evetech.net/latest/universe/ids/', [itemName]);
        
        if (response.data.inventory_types && response.data.inventory_types.length > 0) {
            const id = response.data.inventory_types[0].id;
            const officialName = response.data.inventory_types[0].name;

            itemCache[nameKey] = id;
            saveCache(itemCache);
            console.log(`[Cache Update] Added ${officialName} -> ${id}`);
            return id;
        }

        return null;
    } catch (error) {
        console.error("ID Search Error:", error.message);
        return null;
    }
}

// Fetch hub prices
async function fetchHubPrice(hub, typeId) {
    const url = `https://esi.evetech.net/latest/markets/${hub.region}/orders/`;
    try {
        const response = await axios.get(url, { params: { type_id: typeId } });
        const orders = response.data;

        const sellOrders = orders.filter(o => !o.is_buy_order);
        const buyOrders = orders.filter(o => o.is_buy_order);

        return {
            hub: hub.name,
            lowestSell: sellOrders.length ? Math.min(...sellOrders.map(o => o.price)) : null,
            highestBuy: buyOrders.length ? Math.max(...buyOrders.map(o => o.price)) : null
        };
    } catch (error) {
        console.error(`Error fetching ${hub.name}:`, error.message);
        return { hub: hub.name, lowestSell: null, highestBuy: null };
    }
}

// API Endpoint: Market Compare
app.get('/api/market/compare', async (req, res) => {
    const itemName = req.query.name;
    if (!itemName) return res.status(400).json({ error: "ITEM_REQUIRED" });

    try {
        // Get Type ID
        const typeId = await getTypeId(itemName);
        if (!typeId) return res.status(404).json({ error: "ITEM_NOT_FOUND" });

        // Check price cache
        const cacheKey = `price-${typeId}`;
        const cached = PRICE_CACHE.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
            console.log(`[Price Cache Hit] ${itemName}`);
            return res.json(cached.data);
        }

        // Fetch prices from all hubs (parallel)
        const hubResults = await Promise.all(
            HUBS.map(hub => fetchHubPrice(hub, typeId))
        );

        // Find best price
        const validSells = hubResults.filter(h => h.lowestSell !== null);
        const bestPrice = validSells.length ? Math.min(...validSells.map(h => h.lowestSell)) : null;

        const response = {
            name: itemName.toUpperCase(),
            typeId: typeId,
            bestPrice: bestPrice,
            hubs: hubResults,
            timestamp: new Date().toISOString()
        };

        // Cache the result
        PRICE_CACHE.set(cacheKey, {
            data: response,
            timestamp: Date.now()
        });

        res.json(response);

    } catch (error) {
        console.error("Market aggregation error:", error);
        res.status(500).json({ error: "INTERNAL_CORE_ERROR" });
    }
});

// Start server
app.listen(port, () => {
    console.log(`[MARKET.SOCKETKILL.COM] Server running on port ${port}`);
});