# app/utils/graph_generator.py
import random
import math
from typing import List, Tuple
from ..models.graph_models import Node, Edge, Agent
from ..models.simulation_models import GraphTopology

def generate_grid_graph(rows: int, cols: int) -> GraphTopology:
    """Generate a grid graph for testing."""
    nodes = []
    edges = []

    # Create nodes
    for r in range(rows):
        for c in range(cols):
            node_id = r * cols + c
            nodes.append(Node(
                id=node_id,
                x=c * 100.0,
                y=r * 100.0,
                label=f"N{node_id}"
            ))

    # Create edges (right and down)
    for r in range(rows):
        for c in range(cols):
            current = r * cols + c

            # Right edge
            if c < cols - 1:
                right = r * cols + (c + 1)
                weight = random.uniform(5.0, 15.0)
                capacity = random.uniform(80.0, 120.0)
                edges.append(Edge(
                    source=current,
                    target=right,
                    base_weight=weight,
                    capacity=capacity
                ))
                # Bidirectional
                edges.append(Edge(
                    source=right,
                    target=current,
                    base_weight=weight,
                    capacity=capacity
                ))

            # Down edge
            if r < rows - 1:
                down = (r + 1) * cols + c
                weight = random.uniform(5.0, 15.0)
                capacity = random.uniform(80.0, 120.0)
                edges.append(Edge(
                    source=current,
                    target=down,
                    base_weight=weight,
                    capacity=capacity
                ))
                # Bidirectional
                edges.append(Edge(
                    source=down,
                    target=current,
                    base_weight=weight,
                    capacity=capacity
                ))

    return GraphTopology(nodes=nodes, edges=edges)

def generate_random_agents(node_count: int, agent_count: int) -> List[Agent]:
    """Generate random agents with random O-D pairs."""
    agents = []
    for i in range(agent_count):
        source = random.randint(0, node_count - 1)
        destination = random.randint(0, node_count - 1)
        while destination == source:
            destination = random.randint(0, node_count - 1)

        agents.append(Agent(
            id=i,
            source=source,
            destination=destination
        ))

    return agents


'''

## Frontend Architecture

### Project Structure
```
frontend/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── api/
│   │   └── client.ts           # API client
│   ├── components/
│   │   ├── GraphCanvas.tsx     # SVG visualization
│   │   ├── ControlPanel.tsx    # Simulation controls
│   │   ├── MetricsChart.tsx    # Time-series chart
│   │   ├── RoutePanel.tsx      # Display routes
│   │   └── Legend.tsx          # Color legend
│   ├── types/
│   │   └── models.ts           # TypeScript types
│   └── hooks/
│       └── useSimulation.ts    # Simulation state hook
├── package.json
├── tsconfig.json
└── vite.config.ts
'''
