import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { analysisAPI } from "@/lib/authApi";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";

const MlInsightsContext = createContext(null);

export function MlInsightsProvider({ children }) {
  const { session } = useAuth();
  const { transactions, summary } = useFinance();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastTrainingResult, setLastTrainingResult] = useState(null);

  const refreshAnalysis = useCallback(async ({ silent = false } = {}) => {
    if (!session?.id) {
      setAnalysis(null);
      setError("");
      return null;
    }

    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await analysisAPI.getMine();
      const next = response.data?.data || null;
      setAnalysis(next);
      setError("");
      return next;
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Unable to load ML analysis";
      setError(message);
      return null;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [session?.id]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!session?.id) {
        if (active) {
          setAnalysis(null);
          setError("");
          setLoading(false);
        }
        return;
      }

      if (active) {
        setLoading(true);
      }

      try {
        const response = await analysisAPI.getMine();
        if (!active) return;
        setAnalysis(response.data?.data || null);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || err?.message || "Unable to load ML analysis");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [session?.id, transactions.length, summary.totalIncome, summary.totalExpenses]);

  const reportTrainingResult = useCallback((result) => {
    if (!result) return;
    setLastTrainingResult({
      at: new Date().toISOString(),
      ...result,
    });
    refreshAnalysis({ silent: true });
  }, [refreshAnalysis]);

  const value = useMemo(() => ({
    analysis,
    ml: analysis?.ml || null,
    predictionSummary: analysis?.predictionSummary || null,
    currentFeatures: analysis?.currentFeatures || null,
    monthlyDataset: analysis?.monthlyDataset || [],
    loading,
    error,
    refreshAnalysis,
    lastTrainingResult,
    reportTrainingResult,
  }), [analysis, loading, error, refreshAnalysis, lastTrainingResult]);

  return <MlInsightsContext.Provider value={value}>{children}</MlInsightsContext.Provider>;
}

export function useMlInsights() {
  const context = useContext(MlInsightsContext);
  if (!context) {
    throw new Error("useMlInsights must be used within MlInsightsProvider");
  }
  return context;
}
