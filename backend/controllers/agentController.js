// backend/controllers/agentController.js
// Implements a rule-based 60:20:20 agent: analyses last 30 days and creates a nudge.

import supabase from "../db/supabaseClient.js";

/**
 * Category classifier (essentials vs lifestyle).
 * Edit this set to tune what you consider essentials.
 */
const ESSENTIALS = new Set([
  "rent",
  "bills",
  "groceries",
  "food",
  "utilities",
  "transport",
  "medicine",
  "emi",
  "loan",
  "school",
  "education",
  "health",
  "insurance"
]);

function classifyCategory(cat) {
  if (!cat) return "essentials";
  const key = String(cat).toLowerCase().trim();
  return ESSENTIALS.has(key) ? "essentials" : "lifestyle";
}

function money(x) {
  return Number((Number(x || 0)).toFixed(2));
}

/**
 * POST /api/agent/coach
 * Request body: { user_id: "<uuid>" }
 *
 * Response:
 * {
 *   insights: [...],
 *   actions: [...],
 *   nudge: "string",
 *   deviations: {...},
 *   topCategories: [...],
 *   nudgeSaved: {...} | null
 * }
 */
export async function coach(req, res) {
  try {
    const userId = req.body?.user_id || req.body?.userId;
    if (!userId) return res.status(400).json({ error: "user_id required in body" });

    // fetch last 30 days transactions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().slice(0, 10);

    const { data: txs, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("date", dateStr)
      .order("date", { ascending: false });

    if (txError) {
      console.error("agent coach: tx fetch error", txError);
      return res.status(500).json({ error: txError.message || txError });
    }

    // aggregate totals and per-category
    let totalIncome = 0;
    let totalExpense = 0;
    const byCategory = {}; // key -> { amount, count }
    const byBucket = { essentials: 0, lifestyle: 0 };

    (txs || []).forEach((t) => {
      const amt = money(t.amount);
      if (t.type === "income") totalIncome += amt;
      else totalExpense += amt;

      const catRaw = (t.category || "Other");
      const catKey = String(catRaw).toLowerCase();
      byCategory[catKey] = byCategory[catKey] || { amount: 0, count: 0 };
      byCategory[catKey].amount += amt;
      byCategory[catKey].count += 1;

      if (t.type !== "income") {
        const bucket = classifyCategory(catRaw);
        byBucket[bucket] = (byBucket[bucket] || 0) + amt;
      }
    });

    totalIncome = money(totalIncome);
    totalExpense = money(totalExpense);
    const savings = money(totalIncome - totalExpense);

    // 60:20:20 conservative targets (essentials:savings:lifestyle)
    const targetEssentials = money(totalIncome * 0.60);
    const targetSavings = money(totalIncome * 0.20);
    const targetLifestyle = money(totalIncome * 0.20);

    const deviations = {
      totalIncome,
      totalExpense,
      savings,
      targetEssentials,
      targetSavings,
      targetLifestyle,
      essentialsActual: money(byBucket.essentials || 0),
      lifestyleActual: money(byBucket.lifestyle || 0)
    };

    deviations.essentialsDiff = money(deviations.essentialsActual - targetEssentials); // positive = overspend
    deviations.savingsDiff = money(deviations.savings - targetSavings); // negative = shortfall
    deviations.lifestyleDiff = money(deviations.lifestyleActual - targetLifestyle);

    // top categories by spend (expenses only)
    const topCategories = Object.entries(byCategory)
      .map(([k, v]) => ({ category: k, amount: money(v.amount), count: v.count }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    // build rule-based insights + actions
    const insights = [];
    const actions = [];

    if (totalIncome <= 0) {
      insights.push("No income recorded in the last 30 days. Add income transactions for planning.");
      actions.push("Add your income entries (amount + date + source) to allow the coach compute targets.");
    } else {
      // Savings
      if (deviations.savings < targetSavings) {
        insights.push(
          `Savings ₹${deviations.savings} are below the 20% target (₹${targetSavings}).`
        );
        const gap = money(targetSavings - deviations.savings);
        const weekly = Math.max(1, Math.ceil(gap / 4));
        actions.push(`Try saving an additional ₹${weekly} per week for the next 4 weeks.`);
      } else {
        insights.push(`Good — savings ₹${deviations.savings} meet or exceed the 20% target.`);
      }

      // Essentials
      if (deviations.essentialsActual > targetEssentials) {
        const over = money(deviations.essentialsActual - targetEssentials);
        insights.push(
          `Essentials spending ₹${deviations.essentialsActual} is ₹${over} above the 60% target (₹${targetEssentials}).`
        );
        const biggest = topCategories.find(c => classifyCategory(c.category) === "essentials") || topCategories[0];
        if (biggest) {
          const weeklyCut = Math.max(1, Math.ceil(over / 3));
          actions.push(`Reduce ${biggest.category} by about ₹${weeklyCut} per week (small, consistent cuts).`);
        } else {
          actions.push("Reduce repeated essentials costs (transport, groceries) slightly this month.");
        }
      } else {
        insights.push(`Essentials spending ₹${deviations.essentialsActual} is within the 60% target.`);
      }

      // Lifestyle
      if (deviations.lifestyleActual > targetLifestyle) {
        const overL = money(deviations.lifestyleActual - targetLifestyle);
        insights.push(
          `Lifestyle spending ₹${deviations.lifestyleActual} is ₹${overL} above the 20% target (₹${targetLifestyle}).`
        );
        const weeklyCut = Math.max(1, Math.ceil(overL / 2));
        actions.push(`Cut discretionary spends (e.g., takeout) by ~₹${weeklyCut} per week.`);
      } else {
        insights.push(`Lifestyle spending ₹${deviations.lifestyleActual} is within the 20% target.`);
      }
    }

    // short friendly nudge (prioritise the biggest deviation)
    let nudge = "";
    if (totalIncome <= 0) {
      nudge = "Add income details so ArthaSathi can recommend a plan.";
    } else if (deviations.savings < targetSavings) {
      const gap = money(Math.max(0, targetSavings - deviations.savings));
      nudge = `You're ₹${gap} short of the 20% savings target. Try saving ₹${Math.max(1, Math.ceil(gap / 4))} per week.`;
    } else if (deviations.essentialsActual > targetEssentials) {
      const over = money(deviations.essentialsActual - targetEssentials);
      nudge = `Essentials overspend of ₹${over}. Try trimming groceries/transport by ₹${Math.max(1, Math.ceil(over / 3))} this week.`;
    } else if (deviations.lifestyleActual > targetLifestyle) {
      const over = money(deviations.lifestyleActual - targetLifestyle);
      nudge = `Lifestyle overspend ₹${over}. Skip one takeaway this week and save ~₹${Math.max(1, Math.ceil(over / 2))}.`;
    } else {
      nudge = "Nice — your 60:20:20 split looks healthy. Keep adding transactions for weekly tips.";
    }

    // save the nudge into the nudges table (best-effort)
    let nudgeSaved = null;
    try {
      const { data: saved, error: saveErr } = await supabase
        .from("nudges")
        .insert([{
          user_id: userId,
          message: nudge,
          language: "en",
          category: (deviations.essentialsDiff > 0 ? "spending" : (deviations.savingsDiff < 0 ? "savings" : "info")),
          insights,
          actions
        }])
        .select()
        .single();

      if (saveErr) {
        console.error("agent coach: failed to save nudge", saveErr);
      } else {
        nudgeSaved = saved || null;
      }
    } catch (err) {
      console.error("agent coach: exception when saving nudge", err);
    }

    // return structured JSON
    return res.json({
      insights,
      actions,
      nudge,
      deviations,
      topCategories,
      nudgeSaved
    });
  } catch (err) {
    console.error("agent coach error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
