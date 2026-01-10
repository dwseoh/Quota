const axios = require("axios");

async function run() {
  for (let i = 0; i < 30; i++) {
    const id = (i % 5) + 1;

    await axios.get(`http://localhost:3001/user/${id}/profile`);
    await axios.get(`http://localhost:3001/dashboard?userId=${id}`);
    await axios.get(`http://localhost:3001/search?q=abcdefgh`);
  }

  console.log("Load test finished.");
}

run().catch((e) => console.error("Load test error:", e.message));
