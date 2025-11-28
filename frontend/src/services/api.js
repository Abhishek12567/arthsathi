// src/services/api.js

const API_BASE = "http://localhost:5000/api";

// 👇 Use your real Supabase user UUID here
export const DEMO_USER_ID = "47e20981-bcd8-4853-adc4-6702ca1dccfc";

/**
 * Add transaction
 */
export async function addTransaction(payload) {
  const res = await fetch(`${API_BASE}/transactions/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to add transaction");

  return res.json();
}

/**
 * Get all transactions
 */
export async function getTransactions(userId) {
  const res = await fetch(`${API_BASE}/transactions/${userId}`);

  if (!res.ok) throw new Error("Failed to load transactions");

  return res.json();
}

/**
 * 👉 Ask the agent for today's advice (structured JSON)
 * 
 * Backend expects:
 *   { user_id: "<uuid>" }
 *
 * And returns:
 *   {
 *     insights: [...],
 *     actions: [...],
 *     nudge: "string",
 *     deviations: {...},
 *     topCategories: [...],
 *     nudgeSaved: {...}
 *   }
 */
export async function getCoachAdvice(userId) {
  const res = await fetch(`${API_BASE}/agent/coach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }), // IMPORTANT
  });

  if (!res.ok) throw new Error("Failed to get advice");

  return res.json(); // return structured advice object
}
