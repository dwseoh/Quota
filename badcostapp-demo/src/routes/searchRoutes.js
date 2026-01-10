const express = require("express");
const paidApi = require("../clients/paidApi");

const router = express.Router();

// BAD: calls paid search q.length times
router.get("/search", async (req, res) => {
  const q = String(req.query.q || "");

  const results = [];
  for (let i = 0; i < q.length; i++) {
    const r = await paidApi.search(q); // repeated paid call
    results.push(r.data);
  }

  res.json({ q, resultsCount: results.length, results });
});

module.exports = router;
