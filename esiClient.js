const axios = require('axios');
const fs = require('fs').promises;

class ESIClient {
        constructor(contactInfo) {
                this.api = axios.create({
                        baseURL: "https://esi.evetech.net",
                        timeout: 15000,
                        headers: { 'User-Agent': `market.socketkill.com (${contactInfo})`, 
                        'X-Compatibility-Date': '2025-12-16'},
                        'Accept': 'application/json',
                
                });

                this.cache = {
                        regions: new Map() // Only keep what the Ledger needs
                };

                this.staticSystemData = {};
                this.isDirty = false;

                // Persist the Region names once an hour or if changed
                setInterval(() => {
                        if (this.isDirty) this.saveCache('./data/esi_cache.json');
                }, 60 * 60 * 1000);
        }

        // Fetches and caches Region names (e.g., 10000002 -> "The Forge")
        async getRegionName(regionId) {
                if (!regionId) return "Unknown";
                if (this.cache.regions.has(regionId)) return this.cache.regions.get(regionId);

                try {
                        const response = await this.api.get(`/universe/regions/${regionId}/`);
                        const name = response.data.name;
                        this.cache.regions.set(regionId, name);
                        this.isDirty = true;
                        return name;
                } catch (err) {
                        return "Unknown Region";
                }
        }

        // Static System Data (ID -> Name, Sec, RegionID)
        async loadSystemCache(filePath) {
                try {
                        const data = await fs.readFile(filePath, 'utf8');
                        this.staticSystemData = JSON.parse(data);
                        return true;
                } catch (err) {
                        console.error("Critical: Static system data missing!");
                        return false;
                }
        }

        getSystemDetails(id) {
                return this.staticSystemData[id] || null;
        }

        async loadCache(filePath) {
                try {
                        const data = await fs.readFile(filePath, 'utf8');
                        if (!data || data.trim() === "") {
                                console.warn("📁 Cache file is empty. Initializing default structure...");
                                this.isDirty = true; // Force a save later
                                return;
                        }
                        const json = JSON.parse(data);
                        this.cache.regions = new Map(Object.entries(json.regions || {}));
                        console.log("📂 Persistent cache loaded.");
                } catch (err) {
                        console.warn("⚠️ No cache file found, starting fresh.");
                }
        }


        async saveCache(filePath) {
                const persistData = { regions: Object.fromEntries(this.cache.regions) };
                await fs.writeFile(filePath, JSON.stringify(persistData, null, 2));
                this.isDirty = false;
                console.log("💾 Region cache saved.");
        }
}

module.exports = ESIClient;