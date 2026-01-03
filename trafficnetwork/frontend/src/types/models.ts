export interface Node {
    id: number;
    x: number;
    y: number;
    label?: string;
  }
  
  export interface Edge {
    source: number;
    target: number;
    base_weight: number;
    capacity: number;
    current_flow: number;
  }
  
  export interface Route {
    path: number[];
    total_cost: number;
  }
  
  export interface Agent {
    id: number;
    source: number;
    destination: number;
    current_route?: Route;
    current_edge_index: number;
    steps_on_current_edge: number;
  }
  
  export interface GraphTopology {
    nodes: Node[];
    edges: Edge[];
  }
  
  export interface SimulationState {
    step: number;
    topology: GraphTopology;
    agents: Agent[];
    routes: Record<number, Route>;
  }
  
  export interface SimulationMetrics {
    step: number;
    average_travel_time: number;
    total_congestion: number;
    congested_edges_count: number;
    average_route_cost: number;
    max_edge_flow: number;
  }