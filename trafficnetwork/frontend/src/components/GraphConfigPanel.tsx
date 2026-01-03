import React, { useState } from 'react';
import type { Node, Edge, Agent, GraphTopology } from '../types/models';

interface Props {
  onLoadGraph: (topology: GraphTopology, agents: Agent[]) => void;
  isLoading: boolean;
}

export const GraphConfigPanel: React.FC<Props> = ({ onLoadGraph, isLoading }) => {
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(5);
  const [agentCount, setAgentCount] = useState(50);
  const [graphType, setGraphType] = useState<'grid' | 'random'>('grid');
  
  const generateGridGraph = (): GraphTopology => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Create nodes
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nodeId = r * cols + c;
        nodes.push({
          id: nodeId,
          x: c * 100,
          y: r * 100,
          label: `${nodeId}`
        });
      }
    }
    
    // Create edges (bidirectional grid)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const current = r * cols + c;
        
        // Right edge
        if (c < cols - 1) {
          const right = r * cols + (c + 1);
          const weight = 5 + Math.random() * 10;
          const capacity = 80 + Math.random() * 40;
          
          edges.push({
            source: current,
            target: right,
            base_weight: weight,
            capacity,
            current_flow: 0
          });
          edges.push({
            source: right,
            target: current,
            base_weight: weight,
            capacity,
            current_flow: 0
          });
        }
        
        // Down edge
        if (r < rows - 1) {
          const down = (r + 1) * cols + c;
          const weight = 5 + Math.random() * 10;
          const capacity = 80 + Math.random() * 40;
          
          edges.push({
            source: current,
            target: down,
            base_weight: weight,
            capacity,
            current_flow: 0
          });
          edges.push({
            source: down,
            target: current,
            base_weight: weight,
            capacity,
            current_flow: 0
          });
        }
      }
    }
    
    return { nodes, edges };
  };
  
  const generateRandomGraph = (): GraphTopology => {
    const nodeCount = rows * cols;
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Create nodes in random positions
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: i,
        x: Math.random() * (cols * 100),
        y: Math.random() * (rows * 100),
        label: `${i}`
      });
    }
    
    // Create random edges (ensure connectivity)
    const connected = new Set([0]);
    const unconnected = new Set(nodes.slice(1).map(n => n.id));
    
    // Connect all nodes (minimum spanning tree approach)
    while (unconnected.size > 0) {
      const connectedNode = Array.from(connected)[
        Math.floor(Math.random() * connected.size)
      ];
      const unconnectedNode = Array.from(unconnected)[
        Math.floor(Math.random() * unconnected.size)
      ];
      
      const weight = 5 + Math.random() * 15;
      const capacity = 70 + Math.random() * 50;
      
      edges.push({
        source: connectedNode,
        target: unconnectedNode,
        base_weight: weight,
        capacity,
        current_flow: 0
      });
      edges.push({
        source: unconnectedNode,
        target: connectedNode,
        base_weight: weight,
        capacity,
        current_flow: 0
      });
      
      connected.add(unconnectedNode);
      unconnected.delete(unconnectedNode);
    }
    
    // Add extra random edges for more paths
    const extraEdges = Math.floor(nodeCount * 0.5);
    for (let i = 0; i < extraEdges; i++) {
      const source = Math.floor(Math.random() * nodeCount);
      const target = Math.floor(Math.random() * nodeCount);
      
      if (source !== target) {
        const weight = 5 + Math.random() * 15;
        const capacity = 70 + Math.random() * 50;
        
        edges.push({
          source,
          target,
          base_weight: weight,
          capacity,
          current_flow: 0
        });
      }
    }
    
    return { nodes, edges };
  };
  
  const generateAgents = (nodeCount: number): Agent[] => {
    const agents: Agent[] = [];
    
    for (let i = 0; i < agentCount; i++) {
      const source = Math.floor(Math.random() * nodeCount);
      let destination = Math.floor(Math.random() * nodeCount);
      
      while (destination === source) {
        destination = Math.floor(Math.random() * nodeCount);
      }
      
      agents.push({
        id: i,
        source,
        destination,
        current_edge_index: 0,
        steps_on_current_edge: 0
      });
    }
    
    return agents;
  };
  
  const handleGenerate = () => {
    const topology = graphType === 'grid' 
      ? generateGridGraph() 
      : generateRandomGraph();
    
    const agents = generateAgents(topology.nodes.length);
    
    onLoadGraph(topology, agents);
  };
  
  return (
    <div className="p-4 bg-white border border-gray-300 rounded">
      <h3 className="text-lg font-semibold mb-3">Custom Graph Generator</h3>
      
      <div className="space-y-3">
        {/* Graph Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Graph Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setGraphType('grid')}
              className={`flex-1 px-3 py-2 text-sm rounded ${
                graphType === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setGraphType('random')}
              className={`flex-1 px-3 py-2 text-sm rounded ${
                graphType === 'random'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Random
            </button>
          </div>
        </div>
        
        {/* Dimensions */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Grid Size: {rows} × {cols} = {rows * cols} nodes
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600">Rows</label>
              <input
                type="range"
                min="3"
                max="10"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Columns</label>
              <input
                type="range"
                min="3"
                max="10"
                value={cols}
                onChange={(e) => setCols(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Agent Count */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Agents: {agentCount}
          </label>
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={agentCount}
            onChange={(e) => setAgentCount(parseInt(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Agents per node: {(agentCount / (rows * cols)).toFixed(1)}
          </p>
        </div>
        
        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Generating...' : 'Generate Custom Graph'}
        </button>
        
        <p className="text-xs text-gray-500">
          {graphType === 'grid' 
            ? 'Creates a regular grid with bidirectional edges' 
            : 'Creates random connected graph with varied edge counts'}
        </p>
      </div>
    </div>
  );
};