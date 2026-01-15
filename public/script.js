// Logic to update the table from your API
    async function refreshLedger() {
        try {
            // Replace with your actual endpoint
            const response = await fetch('/api/krab-hotlist');
            const data = await response.json();
            
            const tbody = document.getElementById('leaderboard-body');
            tbody.innerHTML = ''; // Clear current rows

            data.forEach((sys, index) => {
                const isWhale = sys.delta > 300;
                const row = `
                    <tr>
                        <td>${(index + 1).toString().padStart(2, '0')}</td>
                        <td>${sys.name}</td>
                        <td class="${isWhale ? 'delta-whale' : 'delta-positive'}">+${sys.delta}</td>
                        <td><span class="badge ${isWhale ? 'whale-badge' : ''}">${isWhale ? 'WHALE' : 'ACTIVE'}</span></td>
                        <td>${sys.security}</td>
                    </tr>
                `;
                tbody.insertAdjacentHTML('beforeend', row);
            });
        } catch (e) {
            console.log("Waiting for next delta snapshot...");
        }
    }

    // Refresh every minute to match ESI cache
    setInterval(refreshLedger, 60000);