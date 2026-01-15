const express = require ('express');
const path = require ('path');
const DeltaService = require ('./services/deltaService');
const ESIClient = require ('./esi/esi');
const DiscoveryService = require ('./services/helpers')

const app = express ();
const port = process.env.PORT || 3000;

const esi = new ESIClient ("KRAB.SCAN")
const deltaService = new DeltaService();
let lastAnalysedState = [];

app.use (express.static('public'));
app.use (express.json());

async function performKrabScan() {
    console.log ("Taking snapshot of krabs...")
    const currentKills = await esi.getSystemKills();
    const results = deltaService.calculate(currentKills)
    await deltaService.saveSnapshot('./data/last_snapshot.json');
    const enriched = await Promise.all(results
        .filter(s => s.delta > 0)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 50) // Top 50 active systems
        .map(async (sys) => {
            const details = esi.getSystemDetails(sys.system_id);
            const regionName = await esi.getRegionName(details?.region_id);
            return {
                ...sys,
                name: details?.name || "Unknown",
                region: regionName,
                security: details?.security_status || 0
            };
        })
    );

    lastAnalysedState = enriched;
    console.log (`Scan complete, found ${enriched.length} active systems`);
}

app.get('/api/tactical-state', async (req, res) => {
    // Grab the dynamic background via your DiscoveryService helper
    const background = await DiscoveryService.getBackPhoto();
    
    res.json({
        ui: background,
        ledger: lastAnalysedState
    });
});

async function init () {
    await esi.loadSystemCache('./data/systems.json');
    await esi.loadCache('./data/esi_cache.json');

    await performKrabScan();

    setInterval(performKrabScan, 60 * 60 * 1000);
    app.listen(port, () => {
        console.log(`🚀 Ledger Live: http://localhost:${port}`);
    });
    
}

init();