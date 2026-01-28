// Central Game State Management

import { initializeResources } from './resources.js';
import { initializeBuildings, getBuildingCost } from './buildings.js';
import { initializeModels } from './models.js';
import { initializeResearch } from './research.js';
import { initializeAchievements } from './achievements.js';
import { initializePrestige } from './prestige.js';

export class GameState {
    constructor() {
        this.resources = initializeResources();
        this.buildings = initializeBuildings();
        this.models = initializeModels();
        this.research = initializeResearch();
        this.achievements = initializeAchievements();
        this.prestige = initializePrestige();
        
        this.currentTraining = null;
        this.trainingProgress = 0;
        
        this.stats = {
            totalDataGenerated: 0,
            totalAccuracy: 0,
            maxAccuracy: 0,
            totalCompute: 0,
            totalBuildings: 0,
            modelsTrained: 0,
            uniqueModelsTrained: 0,
            trainedModels: [],
            completedResearch: [],
            deployments: 0,
            startTime: Date.now(),
            totalPlaytime: 0
        };
        
        this.settings = {
            autoSave: true,
            autoSaveInterval: 30000, // 30 seconds
            offlineProgress: true
        };
    }
    
    // Resource Management
    addResource(resourceId, amount) {
        if (this.resources[resourceId]) {
            this.resources[resourceId].amount += amount;
            
            // Update stats
            if (resourceId === 'data') {
                this.stats.totalDataGenerated += amount;
            } else if (resourceId === 'accuracy') {
                this.stats.totalAccuracy += amount;
                this.stats.maxAccuracy = Math.max(this.stats.maxAccuracy, this.resources.accuracy.amount);
            }
        }
    }
    
    canAfford(costs) {
        for (const [resourceId, amount] of Object.entries(costs)) {
            if (!this.resources[resourceId] || this.resources[resourceId].amount < amount) {
                return false;
            }
        }
        return true;
    }
    
    spendResources(costs) {
        if (!this.canAfford(costs)) return false;
        
        for (const [resourceId, amount] of Object.entries(costs)) {
            this.resources[resourceId].amount -= amount;
        }
        return true;
    }
    
    // Building Management
    purchaseBuilding(buildingId) {
        const building = this.buildings[buildingId];
        if (!building || !building.unlocked) return false;
        
        const cost = getBuildingCost(building);
        if (!this.spendResources(cost)) return false;
        
        building.count++;
        this.stats.totalBuildings++;
        this.recalculateProduction();
        
        // Check for building unlocks
        this.checkBuildingUnlocks();
        
        return true;
    }
    
    checkBuildingUnlocks() {
        for (const building of Object.values(this.buildings)) {
            if (!building.unlocked && building.unlockRequirement) {
                let canUnlock = true;
                for (const [resourceId, amount] of Object.entries(building.unlockRequirement)) {
                    if (this.resources[resourceId].amount < amount) {
                        canUnlock = false;
                        break;
                    }
                }
                if (canUnlock) {
                    building.unlocked = true;
                }
            }
        }
    }
    
    // Production Calculation
    recalculateProduction() {
        // Reset all production
        for (const resource of Object.values(this.resources)) {
            resource.perSecond = 0;
        }
        
        // Calculate base production from buildings
        for (const building of Object.values(this.buildings)) {
            if (building.count > 0 && building.production) {
                for (const [resourceId, amount] of Object.entries(building.production)) {
                    this.resources[resourceId].perSecond += amount * building.count;
                }
            }
        }
        
        // Apply global multipliers from research
        let globalMultiplier = 1;
        for (const researchId of this.stats.completedResearch) {
            const research = this.research[researchId];
            if (research.effect.type === 'globalMultiplier') {
                globalMultiplier *= research.effect.multiplier;
            }
        }
        
        // Apply prestige bonuses
        if (this.prestige.upgrades.ensemblelearning.level > 0) {
            const bonus = this.prestige.upgrades.ensemblelearning.effect.value * this.prestige.upgrades.ensemblelearning.level;
            globalMultiplier *= (1 + bonus);
        }
        
        // Apply multiplier to all resources
        for (const resource of Object.values(this.resources)) {
            resource.perSecond *= globalMultiplier;
        }
        
        // Add production from current training
        if (this.currentTraining) {
            const model = this.models[this.currentTraining];
            for (const [resourceId, amount] of Object.entries(model.production)) {
                this.resources[resourceId].perSecond += amount;
            }
        }
    }
    
    // Training Management
    startTraining(modelId) {
        const model = this.models[modelId];
        if (!model || !model.unlocked) return false;
        
        // Check requirements
        for (const [resourceId, amount] of Object.entries(model.requirements)) {
            if (this.resources[resourceId].amount < amount) {
                return false;
            }
        }
        
        this.currentTraining = modelId;
        this.trainingProgress = 0;
        this.recalculateProduction();
        
        return true;
    }
    
