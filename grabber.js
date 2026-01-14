const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const ALLIANCES_FILE = path.join(__dirname, '../alliances.json');
const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(DATA_DIR, 'target_corporations.json');

async function grabWithSafety() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const allianceIds = JSON.parse(await fs.readFile(ALLIANCES_FILE, 'utf8'));
    const corpIdSet = new Set();

    console.log(`Starting safe grab for ${allianceIds.length} alliances...`);

    for (let i = 0; i < allianceIds.length; i++) {
        const id = allianceIds[i];

        try {
            const res = await axios.get(`https://esi.evetech.net/latest/alliances/${id}/corporations/`, {
                headers: { 'X-Compatibility-Date': '2025-12-16' }
            });

            res.data.forEach(cid => corpIdSet.add(cid));
            
            // --- SAFETY CHECK ---
            const remain = parseInt(res.headers['x-esi-error-limit-remain']);
            const reset = parseInt(res.headers['x-esi-error-limit-reset']);

            if (remain < 10) { 
                console.warn(`⚠️ Error limit low (${remain}). Sleeping for ${reset}s...`);
                await new Promise(r => setTimeout(r, (reset + 1) * 1000));
            }
            // --------------------

            process.stdout.write(`\r✅ Processed: ${i + 1}/${allianceIds.length} | Unique Corps: ${corpIdSet.size}`);

        } catch (err) {
            console.error(`\n❌ Error on Alliance ${id}: ${err.message}`);
            // If we get a 420, we MUST stop immediately
            if (err.response?.status === 420) {
                console.error("⛔ HIT ERROR LIMIT (420). Aborting script.");
                break;
            }
        }
        
        // Small pace-setter (20ms) just to keep the event loop healthy
        await new Promise(r => setTimeout(r, 20));
    }

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(Array.from(corpIdSet), null, 2));
    console.log(`\n✨ Done! Saved ${corpIdSet.size} corporations.`);
}

grabWithSafety();