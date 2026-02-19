const API_BASE = ''; // Same origin, no need for full URL

// Clock update
function updateClock() {
    const now = new Date();
    const utc = now.toISOString().split('T')[1].split('.')[0];
    document.getElementById('clock').textContent = utc + ' UTC';
}
setInterval(updateClock, 1000);
updateClock();

function rotateNebula() {
    // Create new Image object to force fresh fetch
    const img = new Image();
    img.onload = () => {
        document.body.style.backgroundImage = `url(https://api.socketkill.com/random)`;
    };
    img.src = `https://api.socketkill.com/random?${Date.now()}`;
}

// Set initial background
document.body.style.backgroundImage = `url(https://api.socketkill.com/random)`;

// Rotate every 5 minutes
setInterval(rotateNebula, 300000);

// Search functionality
// Global cache
let itemCache = [];

// Load market items from CDN on page load
async function loadMarketItems() {
    try {
        const response = await fetch('/data/market-items.json');
        itemCache = await response.json();
        console.log(`✅ Loaded ${itemCache.length} market items`);
    } catch (err) {
        console.error('❌ Failed to load market items:', err);
    }
}

// Initialize immediately
loadMarketItems();

// Autocomplete on search input
const searchInput = document.getElementById('item-search');
const suggestionsContainer = document.createElement('div');
suggestionsContainer.id = 'item-suggestions';
suggestionsContainer.className = 'suggestion-dropdown';
searchInput.parentElement.appendChild(suggestionsContainer);

let selectedIndex = -1;

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    
    // Minimum 2 characters
    if (term.length < 2) {
        hideSuggestions();
        return;
    }
    
    // Fuzzy match
    const matches = itemCache
        .filter(item => item.name.toLowerCase().includes(term))
        .slice(0, 6); // Max 6 results
    
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
    
    // Click handler
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

// Keyboard navigation
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



// Affiliate Rotation System
// Add this to market.js or create separate affiliate.js

const affiliates = [
    {
        id: 'eve-online',
        title: 'START YOUR EVE JOURNEY',
        description: 'New player? Get 1,000,000 skill points free',
        link: 'https://www.eveonline.com/signup?invc=e32ca441-aa95-4eb7-ad06-d2c6334a5872',
        cta: 'CLAIM BONUS',
        icon: 'https://edge.socketkill.com/friend.jpg' 
    },
    {
        id: 'digital-ocean',
        title: 'DIGITAL OCEAN HOSTING',
        description: '$200 credit for new accounts',
        link: 'https://www.digitalocean.com/?refcode=1808909b79cf&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge',
        cta: 'GET CREDIT',
        icon: 'https://web-platforms.sfo2.cdn.digitaloceanspaces.com/WWW/Badge%201.svg'
    },
    {
        id: 'nerdordie',
        title: 'DO YOU STREAM?',
        description: 'Discounts Available',
        link: 'https://nerdordie.com/shop/ref/kps2mr/',
        cta: 'GET DEAL',
        icon: 'https://edge.socketkill.com/NoD_Stacked_White.png'
    },
    {
        id: 'ko-fi',
        title: 'SUPPORT SOCKETKILL',
        description: 'Help keep these tools free',
        link: 'https://ko-fi.com/scottishdex',
        cta: 'DONATE',
        icon: 'https://storage.ko-fi.com/cdn/brandasset/v2/support_me_on_kofi_dark.png?_gl=1*i2rs49*_gcl_au*MzQ4ODkzODgxLjE3NjcyMDIxMDg.*_ga*NjEzNDk0NDM5LjE3NjcyMDIxMDg.*_ga_M13FZ7VQ2C*czE3NzE1MTE3ODIkbzgkZzEkdDE3NzE1MTE4NTQkajYwJGwwJGgw'
    }
    // Add more affiliates as needed
];

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
