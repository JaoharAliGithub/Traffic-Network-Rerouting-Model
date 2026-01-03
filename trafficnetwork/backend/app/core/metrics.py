# app/core/metrics.py
"""
Metrics collection and analysis for simulation.
"""
from typing import List, Dict, Optional
from dataclasses import dataclass
from ..models.graph_models import Edge, Agent, Route
from ..models.simulation_models import SimulationMetrics


@dataclass
class EdgeMetrics:
    """Metrics for a single edge."""
    edge_id: str
    flow: float
    capacity: float
    congestion_ratio: float
    travel_time: float
    base_travel_time: float
    delay: float  # travel_time - base_travel_time


@dataclass
class SystemMetrics:
    """Aggregate system-level metrics."""
    total_system_travel_time: float  # Sum of all agent travel times
    average_travel_time: float
    total_delay: float
    average_delay: float
    total_vehicle_hours: float
    congestion_index: float  # Weighted average of congestion ratios
    price_of_anarchy: Optional[float] = None  # Ratio of user equilibrium to system optimal


class MetricsCollector:
    """Collects and computes various simulation metrics."""
    
    def __init__(self):
        self.history: List[SimulationMetrics] = []
    
    def collect(
        self,
        step: int,
        edges: List[Edge],
        agents: List[Agent]
    ) -> SimulationMetrics:
        """
        Collect metrics for current simulation state.
        
        Args:
            step: Current simulation step
            edges: List of all edges
            agents: List of all agents
            
        Returns:
            SimulationMetrics object
        """
        # Agent-based metrics
        total_cost = 0.0
        agent_count = 0
        
        for agent in agents:
            if agent.current_route:
                total_cost += agent.current_route.total_cost
                agent_count += 1
        
        avg_cost = total_cost / agent_count if agent_count > 0 else 0.0
        
        # Edge-based metrics
        total_congestion = 0.0
        congested_count = 0
        max_flow = 0.0
        total_delay = 0.0
        
        for edge in edges:
            ratio = edge.current_flow / edge.capacity if edge.capacity > 0 else 0.0
            total_congestion += ratio
            
            if ratio > 0.8:
                congested_count += 1
            
            max_flow = max(max_flow, edge.current_flow)
            
            # Delay = actual time - free flow time
            if edge.current_flow > 0:
                delay = edge.compute_weight() - edge.base_weight
                total_delay += delay * edge.current_flow
        
        metrics = SimulationMetrics(
            step=step,
            average_travel_time=avg_cost,
            total_congestion=total_congestion,
            congested_edges_count=congested_count,
            average_route_cost=avg_cost,
            max_edge_flow=max_flow
        )
        
        self.history.append(metrics)
        return metrics
    
    def get_edge_metrics(self, edges: List[Edge]) -> List[EdgeMetrics]:
        """Get detailed metrics for each edge."""
        edge_metrics = []
        
        for edge in edges:
            congestion_ratio = edge.current_flow / edge.capacity if edge.capacity > 0 else 0.0
            travel_time = edge.compute_weight()
            delay = travel_time - edge.base_weight
            
            edge_metrics.append(EdgeMetrics(
                edge_id=f"{edge.source}-{edge.target}",
                flow=edge.current_flow,
                capacity=edge.capacity,
                congestion_ratio=congestion_ratio,
                travel_time=travel_time,
                base_travel_time=edge.base_weight,
                delay=delay
            ))
        
        return edge_metrics
    
    def compute_system_metrics(
        self,
        edges: List[Edge],
        agents: List[Agent]
    ) -> SystemMetrics:
        """Compute comprehensive system-level metrics."""
        total_travel_time = 0.0
        agent_count = 0
        total_delay = 0.0
        weighted_congestion = 0.0
        total_capacity = 0.0
        
        # Aggregate from agents
        for agent in agents:
            if agent.current_route:
                total_travel_time += agent.current_route.total_cost
                agent_count += 1
        
        # Aggregate from edges
        for edge in edges:
            if edge.current_flow > 0:
                travel_time = edge.compute_weight()
                delay = (travel_time - edge.base_weight) * edge.current_flow
                total_delay += delay
                
                congestion_ratio = edge.current_flow / edge.capacity
                weighted_congestion += congestion_ratio * edge.capacity
            
            total_capacity += edge.capacity
        
        avg_travel_time = total_travel_time / agent_count if agent_count > 0 else 0.0
        avg_delay = total_delay / agent_count if agent_count > 0 else 0.0
        congestion_index = weighted_congestion / total_capacity if total_capacity > 0 else 0.0
        
        return SystemMetrics(
            total_system_travel_time=total_travel_time,
            average_travel_time=avg_travel_time,
            total_delay=total_delay,
            average_delay=avg_delay,
            total_vehicle_hours=total_travel_time,
            congestion_index=congestion_index
        )
    
    def get_history(self, limit: Optional[int] = None) -> List[SimulationMetrics]:
        """Get metrics history."""
        if limit:
            return self.history[-limit:]
        return self.history
    
    def clear_history(self):
        """Clear metrics history."""
        self.history.clear()