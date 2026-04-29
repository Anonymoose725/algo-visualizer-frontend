# algo-visualizer-frontend

A React frontend that animates classic algorithm execution step by step.

Live at [algo-visualizer-frontend-six.vercel.app](https://algo-visualizer-frontend-six.vercel.app)  
Backend: [algo-visualizer](https://github.com/Anonymoose725/algo-visualizer)

---

## What it does

The frontend sends an array to the Haskell backend, receives a full execution trace (every comparison the algorithm made and intermediate states), and animates through it, intuitively showing which elements are being compared at each step via highlighted bars and arrows, labeled boxes, and indicator colours.

---

## Stack

| Layer | Technology | Role |
|---|---|---|
| Framework | [React](https://react.dev) | Component/property based UI: each piece of the interface is an isolated function that re-renders when its data changes, hangs to wait for backend data |
| Animations | [Framer Motion](https://www.framer.com/motion/) | Smooth bar height and color transitions between steps |
| Hosting | [Vercel](https://vercel.com) | Deploys automatically from git on every push |

---

## Running locally

**Prerequisites:** Node.js via [nvm](https://github.com/nvm-sh/nvm)

```bash
git clone https://github.com/Anonymoose725/algo-visualizer-frontend
cd algo-visualizer-frontend
npm install
npm start
```

App runs at `http://localhost:3000`. Note the backend is on port 8080 if also running locally.

**Connecting to the backend!**

The frontend reads the API URL from an environment variable. Create a `.env` file in the project root:

```
REACT_APP_API_URL=http://localhost:8080
```

Then run the backend locally (see instructions in its README). Without a running backend, the visualizer UI loads but Visualize fetch requests will fail and throw an error.

---

## Component structure

```
App                          — owns all states to be updated (algorithm, steps, current index, playing)
├── AlgorithmPicker          — user selects active algorithm, states mutated
├── ArrayInput               — text input + Visualize button, makes the API request to backend
├── Visualizer               — renders graphics for current step
└── StepControls             — play/pause/skip/adjust controls with a range slider to go between steps
```

The flow of data is strict: raw information flows down as properties, events go back up as callbacks, and the backend is only ever contacted once by `ArrayInput`. Any other component is purely reliant on the step array stored in state. Functions mutate the state as required.

---

## How the visualization works, sequentially

1. User enters a comma seperated string and clicks *Visualize*
2. `ArrayInput` sends `GET /sort/${algorithm}?input={array}` to the Haskell backend
3. Backend returns a JSON array of steps generated
4. Steps are stored in `App` state exclusively
5. `Visualizer` renders the current step: bar heights reflect values, red highlighting and arrows mark the two elements being compared
6. `StepControls` moves `currentStepIndex` manually or automatically via a 500ms interval if user chooses to press play
7. On the final step everything turns green to signal completion
