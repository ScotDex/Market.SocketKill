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

// Affiliate Rotation System
// Add this to market.js or create separate affiliate.js

const affiliates = [
    {
        id: 'eve-online',
        title: 'START YOUR EVE JOURNEY',
        description: 'New player? Get 1,000,000 skill points free',
        link: 'YOUR_EVE_RECRUIT_LINK_HERE',
        cta: 'CLAIM BONUS',
        icon: '🚀' // or use image URL
    },
    {
        id: 'digital-ocean',
        title: 'DIGITAL OCEAN HOSTING',
        description: '$200 credit for new accounts',
        link: 'YOUR_DO_REFERRAL_LINK',
        cta: 'GET CREDIT',
        icon: '💧'
    },
    {
        id: 'nordvpn',
        title: 'SECURE YOUR CONNECTION',
        description: '68% off + 3 months free',
        link: 'YOUR_VPN_AFFILIATE_LINK',
        cta: 'GET DEAL',
        icon: '🔒'
    },
    {
        id: 'ko-fi',
        title: 'SUPPORT SOCKETKILL',
        description: 'Help keep these tools free',
        link: 'https://ko-fi.com/socketkill',
        cta: 'DONATE',
        icon: '☕'
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
        <div class="aff-icon">${aff.icon}</div>
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
