// Field data with pricing information
const FIELD_DATA = {
    'Box': { area: 1907, price: 30000, level: 1 },
    'Pressure': { area: 2024, price: 70000, level: 5 },
    'Cable': { area: 2175, price: 100000, level: 15 },
    'Pencil': { area: 2419, price: 150000, level: 20 },
    'Chocolate': { area: 2744, price: 190000, level: 25 },
    'Boom': { area: 3271, price: 200000, level: 30 },
    'Controller': { area: 3393, price: 300000, level: 35 },
    'Coffee': { area: 3652, price: 500000, level: 40 },
    'Tango': { area: 3859, price: 750000, level: 45 },
    'Syringe': { area: 3954, price: 1000000, level: 50 },
    'Screw': { area: 3997, price: 1750000, level: 55 },
    'Chips': { area: 6688, price: 3000000, level: 60 },
    'Wire': { area: 6750, price: 5000000, level: 65 },
    'Sport': { area: 6911, price: 10000000, level: 70 },
    'Arizona': { area: 7095, price: 15000000, level: 75 },
    'Liquid': { area: 7163, price: 25000000, level: 80 },
    'Mug': { area: 7313, price: 50000000, level: 85 },
    'Taco': { area: 8227, price: 100000000, level: 90 },
    'Mach': { area: 10481, price: 100000000, level: 90 },
    'Tornado': { area: 10916, price: 105000000, level: 94 },
    'Pokemon': { area: 10973, price: 150000000, level: 95 },
    'Temp': { area: 11182, price: 200000000, level: 100 },
    'Pipe': { area: 15766, price: 250000000, level: 105 },
    'Lamp': { area: 32022, price: 275000000, level: 110 },
    'Socket': { area: 41077, price: 300000000, level: 115 }
};

// Animal data
const ANIMAL_DATA = {
    'farm_chickens': { displayName: 'Chickens' },
    'farm_pig': { displayName: 'Pigs' },
    'farm_cows_small': { displayName: 'Cows (Small)' },
    'farm_cows_medium': { displayName: 'Cows (Medium)' },
    'farm_cows_large': { displayName: 'Cows (Large)' }
};

// Animal feed types
const ANIMAL_FEED_TYPES = {
    'farm_chickens': 'Carrot Seeds',
    'farm_pig': 'Potatoes', 
    'farm_cows_small': 'Wheat',
    'farm_cows_medium': 'Wheat',
    'farm_cows_large': 'Wheat'
};

// --- GLOBAL STATE ---
let apiRefreshInterval = null;
let liveUpdateInterval = null;
let isDragging = false;
let isResizing = false;
let offsetX = 0, offsetY = 0;
let lastSuccessfulFetch = 0;
let currentApiData = { fields: [], animals: [] };
let parentWindowData = null;
const CACHE_DURATION_MS = 30000;

