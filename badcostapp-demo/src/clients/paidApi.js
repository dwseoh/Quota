const axios = require("axios");

// pretend pricing per call (your analyzer can key off these)
const PRICING = {
  GET_USER: 0.02,
  GET_ORDERS: 0.03,
  SEARCH: 0.05,
  BILLING_LOOKUP: 0.08
};

async function getUser(userId) {
  // fake paid endpoint
  return axios.get(`https://example.com/api/users/${userId}`);
}

async function getOrders(userId) {
  return axios.get(`https://example.com/api/orders?userId=${userId}`);
}

async function search(query) {
  return axios.get(`https://example.com/api/search?q=${encodeURIComponent(query)}`);
}

async function billingLookup(userId) {
  return axios.get(`https://example.com/api/billing?userId=${userId}`);
}

module.exports = { PRICING, getUser, getOrders, search, billingLookup };
