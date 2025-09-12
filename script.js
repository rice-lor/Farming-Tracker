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

// Animal feed types
const ANIMAL_FEED_TYPES = {
    'farm_chickens': 'Carrot Seeds',
    'farm_pig': 'Potatoes', 
    'farm_cows_small': 'Wheat',
    'farm_cows_medium': 'Wheat',
    'farm_cows_large': 'Wheat'
};

// Global variables
let refreshInterval = null;
let countdownInterval = null;

// DOM elements
const floatingWindow = document.getElementById('floatingWindow');
const windowHeader = document.getElementById('windowHeader');
const minimizeBtn = document.getElementById('minimizeBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeModalBtn = document.querySelector('.close-modal');
const saveSettingsBtn = document.getElementById('saveSettings');
const opacityRange = document.getElementById('opacityRange');
const opacityValue = document.getElementById('opacityValue');
const refreshIntervalSelect = document.getElementById('refreshInterval');
const customRefreshTime = document.getElementById('customRefreshTime');
const themeOptions = document.querySelectorAll('.theme-option');
const themeToggle = document.getElementById('themeToggle');

// Dragging variables
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

// Default settings
const defaultSettings = {
    opacity: 100,
    theme: 'green',
    mode: 'dark',
    refreshInterval: 60,
    apiKey: ''
};

// Initialize settings from localStorage
let settings = { ...defaultSettings, ...JSON.parse(localStorage.getItem('farmingTrackerSettings') || '{}') };

// Initialize the application
function init() {
    loadSettings();
    setupEventListeners();
    applySettings(settings);
    
    // Load saved API key
    if (settings.apiKey) {
        document.getElementById('apiKey').value = settings.apiKey;
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Window dragging
    windowHeader.addEventListener('mousedown', dragMouseDown);
    
    // Window controls
    minimizeBtn.addEventListener('click', toggleMinimize);
    settingsBtn.addEventListener('click', openSettings);
    
    // Settings modal
    closeModalBtn.addEventListener('click', closeSettings);
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            closeSettings();
        }
    });
    
    // Settings controls
    opacityRange.addEventListener('input', updateOpacityDisplay);
    refreshIntervalSelect.addEventListener('change', handleRefreshIntervalChange);
    themeOptions.forEach(option => {
        option.addEventListener('click', selectTheme);
    });
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Data fetching
    document.getElementById('fetchData').addEventListener('click', fetchAllData);
    
    // Tab functionality
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', switchTab);
    });
}

// Smooth dragging functionality
function dragMouseDown(e) {
    if (e.target === minimizeBtn || e.target === settingsBtn) {
        return;
    }
    
    e.preventDefault();
    offsetX = e.clientX - floatingWindow.offsetLeft;
    offsetY = e.clientY - floatingWindow.offsetTop;
    isDragging = true;
    
    document.addEventListener('mousemove', elementDrag);
    document.addEventListener('mouseup', closeDragElement);
}

function elementDrag(e) {
    if (isDragging) {
        e.preventDefault();
        const newX = e.clientX - offsetX;
        const newY = e.clientY - offsetY;
        
        floatingWindow.style.left = newX + "px";
        floatingWindow.style.top = newY + "px";
    }
}

function closeDragElement() {
    isDragging = false;
    document.removeEventListener('mousemove', elementDrag);
    document.removeEventListener('mouseup', closeDragElement);
}

// Settings functions
function loadSettings() {
    settings = { ...defaultSettings, ...JSON.parse(localStorage.getItem('farmingTrackerSettings') || '{}') };
}

function saveSettings() {
    const selectedTheme = document.querySelector('.theme-option.active').dataset.theme;
    const customTime = customRefreshTime.style.display === 'block' ? parseInt(customRefreshTime.value) || 60 : null;
    
    settings = {
        opacity: parseInt(opacityRange.value),
        theme: selectedTheme,
        mode: themeToggle.checked ? 'light' : 'dark',
        refreshInterval: refreshIntervalSelect.value === 'custom' ? customTime : parseInt(refreshIntervalSelect.value),
        apiKey: document.getElementById('apiKey').value.trim()
    };
    
    localStorage.setItem('farmingTrackerSettings', JSON.stringify(settings));
    applySettings(settings);
    closeSettings();
    
    // Restart refresh interval with new timing
    if (settings.apiKey) {
        setupRefreshInterval();
    }
}

function applySettings(settings) {
    // Apply opacity
    floatingWindow.style.opacity = settings.opacity / 100;
    
    // Apply theme
    updateThemeColors(settings.theme);
    
    // Apply dark/light mode
    document.body.className = settings.mode === 'light' ? 'light-mode' : '';
    
    // Update settings UI
    opacityRange.value = settings.opacity;
    opacityValue.textContent = `${settings.opacity}%`;
    themeToggle.checked = settings.mode === 'light';
    
    // Update theme selection
    themeOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.theme === settings.theme);
    });
    
    // Update refresh interval
    refreshIntervalSelect.value = settings.refreshInterval.toString();
    if (!Array.from(refreshIntervalSelect.options).some(opt => opt.value === settings.refreshInterval.toString())) {
        refreshIntervalSelect.value = 'custom';
        customRefreshTime.style.display = 'block';
        customRefreshTime.value = settings.refreshInterval;
    }
}

