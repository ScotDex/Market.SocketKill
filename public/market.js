
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.mjs';
const API_BASE = ''; 

function updateClock() {
    const now = new Date();
    const utc = now.toISOString().split('T')[1].split('.')[0];
    document.getElementById('clock').textContent = utc + ' UTC';
}
setInterval(updateClock, 1000);
updateClock();

function rotateNebula() {
   
    const img = new Image();
    img.onload = () => {
        document.body.style.backgroundImage = `url(https://api.socketkill.com/random)`;
    };
    img.src = `https://api.socketkill.com/random?${Date.now()}`;
}

document.body.style.backgroundImage = `url(https://api.socketkill.com/random)`;
setInterval(rotateNebula, 300000);


let itemCache = [];
let fuse; 


async function loadMarketItems() {
    try {
        const response = await fetch('/data/market-items.json');
        itemCache = await response.json();
        
        // Initialize Fuse.js settings
        fuse = new Fuse(itemCache, {
            keys: ['name'],
            threshold: 0.3,        // 0 = exact match, 1 = match anything
            distance: 100,         // Max distance for fuzzy match
            minMatchCharLength: 2, // Minimum characters to match
            ignoreLocation: true   // Search anywhere in string
        });
        
        console.log(`✅ Loaded ${itemCache.length} market items with fuzzy search`);
    } catch (err) {
        console.error('❌ Failed to load market items:', err);
    }
}
let affiliates = [];
async function loadAffiliates() {
    const response = await fetch('/data/ads.json');
    affiliates = await response.json();
    initAffiliates();
}

loadAffiliates();
loadMarketItems();

const searchInput = document.getElementById('item-search');
const loadingState = document.getElementById('loading-state');
const suggestionsContainer = document.createElement('div');
suggestionsContainer.id = 'item-suggestions';
suggestionsContainer.className = 'suggestion-dropdown';
searchInput.parentElement.appendChild(suggestionsContainer);

let selectedIndex = -1;

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.trim();
    
    // Minimum 2 characters
    if (term.length < 2) {
        hideSuggestions();
        return;
    }
    
    // Use Fuse.js for fuzzy search
    const results = fuse.search(term);
    const matches = results.map(r => r.item).slice(0, 6);
    
    if (matches.length === 0) {
        hideSuggestions();
        return;
    }
    
    showSuggestions(matches);
});
function showSuggestions(items) {
    selectedIndex = -1;
    
    suggestionsContainer.innerHTML = items.map((item, i) => 
        `<div class="suggestion-item" data-index="${i}" data-name="${item.name}">
            ${item.name}
        </div>`
    ).join('');
    
    suggestionsContainer.classList.add('active');
    suggestionsContainer.querySelectorAll('.suggestion-item').forEach(el => {
        el.addEventListener('click', () => {
            searchInput.value = el.dataset.name;
            hideSuggestions();
            searchItem(el.dataset.name);
        });
    });
}

function hideSuggestions() {
    suggestionsContainer.classList.remove('active');
    suggestionsContainer.innerHTML = '';
    selectedIndex = -1;
}

searchInput.addEventListener('keydown', (e) => {
    const items = suggestionsContainer.querySelectorAll('.suggestion-item');
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateSelection(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        updateSelection(items);
    } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && items[selectedIndex]) {
            const name = items[selectedIndex].dataset.name;
            searchInput.value = name;
            hideSuggestions();
            searchItem(name);
        } else {
            // Enter without selection - search whatever is typed
            const query = searchInput.value.trim();
            if (query) {
                hideSuggestions();
                searchItem(query);
            }
        }
    } else if (e.key === 'Escape') {
        hideSuggestions();
    }
});

function updateSelection(items) {
    items.forEach((item, i) => {
        if (i === selectedIndex) {
            item.classList.add('selected');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('selected');
        }
    });
}

// Click outside to close
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
        hideSuggestions();
    }
});


let currentAffiliateIndex = 0;
let rotationInterval;
let countdownInterval;
const ROTATION_TIME = 15000; // 15 seconds per affiliate

// Initialize affiliate system
function initAffiliates() {
    renderAffiliate(currentAffiliateIndex);
    renderDots();
    startRotation();
    
    // Manual navigation
    document.getElementById('prev-affiliate')?.addEventListener('click', () => {
        navigateAffiliate(-1);
    });
    
    document.getElementById('next-affiliate')?.addEventListener('click', () => {
        navigateAffiliate(1);
    });
}

// Render current affiliate
function renderAffiliate(index) {
    const aff = affiliates[index];
    const content = document.getElementById('affiliate-content');
    
    if (!content) return;
    
    content.innerHTML = `
        <img src="${aff.icon}" alt="${aff.id}" class="aff-icon">
        <h3 class="aff-title">${aff.title}</h3>
        <p class="aff-desc">${aff.description}</p>
        <a href="${aff.link}" 
           target="_blank" 
           rel="noopener nofollow"
           class="aff-cta"
           data-affiliate="${aff.id}">
            ${aff.cta} →
        </a>
    `;
    
    // Track click (optional analytics)
    content.querySelector('.aff-cta')?.addEventListener('click', () => {
        console.log(`Affiliate click: ${aff.id}`);
        // Add your analytics here if needed
    });
    
    updateDots(index);
}

// Render navigation dots
function renderDots() {
    const dotsContainer = document.getElementById('affiliate-dots');
    if (!dotsContainer) return;
    
    dotsContainer.innerHTML = affiliates.map((_, i) => 
        `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
    ).join('');
    
    // Dot click navigation
    dotsContainer.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            navigateAffiliate(index - currentAffiliateIndex);
        });
    });
}

// Update active dot
function updateDots(index) {
    document.querySelectorAll('.dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

// Navigate to affiliate (delta or absolute)
function navigateAffiliate(delta) {
    stopRotation();
    currentAffiliateIndex = (currentAffiliateIndex + delta + affiliates.length) % affiliates.length;
    renderAffiliate(currentAffiliateIndex);
    startRotation();
}

// Auto-rotation
function startRotation() {
    stopRotation(); // Clear any existing intervals
    
    let secondsRemaining = ROTATION_TIME / 1000;
    
    // Update countdown timer
    countdownInterval = setInterval(() => {
        secondsRemaining--;
        const timerEl = document.getElementById('rotation-timer');
        if (timerEl) timerEl.textContent = `${secondsRemaining}s`;
        
        if (secondsRemaining <= 0) {
            secondsRemaining = ROTATION_TIME / 1000;
        }
    }, 1000);
    
    // Rotate to next affiliate
    rotationInterval = setInterval(() => {
        currentAffiliateIndex = (currentAffiliateIndex + 1) % affiliates.length;
        renderAffiliate(currentAffiliateIndex);
        secondsRemaining = ROTATION_TIME / 1000;
    }, ROTATION_TIME);
}

function stopRotation() {
    if (rotationInterval) clearInterval(rotationInterval);
    if (countdownInterval) clearInterval(countdownInterval);
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAffiliates);
} else {
    initAffiliates();
}

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
