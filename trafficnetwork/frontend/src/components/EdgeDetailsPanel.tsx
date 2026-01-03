import React, { useState } from 'react';
import type { Edge } from '../types/models';

interface Props {
  edges: Edge[];
}

export const EdgeDetailsPanel: React.FC<Props> = ({ edges }) => {
  const [sortBy, setSortBy] = useState<'congestion' | 'flow' | 'id'>('congestion');
  
  // Calculate derived metrics
  const edgesWithMetrics = edges.map(edge => {
    const congestionRatio = edge.current_flow / edge.capacity;
    const baseTime = edge.base_weight;
    
    // BPR function to compute actual time
    const alpha = 0.15;
    const beta = 4.0;
    const actualTime = baseTime * (1 + alpha * Math.pow(congestionRatio, beta));
    const delay = actualTime - baseTime;
    
    return {
      ...edge,
      congestionRatio,
      actualTime,
      delay,
      delayPercent: baseTime > 0 ? (delay / baseTime) * 100 : 0
    };
  });
  
  // Sort edges
  const sortedEdges = [...edgesWithMetrics].sort((a, b) => {
    if (sortBy === 'congestion') return b.congestionRatio - a.congestionRatio;
    if (sortBy === 'flow') return b.current_flow - a.current_flow;
    return a.source - b.source || a.target - b.target;
  });
  
  // Statistics
  const totalEdges = edges.length;
  const congested = edges.filter(e => (e.current_flow / e.capacity) > 0.7).length;
  const avgCongestion = edges.reduce((sum, e) => sum + (e.current_flow / e.capacity), 0) / totalEdges;
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-3">Edge Details</h3>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{totalEdges}</p>
          <p className="text-xs text-gray-600">Total Edges</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{congested}</p>
          <p className="text-xs text-gray-600">Congested (&gt;70%)</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{(avgCongestion * 100).toFixed(0)}%</p>
          <p className="text-xs text-gray-600">Avg Congestion</p>
        </div>
      </div>
      
      {/* Sort Controls */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setSortBy('congestion')}
          className={`px-3 py-1 text-sm rounded ${
            sortBy === 'congestion' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          By Congestion
        </button>
        <button
          onClick={() => setSortBy('flow')}
          className={`px-3 py-1 text-sm rounded ${
            sortBy === 'flow' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          By Flow
        </button>
        <button
          onClick={() => setSortBy('id')}
          className={`px-3 py-1 text-sm rounded ${
            sortBy === 'id' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          By ID
        </button>
      </div>
      
      {/* Edge List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {sortedEdges.slice(0, 20).map((edge) => {
          const congestionColor = 
            edge.congestionRatio > 0.7 ? 'bg-red-100 border-red-300' :
            edge.congestionRatio > 0.4 ? 'bg-yellow-100 border-yellow-300' :
            'bg-green-100 border-green-300';
          
          return (
            <div
              key={`${edge.source}-${edge.target}`}
              className={`p-2 border rounded ${congestionColor}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">
                    Edge {edge.source} → {edge.target}
                  </p>
                  <p className="text-xs text-gray-600">
                    Flow: {edge.current_flow.toFixed(1)} / {edge.capacity.toFixed(0)}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-bold rounded bg-white">
                  {(edge.congestionRatio * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      edge.congestionRatio > 0.7 ? 'bg-red-500' :
                      edge.congestionRatio > 0.4 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(edge.congestionRatio * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="mt-1 text-xs text-gray-700 grid grid-cols-2 gap-1">
                <span>Base: {edge.base_weight.toFixed(1)}s</span>
                <span>Actual: {edge.actualTime.toFixed(1)}s</span>
                <span className="col-span-2 text-red-600">
                  Delay: +{edge.delay.toFixed(1)}s ({edge.delayPercent.toFixed(0)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {sortedEdges.length > 20 && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Showing top 20 of {sortedEdges.length} edges
        </p>
      )}
    </div>
  );
};