# app/core/routing.py
"""
Routing algorithms for graph traversal.
Separated from graph.py for single responsibility principle.
"""
from typing import Dict, List, Optional, Set, Tuple
import heapq
from ..models.graph_models import Route, Edge


class Router:
    """Encapsulates routing algorithms."""
    
    @staticmethod
    def dijkstra(
        source: int,
        destination: int,
        adjacency: Dict[int, List[Tuple[int, Edge]]],
        nodes: Set[int]
    ) -> Optional[Route]:
        """
        Dijkstra's algorithm for shortest path.
        
        Args:
            source: Starting node ID
            destination: Target node ID
            adjacency: Adjacency list mapping node_id -> [(neighbor_id, edge)]
            nodes: Set of valid node IDs
            
        Returns:
            Route object or None if no path exists
        """
        if source not in nodes or destination not in nodes:
            return None
        
        # Priority queue: (cost, node, path)
        pq: List[Tuple[float, int, List[int]]] = [(0.0, source, [source])]
        visited: Set[int] = set()
        costs: Dict[int, float] = {source: 0.0}
        
        while pq:
            current_cost, current_node, path = heapq.heappop(pq)
            
            if current_node in visited:
                continue
            
            visited.add(current_node)
            
            if current_node == destination:
                return Route(path=path, total_cost=current_cost)
            
            # Explore neighbors
            for neighbor, edge in adjacency.get(current_node, []):
                if neighbor in visited:
                    continue
                
                edge_weight = edge.compute_weight()
                new_cost = current_cost + edge_weight
                
                if neighbor not in costs or new_cost < costs[neighbor]:
                    costs[neighbor] = new_cost
                    heapq.heappush(pq, (new_cost, neighbor, path + [neighbor]))
        
        return None
    
    @staticmethod
    def bellman_ford(
        source: int,
        destination: int,
        edges: List[Edge],
        nodes: Set[int]
    ) -> Optional[Route]:
        """
        Bellman-Ford algorithm (slower but handles negative weights).
        Included for completeness - not used in main simulation.
        
        Args:
            source: Starting node ID
            destination: Target node ID
            edges: List of all edges
            nodes: Set of valid node IDs
            
        Returns:
            Route object or None if no path exists
        """
        if source not in nodes or destination not in nodes:
            return None
        
        # Initialize distances
        distances: Dict[int, float] = {node: float('inf') for node in nodes}
        distances[source] = 0.0
        predecessors: Dict[int, Optional[int]] = {node: None for node in nodes}
        
        # Relax edges |V| - 1 times
        for _ in range(len(nodes) - 1):
            for edge in edges:
                if distances[edge.source] != float('inf'):
                    new_dist = distances[edge.source] + edge.compute_weight()
                    if new_dist < distances[edge.target]:
                        distances[edge.target] = new_dist
                        predecessors[edge.target] = edge.source
        
        # Check for negative cycles
        for edge in edges:
            if distances[edge.source] != float('inf'):
                if distances[edge.source] + edge.compute_weight() < distances[edge.target]:
                    raise ValueError("Graph contains negative weight cycle")
        
        # Reconstruct path
        if distances[destination] == float('inf'):
            return None
        
        path = []
        current = destination
        while current is not None:
            path.append(current)
            current = predecessors[current]
        
        path.reverse()
        
        if path[0] != source:
            return None
        
        return Route(path=path, total_cost=distances[destination])
    
    @staticmethod
    def a_star(
        source: int,
        destination: int,
        adjacency: Dict[int, List[Tuple[int, Edge]]],
        nodes: Dict[int, 'Node'],  # Need node positions for heuristic
        heuristic_weight: float = 1.0
    ) -> Optional[Route]:
        """
        A* algorithm with Euclidean distance heuristic.
        
        Args:
            source: Starting node ID
            destination: Target node ID
            adjacency: Adjacency list
            nodes: Dictionary of node objects (need x, y coordinates)
            heuristic_weight: Weight for heuristic (1.0 = consistent, >1 = faster but suboptimal)
            
        Returns:
            Route object or None if no path exists
        """
        if source not in nodes or destination not in nodes:
            return None
        
        dest_node = nodes[destination]
        
        def heuristic(node_id: int) -> float:
            """Euclidean distance heuristic."""
            node = nodes[node_id]
            dx = node.x - dest_node.x
            dy = node.y - dest_node.y
            return heuristic_weight * (dx * dx + dy * dy) ** 0.5
        
        # Priority queue: (f_score, g_score, node, path)
        pq: List[Tuple[float, float, int, List[int]]] = [
            (heuristic(source), 0.0, source, [source])
        ]
        visited: Set[int] = set()
        g_scores: Dict[int, float] = {source: 0.0}
        
        while pq:
            f_score, g_score, current_node, path = heapq.heappop(pq)
            
            if current_node in visited:
                continue
            
            visited.add(current_node)
            
            if current_node == destination:
                return Route(path=path, total_cost=g_score)
            
            for neighbor, edge in adjacency.get(current_node, []):
                if neighbor in visited:
                    continue
                
                tentative_g = g_score + edge.compute_weight()
                
                if neighbor not in g_scores or tentative_g < g_scores[neighbor]:
                    g_scores[neighbor] = tentative_g
                    f = tentative_g + heuristic(neighbor)
                    heapq.heappush(pq, (f, tentative_g, neighbor, path + [neighbor]))
        
        return None


class RoutingStrategy:
    """Interface for different routing strategies (Strategy pattern)."""
    
    def __init__(self, algorithm: str = "dijkstra"):
        """
        Initialize routing strategy.
        
        Args:
            algorithm: One of "dijkstra", "bellman_ford", "a_star"
        """
        self.algorithm = algorithm
    
    def compute_route(
        self,
        source: int,
        destination: int,
        adjacency: Dict[int, List[Tuple[int, Edge]]],
        nodes: Dict[int, 'Node'],
        edges: List[Edge]
    ) -> Optional[Route]:
        """Compute route using selected algorithm."""
        if self.algorithm == "dijkstra":
            return Router.dijkstra(source, destination, adjacency, set(nodes.keys()))
        elif self.algorithm == "bellman_ford":
            return Router.bellman_ford(source, destination, edges, set(nodes.keys()))
        elif self.algorithm == "a_star":
            return Router.a_star(source, destination, adjacency, nodes)
        else:
            raise ValueError(f"Unknown algorithm: {self.algorithm}")