# app/models/graph_models.py
from pydantic import BaseModel, Field, field_validator
from typing import Dict, List, Optional, Tuple
from enum import Enum

class EdgeId(BaseModel):
    """Uniquely identifies a directed edge."""
    source: int
    target: int

    def __hash__(self):
        return hash((self.source, self.target))

    def __eq__(self, other):
        return self.source == other.source and self.target == other.target

class Edge(BaseModel):
    """Directed edge with congestion-aware weight."""
    source: int = Field(..., ge=0)
    target: int = Field(..., ge=0)
    base_weight: float = Field(..., gt=0, description="Base travel time")
    capacity: float = Field(default=100.0, gt=0, description="Max flow before severe congestion")
    current_flow: float = Field(default=0.0, ge=0)

    @property
    def edge_id(self) -> EdgeId:
        return EdgeId(source=self.source, target=self.target)

    def compute_weight(self) -> float:
        """BPR (Bureau of Public Roads) function: t = t0 * (1 + α(flow/capacity)^β)"""
        if self.current_flow <= 0:
            return self.base_weight

        congestion_ratio = self.current_flow / self.capacity
        alpha = 0.15  # Congestion sensitivity
        beta = 4.0    # Nonlinearity (standard BPR)

        return self.base_weight * (1.0 + alpha * (congestion_ratio ** beta))

class Node(BaseModel):
    """Graph node representing intersection or location."""
    id: int = Field(..., ge=0)
    x: float = Field(default=0.0, description="X coordinate for visualization")
    y: float = Field(default=0.0, description="Y coordinate for visualization")
    label: Optional[str] = None

class Route(BaseModel):
    """A path from source to destination."""
    path: List[int] = Field(..., min_length=2)
    total_cost: float = Field(..., ge=0)

    @field_validator('path')
    @classmethod
    def validate_path(cls, v):
        if len(v) < 2:
            raise ValueError("Path must have at least source and destination")
        return v

class Agent(BaseModel):
    """A user/vehicle traversing the network."""
    id: int
    source: int
    destination: int
    current_route: Optional[Route] = None
    steps_on_current_edge: int = 0
    current_edge_index: int = 0  # Which edge in the route
