// UI Rendering Functions

import { getBuildingCost } from '../modules/buildings.js';

// Main render function that updates all UI elements
export function renderAll(gameState) {
    renderStatsBar(gameState);
    renderBuildings(gameState);
    renderModels(gameState);
    renderResearch(gameState);
    renderAchievements(gameState);
    renderStatistics(gameState);
}

export function renderStatsBar(gameState) {
    // Data
    document.getElementById('data-amount').textContent = formatNumber(gameState.resources.data.amount);
    document.getElementById('data-rate').textContent = `(+${formatNumber(gameState.resources.data.perSecond)}/s)`;
    
    // Compute
    document.getElementById('compute-amount').textContent = formatNumber(gameState.resources.compute.amount, 1);
    
    // Accuracy
    document.getElementById('accuracy-amount').textContent = formatNumber(gameState.resources.accuracy.amount, 2);
    document.getElementById('accuracy-rate').textContent = `(+${formatNumber(gameState.resources.accuracy.perSecond, 1)}/s)`;
    
    // Research
    document.getElementById('research-amount').textContent = formatNumber(gameState.resources.research.amount);
}

export function renderBuildings(gameState) {
    const tiers = {
        1: document.getElementById('buildings-tier1'),
        2: document.getElementById('buildings-tier2'),
        3: document.getElementById('buildings-tier3')
    };
    
    for (const [id, building] of Object.entries(gameState.buildings)) {
        if (!building.unlocked) continue;
        
        const tier = building.tier;
        const container = tiers[tier];
        if (!container) continue;
        
        let card = document.getElementById(`building-${id}`);
        if (!card) {
            card = createBuildingCard(id, building);
            container.appendChild(card);
        }
        
        updateBuildingCard(card, building, gameState);
    }
}

function createBuildingCard(id, building) {
    const card = document.createElement('div');
    card.className = 'building-card';
    card.id = `building-${id}`;
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-title">${building.icon} ${building.name}</div>
            <div class="card-count" id="building-count-${id}">0</div>
        </div>
        <div class="card-description">${building.description}</div>
        <div class="card-stats" id="building-stats-${id}"></div>
        <div class="card-cost" id="building-cost-${id}"></div>
        <button class="card-button" id="btn-building-${id}">Build</button>
    `;
    
    // Add click handler
    const button = card.querySelector(`#btn-building-${id}`);
    button.addEventListener('click', () => {
        window.game.purchaseBuilding(id);
    });
    
    return card;
}

function updateBuildingCard(card, building, gameState) {
    const id = building.id;
    
    // Update count
    document.getElementById(`building-count-${id}`).textContent = building.count;
    
    // Update stats (production)
    const statsDiv = document.getElementById(`building-stats-${id}`);
    if (building.production && Object.keys(building.production).length > 0) {
        statsDiv.innerHTML = '';
        for (const [resourceId, amount] of Object.entries(building.production)) {
            const resource = gameState.resources[resourceId];
            const stat = document.createElement('div');
            stat.className = 'card-stat';
            stat.innerHTML = `
                <span>Produces:</span>
                <span>${resource.icon} +${formatNumber(amount, 2)}${resource.unit || ''}/s</span>
            `;
            statsDiv.appendChild(stat);
        }
    }
    
    // Update cost
    const cost = getBuildingCost(building);
    const costDiv = document.getElementById(`building-cost-${id}`);
    costDiv.innerHTML = '';
    
    for (const [resourceId, amount] of Object.entries(cost)) {
        const resource = gameState.resources[resourceId];
        const affordable = gameState.resources[resourceId].amount >= amount;
        
        const costItem = document.createElement('span');
        costItem.className = `cost-item ${affordable ? 'affordable' : 'unaffordable'}`;
        costItem.textContent = `${resource.icon} ${formatNumber(amount)}`;
        costDiv.appendChild(costItem);
    }
    
    // Update button
    const button = document.getElementById(`btn-building-${id}`);
    const canAfford = gameState.canAfford(cost);
    button.disabled = !canAfford;
}

export function renderModels(gameState) {
    const categories = {
        'classification': document.getElementById('models-classification'),
        'vision': document.getElementById('models-vision'),
        'advanced': document.getElementById('models-advanced')
    };
    
    for (const [id, model] of Object.entries(gameState.models)) {
        if (!model.unlocked) continue;
        
        const container = categories[model.category];
        if (!container) continue;
        
        let card = document.getElementById(`model-${id}`);
        if (!card) {
            card = createModelCard(id, model);
            container.appendChild(card);
        }
        
        updateModelCard(card, model, gameState);
    }
}

function createModelCard(id, model) {
    const card = document.createElement('div');
    card.className = 'model-card';
    card.id = `model-${id}`;
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-title">${model.icon} ${model.name}</div>
        </div>
        <div class="card-description">${model.description}</div>
        <div class="card-stats" id="model-stats-${id}"></div>
        <div class="card-cost" id="model-cost-${id}"></div>
        <button class="card-button" id="btn-model-${id}">Train Model</button>
    `;
    
    const button = card.querySelector(`#btn-model-${id}`);
    button.addEventListener('click', () => {
        window.game.startTraining(id);
    });
    
    return card;
}

