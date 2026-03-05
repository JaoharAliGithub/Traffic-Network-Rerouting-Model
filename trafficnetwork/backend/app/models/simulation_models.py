# app/models/simulation_models.py
from pydantic import BaseModel, Field
from typing import Dict, List
from models.graph_models import Node, Edge, Agent, Route

class GraphTopology(BaseModel):
    """Complete graph definition."""
    nodes: List[Node]
    edges: List[Edge]

class SimulationState(BaseModel):
    """Current state of the simulation."""
    step: int = Field(default=0, ge=0)
    topology: GraphTopology
    agents: List[Agent]
    routes: Dict[int, Route] = Field(default_factory=dict)  # agent_id -> route

class SimulationMetrics(BaseModel):
    """Metrics collected during simulation."""
    step: int
    average_travel_time: float
    total_congestion: float  # Sum of (flow/capacity) ratios
    congested_edges_count: int  # Edges with flow > 0.8 * capacity
    average_route_cost: float
    max_edge_flow: float
