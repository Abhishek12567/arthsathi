// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import InsightsCard from "../components/InsightsCard";
import NudgeBox from "../components/NudgeBox";
import { getTransactions, DEMO_USER_ID } from "../services/api";

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactions(DEMO_USER_ID);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>ArthaSathi</h1>
        <p className="muted">
          Your multilingual financial coach for gig & irregular income.
        </p>
      </header>

      <main className="app-main">
        <section className="left-column">
          <TransactionForm userId={DEMO_USER_ID} onAdded={loadTransactions} />
          <InsightsCard transactions={transactions} />
        </section>

        <section className="right-column">
          {loading ? <div className="card">Loading...</div> : null}
          <TransactionList transactions={transactions} />
          <NudgeBox userId={DEMO_USER_ID} />
        </section>
      </main>
    </div>
  );
}
