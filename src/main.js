// Main Game Initialization and Loop

import { GameState } from './modules/game-state.js';
import { initializeUI } from './ui/ui-init.js';
import { renderAll, showToast } from './ui/ui-render.js';

// Global game instance
window.game = null;
let lastTick = Date.now();
let lastSave = Date.now();
let lastRender = Date.now();
const TICK_INTERVAL = 100; // Update every 100ms (10 times per second)
const RENDER_INTERVAL = 100; // Render every 100ms
const SAVE_INTERVAL = 30000; // Auto-save every 30 seconds
const MAX_OFFLINE_TIME = 24 * 60 * 60 * 1000; // Max 24 hours offline progression

// Initialize the game
function init() {
    console.log('🤖 AI-Idle starting...');
    
    try {
        // Create game state
        window.game = new GameState();
        
        let hasOfflineProgress = false;
        let offlineGains = null;
        
        // Try to load saved game
        const savedGame = localStorage.getItem('ai-idle-save');
        if (savedGame) {
            console.log('📂 Loading saved game...');
            try {
                const saveData = JSON.parse(savedGame);
                window.game.load(saveData);
                
                // Calculate offline progression
                const offlineTime = Math.min(Date.now() - window.game.lastSaveTime, MAX_OFFLINE_TIME);
                if (offlineTime > 5000) { // Only show if > 5 seconds
                    console.log(`⏰ Processing ${(offlineTime / 1000).toFixed(0)}s of offline time`);
                    
                    // Capture resources before offline progress
                    const beforeData = window.game.resources.data.amount;
                    const beforeAccuracy = window.game.resources.accuracy.amount;
                    const beforeResearch = window.game.resources.research.amount;
                    
                    window.game.processOfflineProgress(offlineTime);
                    
                    // Calculate gains
                    const dataGained = window.game.resources.data.amount - beforeData;
                    const accuracyGained = window.game.resources.accuracy.amount - beforeAccuracy;
                    const researchGained = window.game.resources.research.amount - beforeResearch;
                    
                    offlineGains = {
                        time: offlineTime,
                        data: dataGained,
                        accuracy: accuracyGained,
                        research: researchGained
                    };
                    
                    hasOfflineProgress = true;
                }
            } catch (e) {
                console.error('❌ Failed to load save:', e);
                showToast('Failed to load save game. Starting fresh.', 'warning');
            }
        } else {
            console.log('✨ Starting new game');
            showToast('Welcome to AI-Idle! Click "Collect Data" to begin.', 'success');
        }
        
        // Initialize UI (includes event listeners)
        console.log('🎨 Initializing UI...');
        initializeUI(window.game);
        
        // Initial render
        renderAll(window.game);
        
        // Show offline progress modal if applicable
        if (hasOfflineProgress && offlineGains) {
            setTimeout(() => showOfflineProgressModal(offlineGains), 500);
        }
        
        // Start game loop
        console.log('▶️ Starting game loop...');
        requestAnimationFrame(gameLoop);
        
        console.log('✅ AI-Idle initialized successfully!');
        
    } catch (error) {
        console.error('💥 Critical error during initialization:', error);
        document.body.innerHTML = `
            <div style="color: white; text-align: center; padding: 50px; font-family: monospace;">
                <h1>❌ Initialization Error</h1>
                <p>Failed to start AI-Idle. Check console for details.</p>
                <pre style="text-align: left; max-width: 800px; margin: 20px auto; background: #1a1a1a; padding: 20px; border-radius: 10px;">${error.stack}</pre>
                <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Reload Page</button>
            </div>
        `;
    }
}

