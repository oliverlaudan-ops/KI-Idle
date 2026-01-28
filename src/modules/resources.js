// Resource Definitions

export const resources = {
    data: {
        id: 'data',
        name: 'Training Data',
        icon: '📊',
        amount: 10,
        perSecond: 0,
        unlocked: true,
        description: 'Essential datasets needed to train machine learning models'
    },
    compute: {
        id: 'compute',
        name: 'Compute Power',
        icon: '⚡',
        amount: 0,
        perSecond: 0,
        unlocked: true,
        unit: 'TFLOPS',
        description: 'Processing power measured in TFLOPS (Tera Floating Point Operations Per Second)'
    },
    accuracy: {
        id: 'accuracy',
        name: 'Model Accuracy',
        icon: '🎯',
        amount: 0,
        perSecond: 0,
        unlocked: true,
        unit: '%',
        description: 'Model performance metric used as currency for upgrades'
    },
    research: {
        id: 'research',
        name: 'Research Points',
        icon: '🔬',
        amount: 0,
        perSecond: 0,
        unlocked: true,
        description: 'Points used to unlock new algorithms and technologies'
    }
};

// Initialize resources
export function initializeResources() {
    return JSON.parse(JSON.stringify(resources));
}