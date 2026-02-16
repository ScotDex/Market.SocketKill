/**
 * Format ISK values for display
 */
function formatISK(value) {
    if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
    return value.toFixed(2);
}

/**
 * Format ISK with full precision (for exact prices)
 */
function formatISKExact(value) {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Format volume numbers
 */
function formatVolume(value) {
    if (value >= 1e12) return (value / 1e12).toFixed(1) + 'T';
    if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
    return value.toString();
}

/**
 * Get current UTC timestamp in ISO format
 */
function getUTCTimestamp() {
    return new Date().toISOString();
}

/**
 * Get UTC time string for display (HH:MM:SS)
 */
function getUTCTimeString() {
    const now = new Date();
    return now.toISOString().split('T')[1].split('.')[0];
}

/**
 * Sanitize item name for cache key
 */
function sanitizeItemName(name) {
    return name.trim().toLowerCase();
}

/**
 * Calculate percentage difference
 */
function calculatePriceDelta(oldPrice, newPrice) {
    if (!oldPrice || oldPrice === 0) return null;
    return ((newPrice - oldPrice) / oldPrice) * 100;
}

/**
 * Find cheapest hub from results
 */
function findCheapestHub(hubResults) {
    const validHubs = hubResults.filter(h => h.lowestSell !== null);
    if (validHubs.length === 0) return null;
    
    return validHubs.reduce((cheapest, current) => 
        current.lowestSell < cheapest.lowestSell ? current : cheapest
    );
}

module.exports = {
    formatISK,
    formatISKExact,
    formatVolume,
    getUTCTimestamp,
    getUTCTimeString,
    sanitizeItemName,
    calculatePriceDelta,
    findCheapestHub
};