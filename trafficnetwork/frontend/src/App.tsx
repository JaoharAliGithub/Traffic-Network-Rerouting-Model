import React, { useState } from 'react';
import { GraphCanvas } from './components/GraphCanvas';
import { ControlPanel } from './components/ControlPanel';
import { MetricsChart } from './components/MetricsChart';
import { RoutePanel } from './components/RoutePanel';
import { EdgeDetailsPanel } from './components/EdgeDetailsPanel';
import { GraphConfigPanel } from './components/GraphConfigPanel';
import * as api from './api/client';
import type { SimulationState, SimulationMetrics, GraphTopology, Agent } from './types/models';


export default function App() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [metrics, setMetrics] = useState<SimulationMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'agents' | 'edges'>('agents');
  const [reroutingEnabled, setReroutingEnabled] = useState(false);
  const [reroutingInterval, setReroutingInterval] = useState(10);
  const [lastReroutedCount, setLastReroutedCount] = useState(0);

  
const handleToggleRerouting = async (enabled: boolean) => {
  try {
    const response = await fetch('http://localhost:8000/api/simulation/configure-rerouting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, interval: reroutingInterval })
    });
    
    if (response.ok) {
      setReroutingEnabled(enabled);
    }
  } catch (error) {
    console.error('Failed to configure rerouting:', error);
    setError('Failed to configure rerouting');
  }
};