function updateModelCard(card, model, gameState) {
    const id = model.id;
    
    // Update stats
    const statsDiv = document.getElementById(`model-stats-${id}`);
    statsDiv.innerHTML = '';
    for (const [resourceId, amount] of Object.entries(model.production)) {
        const resource = gameState.resources[resourceId];
        const stat = document.createElement('div');
        stat.className = 'card-stat';
        stat.innerHTML = `
            <span>Generates:</span>
            <span>${resource.icon} +${formatNumber(amount, 2)}${resource.unit || ''}/s</span>
        `;
        statsDiv.appendChild(stat);
    }
    
    // Update requirements
    const costDiv = document.getElementById(`model-cost-${id}`);
    costDiv.innerHTML = '<strong>Requires:</strong><br>';
    
    for (const [resourceId, amount] of Object.entries(model.requirements)) {
        const resource = gameState.resources[resourceId];
        const hasEnough = gameState.resources[resourceId].amount >= amount;
        
        const costItem = document.createElement('span');
        costItem.className = `cost-item ${hasEnough ? 'affordable' : 'unaffordable'}`;
        costItem.textContent = `${resource.icon} ${formatNumber(amount)}`;
        costDiv.appendChild(costItem);
    }
    
    // Update button
    const button = document.getElementById(`btn-model-${id}`);
    const isTraining = gameState.currentTraining === id;
    button.textContent = isTraining ? 'Training...' : 'Train Model';
    button.disabled = isTraining || !canTrainModel(model, gameState);
}

function canTrainModel(model, gameState) {
    for (const [resourceId, amount] of Object.entries(model.requirements)) {
        if (gameState.resources[resourceId].amount < amount) {
            return false;
        }
    }
    return true;
}

export function renderResearch(gameState) {
    const categories = {
        'optimizers': document.getElementById('research-optimizers'),
        'activations': document.getElementById('research-activations'),
        'architectures': document.getElementById('research-architectures'),
        'regularization': document.getElementById('research-regularization')
    };
    
    for (const [id, research] of Object.entries(gameState.research)) {
        if (!research.unlocked) continue;
        
        const container = categories[research.category];
        if (!container) continue;
        
        let card = document.getElementById(`research-${id}`);
        if (!card) {
            card = createResearchCard(id, research);
            container.appendChild(card);
        }
        
        updateResearchCard(card, research, gameState);
    }
}

function createResearchCard(id, research) {
    const card = document.createElement('div');
    card.className = 'research-card';
    card.id = `research-${id}`;
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-title">${research.icon} ${research.name}</div>
        </div>
        <div class="card-description">${research.description}</div>
        <div class="card-cost" id="research-cost-${id}"></div>
        <button class="card-button" id="btn-research-${id}">Research</button>
    `;
    
    const button = card.querySelector(`#btn-research-${id}`);
    button.addEventListener('click', () => {
        window.game.performResearch(id);
    });
    
    return card;
}

function updateResearchCard(card, research, gameState) {
    const id = research.id;
    
    if (research.researched) {
        card.style.opacity = '0.5';
        card.style.borderColor = 'var(--accent-success)';
    }
    
    // Update cost
    const costDiv = document.getElementById(`research-cost-${id}`);
    costDiv.innerHTML = '';
    
    for (const [resourceId, amount] of Object.entries(research.cost)) {
        const resource = gameState.resources[resourceId];
        const hasEnough = gameState.resources[resourceId].amount >= amount;
        
        const costItem = document.createElement('span');
        costItem.className = `cost-item ${hasEnough ? 'affordable' : 'unaffordable'}`;
        costItem.textContent = `${resource.icon} ${formatNumber(amount)}`;
        costDiv.appendChild(costItem);
    }
    
    // Update button
    const button = document.getElementById(`btn-research-${id}`);
    button.disabled = research.researched || !gameState.canAfford(research.cost);
    button.textContent = research.researched ? 'Completed' : 'Research';
}

export function renderAchievements(gameState) {
    // Implementation for achievement rendering
    // Similar pattern to other render functions
}

export function renderStatistics(gameState) {
    // Update playtime
    const playtime = Math.floor((Date.now() - gameState.stats.startTime + gameState.stats.totalPlaytime) / 1000);
    document.getElementById('playtime').textContent = formatTime(playtime);
}

// Utility Functions
export function formatNumber(num, decimals = 0) {
    if (num < 1000) {
        return num.toFixed(decimals);
    }
    
    const units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
    
    if (tier <= 0) return num.toFixed(decimals);
    if (tier >= units.length) return num.toExponential(2);
    
    const unit = units[tier];
    const scaled = num / Math.pow(10, tier * 3);
    
    return scaled.toFixed(decimals) + unit;
}

export function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}