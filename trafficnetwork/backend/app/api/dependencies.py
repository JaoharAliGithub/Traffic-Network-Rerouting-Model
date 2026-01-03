# app/api/dependencies.py
from typing import Optional
from ..core.simulation import Simulator

# Global state (acceptable for this scope; consider Redis for production)
_simulator: Optional[Simulator] = None

def get_simulator() -> Optional[Simulator]:
    """Dependency to retrieve simulator instance."""
    return _simulator

def set_simulator(simulator: Simulator):
    """Set the global simulator instance."""
    global _simulator
    _simulator = simulator
