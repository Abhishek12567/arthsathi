import { supabase } from "../db/supabaseClient.js";

// Add new transaction
export async function addTransaction(req, res) {
  const { user_id, date, amount, type, category, note } = req.body;

  const { data, error } = await supabase
    .from("transactions")
    .insert([{ user_id, date, amount, type, category, note }]);

  if (error) return res.status(400).json({ error });

  res.json({ message: "Transaction added", data });
}

// Get all transactions for a user
export async function getTransactions(req, res) {
  const userId = req.params.userId;

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) return res.status(400).json({ error });

  res.json(data);
}
