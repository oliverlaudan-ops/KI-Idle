# KI-Idle - Game Design Document

## Core Concept

KI-Idle is an incremental game where players build and manage a Machine Learning research facility. Players train neural networks, optimize algorithms, and scale their AI infrastructure while learning real ML concepts through gameplay.

## Game Loop

1. **Collect Training Data** (passive resource generation)
2. **Train Models** (consume resources, produce accuracy/performance)
3. **Purchase Upgrades** (better hardware, algorithms, architectures)
4. **Research New Technologies** (unlock advanced ML concepts)
5. **Deploy Models** (prestige system - reset with permanent bonuses)

## Resources

### Primary Resources
- **Training Data** - Base resource, generated passively
- **Compute Power (TFLOPS)** - Determines training speed
- **Model Accuracy (%)** - Main currency for progression
- **Research Points** - Unlock new technologies

### Secondary Resources
- **Energy (kWh)** - Powers data centers and GPU clusters
- **Memory (GB)** - Required for larger models
- **Bandwidth (GB/s)** - Affects data pipeline efficiency

## Buildings / Infrastructure

### Tier 1: Foundation
- **Data Collectors** - Generate training data
  - Cost: 10 Data | Produces: 1 Data/s
- **CPU Cores** - Basic compute power
  - Cost: 50 Data | Produces: 0.1 TFLOPS
- **Storage Servers** - Enable data accumulation
  - Cost: 100 Data | Increases: Data cap by 1000

### Tier 2: Acceleration
- **GPU Clusters** - High-performance training
  - Cost: 1K Data, 10 TFLOPS | Produces: 5 TFLOPS
- **Data Pipelines** - Automated data processing
  - Cost: 5K Data | Produces: 10 Data/s
- **Cooling Systems** - Improve efficiency
  - Cost: 10K Data | Bonus: +15% all production

### Tier 3: Advanced Infrastructure
- **TPU Arrays** - Specialized ML hardware
  - Cost: 100K Data, 100 TFLOPS | Produces: 50 TFLOPS
- **Distributed Systems** - Parallel training
  - Cost: 500K Data | Bonus: +50% training speed
- **Quantum Processors** - Experimental compute
  - Cost: 10M Data, 1000 TFLOPS | Produces: 500 TFLOPS

## Training Tasks / Models

Players train increasingly complex models as they progress:

### Early Game: Basic Classification
- **Digit Recognition (MNIST-style)**
  - Required: 100 Data, 1 TFLOPS
  - Produces: 0.1 Accuracy/s
  - Teaches: Basic neural networks

### Mid Game: Advanced Vision
- **Image Classification (ImageNet-style)**
  - Required: 10K Data, 50 TFLOPS
  - Produces: 5 Accuracy/s
  - Teaches: Convolutional Neural Networks

- **Object Detection**
  - Required: 100K Data, 200 TFLOPS
  - Produces: 20 Accuracy/s
  - Teaches: Region-based CNNs

### Late Game: Complex Tasks
- **Natural Language Processing**
  - Required: 1M Data, 1K TFLOPS
  - Produces: 100 Accuracy/s
  - Teaches: Transformers, Attention

- **Reinforcement Learning Agents**
  - Required: 10M Data, 5K TFLOPS
  - Produces: 500 Accuracy/s
  - Teaches: Q-Learning, Policy Gradients

### End Game: Frontier Models
- **Large Language Models**
  - Required: 100M Data, 50K TFLOPS
  - Produces: 5K Accuracy/s
  - Teaches: Scaling laws, Emergent abilities

- **Multimodal AI**
  - Required: 1B Data, 500K TFLOPS
  - Produces: 50K Accuracy/s
  - Teaches: Vision-Language models

## Research Tree

### Optimization Algorithms
- **Stochastic Gradient Descent (SGD)** - Unlocked at start
- **Momentum** - +10% training speed | Cost: 1K Accuracy
- **Adam Optimizer** - +25% training speed | Cost: 10K Accuracy
- **AdamW** - +40% training speed | Cost: 100K Accuracy

### Activation Functions
- **Sigmoid** - Unlocked at start
- **ReLU** - +15% model performance | Cost: 5K Accuracy
- **Leaky ReLU** - +20% model performance | Cost: 25K Accuracy
- **GELU** - +35% model performance | Cost: 100K Accuracy
- **Swish** - +50% model performance | Cost: 500K Accuracy

### Architectures
- **Dense Networks** - Unlocked at start
- **Convolutional Networks** - Unlock image tasks | Cost: 50K Accuracy
- **Recurrent Networks** - Unlock sequence tasks | Cost: 200K Accuracy
- **Transformers** - +100% all performance | Cost: 1M Accuracy
- **Diffusion Models** - Unlock generative tasks | Cost: 10M Accuracy

