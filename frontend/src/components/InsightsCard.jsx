// src/components/InsightsCard.jsx
import React, { useMemo } from "react";

export default function InsightsCard({ transactions = [] }) {
  const summary = useMemo(() => {
    // ensure transactions is an array
    const txs = Array.isArray(transactions) ? transactions : [];

    let income = 0;
    let expense = 0;

    txs.forEach((t) => {
      // tolerate string numbers or missing fields
      const amt = Number(t?.amount || 0);
      if (t?.type === "income") income += amt;
      else expense += amt;
    });

    const savings = income - expense;
    const safeIncome = income > 0 ? income : 1; // avoid division by zero
    const expensePct = (expense / safeIncome) * 100;
    const savingsPct = (savings / safeIncome) * 100;

    return {
      income,
      expense,
      savings,
      expensePct: expensePct.toFixed(1),
      savingsPct: savingsPct.toFixed(1),
      txCount: txs.length,
    };
  }, [transactions]);

  return (
    <div className="card">
      <h3>Quick Financial Snapshot</h3>

      {summary.txCount === 0 ? (
        <p className="muted">No transactions yet — add one to see insights.</p>
      ) : (
        <>
          <div className="insights-grid" style={{ marginTop: 8 }}>
            <div>
              <span className="label">Income (30 days)</span>
              <div className="value">₹{summary.income.toFixed(2)}</div>
            </div>
            <div>
              <span className="label">Expenses</span>
              <div className="value">₹{summary.expense.toFixed(2)}</div>
            </div>
            <div>
              <span className="label">Savings</span>
              <div className={`value ${summary.savings < 0 ? "negative" : ""}`}>
                ₹{summary.savings.toFixed(2)}
              </div>
            </div>
          </div>

          <p className="muted mt-2">
            Expense % of income: <b>{summary.expensePct}%</b> • Savings %:{" "}
            <b>{summary.savingsPct}%</b>
          </p>
          <p className="muted">
            Target (conservative): <b>60%</b> essentials, <b>20%</b> savings,{" "}
            <b>20%</b> lifestyle.
          </p>
        </>
      )}
    </div>
  );
}