function updateThemeColors(theme) {
    const gradients = {
        green: 'linear-gradient(to right, #4a9f5e, #2e7d32)',
        blue: 'linear-gradient(to right, #2196F3, #0D47A1)',
        purple: 'linear-gradient(to right, #9C27B0, #4A148C)',
        red: 'linear-gradient(to right, #F44336, #B71C1C)',
        pink: 'linear-gradient(to right, #E91E63, #AD1457)',
        black: 'linear-gradient(to right, #424242, #212121)',
        yellow: 'linear-gradient(to right, #FFC107, #F57C00)',
        orange: 'linear-gradient(to right, #FF9800, #E65100)'
    };
    
    const colors = {
        green: '#2e7d32',
        blue: '#0D47A1', 
        purple: '#4A148C',
        red: '#B71C1C',
        pink: '#AD1457',
        black: '#212121',
        yellow: '#F57C00',
        orange: '#E65100'
    };
    
    // Update header gradient
    windowHeader.style.background = gradients[theme];
    
    // Update button colors
    const themedButtons = document.querySelectorAll('.themed-button');
    themedButtons.forEach(button => {
        button.style.backgroundColor = colors[theme];
    });
}

// Event handler functions
function toggleMinimize() {
    floatingWindow.classList.toggle('minimized');
    minimizeBtn.textContent = floatingWindow.classList.contains('minimized') ? '+' : '—';
}

function openSettings() {
    applySettings(settings);
    settingsModal.style.display = 'block';
}

function closeSettings() {
    settingsModal.style.display = 'none';
}

function updateOpacityDisplay() {
    opacityValue.textContent = `${opacityRange.value}%`;
}

function handleRefreshIntervalChange() {
    customRefreshTime.style.display = refreshIntervalSelect.value === 'custom' ? 'block' : 'none';
}

function selectTheme(event) {
    themeOptions.forEach(option => option.classList.remove('active'));
    event.target.classList.add('active');
}

function switchTab(event) {
    const tabId = event.target.getAttribute('data-tab');
    
    // Update active tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show corresponding content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabId}Tab`) {
            content.classList.add('active');
        }
    });
}

// Data fetching functions
function fetchAllData() {
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (!apiKey) {
        alert('Please enter your API key');
        return;
    }
    
    // Save API key to settings
    settings.apiKey = apiKey;
    localStorage.setItem('farmingTrackerSettings', JSON.stringify(settings));
    
    fetchFieldsData(apiKey);
    fetchAnimalsData(apiKey);
    setupRefreshInterval();
}

function setupRefreshInterval() {
    // Clear existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Set up new interval
    const intervalTime = settings.refreshInterval * 1000; // Convert to milliseconds
    refreshInterval = setInterval(() => {
        if (settings.apiKey) {
            fetchFieldsData(settings.apiKey);
            fetchAnimalsData(settings.apiKey);
        }
    }, intervalTime);
}

