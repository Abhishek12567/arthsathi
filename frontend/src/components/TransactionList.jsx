// src/components/TransactionList.jsx
import React from "react";

export default function TransactionList({ transactions }) {
  if (!transactions?.length) {
    return <div className="card">No transactions yet. Add your first one!</div>;
  }

  return (
    <div className="card">
      <h3>Recent Transactions</h3>
      <ul className="tx-list">
        {transactions.map((t) => (
          <li key={t.id} className="tx-item">
            <div>
              <div className="tx-main">
                <span className="tx-category">{t.category || "Uncategorized"}</span>
                <span className={`tx-amount ${t.type === "expense" ? "expense" : "income"}`}>
                  {t.type === "expense" ? "-" : "+"}₹{Number(t.amount).toFixed(2)}
                </span>
              </div>
              <div className="tx-meta">
                <span>{t.date}</span>
                {t.note && <span>• {t.note}</span>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
