# app/core/simulation.py
from typing import List, Dict
from .graph import Graph
from .metrics import MetricsCollector
from models.graph_models import Agent, Route
from models.simulation_models import SimulationState, SimulationMetrics, \
    GraphTopology


class Simulator:
    """Orchestrates the simulation steps."""

    def __init__(self, topology: GraphTopology, agents: List[Agent],
                 rerouting_enabled: bool = True):
        self.graph = Graph(topology.nodes, topology.edges)
        self.agents = {agent.id: agent for agent in agents}
        self.step_count = 0
        self.metrics_collector = MetricsCollector()
        self.rerouting_enabled = rerouting_enabled  # Toggle rerouting
        self.rerouting_interval = 10  # Reroute every N steps

        # Initial routing
        self._compute_all_routes()

    def set_rerouting_config(self, enabled: bool, interval: int = 10):
        """Configure rerouting behavior."""
        self.rerouting_enabled = enabled
        self.rerouting_interval = interval

    def _compute_all_routes(self) -> List[int]:
        """Compute routes for all agents. Returns list of rerouted agent IDs."""
        rerouted = []
        for agent in self.agents.values():
            route = self.graph.compute_shortest_path(agent.source,
                                                     agent.destination)
            if route:
                agent.current_route = route
                agent.current_edge_index = 0
                agent.steps_on_current_edge = 0
                rerouted.append(agent.id)
        return rerouted

    def _update_flows(self):
        """Update edge flows based on agent positions."""
        self.graph.reset_flows()

        for agent in self.agents.values():
            if not agent.current_route or len(agent.current_route.path) < 2:
                continue

            # Agents contribute flow to their current edge
            if agent.current_edge_index < len(agent.current_route.path) - 1:
                source = agent.current_route.path[agent.current_edge_index]
                target = agent.current_route.path[agent.current_edge_index + 1]
                self.graph.update_edge_flow(source, target, 1.0)

    def _advance_agents(self):
        """Move agents along their routes."""
        for agent in self.agents.values():
            if not agent.current_route:
                continue

            path = agent.current_route.path
            if agent.current_edge_index >= len(path) - 1:
                # Agent reached destination
                continue

            source = path[agent.current_edge_index]
            target = path[agent.current_edge_index + 1]
            edge = self.graph.get_edge(source, target)

            if edge:
                # Simplified: agents take ceil(weight) steps to traverse edge
                required_steps = max(1, int(edge.compute_weight()))
                agent.steps_on_current_edge += 1

                # DEBUG
                print(
                    f"Agent {agent.id}: edge {source}->{target}, step {agent.steps_on_current_edge}/{required_steps}, edge_index {agent.current_edge_index}/{len(path) - 1}")

                if agent.steps_on_current_edge >= required_steps:
                    # Move to next edge
                    agent.current_edge_index += 1
                    agent.steps_on_current_edge = 0
                    print(
                        f"  -> Agent {agent.id} moved to next edge, now at index {agent.current_edge_index}")

    def _reroute_all_agents(self) -> List[int]:
        """Reroute agents based on current congestion."""
        rerouted = []

        for agent in self.agents.values():
            # Skip completed agents
            if not agent.current_route or agent.current_edge_index >= len(
                    agent.current_route.path) - 1:
                continue

            # Get current position
            current_node = agent.current_route.path[agent.current_edge_index]

            # Compute new route with current congestion
            new_route = self.graph.compute_shortest_path(current_node,
                                                         agent.destination)

            if new_route:
                # Calculate remaining cost on old route
                old_remaining_cost = 0.0
                old_path = agent.current_route.path[agent.current_edge_index:]

                for i in range(len(old_path) - 1):
                    edge = self.graph.get_edge(old_path[i], old_path[i + 1])
                    if edge:
                        old_remaining_cost += edge.compute_weight()

                # Compare costs
                new_cost = new_route.total_cost
                improvement_ratio = (
                                                old_remaining_cost - new_cost) / old_remaining_cost if old_remaining_cost > 0 else 0

                # Reroute if new path is at least 5% better
                if improvement_ratio > 0.05:
                    agent.current_route = new_route
                    agent.current_edge_index = 0
                    agent.steps_on_current_edge = 0
                    rerouted.append(agent.id)

        return rerouted

    def _collect_metrics(self) -> SimulationMetrics:
        """Compute current metrics using MetricsCollector."""
        return self.metrics_collector.collect(
            self.step_count,
            list(self.graph.edges.values()),
            list(self.agents.values())
        )

    def set_rerouting_config(self, enabled: bool, interval: int = 10):
        """Configure rerouting behavior."""
        self.rerouting_enabled = enabled
        self.rerouting_interval = interval
        print(f"[CONFIG] Rerouting {'enabled' if enabled else 'disabled'}, interval: {interval}")

    def step(self, num_steps: int = 1) -> tuple[List[int], SimulationMetrics]:
        """Execute simulation steps with optional rerouting."""
        rerouted = []
        for step_num in range(num_steps):
            print(f"\n=== STEP {self.step_count + 1} ===")
        print(f"[DEBUG] Rerouting enabled: {self.rerouting_enabled}")
        print(f"[DEBUG] Rerouting interval: {self.rerouting_interval}")
        print(f"[DEBUG] Current step: {self.step_count}")
        print(f"[DEBUG] Next step will be: {self.step_count + 1}")
        print(f"[DEBUG] (step + 1) % interval = ({self.step_count + 1}) % {self.rerouting_interval} = {(self.step_count + 1) % self.rerouting_interval}")
        print(f"[DEBUG] Should reroute this step? {(self.step_count + 1) % self.rerouting_interval == 0}")


        for step_num in range(num_steps):
            print(f"\n=== STEP {self.step_count + 1} ===")

            # Debug info
            print(f"[DEBUG] Rerouting enabled: {self.rerouting_enabled}")
            if self.rerouting_enabled:
                print(f"[DEBUG] Rerouting interval: {self.rerouting_interval}")
                print(f"[DEBUG] Should reroute this step? {(self.step_count + 1) % self.rerouting_interval == 0}")

            # 1. Update flows based on current positions
            self._update_flows()

            # 2. Move agents forward
            self._advance_agents()

            # 3. Periodic rerouting (if enabled)
            if self.rerouting_enabled and (self.step_count + 1) % self.rerouting_interval == 0:
                print(f"[REROUTING] Recalculating routes at step {self.step_count + 1}...")
                new_rerouted = self._reroute_all_agents()
                rerouted.extend(new_rerouted)
                print(f"[REROUTING] {len(new_rerouted)} agents chose new routes")

            # 4. Collect metrics
            metrics = self._collect_metrics()

            self.step_count += 1

        return list(set(rerouted)), self.metrics_collector.history[-1]

    def get_state(self) -> SimulationState:
        """Get current simulation state."""
        return SimulationState(
            step=self.step_count,
            topology=GraphTopology(
                nodes=list(self.graph.nodes.values()),
                edges=list(self.graph.edges.values())
            ),
            agents=list(self.agents.values()),
            routes={aid: a.current_route for aid, a in self.agents.items() if
                    a.current_route}
        )


    def _reroute_all_agents(self) -> List[int]:
        """Reroute agents based on current congestion."""
        rerouted = []

        for agent in self.agents.values():
            # Skip completed agents
            if not agent.current_route or agent.current_edge_index >= len(agent.current_route.path) - 1:
                continue

            # Get current position
            current_node = agent.current_route.path[agent.current_edge_index]

            # Compute new route with current congestion
            new_route = self.graph.compute_shortest_path(current_node, agent.destination)

            if new_route:
                # Calculate remaining cost on old route
                old_remaining_cost = 0.0
                old_path = agent.current_route.path[agent.current_edge_index:]

                for i in range(len(old_path) - 1):
                    edge = self.graph.get_edge(old_path[i], old_path[i + 1])
                    if edge:
                        old_remaining_cost += edge.compute_weight()

                # Compare costs
                new_cost = new_route.total_cost
                improvement_ratio = (old_remaining_cost - new_cost) / old_remaining_cost if old_remaining_cost > 0 else 0

                # Reroute if new path is at least 5% better
                if new_cost < old_remaining_cost * 0.99:
                    print(f"  Agent {agent.id}: Rerouting! Old cost: {old_remaining_cost:.1f}, New cost: {new_cost:.1f} ({improvement_ratio*100:.1f}% better)")
                    agent.current_route = new_route
                    agent.current_edge_index = 0
                    agent.steps_on_current_edge = 0
                    rerouted.append(agent.id)

        return rerouted

    def query_route(self, source: int, destination: int) -> Route:
        """Query current optimal route."""
        return self.graph.compute_shortest_path(source, destination)

    @property
    def metrics_history(self) -> List[SimulationMetrics]:
        """Get metrics history."""
        return self.metrics_collector.get_history()
