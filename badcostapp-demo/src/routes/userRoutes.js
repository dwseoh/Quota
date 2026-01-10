const express = require("express");
const paidApi = require("../clients/paidApi");

const router = express.Router();

// BAD: N+1 billing lookups + redundant getUser call
router.get("/user/:id/profile", async (req, res) => {
  const userId = req.params.id;

  const user = await paidApi.getUser(userId);     // paid call
  const orders = await paidApi.getOrders(userId); // paid call

  const enriched = [];

  // N+1 pattern: billing lookup repeated for each order
  for (const order of (orders.data || [])) {
    const billing = await paidApi.billingLookup(userId); // paid call repeated
    enriched.push({ order, billing: billing.data });
  }

  // redundant repeated call
  const userAgain = await paidApi.getUser(userId); // paid call repeated

  res.json({ user: userAgain.data, orders: enriched });
});

module.exports = router;
