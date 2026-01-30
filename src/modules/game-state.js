// Central Game State Management

import { initializeResources } from './resources.js';
import { initializeBuildings, getBuildingCost } from './buildings.js';
import { initializeModels } from './models.js';
import { initializeResearch } from './research.js';
import { initializeAchievements } from './achievements.js';
import { initializePrestige } from './prestige.js';
import { checkAndUnlockAchievements, getAchievementBonus } from './achievement-checker.js';

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
        
        // Enhanced training state for UI animations
        this.training = null; // Will be set when training starts
        
        // Achievement bonuses storage
        this.achievementBonuses = {
            dataGeneration: 1,
            allProduction: 1,
            trainingSpeed: 1,
            modelPerformance: 1,
            computePower: 1,
            allResources: 1,
            buildingCostReduction: 0,
            globalMultiplier: 1,
            deploymentTokens: 1,
            permanentAccuracy: 1,
            researchPoints: 1
        };
        
        // Multipliers object for UI
        this.multipliers = {
            trainingSpeed: 1.0,
            global: 1.0
        };
        
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
            totalPlaytime: 0,
            lastPlaytimeUpdate: Date.now()
        };
        
        this.settings = {
            autoSave: true,
            autoSaveInterval: 30000, // 30 seconds
            offlineProgress: true
        };
        
        this.lastSaveTime = Date.now();
        
        // Queue for newly unlocked achievements (for notifications)
        this.newlyUnlockedAchievements = [];
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
        
        let cost = getBuildingCost(building);
        
        // Apply achievement cost reduction
        if (this.achievementBonuses.buildingCostReduction > 0) {
            const reduction = this.achievementBonuses.buildingCostReduction;
            const adjustedCost = {};
            for (const [resourceId, amount] of Object.entries(cost)) {
                adjustedCost[resourceId] = amount * (1 - reduction);
            }
            cost = adjustedCost;
        }
        
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
                    if (this.resources[resourceId]) {
                        this.resources[resourceId].perSecond += amount * building.count;
                    }
                }
            }
        }
        
        // Apply specific resource bonuses FIRST (before global multipliers)
        // This ensures they show up correctly in the UI
        if (this.resources.data) {
            this.resources.data.perSecond *= this.achievementBonuses.dataGeneration;
        }
        if (this.resources.compute) {
            this.resources.compute.perSecond *= this.achievementBonuses.computePower;
        }
        if (this.resources.research) {
            this.resources.research.perSecond *= this.achievementBonuses.researchPoints;
        }
        
        // Apply global multipliers from research
        let globalMultiplier = 1;
        for (const researchId of this.stats.completedResearch) {
            const research = this.research[researchId];
            if (research && research.effect && research.effect.type === 'globalMultiplier') {
                globalMultiplier *= research.effect.multiplier;
            }
        }
        
        // Apply prestige bonuses
        if (this.prestige.upgrades.ensemblelearning.level > 0) {
            const bonus = this.prestige.upgrades.ensemblelearning.effect.value * this.prestige.upgrades.ensemblelearning.level;
            globalMultiplier *= (1 + bonus);
        }
        
        // Apply achievement bonuses to global multiplier
        globalMultiplier *= this.achievementBonuses.globalMultiplier;
        globalMultiplier *= this.achievementBonuses.allProduction;
        globalMultiplier *= this.achievementBonuses.allResources;
        
        // Store multipliers for UI
        this.multipliers.global = globalMultiplier;
        this.multipliers.trainingSpeed = this.achievementBonuses.trainingSpeed;
        
        // Apply global multiplier to all resources
        for (const resource of Object.values(this.resources)) {
            resource.perSecond *= globalMultiplier;
        }
        
        // Add production from current training (with bonuses)
        if (this.currentTraining) {
            const model = this.models[this.currentTraining];
            if (model && model.production) {
                for (const [resourceId, amount] of Object.entries(model.production)) {
                    if (this.resources[resourceId]) {
                        let modifiedAmount = amount * this.achievementBonuses.modelPerformance * globalMultiplier;
                        this.resources[resourceId].perSecond += modifiedAmount;
                    }
                }
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
        
        // Initialize training state for UI
        this.training = {
            modelId: modelId,
            elapsedTime: 0,
            duration: model.trainingTime,
            accuracyPerSecond: model.production.accuracy || 0,
            startTime: Date.now()
        };
        
        this.recalculateProduction();
        
        return true;
    }
    
    stopTraining() {
        this.currentTraining = null;
        this.trainingProgress = 0;
        this.training = null;
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
    
    // Achievement Management
    checkAchievements() {
        const newUnlocks = checkAndUnlockAchievements(this);
        if (newUnlocks.length > 0) {
            this.newlyUnlockedAchievements.push(...newUnlocks);
        }
        return newUnlocks;
    }
    
    // Get and clear newly unlocked achievements (for UI notifications)
    popNewlyUnlockedAchievements() {
        const achievements = this.newlyUnlockedAchievements;
        this.newlyUnlockedAchievements = [];
        return achievements;
    }
    
    // Game Loop Update
    update(deltaTime) {
        // Update playtime
        const now = Date.now();
        const playtimeDelta = now - this.stats.lastPlaytimeUpdate;
        this.stats.totalPlaytime += playtimeDelta;
        this.stats.lastPlaytimeUpdate = now;
        
        // Add resources from production
        for (const [resourceId, resource] of Object.entries(this.resources)) {
            if (resource.perSecond > 0) {
                this.addResource(resourceId, resource.perSecond * deltaTime);
            }
        }
        
        // Update training progress
        if (this.currentTraining && this.training) {
            const model = this.models[this.currentTraining];
            const trainingSpeedBonus = this.achievementBonuses.trainingSpeed;
            
            this.trainingProgress += deltaTime * trainingSpeedBonus;
            this.training.elapsedTime += deltaTime * trainingSpeedBonus;
            
            if (this.trainingProgress >= model.trainingTime) {
                this.completeTraining();
            }
        }
        
        // Check unlocks
        this.checkBuildingUnlocks();
        this.checkResearchUnlocks();
        
        // Check achievements
        this.checkAchievements();
        
        // Update total compute for stats
        this.stats.totalCompute = this.resources.compute.amount;
    }
    
    // Process offline progression
    processOfflineProgress(offlineTime) {
        const maxOfflineTime = 24 * 60 * 60 * 1000; // 24 hours
        const actualTime = Math.min(offlineTime, maxOfflineTime) / 1000; // Convert to seconds
        
        // Update playtime
        this.stats.totalPlaytime += Math.min(offlineTime, maxOfflineTime);
        
        // Apply offline production
        for (const [resourceId, resource] of Object.entries(this.resources)) {
            if (resource.perSecond > 0) {
                this.addResource(resourceId, resource.perSecond * actualTime);
            }
        }
        
        // Check achievements after offline progress
        this.checkAchievements();
    }
    
    // Save/Load
    save() {
        const saveData = {
            version: '0.2',
            timestamp: Date.now(),
            resources: this.resources,
            buildings: this.buildings,
            models: this.models,
            research: this.research,
            achievements: this.achievements,
            achievementBonuses: this.achievementBonuses,
            prestige: this.prestige,
            currentTraining: this.currentTraining,
            trainingProgress: this.trainingProgress,
            training: this.training,
            stats: this.stats,
            settings: this.settings
        };
        
        this.lastSaveTime = Date.now();
        return saveData;
    }
    
    load(saveData) {
        try {
            // Restore state
            this.resources = saveData.resources;
            this.buildings = saveData.buildings;
            this.models = saveData.models;
            this.research = saveData.research;
            this.achievements = saveData.achievements;
            this.prestige = saveData.prestige;
            this.currentTraining = saveData.currentTraining;
            this.trainingProgress = saveData.trainingProgress;
            this.training = saveData.training || null;
            this.stats = saveData.stats;
            this.settings = saveData.settings;
            
            // Load achievement bonuses if they exist
            if (saveData.achievementBonuses) {
                this.achievementBonuses = saveData.achievementBonuses;
            }
            
            // Ensure lastPlaytimeUpdate is set
            if (!this.stats.lastPlaytimeUpdate) {
                this.stats.lastPlaytimeUpdate = Date.now();
            }
            
            this.recalculateProduction();
            this.lastSaveTime = saveData.timestamp || Date.now();
            
            return true;
        } catch (e) {
            console.error('Failed to load save:', e);
            return false;
        }
    }
    
    reset() {
        Object.assign(this, new GameState());
    }
    
    // Export/Import with Unicode-safe Base64
    export() {
        const saveData = this.save();
        const jsonString = JSON.stringify(saveData);
        // Use Unicode-safe encoding
        return btoa(encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode('0x' + p1);
        }));
    }
    
    import(saveString) {
        try {
            // Decode Unicode-safe Base64
            const jsonString = decodeURIComponent(atob(saveString).split('').map((c) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const saveData = JSON.parse(jsonString);
            this.load(saveData);
            return true;
        } catch (e) {
            console.error('Failed to import save:', e);
            return false;
        }
    }
}