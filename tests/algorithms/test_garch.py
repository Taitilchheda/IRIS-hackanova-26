"""
Tests for GARCH volatility model.
"""
import numpy as np
import pytest
from app.algorithms.risk.garch import GARCHModel, EGARCHModel


@pytest.fixture
def sample_returns():
    rng = np.random.default_rng(42)
    return rng.normal(0.0005, 0.012, 500)


def test_garch_fit_runs(sample_returns):
    model = GARCHModel()
    model.fit(sample_returns)
    assert model._fitted is True


def test_garch_positive_vol(sample_returns):
    model = GARCHModel().fit(sample_returns)
    vol = model.forecast_annualised_vol()
    assert vol > 0


def test_garch_vol_reasonable(sample_returns):
    """Annualised vol should be in a plausible range (1% – 200%)."""
    model = GARCHModel().fit(sample_returns)
    vol = model.forecast_annualised_vol()
    assert 0.01 < vol < 2.0


def test_garch_not_fitted_raises():
    model = GARCHModel()
    with pytest.raises(RuntimeError):
        model.forecast_variance()


def test_egarch_fit_runs(sample_returns):
    model = EGARCHModel()
    model.fit(sample_returns)
    assert model._fitted is True


def test_egarch_positive_vol(sample_returns):
    model = EGARCHModel().fit(sample_returns)
    vol = model.forecast_annualised_vol()
    assert vol > 0


def test_garch_short_series():
    """GARCH should not crash on very short series."""
    model = GARCHModel().fit(np.array([0.01, -0.02, 0.005]))
    assert model.forecast_annualised_vol() > 0
