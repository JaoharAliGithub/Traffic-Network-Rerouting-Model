# app/core/graph.py (updated)
from typing import Dict, List, Optional, Set, Tuple
from collections import defaultdict
from ..models.graph_models import Node, Edge, EdgeId, Route
from .congestion import CongestionModel, BPRCongestionModel
from .routing import Router

class Graph:
    """Efficient graph representation with adjacency list."""
    
    def __init__(
        self,
        nodes: List[Node],
        edges: List[Edge],
        congestion_model: Optional[CongestionModel] = None
    ):
        self.nodes: Dict[int, Node] = {n.id: n for n in nodes}
        self.edges: Dict[EdgeId, Edge] = {e.edge_id: e for e in edges}
        self.congestion_model = congestion_model or BPRCongestionModel()
        
        # Adjacency list: node_id -> list of (neighbor_id, edge)
        self.adj: Dict[int, List[Tuple[int, Edge]]] = defaultdict(list)
        for edge in edges:
            self.adj[edge.source].append((edge.target, edge))
    
    def get_edge(self, source: int, target: int) -> Optional[Edge]:
        """Retrieve edge by endpoints."""
        edge_id = EdgeId(source=source, target=target)
        return self.edges.get(edge_id)
    
    def get_neighbors(self, node_id: int) -> List[Tuple[int, Edge]]:
        """Get all outgoing edges from a node."""
        return self.adj.get(node_id, [])
    
    def update_edge_flow(self, source: int, target: int, delta_flow: float):
        """Update flow on an edge."""
        edge = self.get_edge(source, target)
        if edge:
            edge.current_flow = max(0.0, edge.current_flow + delta_flow)
    
    def reset_flows(self):
        """Reset all edge flows to zero."""
        for edge in self.edges.values():
            edge.current_flow = 0.0
    
    def compute_shortest_path(self, source: int, destination: int) -> Optional[Route]:
        """Dijkstra's algorithm with current edge weights."""
        return Router.dijkstra(source, destination, self.adj, set(self.nodes.keys()))
    
    def get_congestion_ratio(self, source: int, target: int) -> float:
        """Get congestion ratio for visualization."""
        edge = self.get_edge(source, target)
        if edge and edge.capacity > 0:
            return min(1.0, edge.current_flow / edge.capacity)
        return 0.0