// --- DOM ELEMENTS ---
const floatingWindow = document.getElementById('floatingWindow');
const windowHeader = document.getElementById('windowHeader');
const minimizeBtn = document.getElementById('minimizeBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeModalBtn = document.querySelector('.close-modal');
const saveSettingsBtn = document.getElementById('saveSettings');
const apiKeyInput = document.getElementById('apiKey');
const opacityRange = document.getElementById('opacityRange');
const opacityValue = document.getElementById('opacityValue');
const refreshIntervalSelect = document.getElementById('refreshInterval');
const customRefreshTime = document.getElementById('customRefreshTime');
const themeOptions = document.querySelectorAll('.theme-option');
const themeToggle = document.getElementById('themeToggle');
const layoutToggle = document.getElementById('layoutToggle');
const fetchDataBtn = document.getElementById('fetchData');
const statusMessageDiv = document.getElementById('statusMessage');
const resizeHandle = document.getElementById('resizeHandle');

// --- SETTINGS ---
const defaultSettings = {
    opacity: 100,
    theme: 'green',
    mode: 'dark',
    layout: 'single',
    refreshInterval: 60,
    apiKey: ''
};
let settings = { ...defaultSettings, ...JSON.parse(localStorage.getItem('farmingTrackerSettings') || '{}') };

// --- INITIALIZATION ---
function init() {
    loadSettings();
    applySettings(settings);
    setupEventListeners();
    displayFieldsData();
    displayAnimalsData();
    startLiveUpdates();
    window.parent.postMessage({ type: 'getData' }, '*');
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    windowHeader.addEventListener('mousedown', dragMouseDown);
    resizeHandle.addEventListener('mousedown', resizeMouseDown);
    minimizeBtn.addEventListener('click', toggleMinimize);
    settingsBtn.addEventListener('click', openSettings);
    closeModalBtn.addEventListener('click', closeSettings);
    window.addEventListener('click', (e) => { if (e.target === settingsModal) closeSettings(); });
    opacityRange.addEventListener('input', updateOpacityDisplay);
    refreshIntervalSelect.addEventListener('change', handleRefreshIntervalChange);
    themeOptions.forEach(option => option.addEventListener('click', selectTheme));
    saveSettingsBtn.addEventListener('click', saveAndApplySettings);
    fetchDataBtn.addEventListener('click', () => fetchAllData(true));
    document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', switchTab));
    window.addEventListener('message', handleParentMessage);
    window.addEventListener('keydown', handleEscapeKey);
}

// --- CORE LOGIC ---
async function fetchAllData(force = false) {
    const now = Date.now();
    if (!force && now - lastSuccessfulFetch < CACHE_DURATION_MS) {
        showStatusMessage('Using cached data. Refresh to force.', false);
        return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        showStatusMessage('API key missing. Open Settings to enter it.', true);
        return;
    }

    fetchDataBtn.disabled = true;
    fetchDataBtn.querySelector('span').innerHTML = '<span class="loading-spinner"></span>Loading...';
    showStatusMessage('Fetching latest data...', false);

    try {
        const [fieldsResponse, animalsResponse] = await Promise.all([
            fetch('https://tycoon-2epova.users.cfx.re/status/farming/fields.json', { headers: { 'X-Tycoon-Key': apiKey } }),
            fetch('https://tycoon-2epova.users.cfx.re/status/farming/animals.json', { headers: { 'X-Tycoon-Key': apiKey } })
        ]);

        if (!fieldsResponse.ok || !animalsResponse.ok) {
            throw new Error(`API Error: Fields ${fieldsResponse.status}, Animals ${animalsResponse.status}`);
        }

        const fieldsData = await fieldsResponse.json();
        const animalsData = await animalsResponse.json();

        currentApiData = { fields: fieldsData.fields || [], animals: animalsData.animals || [] };
        
        displayFieldsData();
        displayAnimalsData();

        lastSuccessfulFetch = Date.now();
        showStatusMessage(`Updated: ${new Date(lastSuccessfulFetch).toLocaleTimeString()}`, false);
        
    } catch (error) {
        console.error("Fetch Error:", error);
        showStatusMessage(`Error: ${error.message}`, true);
    } finally {
        fetchDataBtn.disabled = false;
        fetchDataBtn.querySelector('span').textContent = 'Load Data';
    }
}

function startLiveUpdates() {
    if (liveUpdateInterval) clearInterval(liveUpdateInterval);
    liveUpdateInterval = setInterval(updateAllTimers, 1000);
}

// --- DISPLAY & RENDERING ---
function displayFieldsData() {
    const container = document.getElementById('fieldsContainer');
    container.innerHTML = '';

    const allFields = Object.keys(FIELD_DATA).map(fieldName => {
        const staticInfo = FIELD_DATA[fieldName];
        const apiInfo = currentApiData.fields.find(f => f.name === fieldName);
        return { name: fieldName, ...staticInfo, ...apiInfo, isOwned: !!apiInfo };
    });
    
    const statePriority = { 'harvesting': 1, 'growing': 2, 'planting': 3, 'cultivating': 4 };
    allFields.sort((a, b) => {
        if (a.isOwned !== b.isOwned) return a.isOwned ? -1 : 1;
        if (!a.isOwned) return a.name.localeCompare(b.name);

        const aPrio = statePriority[a.state] || 5;
        const bPrio = statePriority[b.state] || 5;
        if (aPrio !== bPrio) return aPrio - bPrio;

        if (a.state === 'growing') {
             const aTimeLeft = (a.harvest_time || 0) - Date.now() / 1000;
             const bTimeLeft = (b.harvest_time || 0) - Date.now() / 1000;
             return aTimeLeft - bTimeLeft;
        }
        
        return a.name.localeCompare(b.name);
    });

    allFields.forEach(field => {
        const fieldBox = document.createElement('div');
        fieldBox.className = `field-box ${!field.isOwned ? 'unowned' : ''}`;
        
        let htmlContent;
        if (field.isOwned) {
            let growthInfoHtml = '';
            if (field.state === 'growing' && field.harvest_time && field.time_planted) {
                const localHarvestTime = new Date(field.harvest_time * 1000).toLocaleString();
                growthInfoHtml = `
                    <p><span class="label">Ready At:</span> <span class="value">${localHarvestTime}</span></p>
                    <p><span class="label">Time Left:</span> <span class="value countdown-timer" data-end-time="${field.harvest_time}"></span></p>
                    <div class="progress-bar growth-progress-bar" data-start-time="${field.time_planted}" data-end-time="${field.harvest_time}">
                        <div class="progress"></div>
                    </div>`;
            }
            htmlContent = `
                <h4>${field.name}</h4>
                <div class="field-info">
                    <p><span class="label">Area:</span> <span class="value">${Math.round(field.area)}m²</span></p>
                    <p><span class="label">Crop:</span> <span class="value">${field.crop_name || 'None'}</span></p>
                    <p><span class="label">State:</span> <span class="value">${field.state}</span></p>
                    ${growthInfoHtml}
                </div>
                <div class="status ${field.state}">${field.state.toUpperCase()}</div>`;
        } else {
            htmlContent = `
                <h4>${field.name}</h4>
                <div class="field-info">
                    <p><span class="label">Area:</span> <span class="value">${Math.round(field.area)}m²</span></p>
                    <p><span class="label">Price:</span> <span class="value">${formatPrice(field.price)}</span></p>
                    <p><span class="label">Level:</span> <span class="value">${field.level}</span></p>
                </div>
                <div class="status unowned-status">UNOWNED</div>`;
        }
        fieldBox.innerHTML = htmlContent;
        container.appendChild(fieldBox);
    });
}

function displayAnimalsData() {
    const container = document.getElementById('animalsContainer');
    container.innerHTML = '';

    const allAnimals = Object.keys(ANIMAL_DATA).map(intName => {
        const staticInfo = ANIMAL_DATA[intName];
        const apiInfo = currentApiData.animals.find(a => a.int_name === intName);
        return { int_name: intName, ...staticInfo, ...apiInfo, isOwned: !!apiInfo };
    });

    allAnimals.sort((a, b) => {
        if (a.isOwned !== b.isOwned) return a.isOwned ? -1 : 1;
        if (!a.isOwned) return a.displayName.localeCompare(b.displayName);
        
        const aReady = !a.collection_time || a.collection_time * 1000 <= Date.now();
        const bReady = !b.collection_time || b.collection_time * 1000 <= Date.now();
        if(aReady !== bReady) return aReady ? -1 : 1;

        return (a.collection_time || 0) - (b.collection_time || 0);
    });

    allAnimals.forEach(animal => {
        const animalBox = document.createElement('div');
        animalBox.className = `animal-box ${!animal.isOwned ? 'unowned' : ''}`;
        let htmlContent;

        if (animal.isOwned) {
            const feedPercentage = (animal.feed_level / animal.feed_max) * 100;
            const feedRemaining = animal.feed_max - animal.feed_level;
            let collectionInfoHtml = `<p><span class="label">Collection:</span> <span class="value countdown-timer" data-end-time="${animal.collection_time}"></span></p>`;
            if (animal.collection_time) {
                const localCollectionTime = new Date(animal.collection_time * 1000).toLocaleString();
                collectionInfoHtml += `<p><span class="label">Ready At:</span> <span class="value">${localCollectionTime}</span></p>`;
            }

            htmlContent = `
                <h4>${animal.displayName}</h4>
                <div class="animal-count">${animal.total}/10</div>
                <div class="feed-info">
                    <p><span class="label">Amount to Feed:</span> <span class="value">${feedRemaining}</span></p>
                    <div class="progress-bar"><div class="progress" style="width: ${feedPercentage}%"></div></div>
                    <p><span class="label">Feed Level:</span> <span class="value">${feedPercentage.toFixed(0)}%</span></p>
                    <p><span class="label">Feed Type:</span> <span class="value">${ANIMAL_FEED_TYPES[animal.int_name] || 'Unknown'}</span></p>
                    ${collectionInfoHtml}
                </div>`;
        } else {
            htmlContent = `
                <h4>${animal.displayName}</h4>
                 <div class="animal-count">0/10</div>
                <div class="feed-info">
                    <p><span class="label">Feed type:</span> <span class="value">${ANIMAL_FEED_TYPES[animal.int_name] || 'Unknown'}</span></p>
                </div>
                <div class="status unowned-status">UNOWNED</div>`;
        }
        animalBox.innerHTML = htmlContent;
        container.appendChild(animalBox);
    });
}


function updateAllTimers() {
    // Update digital countdowns
    document.querySelectorAll('.countdown-timer').forEach(timerEl => {
        const endTime = parseInt(timerEl.dataset.endTime, 10);
        if (!endTime || isNaN(endTime)) {
            timerEl.textContent = 'N/A';
            return;
        }

        const now = Math.floor(Date.now() / 1000);
        const remaining = endTime - now;

        if (remaining <= 0) {
            timerEl.textContent = 'Ready!';
            timerEl.style.color = '#f44336';
        } else {
            const hours = String(Math.floor(remaining / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
            const seconds = String(remaining % 60).padStart(2, '0');
            timerEl.textContent = `${hours}:${minutes}:${seconds}`;
            timerEl.style.color = '';
        }
    });

    // Update field growth progress bars
    document.querySelectorAll('.growth-progress-bar').forEach(barEl => {
        const startTime = parseInt(barEl.dataset.startTime, 10);
        const endTime = parseInt(barEl.dataset.endTime, 10);
        const now = Math.floor(Date.now() / 1000);

        if (!startTime || !endTime || isNaN(startTime) || isNaN(endTime)) return;

        const totalDuration = endTime - startTime;
        const elapsedTime = now - startTime;
        let progress = (elapsedTime / totalDuration) * 100;
        
        progress = Math.max(0, Math.min(100, progress)); // Clamp between 0 and 100

        barEl.querySelector('.progress').style.width = `${progress}%`;
    });
}

function showStatusMessage(message, isError) {
    statusMessageDiv.textContent = message;
    statusMessageDiv.className = `status-container ${isError ? 'error' : ''}`;
}

// --- SETTINGS & UTILITIES ---
function saveAndApplySettings() {
    const customTime = customRefreshTime.style.display === 'block' ? parseInt(customRefreshTime.value) || 60 : null;
    settings = {
        opacity: parseInt(opacityRange.value),
        theme: document.querySelector('.theme-option.active').dataset.theme,
        mode: themeToggle.checked ? 'light' : 'dark',
        layout: layoutToggle.checked ? 'grid' : 'single',
        refreshInterval: refreshIntervalSelect.value === 'custom' ? customTime : parseInt(refreshIntervalSelect.value),
        apiKey: apiKeyInput.value.trim()
    };
    localStorage.setItem('farmingTrackerSettings', JSON.stringify(settings));
    applySettings(settings);
    closeSettings();
    setupApiRefreshInterval();
}

function applySettings(s) {
    floatingWindow.style.opacity = s.opacity / 100;
    updateThemeColors(s.theme);
    document.body.className = s.mode === 'light' ? 'light-mode' : '';
    if (s.layout === 'grid') document.body.classList.add('grid-view');
    
    opacityRange.value = s.opacity;
    opacityValue.textContent = `${s.opacity}%`;
    themeToggle.checked = s.mode === 'light';
    layoutToggle.checked = s.layout === 'grid';
    themeOptions.forEach(opt => opt.classList.toggle('active', opt.dataset.theme === s.theme));
    apiKeyInput.value = s.apiKey;
    
    const intervalExists = Array.from(refreshIntervalSelect.options).some(opt => opt.value === s.refreshInterval.toString());
    if (intervalExists) {
        refreshIntervalSelect.value = s.refreshInterval.toString();
        customRefreshTime.style.display = 'none';
    } else {
        refreshIntervalSelect.value = 'custom';
        customRefreshTime.style.display = 'block';
        customRefreshTime.value = s.refreshInterval;
    }
}

function setupApiRefreshInterval() {
    if (apiRefreshInterval) clearInterval(apiRefreshInterval);
    const intervalTime = settings.refreshInterval * 1000;
    if (intervalTime > 0) {
        apiRefreshInterval = setInterval(() => fetchAllData(false), intervalTime);
    }
}

function getApiKey() {
    const manualKey = apiKeyInput.value.trim();
    if (manualKey) return manualKey;
    if (parentWindowData && parentWindowData.pkey) return parentWindowData.pkey;
    return settings.apiKey;
}

// --- EVENT HANDLERS ---
function handleParentMessage(event) {
    if (event.data && event.data.pkey) {
        parentWindowData = event.data;
        if (!apiKeyInput.value.trim()) {
            fetchAllData(true);
        }
    }
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        window.parent.postMessage({ type: 'pin' }, '*');
    }
}

function dragMouseDown(e) {
    if (e.target.classList.contains('window-control') || e.target.id === 'resizeHandle') return;
    e.preventDefault();
    offsetX = e.clientX - floatingWindow.offsetLeft;
    offsetY = e.clientY - floatingWindow.offsetTop;
    document.addEventListener('mousemove', elementDrag);
    document.addEventListener('mouseup', closeDragElement);
}

function elementDrag(e) {
    e.preventDefault();
    floatingWindow.style.left = (e.clientX - offsetX) + "px";
    floatingWindow.style.top = (e.clientY - offsetY) + "px";
}

function closeDragElement() {
    document.removeEventListener('mousemove', elementDrag);
    document.removeEventListener('mouseup', closeDragElement);
}

function resizeMouseDown(e) {
    e.preventDefault();
    document.addEventListener('mousemove', elementResize);
    document.addEventListener('mouseup', closeResizeElement);
}

function elementResize(e) {
    const newWidth = e.clientX - floatingWindow.offsetLeft;
    const newHeight = e.clientY - floatingWindow.offsetTop;
    floatingWindow.style.width = `${newWidth > 300 ? newWidth : 300}px`;
    floatingWindow.style.height = `${newHeight > 400 ? newHeight : 400}px`;
}

function closeResizeElement() {
    document.removeEventListener('mousemove', elementResize);
    document.removeEventListener('mouseup', closeResizeElement);
}

// --- Simple UI Functions ---
function loadSettings() { settings = { ...defaultSettings, ...JSON.parse(localStorage.getItem('farmingTrackerSettings') || '{}') }; }
function toggleMinimize() { floatingWindow.classList.toggle('minimized'); }
function openSettings() { settingsModal.style.display = 'block'; }
function closeSettings() { settingsModal.style.display = 'none'; }
function updateOpacityDisplay() { opacityValue.textContent = `${opacityRange.value}%`; floatingWindow.style.opacity = opacityRange.value / 100;}
function handleRefreshIntervalChange() { customRefreshTime.style.display = refreshIntervalSelect.value === 'custom' ? 'block' : 'none'; }
function selectTheme(event) { themeOptions.forEach(option => option.classList.remove('active')); event.target.classList.add('active'); }
function switchTab(event) {
    const tabId = event.target.dataset.tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `${tabId}Tab`));
}
function formatPrice(price) { return price >= 1000000 ? `$${(price / 1000000).toFixed(0)}mil` : `$${price.toLocaleString()}`; }
function updateThemeColors(theme) {
    const gradients = { green: 'linear-gradient(to right, #4a9f5e, #2e7d32)', blue: 'linear-gradient(to right, #2196F3, #0D47A1)', purple: 'linear-gradient(to right, #9C27B0, #4A148C)', red: 'linear-gradient(to right, #F44336, #B71C1C)', pink: 'linear-gradient(to right, #E91E63, #AD1457)', black: 'linear-gradient(to right, #424242, #212121)', yellow: 'linear-gradient(to right, #FFC107, #F57C00)', orange: 'linear-gradient(to right, #FF9800, #E65100)' };
    const colors = { green: '#2e7d32', blue: '#0D47A1', purple: '#4A148C', red: '#B71C1C', pink: '#AD1457', black: '#212121', yellow: '#F57C00', orange: '#E65100' };
    const themeColor = colors[theme] || '#2e7d32';
    windowHeader.style.background = gradients[theme];
    document.querySelectorAll('.themed-button').forEach(btn => btn.style.backgroundColor = themeColor);
    document.documentElement.style.setProperty('--theme-color', themeColor);
}

// --- START ---
document.addEventListener('DOMContentLoaded', init);

