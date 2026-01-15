const fs = require('fs').promises;

class DeltaService {
    constructor(){
        this.previousSnapshot = new Map();
    }

    async saveSnapshot(filepath) {
        try {
            const data = Array.from(this.previousSnapshot.entries());
            await fs.writeFile(filepath, JSON.stringify(data, null, 2));
            console.log("Snapshot Saved to Disk");
        } catch (err) {
            console.error("failed to save snapshot", err.message);
        }
    }

    loadPreviousState(data) {
        if (!data) return;
        this.previousSnapshot = new Map (data.map(sys => [sys.system_id, sys.npc_kills]));
    }

    calculate(currentData) {
        const results = currentData.map(current => {
            const prevKills = this.previousSnapshot.get(current.system_id) || 0
            const delta = current.npc_kills - prevKills;

            return {
                ...current,
                delta: delta,
                velocity: prevKills > 0 ? ((delta / prevKills) * 100).toFixed(1) : 100.0,
                isNewActivity: prevKills === 0 && current.npc_kills > 0,
                intensity: this.determineIntensity(current.npc_kills, delta)
        
            };
        });

        this.previousSnapshot = new Map(currentData.map(sys => [sys.system_id, sys.npc_kills]));
        return results;
    }

    determineIntensity(kills, delta) {
        if (kills > 5000) return 'High';
        if (delta > 1000) return 'Medium';
        if (delta > -500) return 'Shite';
        return 'STABLE';
        
    }
}

module.exports = DeltaService