### Regularization Techniques
- **Dropout** - Prevent overfitting, +10% efficiency | Cost: 10K Accuracy
- **Batch Normalization** - +20% training stability | Cost: 50K Accuracy
- **Layer Normalization** - +30% convergence speed | Cost: 200K Accuracy
- **Weight Decay** - +15% model generalization | Cost: 100K Accuracy

### Hardware Innovations
- **Mixed Precision Training** - -30% compute cost | Cost: 500K Accuracy
- **Gradient Checkpointing** - -40% memory usage | Cost: 1M Accuracy
- **Model Parallelism** - Scale to larger models | Cost: 5M Accuracy
- **Pipeline Parallelism** - +200% throughput | Cost: 25M Accuracy

## Prestige System: Model Deployment

When players reach 100% accuracy on a task, they can **Deploy** their model:

### Benefits
- Gain **Deployment Tokens** based on total accuracy achieved
- Permanent bonuses to production rates
- Unlock new model architectures
- Start fresh with enhanced capabilities

### Prestige Upgrades
- **Pre-trained Weights** - Start with 10% of previous data
- **Transfer Learning** - +50% permanent training speed
- **AutoML Systems** - Automate upgrades (auto-buyer)
- **Neural Architecture Search** - Automatically find optimal models
- **Federated Learning** - Passive offline progression increases by 100%

## Achievements

### Training Milestones
- **First Steps** - Train your first model
- **GPU Enthusiast** - Build 10 GPU clusters
- **Big Data** - Accumulate 1 million training data
- **Supercomputer** - Reach 10,000 TFLOPS

### Research Breakthroughs
- **Optimization Expert** - Unlock all optimizers
- **Deep Learning Pioneer** - Research all activation functions
- **Transformer Revolution** - Unlock transformer architecture
- **Quantum Leap** - Build first quantum processor

### Model Performance
- **Overfitting is Real** - Reach 99.9% accuracy on any task
- **Generalist AI** - Complete 10 different training tasks
- **Frontier Labs** - Deploy 5 models
- **AGI Researcher** - Reach 1 billion total accuracy

## UI Layout

### Top Bar (Stats)
- Training Data: X.XX/s
- Compute Power: X.XX TFLOPS
- Model Accuracy: X.XX%/s
- Research Points: XXXX

### Main Tabs
1. **Infrastructure** - Build data centers, GPUs, etc.
2. **Training** - Select and train models
3. **Research** - Unlock new technologies
4. **Deployment** - Prestige system and permanent upgrades
5. **Achievements** - Track milestones
6. **Statistics** - Detailed analytics

### Visual Elements
- **Training Progress Bar** - Current model training status
- **Loss Curve Graph** - Animated decreasing loss over time
- **Accuracy Metrics** - Real-time performance indicators
- **Neural Network Visualization** - Animated neurons firing during training

## Progression Curve

### Phase 1: Manual Training (0-10 minutes)
- Click to generate data
- Build first infrastructure
- Train simple models manually

### Phase 2: Automation (10-60 minutes)
- Passive data generation
- Auto-train basic models
- Unlock first research options

### Phase 3: Scaling (1-4 hours)
- Build advanced infrastructure
- Train complex models
- Optimize with research tree

### Phase 4: Prestige Loop (4+ hours)
- Deploy first models
- Unlock prestige upgrades
- Start exponential growth cycle

## Technical Implementation Notes

### Save System
- Auto-save every 30 seconds to localStorage
- Export/import save files
- Offline progression calculation on load

### Performance
- Efficient calculation loops
- Render optimization (only update visible elements)
- BigNumber library for large values (post-deployment)

### Balancing Philosophy
- Early game: Linear growth, short upgrade cycles
- Mid game: Polynomial growth, strategic choices matter
- Late game: Exponential growth, prestige becomes attractive
- Post-prestige: Multiplicative bonuses create meaningful resets

## Future Expansion Ideas

### Potential Features
- **Competitions** - Benchmark your models against others
- **Collaborative Training** - Federated learning with other players
- **Adversarial Networks** - GANs as a mini-game
- **Model Zoo** - Collect and showcase deployed models
- **Research Papers** - In-game documentation of ML concepts
- **Challenges** - Limited resource scenarios, speed-run modes

### Educational Integration
- Tooltips explaining real ML concepts
- Links to learning resources
- In-game glossary of terms
- "How it works" modal for each feature

---

**Version:** 1.0  
**Last Updated:** January 28, 2026