const handleSetReroutingInterval = async (interval: number) => {
  setReroutingInterval(interval);
  
  if (reroutingEnabled) {
    try {
      await fetch('http://localhost:8000/api/simulation/configure-rerouting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true, interval })
      });
    } catch (error) {
      console.error('Failed to update rerouting interval:', error);
    }
  }
};
  
  const refreshState = async () => {
    try {
      const { state: newState } = await api.getState();
      setState(newState);
      setError(null);
    } catch (err) {
      setError('Failed to fetch state');
      console.error(err);
    }
  };
  
  const refreshMetrics = async () => {
    try {
      const { history } = await api.getMetrics(100);
      setMetrics(history);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };
  
  const loadSampleGraph = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await api.loadSampleGraph();
      await refreshState();
      await refreshMetrics();
      setSelectedAgentId(null);
    } catch (error) {
      console.error('Failed to load graph:', error);
      setError('Failed to load sample graph. Make sure backend is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadCustomGraph = async (topology: GraphTopology, agents: Agent[]) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.loadGraph(topology, agents);
      await refreshState();
      await refreshMetrics();
      setSelectedAgentId(null);
    } catch (error) {
      console.error('Failed to load custom graph:', error);
      setError('Failed to load custom graph');
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleStep = async (steps: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Store old routes before advancing
      const oldRoutes = new Map(
        state?.agents.map(a => [a.id, a.current_route?.path.join('-')]) || []
      );
      
      // Advance simulation
      const response = await api.advanceSimulation(steps);
      console.log('Step response:', response);
      
      // Refresh state
      await refreshState();
      
      // Compare routes to detect changes
      if (state) {
        const changedAgents: number[] = [];
        state.agents.forEach(agent => {
          const oldRoute = oldRoutes.get(agent.id);
          const newRoute = agent.current_route?.path.join('-');
          if (oldRoute && newRoute && oldRoute !== newRoute) {
            changedAgents.push(agent.id);
            console.log(`Agent ${agent.id} changed route: ${oldRoute} → ${newRoute}`);
          }
        });
        setLastReroutedCount(changedAgents.length);
      }
      
      await refreshMetrics();
    } catch (error) {
      console.error('Failed to advance:', error);
      setError('Failed to advance simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await api.resetGraph();
      await refreshState();
      await refreshMetrics();
      setSelectedAgentId(null);
    } catch (error) {
      console.error('Failed to reset:', error);
      setError('Failed to reset simulation');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Traffic Network Simulator
          </h1>
          <p className="text-gray-600 mt-1">
            Congestion-aware routing with dynamic agent rerouting
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-4">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}
        
        {state && (
  <div className="mb-2 flex gap-2">
    <div className="flex-1 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
      <strong>Step:</strong> {state.step} | 
      <strong> Active:</strong> {state.agents.filter(a => 
        a.current_route && a.current_edge_index < a.current_route.path.length - 1
      ).length} / {state.agents.length}
    </div>
    
    {reroutingEnabled && (
      <div className="p-2 bg-purple-50 border border-purple-200 rounded text-sm">
        <strong>Rerouting:</strong> ON (every {reroutingInterval} steps)
        {lastReroutedCount > 0 && (
          <span className="ml-2 text-purple-700">
            ⚡ {lastReroutedCount} agents rerouted
          </span>
        )}
      </div>
    )}
  </div>
)}
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Panel - Graph Visualization */}
          <div className="lg:col-span-3 space-y-4">
            {/* Graph Canvas */}
            <div className="bg-white p-4 rounded shadow-lg" style={{ height: '500px' }}>
              {state ? (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold">Network Visualization</h2>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-1 bg-green-500"></div>
                        <span>Low</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-1 bg-yellow-500"></div>
                        <span>Medium</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-1 bg-red-500"></div>
                        <span>High</span>
                      </div>
                      {selectedAgentId !== null && (
                        <div className="flex items-center gap-1 ml-2">
                          <div className="w-4 h-1 bg-purple-500"></div>
                          <span>Selected Route</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ height: 'calc(100% - 40px)' }}>
                    <GraphCanvas
                      nodes={state.topology.nodes}
                      edges={state.topology.edges}
                      agents={state.agents}
                      selectedAgentId={selectedAgentId}
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="mt-2 text-lg text-gray-600">No graph loaded</p>
                    <p className="text-sm text-gray-500">Load a sample or create a custom graph to begin</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Metrics Chart */}
            <MetricsChart metrics={metrics} />
          </div>
          
          {/* Right Panel - Controls and Details */}
          <div className="space-y-4">
            {/* Control Panel */}
            <ControlPanel
              onStep={handleStep}
              onReset={handleReset}
              onLoadSample={loadSampleGraph}
              onToggleRerouting={handleToggleRerouting}
              onSetReroutingInterval={handleSetReroutingInterval}
              isLoading={isLoading}
              currentStep={state?.step || 0}
              hasGraph={state !== null}  // Add this
              reroutingEnabled={reroutingEnabled}
              reroutingInterval={reroutingInterval}
            />
            
            {/* Graph Config Panel */}
            <GraphConfigPanel
              onLoadGraph={loadCustomGraph}
              isLoading={isLoading}
            />
            
            {/* Tabbed Panel for Agents/Edges */}
            {state && (
              <div className="bg-white border border-gray-300 rounded">
                <div className="flex border-b">
                  <button
                    onClick={() => setActiveTab('agents')}
                    className={`flex-1 px-4 py-2 font-medium ${
                      activeTab === 'agents'
                        ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Agents ({state.agents.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('edges')}
                    className={`flex-1 px-4 py-2 font-medium ${
                      activeTab === 'edges'
                        ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Edges ({state.topology.edges.length})
                  </button>
                </div>
                
                <div className="p-0">
                  {activeTab === 'agents' ? (
                    <RoutePanel
                      agents={state.agents}
                      onSelectAgent={setSelectedAgentId}
                      selectedAgentId={selectedAgentId}
                    />
                  ) : (
                    <EdgeDetailsPanel edges={state.topology.edges} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 pb-4">
          <p>Traffic Network Simulator - Built with FastAPI + React + TypeScript</p>
          <p className="mt-1">
            Backend: <span className="font-mono">http://localhost:8000</span> | 
            Frontend: <span className="font-mono">http://localhost:5173</span>
          </p>
        </div>
      </div>
    </div>
  );

 
}

