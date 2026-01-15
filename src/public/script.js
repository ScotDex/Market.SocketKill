const WHALE_THRESHOLD = 300;

async function updateLedger() {
    try {
        const response = await fetch('/api/tactical-state');
        const data = await response.json();
        
        // 1. Unpack the data
        const systems = data.ledger;
        const ui = data.ui;

        // 2. Update the background image (DiscoveryService helper)
        if (ui && ui.url) {
            document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${ui.url}')`;
            // Optional: Update a photo credit element if you have one
            const credit = document.getElementById('photo-credit');
            if (credit) credit.innerText = `Location: ${ui.location || 'Unknown Deep Space'}`;
        }

        // 3. Render the Table
        const tbody = document.getElementById('ledger-body');
        if (!systems || systems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Waiting for Tactical Sweep...</td></tr>';
            return;
        }

        tbody.innerHTML = systems.map((sys, i) => {
            const isWhale = sys.delta >= WHALE_THRESHOLD;
            // Use the intensity class we set in the DeltaService for the row styling
            const intensityClass = sys.intensity ? `row-${sys.intensity.toLowerCase()}` : '';

            return `
                <tr class="${intensityClass}">
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
        console.error("Tactical Link Offline: Re-attempting sync...");
    }
}

// Initial load
updateLedger();
// Sync every 60 seconds to catch server-side updates
setInterval(updateLedger, 60000);