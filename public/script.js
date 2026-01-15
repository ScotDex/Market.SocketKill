const WHALE_THRESHOLD = 300;

async function updateLedger() {
    try {
        const response = await fetch('/api/krab-hotlist');
        const systems = await response.json();
        
        const tbody = document.getElementById('ledger-body');
        tbody.innerHTML = systems.map((sys, i) => {
            const isWhale = sys.delta >= WHALE_THRESHOLD;
            return `
                <tr>
                    <td style="color: var(--text-dim)">${(i+1).toString().padStart(2, '0')}</td>
                    <td><strong>${sys.name}</strong></td>
                    <td class="${isWhale ? 'delta-whale' : 'delta-active'}">
                        ${isWhale ? '▲ ' : '+'} ${sys.delta}
                    </td>
                    <td><span class="pulse-dot"></span>${sys.region}</td>
                    <td style="text-align: right">${sys.security.toFixed(1)}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error("Snapshot sync in progress...");
    }
}

// Initial load and hourly sync
updateLedger();
setInterval(updateLedger, 60000);