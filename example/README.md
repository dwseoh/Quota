# BadCostApp Demo

A deliberately inefficient codebase for testing “cost intelligence” tooling.

## Endpoints
- `GET /user/:id/profile`  
  N+1 billing lookups + redundant user calls

- `GET /search?q=...`  
  Calls a paid search API `q.length` times

- `GET /dashboard?userId=...`  
  Serial fan-out calls + redundant billing lookup

## Run
```bash
npm install
npm run dev