function fetchFieldsData(apiKey) {
    const url = 'https://tycoon-2epova.users.cfx.re/status/farming/fields.json';
    
    document.getElementById('fieldsLoading').style.display = 'block';
    document.getElementById('fieldsError').style.display = 'none';
    
    fetch(url, {
        headers: {
            'X-Tycoon-Key': apiKey
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch fields data');
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('fieldsLoading').style.display = 'none';
        displayFieldsData(data.fields);
        startCountdownTimers();
    })
    .catch(error => {
        document.getElementById('fieldsLoading').style.display = 'none';
        document.getElementById('fieldsError').style.display = 'block';
        document.getElementById('fieldsError').textContent = error.message;
    });
}

function fetchAnimalsData(apiKey) {
    const url = 'https://tycoon-2epova.users.cfx.re/status/farming/animals.json';
    
    document.getElementById('animalsLoading').style.display = 'block';
    document.getElementById('animalsError').style.display = 'none';
    
    fetch(url, {
        headers: {
            'X-Tycoon-Key': apiKey
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch animals data');
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('animalsLoading').style.display = 'none';
        displayAnimalsData(data.animals);
    })
    .catch(error => {
        document.getElementById('animalsLoading').style.display = 'none';
        document.getElementById('animalsError').style.display = 'block';
        document.getElementById('animalsError').textContent = error.message;
    });
}

// Data display functions
function displayFieldsData(fields) {
    const container = document.getElementById('fieldsContainer');
    container.innerHTML = '';
    
    // Show all fields, not just owned ones
    if (fields.length === 0) {
        container.innerHTML = '<div class="error">No fields found</div>';
        return;
    }
    
    fields.forEach(field => {
        const fieldInfo = FIELD_DATA[field.name] || { area: field.planted_area, price: 0, level: 0 };
        const fieldBox = document.createElement('div');
        fieldBox.className = 'field-box';
        fieldBox.setAttribute('data-field-name', field.name);
        
        // Format price
        const formattedPrice = field.isOwned ? 'Owned' : formatPrice(fieldInfo.price);
        
        // Get crop information
        const cropName = field.crop_name || 'None';
        
        // Get state and countdown
        let stateDisplay = field.state;
        let countdownHtml = '';
        
        if (field.state === 'growing' && field.time_planted && field.harvest_time) {
            const countdownId = `countdown-${field.name.replace(/\s+/g, '-')}`;
            countdownHtml = `<div class="countdown-timer" id="${countdownId}">Calculating...</div>`;
        }
        
        // Fertilized status
        const fertilizedStatus = field.fertilized ? 'Yes' : 'No';
        
        fieldBox.innerHTML = `
            <h4>${field.name}</h4>
            <div class="field-info">
                <p><span class="label">Area:</span> <span class="value">${Math.round(fieldInfo.area)}m²</span></p>
                <p><span class="label">Price/Status:</span> <span class="value">${formattedPrice} (Lvl. ${fieldInfo.level})</span></p>
                <p><span class="label">Current crop:</span> <span class="value">${cropName}</span></p>
                <p><span class="label">State:</span> <span class="value">${stateDisplay}</span></p>
                ${countdownHtml}
                <p><span class="label">Fertilized:</span> <span class="value">${fertilizedStatus}</span></p>
            </div>
            <div class="status ${field.state}">${field.state.toUpperCase()}</div>
        `;
        
        container.appendChild(fieldBox);
    });
}

function displayAnimalsData(animals) {
    const container = document.getElementById('animalsContainer');
    container.innerHTML = '';
    
    const ownedAnimals = animals.filter(animal => animal.isOwned);
    
    if (ownedAnimals.length === 0) {
        container.innerHTML = '<div class="error">No owned animals found</div>';
        return;
    }
    
    ownedAnimals.forEach(animal => {
        const animalBox = document.createElement('div');
        animalBox.className = 'animal-box';
        
        // Format animal name
        const animalName = formatAnimalName(animal.int_name);
        
        // Calculate feed percentage and remaining capacity
        const feedPercentage = (animal.feed_level / animal.feed_max) * 100;
        const feedRemaining = animal.feed_max - animal.feed_level;
        
        // Get feed type
        const feedType = ANIMAL_FEED_TYPES[animal.int_name] || 'Unknown';
        
        // Format collection time
        const collectionTime = formatTimeLeft(animal.collection_time);
        
        animalBox.innerHTML = `
            <h4>${animalName}</h4>
            <div class="animal-count">${animal.total}/10</div>
            <div class="feed-info">
                <p><span class="label">Feed capacity:</span> <span class="value">${feedRemaining}</span></p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${feedPercentage}%"></div>
                </div>
                <p><span class="label">Collection time:</span> <span class="value">${collectionTime}</span></p>
                <p><span class="label">Feed type:</span> <span class="value">${feedType}</span></p>
            </div>
        `;
        
        container.appendChild(animalBox);
    });
}

// Utility functions
function formatPrice(price) {
    if (price >= 1000000) {
        return `$${(price / 1000000).toFixed(0)}mil`;
    }
    return `$${price.toLocaleString()}`;
}

function formatAnimalName(intName) {
    const nameMap = {
        'farm_chickens': 'Chickens',
        'farm_pig': 'Pigs',
        'farm_cows_small': 'Cows (Small)',
        'farm_cows_medium': 'Cows (Medium)',
        'farm_cows_large': 'Cows (Large)'
    };
    
    return nameMap[intName] || intName.replace('farm_', '').replace(/_/g, ' ').toUpperCase();
}

function formatTimeLeft(timestamp) {
    if (!timestamp) return 'Not available';
    
    const now = Date.now();
    const collectionTime = timestamp * 1000;
    
    if (collectionTime <= now) {
        return 'Ready to collect';
    }
    
    const diffMs = collectionTime - now;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
}

function updateCountdown(fieldName, timeStart, timeEnd) {
    const countdownElement = document.getElementById(`countdown-${fieldName.replace(/\s+/g, '-')}`);
    if (!countdownElement) return;
    
    const now = Math.floor(Date.now() / 1000);
    const totalTime = timeEnd - timeStart;
    const elapsed = now - timeStart;
    const remaining = timeEnd - now;
    
    if (remaining <= 0) {
        countdownElement.textContent = 'Ready to harvest!';
        countdownElement.style.color = '#f44336';
        return;
    }
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;
    
    const progress = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
    
    countdownElement.innerHTML = `
        <div>Time remaining: ${hours}h ${minutes}m ${seconds}s</div>
        <div>Progress: ${progress.toFixed(1)}%</div>
    `;
}

function startCountdownTimers() {
    // Clear existing countdown interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    // Start new countdown interval
    countdownInterval = setInterval(() => {
        const fieldBoxes = document.querySelectorAll('.field-box');
        fieldBoxes.forEach(box => {
            const fieldName = box.getAttribute('data-field-name');
            const countdownElement = box.querySelector('.countdown-timer');
            
            if (countdownElement && fieldName) {
                // This would need field data to be stored globally for countdown updates
                // For now, we'll update every minute when data refreshes
            }
        });
    }, 1000);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);