# app/api/routes.py
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from ..models.api_models import (
    LoadGraphRequest, LoadGraphResponse,
    StepRequest, StepResponse,
    StateResponse, MetricsHistoryResponse,
    RouteQueryRequest, RouteQueryResponse
)
from ..core.simulation import Simulator
from .dependencies import get_simulator, set_simulator

from pydantic import BaseModel



router = APIRouter()
@router.post("/graph/load-sample")
def load_sample_graph(rows: int = 5, cols: int = 5, agents: int = 50):
    """Load a sample grid graph for testing."""
    from ..utils.graph_generator import generate_grid_graph, generate_random_agents

    topology = generate_grid_graph(rows, cols)
    agent_list = generate_random_agents(len(topology.nodes), agents)

    simulator = Simulator(topology, agent_list)
    set_simulator(simulator)

    return LoadGraphResponse(
        success=True,
        message=f"Sample {rows}x{cols} grid loaded with {agents} agents",
        node_count=len(topology.nodes),
        edge_count=len(topology.edges),
        agent_count=len(agent_list)
    )
class ReroutingConfigRequest(BaseModel):
    enabled: bool
    interval: int = 10

@router.post("/simulation/configure-rerouting")
def configure_rerouting(request: ReroutingConfigRequest):
    """Enable/disable dynamic rerouting."""
    simulator = get_simulator()
    if not simulator:
        raise HTTPException(status_code=400, detail="No graph loaded")

    simulator.set_rerouting_config(request.enabled, request.interval)

    return {
        "success": True,
        "rerouting_enabled": request.enabled,
        "rerouting_interval": request.interval
    }


@router.post("/graph/load", response_model=LoadGraphResponse)
def load_graph(request: LoadGraphRequest):
    """Load a new graph and initialize simulation."""
    try:
        simulator = Simulator(request.topology, request.agents)
        set_simulator(simulator)

        return LoadGraphResponse(
            success=True,
            message="Graph loaded successfully",
            node_count=len(request.topology.nodes),
            edge_count=len(request.topology.edges),
            agent_count=len(request.agents)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/graph/reset")
def reset_graph():
    """Reset simulation to initial state."""
    simulator = get_simulator()
    if not simulator:
        raise HTTPException(status_code=400, detail="No graph loaded")

    # Reinitialize with same topology
    state = simulator.get_state()
    new_simulator = Simulator(state.topology, state.agents)
    set_simulator(new_simulator)

    return {"success": True, "message": "Simulation reset"}

@router.post("/simulation/step", response_model=StepResponse)
def advance_simulation(request: StepRequest):
    """Advance simulation by N steps."""
    simulator = get_simulator()
    if not simulator:
        raise HTTPException(status_code=400, detail="No graph loaded")

    try:
        rerouted, metrics = simulator.step(request.steps)
        return StepResponse(
            current_step=simulator.step_count,
            metrics=metrics,
            rerouted_agents=rerouted
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/simulation/state", response_model=StateResponse)
def get_state():
    """Get current simulation state."""
    simulator = get_simulator()
    if not simulator:
        raise HTTPException(status_code=400, detail="No graph loaded")

    return StateResponse(state=simulator.get_state())

@router.get("/simulation/metrics", response_model=MetricsHistoryResponse)
def get_metrics(limit: Optional[int] = None):
    """Get metrics history."""
    simulator = get_simulator()
    if not simulator:
        raise HTTPException(status_code=400, detail="No graph loaded")

    history = simulator.metrics_history
    if limit:
        history = history[-limit:]

    return MetricsHistoryResponse(history=history)

@router.post("/routes/query", response_model=RouteQueryResponse)
def query_route(request: RouteQueryRequest):
    """Query optimal route between two nodes."""
    simulator = get_simulator()
    if not simulator:
        raise HTTPException(status_code=400, detail="No graph loaded")

    route = simulator.query_route(request.source, request.destination)
    return RouteQueryResponse(
        route=route,
        success=route is not None
    )
