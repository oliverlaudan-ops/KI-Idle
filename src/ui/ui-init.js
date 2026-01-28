// UI Initialization

import { initializeTabs } from './ui-tabs.js';
import { showToast } from './ui-render.js';

export function initializeUI(game) {
    // Initialize tabs
    initializeTabs();
    
    // Save button
    document.getElementById('btn-save').addEventListener('click', () => {
        game.save();
        showToast('Game saved successfully!', 'success');
    });
    
    // Export button
    document.getElementById('btn-export').addEventListener('click', () => {
        const saveString = game.export();
        
        // Copy to clipboard
        navigator.clipboard.writeText(saveString).then(() => {
            showToast('Save exported to clipboard!', 'success');
        }).catch(() => {
            // Fallback: show in prompt
            prompt('Copy this save string:', saveString);
        });
    });
    
    // Import button
    document.getElementById('btn-import').addEventListener('click', () => {
        const saveString = prompt('Paste your save string:');
        if (saveString) {
            const success = game.import(saveString);
            if (success) {
                showToast('Save imported successfully!', 'success');
                location.reload();
            } else {
                showToast('Failed to import save!', 'error');
            }
        }
    });
    
    // Reset button
    document.getElementById('btn-reset').addEventListener('click', () => {
        const confirmed = confirm('Are you sure you want to reset? This will delete ALL progress!');
        if (confirmed) {
            const doubleCheck = confirm('This action cannot be undone. Are you REALLY sure?');
            if (doubleCheck) {
                game.reset();
                location.reload();
            }
        }
    });
    
    // Deployment button
    document.getElementById('btn-deploy').addEventListener('click', () => {
        // TODO: Implement deployment/prestige
        showToast('Deployment system coming soon!', 'warning');
    });
}