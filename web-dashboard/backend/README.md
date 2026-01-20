# quota architecture sandbox backend

fastapi server that handles the architecture sandbox logic. basically does rag for design help and calculates the infra costs.

## setup

1. `python -m venv venv && source venv/bin/activate`
2. `pip install -r requirements.txt`
3. `cp .env.example .env` (add `GEMINI_API_KEY`)
4. `python -m app.main`

runs at `localhost:8000`. docs at `/docs`.

## core stuff

- **rag** (`app/services/rag_service.py`): langchain + faiss for technical docs.
- **arch** (`app/services/architecture_service.py`): handles the node/edge schema.
- **costs** (`app/services/cost_calculator.py`): the pricing engine logic.

## endpoints

- `post /api/chat`: just talking to the ai architect.
- `post /api/chat/implement`: when the ai actually changes the graph.
- `get /health`: check if it's alive.