// Main game loop
function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - lastTick) / 1000; // Convert to seconds
    
    // Update game state
    if (deltaTime >= TICK_INTERVAL / 1000) {
        window.game.update(deltaTime);
        lastTick = now;
        
        // Check for newly unlocked achievements and show notifications
        const newAchievements = window.game.popNewlyUnlockedAchievements();
        for (const { id, achievement } of newAchievements) {
            showAchievementUnlock(achievement);
        }
    }
    
    // Render updates (can be less frequent than game updates)
    if (now - lastRender >= RENDER_INTERVAL) {
        renderAll(window.game);
        lastRender = now;
    }
    
    // Auto-save check
    if (now - lastSave >= SAVE_INTERVAL) {
        saveGame(true); // true = auto-save
        lastSave = now;
    }
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Show achievement unlock notification
function showAchievementUnlock(achievement) {
    console.log(`🏆 Achievement unlocked: ${achievement.name}`);
    
    // Create special toast for achievements
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast achievement';
    toast.innerHTML = `
        <div class="achievement-toast">
            <div class="achievement-toast-icon">${achievement.icon}</div>
            <div class="achievement-toast-content">
                <div class="achievement-toast-title">🏆 Achievement Unlocked!</div>
                <div class="achievement-toast-name">${achievement.name}</div>
                <div class="achievement-toast-reward">+${achievement.reward}</div>
            </div>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Play sound if available
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jtXzzn0uBSd7yvLekDcJGGe+7ueXRA0PU6nm8bllHQU4kdXzy34vBSh9y/LfkjgJGWm/7+aXRA8OU6vl8bplHgU4ktXzzn8wBSl+y/LgkzgKGWm/7+aXRQ8RUqrl8bplHgU4ktXzzoAwBil+y/LgkzkKGWnA7+aXRQ8RUqrl8bpmHgU4ktX0zoAwBil+y/LhlDoKGWnA7+aYRQ8RUqrl8bpmHgU4ktX0z4AwBil+y/Lhlj0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhlzwLGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4EwBil+y/LhmD0LGWnA7+aYRg8RUqrl8bpmHgU4ktX0z4E');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors if audio fails
    } catch (e) {
        // Ignore audio errors
    }
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000); // Show for 5 seconds (longer than normal toasts)
}

// Save game
function saveGame(isAutoSave = false) {
    try {
        const saveData = window.game.save();
        localStorage.setItem('ai-idle-save', JSON.stringify(saveData));
        
        // Update last save time display
        const lastSaveElement = document.getElementById('last-save-time');
        if (lastSaveElement) {
            lastSaveElement.textContent = new Date().toLocaleTimeString();
        }
        
        console.log('💾 Game saved' + (isAutoSave ? ' (auto)' : ''));
        
        // Show toast only for manual saves, not auto-saves
        if (!isAutoSave) {
            showToast('Game saved successfully!', 'success');
        }
    } catch (error) {
        console.error('❌ Failed to save game:', error);
        showToast('Failed to save game!', 'error');
    }
}

// Show offline progress modal
function showOfflineProgressModal(gains) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'offline-modal';
    
    const timeString = formatOfflineTime(gains.time);
    
    modal.innerHTML = `
        <div class="modal-content offline-modal-content">
            <div class="modal-header">
                <h2>⏰ Welcome Back!</h2>
            </div>
            <div class="modal-body">
                <p style="font-size: 1.1rem; margin-bottom: 1.5rem;">You were away for <strong>${timeString}</strong></p>
                <div class="offline-gains">
                    <h3 style="color: var(--accent-primary); margin-bottom: 1rem;">Resources Gained:</h3>
                    ${gains.data > 0 ? `<div class="offline-gain-item">📊 <strong>${formatNumber(gains.data)}</strong> Training Data</div>` : ''}
                    ${gains.accuracy > 0 ? `<div class="offline-gain-item">🎯 <strong>${formatNumber(gains.accuracy)}</strong> Accuracy</div>` : ''}
                    ${gains.research > 0 ? `<div class="offline-gain-item">🔬 <strong>${formatNumber(gains.research)}</strong> Research Points</div>` : ''}
                    ${gains.data === 0 && gains.accuracy === 0 && gains.research === 0 ? '<p style="color: var(--text-secondary);">No production yet. Build infrastructure to gain offline progress!</p>' : ''}
                </div>
                <div class="modal-actions" style="margin-top: 2rem;">
                    <button class="btn-primary" onclick="document.getElementById('offline-modal').remove()" style="width: 100%; padding: 1rem;">Continue</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on ESC
    const closeHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeHandler);
        }
    };
    document.addEventListener('keydown', closeHandler);
}

