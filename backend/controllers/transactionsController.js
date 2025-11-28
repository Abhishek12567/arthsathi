// backend/controllers/transactionsController.js
import supabase from "../db/supabaseClient.js";

export async function addTransaction(req, res) {
  try {
    console.log("POST /api/transactions/add - body:", req.body);

    const { user_id, date, amount, type, category, note } = req.body;
    if (!user_id || !amount || !type) {
      return res.status(400).json({ error: "user_id, amount and type are required" });
    }

    const normalizedType = String(type).toLowerCase();
    if (!["income", "expense"].includes(normalizedType)) {
      return res.status(400).json({ error: "type must be 'income' or 'expense'" });
    }

    const payload = {
      user_id,
      date: date || new Date().toISOString().slice(0, 10),
      amount: Number(amount),
      type: normalizedType,
      category: category || "Other",
      note: note || null,
    };

    console.log("Inserting payload:", payload);

    const { data, error } = await supabase
      .from("transactions")
      .insert([payload])
      .select()
      .single();

    console.log("Supabase insert result:", { data, error });

    if (error) {
      return res.status(500).json({ error: error.message || error });
    }

    return res.status(201).json({ message: "Transaction added", data });
  } catch (err) {
    console.error("addTransaction exception:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}

export async function getTransactions(req, res) {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    console.log("GET /api/transactions/", userId);

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Supabase select error:", error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.json(data || []);
  } catch (err) {
    console.error("getTransactions exception:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
