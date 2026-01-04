# Traffic Network Rerouting Simulator

A full-stack congestion-aware traffic simulation system demonstrating dynamic routing algorithms and real-time traffic flow optimization on weighted graph networks.

## Overview

This project models urban traffic networks as directed weighted graphs where agents (vehicles) navigate from source to destination while adapting to real-time congestion. Edge weights dynamically adjust based on traffic flow using the Bureau of Public Roads (BPR) congestion function.

**Live Demo:** Load a sample graph, enable dynamic rerouting, and watch 200+ agents adapt their routes as congestion builds in real-time.

---

## Key Features

### 🚗 **Dynamic Agent Routing**
- 200+ concurrent agents autonomously navigate through the network
- Real-time route recalculation based on current congestion levels
- Configurable rerouting intervals (every N steps) with improvement thresholds

### 📊 **Congestion Modeling**
- **BPR Function** (Bureau of Public Roads): `travel_time = base_time × (1 + α(flow/capacity)^β)`
- Edge weights dynamically adjust based on traffic flow
- Standard parameters: α = 0.15 (congestion sensitivity), β = 4.0 (non-linearity)

### 🗺️ **Interactive Visualization**
- Real-time SVG rendering of network graph with 60fps performance
- Color-coded congestion heatmap (green → yellow → red based on flow/capacity ratio)
- Agent position tracking and route highlighting
- Time-series metrics charts (travel time, congestion, delays)

### 🔄 **Routing Strategies**
- Static routing: Initial best path, no adaptation
- Dynamic rerouting: Greedy best-response where each agent independently optimizes
- Configurable improvement threshold (default: 1% cost reduction required to switch routes)

---

## Architecture

### Backend (Python + FastAPI)
```
backend/
├── app/
│   ├── api/              # REST endpoints
│   ├── core/             # Simulation engine
│   │   ├── graph.py      # Graph data structure (adjacency list)
│   │   ├── routing.py    # Dijkstra's algorithm
│   │   ├── congestion.py # BPR & congestion models
│   │   ├── simulation.py # Orchestration logic
│   │   └── metrics.py    # Performance tracking
│   ├── models/           # Pydantic data models
│   └── utils/            # Graph generators
```

**Key Algorithms:**
- **Dijkstra's Algorithm**: O(E log V) shortest path with min-heap priority queue
- **BPR Congestion Model**: `w(flow) = w₀ × (1 + α(flow/capacity)^β)`
- **Greedy Best-Response Rerouting**: Each agent recalculates from current position if alternative path offers >1% improvement

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── components/       # UI components
│   │   ├── GraphCanvas.tsx       # SVG visualization engine
│   │   ├── ControlPanel.tsx      # Simulation controls
│   │   ├── MetricsChart.tsx      # Time-series graphs
│   │   ├── RoutePanel.tsx        # Agent route display
│   │   └── EdgeDetailsPanel.tsx  # Edge statistics
│   ├── api/              # Backend API client
│   └── types/            # TypeScript interfaces
```

---

## Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Access the application at `http://localhost:5173`

---

## Usage

### Quick Start
1. **Load Sample Graph**: Click "Load Sample Graph" to generate a 5×5 grid with 50 agents
2. **Enable Rerouting**: Check "Dynamic Rerouting" and set interval to 10 steps
3. **Advance Simulation**: Click "Advance 10 Steps" and watch agents move
4. **Observe Congestion**: See edges change color as flow increases
5. **Select Agent**: Click an agent in the Route Panel to highlight their path

### Custom Scenarios
- **Generate Custom Graph**: Use sliders to create grids from 3×3 to 10×10 with 10-200 agents
- **Adjust Rerouting**: Change interval (5-50 steps) to control adaptation frequency
- **Compare Strategies**: Run with rerouting ON vs OFF to measure performance difference

### API Endpoints
```
POST   /api/graph/load              # Load custom topology
POST   /api/graph/load-sample       # Load sample grid graph
POST   /api/simulation/step         # Advance N steps
GET    /api/simulation/state        # Get current state
GET    /api/simulation/metrics      # Get metrics history
POST   /api/simulation/configure-rerouting  # Enable/disable rerouting
```

Full API documentation: `http://localhost:8000/docs`

---

## Algorithms & Mathematics

### Dijkstra's Shortest Path Algorithm
```
Input: Graph G = (V, E), source node s, destination node d
Output: Shortest path from s to d

1. Initialize distance[s] = 0, distance[v] = ∞ for all v ≠ s
2. Create min-heap Q with all vertices
3. While Q not empty:
   a. u = extract_min(Q)
   b. For each neighbor v of u:
      - If distance[u] + weight(u,v) < distance[v]:
          distance[v] = distance[u] + weight(u,v)
          predecessor[v] = u
4. Reconstruct path from predecessors

Time Complexity: O(E log V) with binary heap
Space Complexity: O(V + E) for adjacency list
```

### BPR Congestion Function
```
Travel Time Calculation:
t(flow) = t₀ × (1 + α × (flow/capacity)^β)

Where:
- t₀ = base travel time (free-flow conditions)
- flow = current number of agents on edge
- capacity = maximum throughput before severe congestion
- α = 0.15 (congestion sensitivity parameter, standard value)
- β = 4.0 (non-linearity exponent, standard value)

Properties:
- Monotonically increasing: more flow → higher travel time
- Non-linear: congestion effects accelerate exponentially
- Calibrated to real-world traffic observations
```

