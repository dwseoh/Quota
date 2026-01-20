# quota architecture sandbox frontend

next.js dashboard for the architecture sandbox. uses react flow for the canvas and zustand for state.

## setup

1. `npm install`
2. `npm run dev`

runs at `localhost:3000`. needs the backend up at `localhost:8000`.

## features

- **canvas**: drag and drop cloud nodes.
- **chat**: sidebar to talk to the ai architect.
- **scaling**: sliders to change users/traffic and see price updates.

## structure

- `app/sandbox/new/page.tsx`: the main editor.
- `lib/store.ts`: all the node/edge/scope state.
- `lib/api.ts`: axios/fetch wrapper for the backend.