// Format offline time
function formatOfflineTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ${hours % 24} hour${(hours % 24) !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} minute${(minutes % 60) !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
        return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
}

// Format number for display
function formatNumber(num) {
    if (num < 1000) return Math.floor(num).toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
    return (num / 1000000000000).toFixed(1) + 'T';
}

// Handle page visibility (pause when tab is hidden)
let wasHidden = false;
let hiddenTime = 0;

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        wasHidden = true;
        hiddenTime = Date.now();
        console.log('👋 Tab hidden - game continues in background');
        // Save when tab is hidden
        saveGame();
    } else if (wasHidden) {
        const offlineTime = Date.now() - hiddenTime;
        if (offlineTime > 5000) { // Only process if > 5 seconds
            console.log(`👀 Tab visible again after ${(offlineTime / 1000).toFixed(0)}s`);
            
            // Capture resources before offline progress
            const beforeData = window.game.resources.data.amount;
            const beforeAccuracy = window.game.resources.accuracy.amount;
            const beforeResearch = window.game.resources.research.amount;
            
            window.game.processOfflineProgress(offlineTime);
            
            // Calculate gains
            const dataGained = window.game.resources.data.amount - beforeData;
            const accuracyGained = window.game.resources.accuracy.amount - beforeAccuracy;
            const researchGained = window.game.resources.research.amount - beforeResearch;
            
            // Show toast if gains are significant
            if (dataGained > 0 || accuracyGained > 0 || researchGained > 0) {
                const gains = [];
                if (dataGained > 0) gains.push(`${formatNumber(dataGained)} Data`);
                if (accuracyGained > 0) gains.push(`${formatNumber(accuracyGained)} Accuracy`);
                if (researchGained > 0) gains.push(`${formatNumber(researchGained)} Research`);
                
                showToast(`Gained while away: ${gains.join(', ')}`, 'success');
            }
            
            renderAll(window.game);
        }
        wasHidden = false;
    }
});

// Handle beforeunload (save before closing)
window.addEventListener('beforeunload', () => {
    saveGame();
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('📜 main.js loaded');

// Add styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .offline-modal-content {
        max-width: 500px;
    }
    
    .offline-gains {
        background: var(--bg-tertiary);
        border: 2px solid var(--accent-primary);
        border-radius: 12px;
        padding: 1.5rem;
    }
    
    .offline-gain-item {
        font-size: 1.1rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .offline-gain-item:last-child {
        border-bottom: none;
    }
    
    /* Achievement Toast Styles */
    .toast.achievement {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 2px solid #ffd700;
        box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3);
        min-width: 350px;
        padding: 0;
    }
    
    .achievement-toast {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
    }
    
    .achievement-toast-icon {
        font-size: 3rem;
        filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5));
        animation: bounce 0.6s ease infinite alternate;
    }
    
    @keyframes bounce {
        from { transform: translateY(0); }
        to { transform: translateY(-5px); }
    }
    
    .achievement-toast-content {
        flex: 1;
    }
    
    .achievement-toast-title {
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #ffd700;
        margin-bottom: 0.25rem;
    }
    
    .achievement-toast-name {
        font-size: 1.2rem;
        font-weight: bold;
        margin-bottom: 0.25rem;
    }
    
    .achievement-toast-reward {
        font-size: 0.9rem;
        opacity: 0.9;
        color: #a0ffb0;
    }
`;
document.head.appendChild(style);