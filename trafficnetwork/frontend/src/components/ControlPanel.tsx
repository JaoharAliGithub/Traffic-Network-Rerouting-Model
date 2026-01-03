import React, { useState } from 'react';

interface Props {
  onStep: (steps: number) => void;
  onReset: () => void;
  onLoadSample: () => void;
  onToggleRerouting?: (enabled: boolean) => void;
  onSetReroutingInterval?: (interval: number) => void;
  isLoading: boolean;
  currentStep: number;
  hasGraph?: boolean; 
  reroutingEnabled?: boolean;
  reroutingInterval?: number;
}

export const ControlPanel: React.FC<Props> = ({
  onStep,
  onReset,
  onLoadSample,
  onToggleRerouting,
  onSetReroutingInterval,
  isLoading,
  currentStep,
  hasGraph = false, 
  reroutingEnabled = false,
  reroutingInterval = 10
}) => {
  const [stepCount, setStepCount] = useState(1);
  
  return (
    <div className="p-4 bg-gray-50 border border-gray-300 rounded">
      <h2 className="text-lg font-semibold mb-3">Controls</h2>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Steps to advance:
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={stepCount}
            onChange={(e) => setStepCount(parseInt(e.target.value) || 1)}
            className="w-full px-2 py-1 border rounded"
          />
        </div>
        
        <button
          onClick={() => onStep(stepCount)}
          disabled={isLoading}  // Use hasGraph
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : `Advance ${stepCount} Step(s)`}
        </button>

        <button
          onClick={onReset}
          disabled={isLoading}  // Use hasGraph
          className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Reset Simulation
        </button>
        
        <button
          onClick={onLoadSample}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Load Sample Graph
        </button>
        
        {/* Rerouting Configuration */}
        {onToggleRerouting && (
          <div className="pt-3 border-t space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reroutingEnabled}
                onChange={(e) => onToggleRerouting(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm font-medium">Dynamic Rerouting</span>
            </label>
            
            {reroutingEnabled && onSetReroutingInterval && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Reroute every {reroutingInterval} steps
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={reroutingInterval}
                  onChange={(e) => onSetReroutingInterval(parseInt(e.target.value))}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
            )}
            
            {reroutingEnabled && (
              <p className="text-xs text-gray-500">
                Agents will recalculate routes based on current congestion
              </p>
            )}
          </div>
        )}
        
        <div className="pt-2 border-t">
          <p className="text-sm">Current Step: <strong>{currentStep}</strong></p>
        </div>
      </div>
    </div>
  );
};