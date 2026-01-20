# web sandbox

this is the workspace for the architecture designer and cost simulator. split into a fastapi backend and a next.js frontend.

## structure

- **backend**: python service handling gemini, rag (langchain/faiss), and cost logic.
- **frontend**: next.js app with react flow for the interactive canvas.

## setup

1. go to `backend/` and follow its readme to start the api.
2. go to `frontend/` and follow its readme to start the dev server.
3. needs a google gemini api key in `backend/.env`.