    stopTraining() {
        this.currentTraining = null;
        this.trainingProgress = 0;
        this.recalculateProduction();
    }
    
    completeTraining() {
        if (!this.currentTraining) return;
        
        const modelId = this.currentTraining;
        this.stats.modelsTrained++;
        
        if (!this.stats.trainedModels.includes(modelId)) {
            this.stats.trainedModels.push(modelId);
            this.stats.uniqueModelsTrained++;
        }
        
        this.stopTraining();
    }
    
    // Research Management
    performResearch(researchId) {
        const research = this.research[researchId];
        if (!research || !research.unlocked || research.researched) return false;
        
        if (!this.spendResources(research.cost)) return false;
        
        research.researched = true;
        this.stats.completedResearch.push(researchId);
        
        // Apply research effects
        if (research.effect.type === 'unlockModels') {
            for (const modelId of research.effect.models) {
                if (this.models[modelId]) {
                    this.models[modelId].unlocked = true;
                }
            }
        }
        
        // Check for research unlocks
        this.checkResearchUnlocks();
        this.recalculateProduction();
        
        return true;
    }
    
    checkResearchUnlocks() {
        for (const research of Object.values(this.research)) {
            if (!research.unlocked && research.unlockRequirement) {
                if (research.unlockRequirement.research) {
                    const reqResearch = this.research[research.unlockRequirement.research];
                    if (reqResearch && reqResearch.researched) {
                        research.unlocked = true;
                    }
                }
            }
        }
        
        // Check model unlocks based on accuracy
        for (const model of Object.values(this.models)) {
            if (!model.unlocked && model.unlockRequirement) {
                let canUnlock = true;
                for (const [resourceId, amount] of Object.entries(model.unlockRequirement)) {
                    if (this.resources[resourceId].amount < amount) {
                        canUnlock = false;
                        break;
                    }
                }
                if (canUnlock) {
                    model.unlocked = true;
                }
            }
        }
    }
    
    // Game Loop Update
    update(deltaTime) {
        const dt = deltaTime / 1000; // Convert to seconds
        
        // Add resources from production
        for (const [resourceId, resource] of Object.entries(this.resources)) {
            if (resource.perSecond > 0) {
                this.addResource(resourceId, resource.perSecond * dt);
            }
        }
        
        // Update training progress
        if (this.currentTraining) {
            const model = this.models[this.currentTraining];
            this.trainingProgress += dt;
            
            if (this.trainingProgress >= model.trainingTime) {
                this.completeTraining();
            }
        }
        
        // Check unlocks
        this.checkBuildingUnlocks();
        this.checkResearchUnlocks();
        
        // Update total compute for stats
        this.stats.totalCompute = this.resources.compute.amount;
    }
    
    // Save/Load
    save() {
        const saveData = {
            version: '0.1',
            timestamp: Date.now(),
            resources: this.resources,
            buildings: this.buildings,
            models: this.models,
            research: this.research,
            achievements: this.achievements,
            prestige: this.prestige,
            currentTraining: this.currentTraining,
            trainingProgress: this.trainingProgress,
            stats: this.stats,
            settings: this.settings
        };
        
        localStorage.setItem('kiIdle_save', JSON.stringify(saveData));
        return saveData;
    }
    
    load() {
        const saveString = localStorage.getItem('kiIdle_save');
        if (!saveString) return false;
        
        try {
            const saveData = JSON.parse(saveString);
            
            // Calculate offline progress
            if (this.settings.offlineProgress && saveData.timestamp) {
                const offlineTime = (Date.now() - saveData.timestamp) / 1000; // seconds
                const maxOfflineTime = 3600 * 24; // 24 hours max
                const actualOfflineTime = Math.min(offlineTime, maxOfflineTime);
                
                // Restore state first
                this.resources = saveData.resources;
                this.buildings = saveData.buildings;
                this.recalculateProduction();
                
                // Apply offline progress
                for (const [resourceId, resource] of Object.entries(this.resources)) {
                    if (resource.perSecond > 0) {
                        this.addResource(resourceId, resource.perSecond * actualOfflineTime);
                    }
                }
            }
            
            // Load full state
            Object.assign(this, saveData);
            this.recalculateProduction();
            
            return true;
        } catch (e) {
            console.error('Failed to load save:', e);
            return false;
        }
    }
    
    reset() {
        Object.assign(this, new GameState());
        localStorage.removeItem('kiIdle_save');
    }
    
    // Export/Import
    export() {
        const saveData = this.save();
        return btoa(JSON.stringify(saveData));
    }
    
    import(saveString) {
        try {
            const saveData = JSON.parse(atob(saveString));
            localStorage.setItem('kiIdle_save', JSON.stringify(saveData));
            this.load();
            return true;
        } catch (e) {
            console.error('Failed to import save:', e);
            return false;
        }
    }
}