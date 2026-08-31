"""Unit tests for OPTION1 calculations (Phase 1 foundation)."""

import math


def spread_percent(bid: float, ask: float) -> float:
  mid = (bid + ask) / 2
  if mid <= 0:
    return float("inf")
  return (ask - bid) / mid * 100


def theta_burn_percent(theta: float, premium: float) -> float:
  if premium <= 0:
    return float("inf")
  return abs(theta) / premium * 100


def option_cost(premium: float) -> float:
  return premium * 100


class TestSpreadPercent:
  def test_normal_spread(self):
    assert abs(spread_percent(5.0, 5.2) - 3.92156862745098) < 0.01

  def test_zero_mid(self):
    assert spread_percent(0, 0) == float("inf")


class TestThetaBurn:
  def test_example_from_spec(self):
    # Premium = $0.60, Theta = -$0.06 → 10% per day
    assert abs(theta_burn_percent(-0.06, 0.60) - 10.0) < 0.01


class TestOptionCost:
  def test_cost_calculation(self):
    assert option_cost(0.25) == 25.0
