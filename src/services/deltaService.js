class DeltaService {
    constructor(){
        this.previousSnapshot = new Map();
    }

    loadPreviousState(data) {
        if (!data) return;
        this.previousSnapshot = new Map (data.map(sys => [sys.system_id, sys.npc_kills]));
    }

    calculate(currentData) {
        return currentData.map(current => {
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
    }

    determineIntensity(kills, delta) {
        if (kills > 5000) return '';
        if (delta > 1000) return '';
        if (delta > -500) return '';
        return 'STABLE';
        
    }
}

module.exports = DeltaService