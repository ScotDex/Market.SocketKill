const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const TARGET_FILE = path.join(__dirname, '../data/target_corporations.json');
const BACKUP_FILE = path.join(__dirname, `../data/target_corporations_backup_${Date.now()}.json`);

async function refineList() {
    try {
        // 1. Load the IDs from your fresh grabber run
        const rawData = await fs.readFile(TARGET_FILE, 'utf8');
        const ids = JSON.parse(rawData);
        
        console.log(`🚀 Starting refinement of ${ids.length} corporations...`);
        
        // 2. Create a backup just in case
        await fs.writeFile(BACKUP_FILE, rawData);
        console.log(`💾 Backup created at: ${path.basename(BACKUP_FILE)}`);

        const eliteIds = [];
        const BATCH_SIZE = 40; // Respect ESI's connection limits

        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
            const chunk = ids.slice(i, i + BATCH_SIZE);
            
            // Process chunk in parallel for speed
            await Promise.all(chunk.map(async (id) => {
                try {
                    const response = await axios.get(`https://esi.evetech.net/latest/corporations/${id}/`, {
                        headers: { 'X-Compatibility-Date': '2025-12-16' },
                        timeout: 5000
                    });

                    const memberCount = response.data.member_count;

                    // FILTER LOGIC: Keep only those with 1,000+ members
                    if (memberCount >= 1000) {
                        eliteIds.push(id);
                        console.log(`✅ KEEP: ${response.data.name} (${memberCount} members)`);
                    }
                } catch (err) {
                    // Silently skip corps that error out or don't exist
                }
            }));

            const progress = Math.min(i + BATCH_SIZE, ids.length);
            process.stdout.write(`\r🔄 Progress: ${progress}/${ids.length} | Found Elite: ${eliteIds.length}`);
            
            // Short breather between batches
            await new Promise(r => setTimeout(r, 50));
        }

        // 3. THE CIRCUIT BREAKER
        // If eliteIds is empty, it means something went wrong (or no one is that big).
        // We do NOT overwrite in this case.
        if (eliteIds.length === 0) {
            console.error("\n❌ SAFETY ERROR: Filter resulted in 0 corporations.");
            console.error("Overwrite cancelled. Your original file is still intact.");
            return;
        }

        // 4. Overwrite with the clean, elite list
        await fs.writeFile(TARGET_FILE, JSON.stringify(eliteIds, null, 2));

        console.log(`\n\n✨ --- Refinement Complete ---`);
        console.log(`Original: ${ids.length} IDs`);
        console.log(`Remaining (1k+ members): ${eliteIds.length} IDs`);
        console.log(`File Overwritten: ${TARGET_FILE}`);

    } catch (error) {
        console.error("\n💥 Critical Failure:", error.message);
    }
}

refineList();