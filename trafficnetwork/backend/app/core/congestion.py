# app/core/congestion.py
"""
Congestion modeling and weight update functions.
Different congestion models can be plugged in here.
"""
from typing import Protocol
from models.graph_models import Edge


class CongestionModel(Protocol):
    """Protocol for congestion models."""

    def compute_weight(self, edge: Edge) -> float:
        """Compute congested weight for an edge."""
        ...


class BPRCongestionModel:
    """
    Bureau of Public Roads (BPR) congestion function.
    Standard model used in transportation engineering.

    Formula: t = t0 * (1 + α * (flow/capacity)^β)

    Where:
    - t0: free-flow travel time (base_weight)
    - α: congestion sensitivity parameter (typically 0.15)
    - β: congestion nonlinearity parameter (typically 4.0)
    - flow/capacity: volume-to-capacity ratio
    """

    def __init__(self, alpha: float = 0.15, beta: float = 4.0):
        """
        Initialize BPR model.

        Args:
            alpha: Congestion sensitivity (0.15 is standard)
            beta: Congestion nonlinearity (4.0 is standard)
        """
        self.alpha = alpha
        self.beta = beta

    def compute_weight(self, edge: Edge) -> float:
        """Compute travel time with BPR function."""
        if edge.current_flow <= 0:
            return edge.base_weight

        congestion_ratio = edge.current_flow / edge.capacity
        congestion_factor = 1.0 + self.alpha * (congestion_ratio ** self.beta)

        return edge.base_weight * congestion_factor


class LinearCongestionModel:
    """
    Simple linear congestion model.
    Good for testing and educational purposes.

    Formula: t = t0 * (1 + k * flow/capacity)
    """

    def __init__(self, k: float = 1.0):
        """
        Initialize linear model.

        Args:
            k: Linear congestion coefficient
        """
        self.k = k

    def compute_weight(self, edge: Edge) -> float:
        """Compute travel time with linear function."""
        if edge.current_flow <= 0:
            return edge.base_weight

        congestion_ratio = edge.current_flow / edge.capacity
        congestion_factor = 1.0 + self.k * congestion_ratio

        return edge.base_weight * congestion_factor


class ExponentialCongestionModel:
    """
    Exponential congestion model for severe congestion effects.

    Formula: t = t0 * exp(k * flow/capacity)
    """

    def __init__(self, k: float = 2.0):
        """
        Initialize exponential model.

        Args:
            k: Exponential growth rate
        """
        self.k = k

    def compute_weight(self, edge: Edge) -> float:
        """Compute travel time with exponential function."""
        import math

        if edge.current_flow <= 0:
            return edge.base_weight

        congestion_ratio = edge.current_flow / edge.capacity
        congestion_factor = math.exp(self.k * congestion_ratio)

        return edge.base_weight * congestion_factor


class PiecewiseCongestionModel:
    """
    Piecewise congestion model with different regimes.

    - Below threshold: minimal congestion
    - Above threshold: rapid increase
    """

    def __init__(
        self,
        threshold: float = 0.7,
        low_alpha: float = 0.05,
        high_alpha: float = 0.5,
        beta: float = 4.0
    ):
        """
        Initialize piecewise model.

        Args:
            threshold: Congestion ratio threshold
            low_alpha: Congestion factor below threshold
            high_alpha: Congestion factor above threshold
            beta: Nonlinearity parameter
        """
        self.threshold = threshold
        self.low_alpha = low_alpha
        self.high_alpha = high_alpha
        self.beta = beta

    def compute_weight(self, edge: Edge) -> float:
        """Compute travel time with piecewise function."""
        if edge.current_flow <= 0:
            return edge.base_weight

        congestion_ratio = edge.current_flow / edge.capacity

        if congestion_ratio < self.threshold:
            alpha = self.low_alpha
        else:
            alpha = self.high_alpha

        congestion_factor = 1.0 + alpha * (congestion_ratio ** self.beta)

        return edge.base_weight * congestion_factor


class CongestionModelFactory:
    """Factory for creating congestion models."""

    @staticmethod
    def create(model_type: str = "bpr", **kwargs) -> CongestionModel:
        """
        Create a congestion model.

        Args:
            model_type: One of "bpr", "linear", "exponential", "piecewise"
            **kwargs: Model-specific parameters

        Returns:
            CongestionModel instance
        """
        if model_type == "bpr":
            return BPRCongestionModel(**kwargs)
        elif model_type == "linear":
            return LinearCongestionModel(**kwargs)
        elif model_type == "exponential":
            return ExponentialCongestionModel(**kwargs)
        elif model_type == "piecewise":
            return PiecewiseCongestionModel(**kwargs)
        else:
            raise ValueError(f"Unknown congestion model: {model_type}")
