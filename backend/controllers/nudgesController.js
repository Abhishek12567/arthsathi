import { supabase } from "../db/supabaseClient.js";

// Get nudges for a user
export async function getNudges(req, res) {
  const userId = req.params.userId;

  const { data, error } = await supabase
    .from("nudges")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error });

  res.json(data);
}

// Add new nudge
export async function addNudge(req, res) {
  const { user_id, message, language, category } = req.body;

  const { data, error } = await supabase
    .from("nudges")
    .insert([{ user_id, message, language, category }]);

  if (error) return res.status(400).json({ error });

  res.json({ message: "Nudge added", data });
}
