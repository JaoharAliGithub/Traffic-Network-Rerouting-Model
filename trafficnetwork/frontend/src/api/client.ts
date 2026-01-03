import type { 
    GraphTopology, 
    Agent, 
    SimulationState, 
    SimulationMetrics 
  } from '../types/models';
  
  const API_BASE = 'http://localhost:8000/api';
  
  export async function loadGraph(topology: GraphTopology, agents: Agent[]) {
    const response = await fetch(`${API_BASE}/graph/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topology, agents })
    });
    if (!response.ok) throw new Error('Failed to load graph');
    return response.json();
  }
  
  export async function loadSampleGraph() {
    const response = await fetch(`${API_BASE}/graph/load-sample`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to load sample graph');
    return response.json();
  }
  
  export async function advanceSimulation(steps: number = 1) {
    const response = await fetch(`${API_BASE}/simulation/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps })
    });
    if (!response.ok) throw new Error('Failed to advance simulation');
    return response.json();
  }
  
  export async function getState(): Promise<{ state: SimulationState }> {
    const response = await fetch(`${API_BASE}/simulation/state`);
    if (!response.ok) throw new Error('Failed to get state');
    return response.json();
  }
  
  export async function getMetrics(limit?: number): Promise<{ history: SimulationMetrics[] }> {
    const url = limit 
      ? `${API_BASE}/simulation/metrics?limit=${limit}`
      : `${API_BASE}/simulation/metrics`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to get metrics');
    return response.json();
  }
  
  export async function resetGraph() {
    const response = await fetch(`${API_BASE}/graph/reset`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to reset');
    return response.json();
  }
 