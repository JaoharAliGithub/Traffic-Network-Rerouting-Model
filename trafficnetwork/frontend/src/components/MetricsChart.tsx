import React from 'react';
import type { SimulationMetrics } from '../types/models';

interface Props {
  metrics: SimulationMetrics[];
}

export const MetricsChart: React.FC<Props> = ({ metrics }) => {
  if (metrics.length === 0) {
    return <div className="p-4 text-gray-500">No metrics available</div>;
  }
  
  const maxCongestion = Math.max(...metrics.map(m => m.total_congestion), 1);
  const maxTime = Math.max(...metrics.map(m => m.average_travel_time), 1);
  
  const chartHeight = 200;
  const chartWidth = 600;
  const points = metrics.length;
  const stepWidth = chartWidth / Math.max(points - 1, 1);
  
  const congestionPath = metrics
    .map((m, i) => {
      const x = i * stepWidth;
      const y = chartHeight - (m.total_congestion / maxCongestion) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');
  
  const travelTimePath = metrics
    .map((m, i) => {
      const x = i * stepWidth;
      const y = chartHeight - (m.average_travel_time / maxTime) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');
  
  return (
    <div className="p-4 border border-gray-300 rounded bg-white">
      <h3 className="text-md font-semibold mb-2">Metrics Over Time</h3>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
          <line
            key={ratio}
            x1={0}
            y1={chartHeight * (1 - ratio)}
            x2={chartWidth}
            y2={chartHeight * (1 - ratio)}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        ))}
        
        {/* Congestion line */}
        <polyline
          points={congestionPath}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2}
        />
        
        {/* Travel time line */}
        <polyline
          points={travelTimePath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
        />
      </svg>
      
      <div className="flex gap-4 mt-2 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-4 h-0.5 bg-red-500"></div>
          <span>Total Congestion</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-0.5 bg-blue-500"></div>
          <span>Avg Travel Time</span>
        </div>
      </div>
      
      {metrics.length > 0 && (
        <div className="mt-3 text-sm space-y-1">
          <p>Congested Edges: {metrics[metrics.length - 1].congested_edges_count}</p>
          <p>Max Flow: {metrics[metrics.length - 1].max_edge_flow.toFixed(1)}</p>
        </div>
      )}
    </div>
  );
};