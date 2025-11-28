// src/components/TransactionForm.jsx
import React, { useState } from "react";
import { addTransaction } from "../services/api";

const categories = ["Food", "Transport", "Rent", "Bills", "Groceries", "Entertainment", "Other"];

export default function TransactionForm({ userId, onAdded }) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;

    const payload = {
      user_id: userId,
      date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD for Supabase date
      amount: Number(amount),
      type,
      category,
      note,
    };

    try {
      await addTransaction(payload);
      setAmount("");
      setNote("");
      onAdded && onAdded();
    } catch (err) {
      console.error(err);
      alert("Failed to add transaction");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3>Add Transaction</h3>

      <div className="field-row">
        <input
          type="number"
          step="0.01"
          placeholder="Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      <div className="field-row">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <button type="submit" className="primary-btn">
        Save
      </button>
    </form>
  );
}
