// UI Initialization

import { initializeTabs } from './ui-tabs.js';
import { showToast } from './ui-render.js';

export function initializeUI(game) {
    // Initialize tabs
    initializeTabs();
    
    // Manual collect button
    document.getElementById('btn-collect').addEventListener('click', () => {
        game.addResource('data', 1);
        // Add visual feedback
        const btn = document.getElementById('btn-collect');
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 100);
    });
    
    // Save button
    document.getElementById('btn-save').addEventListener('click', () => {
        game.save();
        showToast('Game saved successfully!', 'success');
    });
    
    // Export button - show modal with save string
    document.getElementById('btn-export').addEventListener('click', () => {
        const saveString = game.export();
        showExportModal(saveString);
    });
    
    // Import button - show modal for paste
    document.getElementById('btn-import').addEventListener('click', () => {
        showImportModal(game);
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
    const deployBtn = document.getElementById('btn-deploy');
    if (deployBtn) {
        deployBtn.addEventListener('click', () => {
            showToast('Deployment system coming soon!', 'warning');
        });
    }
    
    // Modal close handlers
    setupModalHandlers();
}

// Show export modal
function showExportModal(saveString) {
    const modal = document.getElementById('save-modal');
    const title = document.getElementById('modal-title');
    const description = document.getElementById('modal-description');
    const textarea = document.getElementById('save-string');
    const actionBtn = document.getElementById('modal-action-btn');
    const downloadBtn = document.getElementById('modal-download-btn');
    const uploadBtn = document.getElementById('modal-upload-btn');
    
    title.textContent = '📤 Export Save';
    description.textContent = 'Copy this save string to backup your progress:';
    textarea.value = saveString;
    textarea.readOnly = true;
    actionBtn.textContent = '📋 Copy to Clipboard';
    actionBtn.className = 'btn-primary';
    downloadBtn.style.display = ''; // Show in export mode
    uploadBtn.style.display = 'none'; // Hide in export mode
    
    // Select all text when modal opens
    setTimeout(() => textarea.select(), 100);
    
    // Copy button handler
    actionBtn.onclick = () => {
        textarea.select();
        navigator.clipboard.writeText(saveString).then(() => {
            showToast('Save string copied to clipboard!', 'success');
            actionBtn.textContent = '✓ Copied!';
            setTimeout(() => {
                actionBtn.textContent = '📋 Copy to Clipboard';
            }, 2000);
        }).catch(() => {
            showToast('Failed to copy. Please copy manually.', 'warning');
        });
    };
    
    // Download button handler
    downloadBtn.onclick = () => {
        const blob = new Blob([saveString], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-idle-save-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Save file downloaded!', 'success');
    };
    
    modal.classList.add('active');
}

// Show import modal
function showImportModal(game) {
    const modal = document.getElementById('save-modal');
    const title = document.getElementById('modal-title');
    const description = document.getElementById('modal-description');
    const textarea = document.getElementById('save-string');
    const actionBtn = document.getElementById('modal-action-btn');
    const downloadBtn = document.getElementById('modal-download-btn');
    const uploadBtn = document.getElementById('modal-upload-btn');
    const fileInput = document.getElementById('file-input');
    
    title.textContent = '📥 Import Save';
    description.textContent = 'Paste your save string or load from file:';
    textarea.value = '';
    textarea.readOnly = false;
    textarea.placeholder = 'Paste your save string here...';
    actionBtn.textContent = '📥 Import Save';
    actionBtn.className = 'btn-primary';
    downloadBtn.style.display = 'none'; // Hide in import mode
    uploadBtn.style.display = ''; // Show in import mode
    
    // Focus textarea when modal opens
    setTimeout(() => textarea.focus(), 100);
    
    // Import button handler
    actionBtn.onclick = () => {
        const saveString = textarea.value.trim();
        if (!saveString) {
            showToast('Please paste a save string first!', 'warning');
            return;
        }
        
        const success = game.import(saveString);
        if (success) {
            showToast('Save imported successfully!', 'success');
            modal.classList.remove('active');
            location.reload();
        } else {
            showToast('Failed to import save! Invalid save string.', 'error');
        }
    };
    
    // Upload button handler - triggers file input
    uploadBtn.onclick = () => {
        fileInput.click();
    };
    
    // File input change handler
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const saveString = event.target.result.trim();
            textarea.value = saveString;
            showToast('File loaded! Click "Import Save" to continue.', 'success');
            
            // Reset file input
            fileInput.value = '';
        };
        reader.onerror = () => {
            showToast('Failed to read file!', 'error');
            fileInput.value = '';
        };
        reader.readAsText(file);
    };
    
    modal.classList.add('active');
}

// Setup modal event handlers
function setupModalHandlers() {
    const modal = document.getElementById('save-modal');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    
    // Close button
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Cancel button
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Click outside modal to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });
}