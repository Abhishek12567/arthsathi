// src/components/NudgeBox.jsx
import React, { useState } from "react";
import { getCoachAdvice } from "../services/api";

export default function NudgeBox({ userId }) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await getCoachAdvice(userId);
      setResponse(res);
    } catch (err) {
      console.error("getCoachAdvice failed:", err);
      setError(err?.message || String(err));
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const safeList = (arr) => (Array.isArray(arr) && arr.length ? arr : []);
  const safeNum = (v) => (typeof v === "number" ? v : Number(v || 0));
  const pct = (part, whole) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

  // simple progress bar component
  const Progress = ({ label, value, target, color = "#0ea5e9" }) => {
    const percent = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <div>{label}</div>
          <div style={{ fontWeight: 700 }}>
            ₹{Number(value).toFixed(0)} / ₹{Number(target).toFixed(0)} ({percent}%)
          </div>
        </div>
        <div style={{ height: 8, background: "#12202b", borderRadius: 6, overflow: "hidden", marginTop: 6 }}>
          <div style={{ width: `${percent}%`, height: "100%", background: color }} />
        </div>
      </div>
    );
  };

  return (
    <div className="card" id="nudge-box">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>ArthaSathi Coach</h3>
        <button className="secondary-btn" onClick={handleClick} disabled={loading}>
          {loading ? "Thinking..." : "Get Today’s Advice"}
        </button>
      </div>

      {error && (
        <div className="card" style={{ marginTop: 10, background: "#2b0b0b" }}>
          <strong style={{ color: "#ffb4b4" }}>Error</strong>
          <div style={{ marginTop: 6, color: "#fca5a5", fontSize: 13 }}>{error}</div>
        </div>
      )}

      {!response && !error && (
        <p className="muted" style={{ marginTop: 12 }}>
          Click the button to generate advice based on the last 30 days of transactions.
        </p>
      )}

      {response && (
        <div style={{ marginTop: 12 }}>
          {/* Nudge */}
          <div className="card" style={{ padding: 12, background: "#041022" }}>
            <strong>Nudge</strong>
            <p style={{ marginTop: 8, marginBottom: 6, lineHeight: 1.4 }}>{response.nudge}</p>
            <small className="muted">
              Saved:{" "}
              {response.nudgeSaved && response.nudgeSaved.created_at
                ? new Date(response.nudgeSaved.created_at).toLocaleString()
                : "no"}
            </small>
          </div>

          {/* Numbers summary */}
          <div style={{ marginTop: 12 }}>
            <strong>Snapshot (last 30 days)</strong>

            <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
              <div style={{ minWidth: 160 }}>
                <div className="muted">Income</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>₹{safeNum(response.deviations?.totalIncome).toFixed(0)}</div>
              </div>

              <div style={{ minWidth: 160 }}>
                <div className="muted">Expense</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>₹{safeNum(response.deviations?.totalExpense).toFixed(0)}</div>
              </div>

              <div style={{ minWidth: 160 }}>
                <div className="muted">Savings</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: safeNum(response.deviations?.savings) < 0 ? "#ff7b7b" : "#a7f3d0" }}>
                  ₹{safeNum(response.deviations?.savings).toFixed(0)}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <Progress
                label="Essentials (target 60%)"
                value={safeNum(response.deviations?.essentialsActual)}
                target={safeNum(response.deviations?.targetEssentials)}
                color="#f59e0b"
              />
              <Progress
                label="Savings (target 20%)"
                value={safeNum(response.deviations?.savings)}
                target={safeNum(response.deviations?.targetSavings)}
                color="#10b981"
              />
              <Progress
                label="Lifestyle (target 20%)"
                value={safeNum(response.deviations?.lifestyleActual)}
                target={safeNum(response.deviations?.targetLifestyle)}
                color="#ef4444"
              />
            </div>
          </div>

          {/* Insights */}
          <div style={{ marginTop: 12 }}>
            <strong>Insights</strong>
            <ul>
              {safeList(response.insights).map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
              {(!response.insights || response.insights.length === 0) && <li className="muted">No insights generated.</li>}
            </ul>
          </div>

          {/* Actions */}
          <div style={{ marginTop: 6 }}>
            <strong>Actions</strong>
            <ul>
              {safeList(response.actions).map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          </div>

          {/* Top categories */}
          <div style={{ marginTop: 6 }}>
            <strong>Top spending categories</strong>
            <ol>
              {safeList(response.topCategories).map((c, i) => (
                <li key={i}>
                  {c.category} — ₹{Number(c.amount || 0).toFixed(0)} ({c.count || 0} tx)
                </li>
              ))}
              {(!response.topCategories || response.topCategories.length === 0) && <li className="muted">No spending recorded.</li>}
            </ol>
          </div>

          {/* Toggle raw numbers */}
          <div style={{ marginTop: 8 }}>
            <button
              className="secondary-btn"
              onClick={() => setShowRaw((s) => !s)}
              style={{ fontSize: 13 }}
            >
              {showRaw ? "Hide raw numbers" : "Show raw numbers (debug)"}
            </button>

            {showRaw && (
              <pre style={{ marginTop: 8, whiteSpace: "pre-wrap", fontSize: 12 }}>
                {JSON.stringify(response.deviations || {}, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
