const express = require("express");
const paidApi = require("../clients/paidApi");

const router = express.Router();

// BAD: serial fan-out + redundant billing lookup
router.get("/dashboard", async (req, res) => {
  const userId = String(req.query.userId || "1");

  const user = await paidApi.getUser(userId);          // paid
  const orders = await paidApi.getOrders(userId);      // paid
  const billing = await paidApi.billingLookup(userId); // paid
  const recs = await paidApi.search("recommended");    // paid

  // redundant call
  const billingAgain = await paidApi.billingLookup(userId); // paid repeated

  res.json({
    user: user.data,
    orders: orders.data,
    billing: billingAgain.data,
    recs: recs.data
  });
});

module.exports = router;
