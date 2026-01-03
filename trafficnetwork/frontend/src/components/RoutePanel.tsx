import React, { useState } from 'react';
import type { Agent } from '../types/models';

interface Props {
  agents: Agent[];
  onSelectAgent: (agentId: number | null) => void;
  selectedAgentId: number | null;
}

export const RoutePanel: React.FC<Props> = ({ 
  agents, 
  onSelectAgent,
  selectedAgentId 
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'arrived'>('all');
  
  const filteredAgents = agents.filter(agent => {
    if (filter === 'all') return true;
    if (filter === 'active') return agent.current_route && 
      agent.current_edge_index < agent.current_route.path.length - 1;
    if (filter === 'arrived') return agent.current_route && 
      agent.current_edge_index >= agent.current_route.path.length - 1;
    return true;
  });
  
  const activeCount = agents.filter(a => a.current_route && 
    a.current_edge_index < a.current_route.path.length - 1).length;
  const arrivedCount = agents.filter(a => a.current_route && 
    a.current_edge_index >= a.current_route.path.length - 1).length;
  
  return (
    <div className="p-4 bg-white border border-gray-300 rounded">
      <h3 className="text-lg font-semibold mb-3">Agent Routes</h3>
      
      {/* Filter Buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-sm rounded ${
            filter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          All ({agents.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1 text-sm rounded ${
            filter === 'active' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setFilter('arrived')}
          className={`px-3 py-1 text-sm rounded ${
            filter === 'arrived' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Arrived ({arrivedCount})
        </button>
      </div>
      
      {/* Agent List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredAgents.map(agent => {
          const isSelected = agent.id === selectedAgentId;
          const isActive = agent.current_route && 
            agent.current_edge_index < agent.current_route.path.length - 1;
          
          return (
            <div
              key={agent.id}
              onClick={() => onSelectAgent(isSelected ? null : agent.id)}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                isSelected 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">Agent {agent.id}</p>
                  <p className="text-sm text-gray-600">
                    {agent.source} → {agent.destination}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {isActive ? 'Traveling' : 'Arrived'}
                </span>
              </div>
              
              {agent.current_route && (
                <div className="mt-2 text-sm">
                  <p className="text-gray-600">
                    Route: {agent.current_route.path.join(' → ')}
                  </p>
                  <p className="text-gray-600">
                    Cost: {agent.current_route.total_cost.toFixed(2)}
                  </p>
                  {isActive && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(agent.current_edge_index / (agent.current_route.path.length - 1)) * 100}%`
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Progress: {agent.current_edge_index}/{agent.current_route.path.length - 1} edges
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {filteredAgents.length === 0 && (
        <p className="text-center text-gray-500 py-4">No agents in this category</p>
      )}
    </div>
  );
};