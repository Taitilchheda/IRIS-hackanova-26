"""
Hidden Markov Model for market regime detection.
Provides: RegimeHMM
"""
from __future__ import annotations
import numpy as np
from typing import Optional, Tuple


class RegimeHMM:
    """
    2-state Gaussian Hidden Markov Model for bull/bear regime classification.

    Uses hmmlearn if available; falls back to a simple Viterbi implementation.

    Parameters
    ----------
    n_states   : number of hidden states (default 2: bull / bear)
    n_iter     : maximum EM iterations for hmmlearn
    random_state : for reproducibility
    """

    def __init__(
        self,
        n_states: int = 2,
        n_iter: int = 100,
        random_state: int = 42,
    ):
        self.n_states = n_states
        self.n_iter = n_iter
        self.random_state = random_state
        self._model = None
        self._use_hmmlearn = False

    def fit(self, returns: np.ndarray) -> "RegimeHMM":
        """
        Fit the HMM to a returns series.

        Parameters
        ----------
        returns : 1-D array of asset returns
        """
        returns = np.asarray(returns, dtype=float)
        returns = returns[np.isfinite(returns)]
        X = returns.reshape(-1, 1)

        try:
            from hmmlearn import hmm as hmmlearn_hmm
            model = hmmlearn_hmm.GaussianHMM(
                n_components=self.n_states,
                covariance_type="full",
                n_iter=self.n_iter,
                random_state=self.random_state,
            )
            model.fit(X)
            self._model = model
            self._use_hmmlearn = True
        except ImportError:
            # Fallback: simple 2-state estimation via k-means-like split
            self._fit_simple(returns)

        self._returns = returns
        return self

    def _fit_simple(self, returns: np.ndarray) -> None:
        """Simple fallback regime detection using volatility-based split."""
        vol = np.abs(returns)
        threshold = np.median(vol)
        self._high_vol_mask = vol > threshold
        self._means = [
            float(np.mean(returns[~self._high_vol_mask])),
            float(np.mean(returns[self._high_vol_mask])),
        ]
        self._stds = [
            float(np.std(returns[~self._high_vol_mask]) + 1e-8),
            float(np.std(returns[self._high_vol_mask]) + 1e-8),
        ]
        self._threshold = threshold

    def predict(self, returns: np.ndarray) -> np.ndarray:
        """
        Predict hidden state sequence for a returns series.

        Returns
        -------
        1-D integer array of state labels (0 or 1)
        """
        returns = np.asarray(returns, dtype=float)
        X = returns.reshape(-1, 1)

        if self._use_hmmlearn and self._model is not None:
            states = self._model.predict(X)
        else:
            # Fallback: classify by volatility
            vol = np.abs(returns)
            states = (vol > self._threshold).astype(int)

        # Relabel so state 0 = "bull" (higher mean return)
        if self._use_hmmlearn and self._model is not None:
            means = self._model.means_.flatten()
        else:
            means = np.array(self._means)

        if means[0] < means[1]:
            # Swap labels so 0 = bull (higher mean)
            states = 1 - states

        return states

    def regime_stats(self, returns: np.ndarray) -> dict:
        """
        Return summary statistics per regime.
        """
        states = self.predict(returns)
        result = {}
        for s in range(self.n_states):
            mask = states == s
            r_s = returns[mask]
            label = "bull" if s == 0 else "bear"
            result[label] = {
                "count": int(np.sum(mask)),
                "pct": round(float(np.mean(mask)) * 100, 1),
                "mean_return": round(float(np.mean(r_s)) * 252, 4) if len(r_s) > 0 else 0.0,
                "volatility": round(float(np.std(r_s)) * np.sqrt(252), 4) if len(r_s) > 0 else 0.0,
            }
        return result
