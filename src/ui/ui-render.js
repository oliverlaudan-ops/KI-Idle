// UI Rendering Functions

import { getBuildingCost } from '../modules/buildings.js';
import { buildings } from '../modules/buildings.js';
import { models } from '../modules/models.js';
import { research } from '../modules/research.js';

// Main render function that updates all UI elements
export function renderAll(gameState) {
    renderStatsBar(gameState);
    renderBuildings(gameState);
    renderModels(gameState);
    renderTrainingStatus(gameState);
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
    document.getElementById('compute-rate').textContent = `(+${formatNumber(gameState.resources.compute.perSecond, 2)}/s)`;
    
    // Accuracy
    document.getElementById('accuracy-amount').textContent = formatNumber(gameState.resources.accuracy.amount, 2);
    document.getElementById('accuracy-rate').textContent = `(+${formatNumber(gameState.resources.accuracy.perSecond, 1)}/s)`;
    
    // Research
    document.getElementById('research-amount').textContent = formatNumber(gameState.resources.research.amount);
    document.getElementById('research-rate').textContent = `(+${formatNumber(gameState.resources.research.perSecond, 2)}/s)`;
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
            // Use current building definition for description
            const buildingDef = buildings[id];
            card = createBuildingCard(id, buildingDef);
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
        if (window.game && window.game.purchaseBuilding(id)) {
            showToast(`Built ${building.name}!`, 'success');
        }
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
            // Use current model definition for description
            const modelDef = models[id];
            card = createModelCard(id, modelDef);
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
        if (window.game && window.game.startTraining(id)) {
            showToast(`Training ${model.name}!`, 'success');
        }
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

// New: Render Training Status with Animations
export function renderTrainingStatus(gameState) {
    const noTrainingMsg = document.getElementById('no-training-msg');
    const activeTraining = document.getElementById('active-training');
    const stopButton = document.getElementById('btn-stop-training');
    
    if (!gameState.currentTraining) {
        // Show idle state
        noTrainingMsg.style.display = 'block';
        activeTraining.style.display = 'none';
        stopButton.style.display = 'none';
        return;
    }
    
    // Show active training
    noTrainingMsg.style.display = 'none';
    activeTraining.style.display = 'block';
    stopButton.style.display = 'block';
    
    const model = gameState.models[gameState.currentTraining];
    const modelDef = models[gameState.currentTraining];
    const training = gameState.training;
    
    // Update model info
    document.getElementById('training-icon').textContent = modelDef.icon || '🧠';
    document.getElementById('training-model-name').textContent = modelDef.name;
    document.getElementById('training-model-category').textContent = model.category;
    
    // Calculate progress
    const progress = Math.min((training.elapsedTime / training.duration) * 100, 100);
    const remainingTime = Math.max(0, training.duration - training.elapsedTime);
    
    // Update progress bar
    const progressFill = document.getElementById('training-progress-fill');
    const progressText = document.getElementById('training-progress-text');
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${progress.toFixed(1)}%`;
    
    // Update time remaining
    document.getElementById('training-time-remaining').textContent = formatTrainingTime(remainingTime);
    
    // Calculate training stats
    const accuracyGain = training.accuracyPerSecond || 0;
    const trainingSpeed = gameState.multipliers.trainingSpeed || 1.0;
    const currentEpoch = Math.floor((training.elapsedTime / training.duration) * 100);
    
    // Update stats
    document.getElementById('training-accuracy-gain').textContent = `+${formatNumber(accuracyGain, 2)}/s`;
    document.getElementById('training-speed').textContent = `${trainingSpeed.toFixed(1)}x`;
    document.getElementById('training-epochs').textContent = `${currentEpoch} / 100`;
    
    // Setup stop button handler (only once)
    if (!stopButton.hasAttribute('data-initialized')) {
        stopButton.setAttribute('data-initialized', 'true');
        stopButton.addEventListener('click', () => {
            if (window.game && confirm('Stop training? Progress will be lost.')) {
                window.game.stopTraining();
                showToast('Training stopped', 'warning');
            }
        });
    }
}

function formatTrainingTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function renderResearch(gameState) {
    const categories = {
        'optimizers': document.getElementById('research-optimizers'),
        'activations': document.getElementById('research-activations'),
        'architectures': document.getElementById('research-architectures'),
        'regularization': document.getElementById('research-regularization')
    };
    
    for (const [id, researchItem] of Object.entries(gameState.research)) {
        if (!researchItem.unlocked) continue;
        
        const container = categories[researchItem.category];
        if (!container) continue;
        
        let card = document.getElementById(`research-${id}`);
        if (!card) {
            // Use current research definition for description
            const researchDef = research[id];
            card = createResearchCard(id, researchDef);
            container.appendChild(card);
        }
        
        updateResearchCard(card, researchItem, gameState);
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
        if (window.game && window.game.performResearch(id)) {
            showToast(`Researched ${research.name}!`, 'success');
        }
    });
    
    return card;
}

function updateResearchCard(card, research, gameState) {
    const id = research.id;
    
    if (research.researched) {
        card.style.opacity = '0.6';
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
    button.textContent = research.researched ? '✓ Completed' : 'Research';
}

export function renderAchievements(gameState) {
    const categories = {
        'training': document.getElementById('achievements-training'),
        'research': document.getElementById('achievements-research'),
        'infrastructure': document.getElementById('achievements-infrastructure')
    };
    
    let unlockedCount = 0;
    let totalCount = 0;
    
    for (const [id, achievement] of Object.entries(gameState.achievements)) {
        totalCount++;
        if (achievement.unlocked) unlockedCount++;
        
        const container = categories[achievement.category];
        if (!container) continue;
        
        let card = document.getElementById(`achievement-${id}`);
        if (!card) {
            card = createAchievementCard(id, achievement);
            container.appendChild(card);
        }
        
        updateAchievementCard(card, achievement);
    }
    
    // Update stats
    document.getElementById('achievements-unlocked').textContent = unlockedCount;
    document.getElementById('achievements-total').textContent = totalCount;
}

function createAchievementCard(id, achievement) {
    const card = document.createElement('div');
    card.className = 'achievement-card';
    card.id = `achievement-${id}`;
    
    card.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-description">${achievement.description}</div>
            <div class="achievement-reward">Reward: ${achievement.reward}</div>
        </div>
    `;
    
    return card;
}

function updateAchievementCard(card, achievement) {
    if (achievement.unlocked) {
        card.classList.add('unlocked');
    } else {
        card.classList.remove('unlocked');
    }
}

export function renderStatistics(gameState) {
    // Update playtime
    const playtime = Math.floor((Date.now() - gameState.stats.startTime + gameState.stats.totalPlaytime) / 1000);
    const playtimeElement = document.getElementById('playtime');
    if (playtimeElement) {
        playtimeElement.textContent = formatTime(playtime);
    }
    
    // Update resources table
    const resourcesTable = document.getElementById('stats-resources');
    if (resourcesTable) {
        resourcesTable.innerHTML = `
            <tr><td>Total Data Generated</td><td>${formatNumber(gameState.stats.totalDataGenerated)}</td></tr>
            <tr><td>Total Accuracy</td><td>${formatNumber(gameState.stats.totalAccuracy)}</td></tr>
            <tr><td>Max Accuracy</td><td>${formatNumber(gameState.stats.maxAccuracy)}</td></tr>
            <tr><td>Total Compute</td><td>${formatNumber(gameState.stats.totalCompute)} TFLOPS</td></tr>
        `;
    }
    
    // Update infrastructure table
    const infraTable = document.getElementById('stats-infrastructure');
    if (infraTable) {
        infraTable.innerHTML = `
            <tr><td>Total Buildings</td><td>${gameState.stats.totalBuildings}</td></tr>
        `;
        for (const [id, building] of Object.entries(gameState.buildings)) {
            if (building.count > 0) {
                infraTable.innerHTML += `<tr><td>${building.name}</td><td>${building.count}</td></tr>`;
            }
        }
    }
    
    // Update training table
    const trainingTable = document.getElementById('stats-training');
    if (trainingTable) {
        trainingTable.innerHTML = `
            <tr><td>Models Trained</td><td>${gameState.stats.modelsTrained}</td></tr>
            <tr><td>Unique Models</td><td>${gameState.stats.uniqueModelsTrained}</td></tr>
            <tr><td>Research Completed</td><td>${gameState.stats.completedResearch.length}</td></tr>
            <tr><td>Deployments</td><td>${gameState.stats.deployments}</td></tr>
        `;
    }
    
    // Update game info table
    const gameInfoTable = document.getElementById('stats-game');
    if (gameInfoTable) {
        gameInfoTable.innerHTML = `
            <tr><td>Playtime</td><td>${formatTime(playtime)}</td></tr>
            <tr><td>Game Version</td><td>0.2-alpha</td></tr>
            <tr><td>Deployments</td><td>${gameState.prestige.deployments}</td></tr>
            <tr><td>Tokens</td><td>${gameState.prestige.tokens}</td></tr>
        `;
    }
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
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Training Completion Animation
export function showTrainingCompleteAnimation(modelName) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const celebration = document.createElement('div');
    celebration.className = 'toast success';
    celebration.innerHTML = `
        <div style="font-size: 1.2rem; font-weight: bold;">🎉 Training Complete!</div>
        <div>${modelName}</div>
    `;
    celebration.style.background = 'linear-gradient(135deg, var(--accent-success), var(--accent-primary))';
    celebration.style.color = 'white';
    celebration.style.boxShadow = '0 0 30px rgba(0, 255, 136, 0.8)';
    
    container.appendChild(celebration);
    
    setTimeout(() => {
        celebration.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => celebration.remove(), 300);
    }, 5000);
}