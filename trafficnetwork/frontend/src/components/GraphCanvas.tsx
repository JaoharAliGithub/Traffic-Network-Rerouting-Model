import React from 'react';
import type { Node, Edge, Agent } from '../types/models';

interface Props {
  nodes: Node[];
  edges: Edge[];
  agents: Agent[];
  selectedAgentId?: number | null;
}

export const GraphCanvas: React.FC<Props> = ({ 
  nodes, 
  edges, 
  agents, 
  selectedAgentId 
}) => {
  if (nodes.length === 0) {
    return <div className="flex items-center justify-center h-96 text-gray-500">No graph loaded</div>;
  }

  const padding = 50;
  const minX = Math.min(...nodes.map(n => n.x)) - padding;
  const maxX = Math.max(...nodes.map(n => n.x)) + padding;
  const minY = Math.min(...nodes.map(n => n.y)) - padding;
  const maxY = Math.max(...nodes.map(n => n.y)) + padding;
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  const computeEdgeWeight = (edge: Edge): number => {
    if (edge.current_flow <= 0) {
      return edge.base_weight;
    }
    
    const congestionRatio = edge.current_flow / edge.capacity;
    const alpha = 0.15;
    const beta = 4.0;
    
    return edge.base_weight * (1.0 + alpha * Math.pow(congestionRatio, beta));
  };
  
  const getEdgeColor = (edge: Edge): string => {
    const ratio = edge.current_flow / edge.capacity;
    if (ratio < 0.3) return '#4ade80';
    if (ratio < 0.7) return '#fbbf24';
    return '#ef4444';
  };
  
  const getEdgeWidth = (edge: Edge): number => {
    const ratio = edge.current_flow / edge.capacity;
    return 1 + ratio * 4;
  };
  
  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const highlightedPath = selectedAgent?.current_route?.path || [];
  
  // Calculate agent positions on their current edge
  const getAgentPosition = (agent: Agent): { x: number, y: number } | null => {
    if (!agent.current_route || agent.current_route.path.length < 2) {
      return null;
    }
    
    const path = agent.current_route.path;
    const edgeIndex = agent.current_edge_index;
    
    // If agent reached destination
    if (edgeIndex >= path.length - 1) {
      const destNode = nodeMap.get(path[path.length - 1]);
      return destNode ? { x: destNode.x, y: destNode.y } : null;
    }
    
    const sourceNode = nodeMap.get(path[edgeIndex]);
    const targetNode = nodeMap.get(path[edgeIndex + 1]);
    
    if (!sourceNode || !targetNode) return null;
    
    // Get the edge to calculate progress
    const edge = edges.find(e => e.source === path[edgeIndex] && e.target === path[edgeIndex + 1]);
    if (!edge) return null;
    
    // Calculate progress along edge (0 to 1)
    const requiredSteps = Math.max(1, Math.floor(computeEdgeWeight(edge)));
    const progress = Math.min(1, agent.steps_on_current_edge / requiredSteps);
    
    // Interpolate position
    return {
      x: sourceNode.x + (targetNode.x - sourceNode.x) * progress,
      y: sourceNode.y + (targetNode.y - sourceNode.y) * progress
    };
  };
  
  return (
    <svg 
      viewBox={`${minX} ${minY} ${width} ${height}`}
      className="w-full h-full border border-gray-300 bg-white"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#666" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map((edge, i) => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (!source || !target) return null;
        
        const isHighlighted = highlightedPath.length > 0 &&
          highlightedPath.some((nodeId, idx) => 
            idx < highlightedPath.length - 1 &&
            highlightedPath[idx] === edge.source &&
            highlightedPath[idx + 1] === edge.target
          );
        
        return (
          <line
            key={`edge-${i}`}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
            stroke={isHighlighted ? '#8b5cf6' : getEdgeColor(edge)}
            strokeWidth={isHighlighted ? 6 : getEdgeWidth(edge)}
            opacity={isHighlighted ? 1.0 : 0.6}
            markerEnd="url(#arrowhead)"
          />
        );
      })}
      
      {/* Nodes */}
      {nodes.map(node => {
        // Check if this node is a source or destination for any agent
        const isSource = agents.some(a => a.source === node.id);
        const isDestination = agents.some(a => a.destination === node.id);
        
        let nodeColor = '#3b82f6'; // Default blue
        let nodeStroke = '#1e40af';
        
        if (isSource && isDestination) {
          nodeColor = '#a855f7'; // Purple for both
          nodeStroke = '#7e22ce';
        } else if (isSource) {
          nodeColor = '#22c55e'; // Green for source
          nodeStroke = '#16a34a';
        } else if (isDestination) {
          nodeColor = '#ef4444'; // Red for destination
          nodeStroke = '#dc2626';
        }
        
        return (
          <circle
            key={`node-${node.id}`}
            cx={node.x}
            cy={node.y}
            r={8}
            fill={nodeColor}
            stroke={nodeStroke}
            strokeWidth={2}
          />
        );
      })}
      
      {/* Node labels */}
      {nodes.map(node => (
        <text
          key={`label-${node.id}`}
          x={node.x}
          y={node.y - 12}
          textAnchor="middle"
          fontSize={10}
          fill="#374151"
          fontWeight="bold"
        >
          {node.label || node.id}
        </text>
      ))}
      
      {/* Agents as moving dots */}
      {agents.map(agent => {
        const position = getAgentPosition(agent);
        if (!position) return null;
        
        const isSelected = agent.id === selectedAgentId;
        const isAtDestination = agent.current_route && 
          agent.current_edge_index >= agent.current_route.path.length - 1;
        
        return (
          <g key={`agent-${agent.id}`}>
            {/* Agent dot */}
            <circle
              cx={position.x}
              cy={position.y}
              r={isSelected ? 5 : 3}
              fill={isSelected ? '#8b5cf6' : isAtDestination ? '#10b981' : '#f59e0b'}
              stroke={isSelected ? '#6d28d9' : '#fff'}
              strokeWidth={isSelected ? 2 : 1}
              opacity={0.9}
            />
            
            {/* Agent label (only for selected) */}
            {isSelected && (
              <text
                x={position.x}
                y={position.y - 8}
                textAnchor="middle"
                fontSize={8}
                fill="#8b5cf6"
                fontWeight="bold"
              >
                A{agent.id}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};