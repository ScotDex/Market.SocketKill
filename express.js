const express = require ('express');


const app = express ();
const port = process.env.PORT || 3000;

app.use (express.static('public'));
app.use (express.json());


// GET /api/market/compare?name=Tritanium
app.get('/api/market/compare', async (req, res) => {
    const itemName = req.query.name;
    if (!itemName) return res.status(400).json({ error: "ITEM_REQUIRED" });

    try {
        // 1. Resolve Name to ID (Check local cache first)
        const typeId = await getTypeId(itemName);
        if (!typeId) return res.status(404).json({ error: "ITEM_NOT_FOUND" });

        // 2. Parallel Fan-Out to Hubs
        // We use Promise.all so all 5 hubs are queried simultaneously
        const hubResults = await Promise.all(HUBS.map(async (hub) => {
            return await fetchHubPrice(hub, typeId);
        }));

        // 3. Optional: Calculate Best Buy/Sell for the 'Analysis' readout
        const validSells = hubResults.filter(h => typeof h.lowestSell === 'number');
        const bestSell = validSells.length ? Math.min(...validSells.map(h => h.lowestSell)) : null;

        res.json({
            name: itemName.toUpperCase(),
            typeId: typeId,
            bestPrice: bestSell,
            hubs: hubResults,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Market aggregation error:", error);
        res.status(500).json({ error: "INTERNAL_CORE_ERROR" });
    }
});