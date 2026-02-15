const API_BASE = ''; // Same origin, no need for full URL

// Clock update
function updateClock() {
    const now = new Date();
    const utc = now.toISOString().split('T')[1].split('.')[0];
    document.getElementById('clock').textContent = utc + ' UTC';
}
setInterval(updateClock, 1000);
updateClock();

// Search functionality
const searchInput = document.getElementById('item-search');
const loadingState = document.getElementById('loading-state');

searchInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
            await searchItem(query);
        }
    }
});

async function searchItem(itemName) {
    try {
        // Show loading state
        loadingState.style.display = 'block';
        
        // Fetch market data
        const res = await fetch(`${API_BASE}/api/market/compare?name=${encodeURIComponent(itemName)}`);
        const data = await res.json();
        
        if (data.error) {
            alert(`Error: ${data.error}`);
            loadingState.style.display = 'none';
            return;
        }
        
        // Update UI
        updateDisplay(data);
        loadingState.style.display = 'none';
        
    } catch (err) {
        console.error('Search failed:', err);
        alert('Search failed. Check console for details.');
        loadingState.style.display = 'none';
    }
}

function updateDisplay(data) {
    // Update item icon
    document.getElementById('item-icon').src = 
        `https://api.socketkill.com/render/market/${data.typeId}`;
    
    // Update item name and ID
    document.getElementById('item-name').textContent = data.name;
    document.getElementById('item-id').textContent = `TYPE_ID: ${data.typeId}`;
    
    // Find cheapest hub
    const validHubs = data.hubs.filter(h => h.lowestSell !== null);
    const cheapestPrice = validHubs.length ? Math.min(...validHubs.map(h => h.lowestSell)) : null;
    
    // Update hub prices
    data.hubs.forEach(hubData => {
        const hubRow = document.querySelector(`.hub-row[data-hub="${hubData.hub.toLowerCase()}"]`);
        if (hubRow) {
            const priceEl = hubRow.querySelector('.hub-price');
            
            if (hubData.lowestSell === null) {
                priceEl.textContent = 'N/A';
                hubRow.classList.remove('cheapest');
            } else {
                priceEl.textContent = formatPrice(hubData.lowestSell) + ' ISK';
                
                // Highlight cheapest
                if (hubData.lowestSell === cheapestPrice) {
                    hubRow.classList.add('cheapest');
                } else {
                    hubRow.classList.remove('cheapest');
                }
            }
        }
    });
}

function formatPrice(price) {
    return price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
