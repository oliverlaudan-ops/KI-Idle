// Main Game Initialization and Loop

import { GameState } from './modules/game-state.js';
import { initializeUI, attachEventListeners } from './ui/ui-init.js';
import { renderAll } from './ui/ui-render.js';

// Global game instance
let game = null;
let lastTick = Date.now();
let lastSave = Date.now();
const TICK_INTERVAL = 100; // Update every 100ms (10 times per second)
const SAVE_INTERVAL = 30000; // Auto-save every 30 seconds
const MAX_OFFLINE_TIME = 24 * 60 * 60 * 1000; // Max 24 hours offline progression

// Initialize the game
function init() {
    console.log('🤖 KI-Idle starting...');
    
    try {
        // Create game state
        game = new GameState();
        
        // Try to load saved game
        const savedGame = localStorage.getItem('ki-idle-save');
        if (savedGame) {
            console.log('📂 Loading saved game...');
            try {
                const saveData = JSON.parse(savedGame);
                game.load(saveData);
                
                // Calculate offline progression
                const offlineTime = Math.min(Date.now() - game.lastSaveTime, MAX_OFFLINE_TIME);
                if (offlineTime > 1000) {
                    console.log(`⏰ Processing ${(offlineTime / 1000).toFixed(0)}s of offline time`);
                    game.processOfflineProgress(offlineTime);
                    showToast(`Welcome back! You gained ${formatOfflineGains()} while offline`, 'success');
                }
            } catch (e) {
                console.error('❌ Failed to load save:', e);
                showToast('Failed to load save game. Starting fresh.', 'warning');
            }
        } else {
            console.log('✨ Starting new game');
            showToast('Welcome to KI-Idle! Click Data Collectors to begin.', 'success');
        }
        
        // Initialize UI
        console.log('🎨 Initializing UI...');
        initializeUI(game);
        attachEventListeners(game);
        
        // Initial render
        renderAll(game);
        
        // Start game loop
        console.log('▶️ Starting game loop...');
        requestAnimationFrame(gameLoop);
        
        console.log('✅ KI-Idle initialized successfully!');
        
    } catch (error) {
        console.error('💥 Critical error during initialization:', error);
        document.body.innerHTML = `
            <div style="color: white; text-align: center; padding: 50px; font-family: monospace;">
                <h1>❌ Initialization Error</h1>
                <p>Failed to start KI-Idle. Check console for details.</p>
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
    
    if (deltaTime >= TICK_INTERVAL / 1000) {
        // Update game state
        game.update(deltaTime);
        
        // Render updates
        renderAll(game);
        
        lastTick = now;
    }
    
    // Auto-save check
    if (now - lastSave >= SAVE_INTERVAL) {
        saveGame();
        lastSave = now;
    }
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Save game
function saveGame() {
    try {
        const saveData = game.save();
        localStorage.setItem('ki-idle-save', JSON.stringify(saveData));
        
        // Update last save time display
        const lastSaveElement = document.getElementById('last-save-time');
        if (lastSaveElement) {
            lastSaveElement.textContent = new Date().toLocaleTimeString();
        }
        
        console.log('💾 Game saved');
    } catch (error) {
        console.error('❌ Failed to save game:', error);
        showToast('Failed to save game!', 'error');
    }
}

// Manual save button
window.manualSave = function() {
    saveGame();
    showToast('Game saved successfully!', 'success');
};

// Export save
window.exportSave = function() {
    try {
        const saveData = game.save();
        const saveString = JSON.stringify(saveData);
        const blob = new Blob([saveString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ki-idle-save-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showToast('Save exported successfully!', 'success');
    } catch (error) {
        console.error('❌ Failed to export save:', error);
        showToast('Failed to export save!', 'error');
    }
};

// Import save
window.importSave = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const saveData = JSON.parse(event.target.result);
                game.load(saveData);
                renderAll(game);
                saveGame();
                showToast('Save imported successfully!', 'success');
            } catch (error) {
                console.error('❌ Failed to import save:', error);
                showToast('Failed to import save! Invalid file.', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
};

// Reset game
window.resetGame = function() {
    const confirmed = confirm(
        '⚠️ WARNING: RESET GAME\n\n' +
        'This will delete ALL progress including:\n' +
        '• All resources and buildings\n' +
        '• Research progress\n' +
        '• Achievements\n' +
        '• Deployment bonuses\n\n' +
        'This action CANNOT be undone!\n\n' +
        'Are you absolutely sure?'
    );
    
    if (confirmed) {
        const doubleCheck = confirm('Really reset? This is your last chance!');
        if (doubleCheck) {
            console.log('🔄 Resetting game...');
            localStorage.removeItem('ki-idle-save');
            location.reload();
        }
    }
};

// Utility: Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Make showToast globally available
window.showToast = showToast;

// Utility: Format offline gains
function formatOfflineGains() {
    const gains = [];
    
    if (game.resources.data.amount > 0) {
        gains.push(`${formatNumber(game.resources.data.amount)} Data`);
    }
    if (game.resources.accuracy.amount > 0) {
        gains.push(`${formatNumber(game.resources.accuracy.amount)} Accuracy`);
    }
    
    return gains.join(', ') || 'some resources';
}

// Utility: Format large numbers
function formatNumber(num) {
    if (num < 1000) return Math.floor(num).toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
    return (num / 1000000000000).toFixed(1) + 'T';
}

// Make formatNumber globally available for UI
window.formatNumber = formatNumber;

// Handle page visibility (pause when tab is hidden)
let wasHidden = false;
let hiddenTime = 0;

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        wasHidden = true;
        hiddenTime = Date.now();
        console.log('👋 Tab hidden - game continues in background');
    } else if (wasHidden) {
        const offlineTime = Date.now() - hiddenTime;
        if (offlineTime > 5000) { // Only show if > 5 seconds
            console.log(`👀 Tab visible again after ${(offlineTime / 1000).toFixed(0)}s`);
            game.processOfflineProgress(offlineTime);
            renderAll(game);
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

// Export game instance for debugging
window.game = game;

console.log('📜 main.js loaded');

// Add slideOut animation to CSS if not exists
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
`;
document.head.appendChild(style);