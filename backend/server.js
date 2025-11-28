import express from "express";
import supabase from "./supabase.js";

const app = express();
app.use(express.json());

// Example route
app.post("/add-user", async (req, res) => {
  const { name, email } = req.body;

  const { data, error } = await supabase
    .from("users")
    .insert([{ name, email }]);

  if (error) return res.status(400).json({ error });

  res.json({ message: "User added", data });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