### Rerouting Decision Logic
```
For each agent at position p with destination d:

1. Calculate remaining cost on current route:
   old_cost = Σ w(e) for all edges e from p to d on current path

2. Compute new optimal route from p to d using Dijkstra:
   new_route = dijkstra(p, d)
   new_cost = total cost of new_route

3. Calculate improvement ratio:
   improvement = (old_cost - new_cost) / old_cost

4. Reroute if improvement > threshold (default: 1%):
   if improvement > 0.01:
       agent.route = new_route
       agent.position = start of new_route

Nash Equilibrium Convergence:
Agents repeatedly reroute until no agent can improve ≥1%, 
reaching a stable state (local Nash equilibrium)
```

### Flow Update Model
```
At each simulation step:

1. Reset all edge flows: flow(e) = 0 for all e ∈ E

2. For each agent a:
   - Determine current edge e that agent is traversing
   - Increment flow(e) += 1

3. Update edge weights using BPR:
   w(e) = w₀(e) × (1 + 0.15 × (flow(e)/capacity(e))^4)

4. Edge weight affects future routing decisions in next rerouting step
```

---

## Performance Metrics

### System-Level Metrics

**Average Travel Time**
```
avg_time = (Σ cost(route_i)) / N

Where:
- N = total number of agents
- cost(route_i) = sum of edge weights along agent i's route
- Measures system-wide efficiency
```

**Total Congestion**
```
total_congestion = Σ (flow(e) / capacity(e)) for all e ∈ E

- Sum of congestion ratios across all edges
- Higher values indicate more severe bottlenecks
- Unbounded metric (can exceed number of edges)
```

**Congested Edge Count**
```
congested_count = |{e ∈ E : flow(e)/capacity(e) > 0.7}|

- Number of edges with >70% utilization
- Identifies bottleneck locations
- Discrete metric for capacity planning
```

**Average Route Cost**
```
avg_cost = (Σ total_cost(route_i)) / N

- Mean cost across all agent routes
- Includes congestion effects
- Measured in time units
```

**Max Edge Flow**
```
max_flow = max{flow(e) : e ∈ E}

- Identifies most heavily used edge
- Used for bottleneck analysis
- Integer value (number of agents)
```

### Edge-Level Metrics

**Congestion Ratio**
```
congestion_ratio(e) = flow(e) / capacity(e)

- Range: [0, ∞) (can exceed 1.0 for overcapacity)
- Color mapping: <0.3 green, 0.3-0.7 yellow, >0.7 red
```

**Actual Travel Time**
```
t_actual(e) = t_base(e) × (1 + 0.15 × (flow(e)/capacity(e))^4)

- Real-time travel time including congestion
- Used by Dijkstra for route computation
```

**Edge Delay**
```
delay(e) = t_actual(e) - t_base(e)

- Additional time due to congestion
- Zero when flow = 0
```

**Delay Percentage**
```
delay_pct(e) = (delay(e) / t_base(e)) × 100%

- Percentage increase over free-flow time
- Can exceed 100% in severe congestion
```

---

## Technical Implementation

### Graph Data Structure
```python
# Adjacency list representation
adjacency: Dict[int, List[Tuple[int, Edge]]]

# Hash map for O(1) edge lookups
edges: Dict[EdgeId, Edge]

# Node storage
nodes: Dict[int, Node]

Space Complexity: O(V + E)
Edge Lookup: O(1)
Neighbor Iteration: O(degree(v))
```

### Simulation Loop
```python
def step(num_steps):
    for _ in range(num_steps):
        1. update_flows()           # O(N) - iterate agents
        2. advance_agents()         # O(N) - move along routes
        3. if rerouting_enabled:
              reroute_all_agents()  # O(N × E log V) - Dijkstra per agent
        4. collect_metrics()        # O(E + N) - aggregate statistics
    
Total per step: O(N × E log V) when rerouting
Total per step: O(N) when not rerouting
```

### State Management
```
Backend: In-memory Python dictionaries
- agents: Dict[agent_id, Agent]
- graph.nodes: Dict[node_id, Node]
- graph.edges: Dict[EdgeId, Edge]

Frontend: React useState hooks
- state: SimulationState | null
- metrics: SimulationMetrics[]
- selectedAgentId: number | null
```

---

## Configuration Parameters

### BPR Function Parameters
```python
alpha = 0.15    # Congestion sensitivity (standard value)
beta = 4.0      # Non-linearity exponent (standard value)

# Alternative models available:
# - Linear: w = w₀(1 + k × flow/capacity)
# - Exponential: w = w₀ × exp(k × flow/capacity)
# - Piecewise: Different α below/above threshold
```

### Rerouting Configuration
```python
rerouting_enabled: bool = True
rerouting_interval: int = 10        # Steps between rerouting
improvement_threshold: float = 0.01  # 1% minimum improvement
```

### Graph Generation
```python
grid_size: Tuple[int, int] = (5, 5)           # rows × cols
agent_count: int = 50
edge_base_weight: Uniform(10.0, 20.0)         # Random time units
edge_capacity: Uniform(80.0, 120.0)           # Random vehicles
```

