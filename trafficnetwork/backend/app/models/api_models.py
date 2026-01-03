# app/models/api_models.py
from pydantic import BaseModel, Field
from typing import List, Optional
from .graph_models import Node, Edge, Agent, Route
from .simulation_models import SimulationState, SimulationMetrics, GraphTopology

class LoadGraphRequest(BaseModel):
    """Request to load a new graph."""
    topology: GraphTopology
    agents: List[Agent]

class LoadGraphResponse(BaseModel):
    """Response after loading graph."""
    success: bool
    message: str
    node_count: int
    edge_count: int
    agent_count: int

class StepRequest(BaseModel):
    """Request to advance simulation."""
    steps: int = Field(default=1, ge=1, le=100)

class StepResponse(BaseModel):
    """Response after simulation step."""
    current_step: int
    metrics: SimulationMetrics
    rerouted_agents: List[int]  # IDs of agents that got new routes

class StateResponse(BaseModel):
    """Full simulation state."""
    state: SimulationState

class MetricsHistoryResponse(BaseModel):
    """Time-series metrics."""
    history: List[SimulationMetrics]

class RouteQueryRequest(BaseModel):
    """Query for a specific route."""
    source: int
    destination: int

class RouteQueryResponse(BaseModel):
    """Route query result."""
    route: Optional[Route]
    success: bool
