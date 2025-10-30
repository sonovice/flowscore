# FlowScore Developer Documentation

This document provides information for developers working on the FlowScore codebase.

## Project Overview

FlowScore is a web application designed to receive MEI (Music Encoding Initiative) data from a single "provider" source and distribute specific musical staves in real-time to multiple "client" viewers via WebSockets. Clients can subscribe to view one or more specific staves from the incoming MEI stream.

## Technologies Used

- **Runtime:** [Bun](https://bun.sh/)
- **Server Framework:** [ElysiaJS](https://elysiajs.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Data Format:** [MEI (Music Encoding Initiative)](https://music-encoding.org/)
- **Real-time Communication:** WebSockets
- **Compression:** [Pako](https://github.com/nodeca/pako) (for WebSocket message compression)
- **Service Discovery:** [bonjour-service](https://github.com/brianc/node-bonjour) (for mDNS/DNS‑SD advertising)
- **Frontend:** (Assumed based on `src/ui`) Likely Vite, TypeScript, potentially a framework like React/Vue/Svelte, Tailwind CSS.

## Project Structure

```
flowscore/
├── docs/               # Documentation (you are here)
├── examples/           # Example MEI files
├── src/                # Main source code
│   ├── server/         # Server-side logic (ElysiaJS)
│   │   ├── handlers/   # Request handlers (WebSocket, static files, stats)
│   │   │   ├── websocket.ts # Core WebSocket logic for provider/client communication and MEI processing
│   │   │   ├── static.ts    # Serves frontend static files
│   │   │   └── stats.ts     # Serves server statistics
│   │   ├── discovery.ts   # mDNS/DNS‑SD service advertising for autodiscovery
│   │   ├── globals.ts    # Global state (e.g., app instance, connection status)
│   │   ├── index.ts      # Server setup and startup (`serve` function)
│   │   └── meiHelpers.ts # Utility functions for MEI manipulation (filtering, cleaning)
│   ├── ui/             # Frontend source code (details TBD, likely Vite-based)
│   │   ├── public/
│   │   ├── src/
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── index.ts        # Main application entry point (CLI parsing, server startup)
│   └── utils.ts        # General utility functions
├── package.json        # Project dependencies and scripts (server)
└── ...                 # Configuration files (.gitignore, tsconfig.json, etc.)
```

## Server Logic (`src/server/`)

1.  **Entry Point (`src/index.ts`):** Parses command-line arguments (currently just `--port`/`-p`) and calls the `serve` function.
2.  **Server Initialization (`src/server/index.ts`):**
    *   Uses ElysiaJS to create an HTTP and WebSocket server.
    *   Sets up routes:
        *   `GET /stats`: Serves server statistics (`src/server/handlers/stats.ts`).
        *   `GET *`: Serves static files for the frontend UI (`src/server/handlers/static.ts`).
        *   `WS /ws`: Handles WebSocket connections.
    *   Applies CORS middleware.
    *   Starts listening on the specified host and port.
    *   Advertises the broker via mDNS/DNS‑SD unless disabled by `DISABLE_MDNS`.
3.  **WebSocket Handling (`src/server/handlers/websocket.ts`):**
    *   **Connection (`handle_open`):**
        *   Differentiates between `provider` and `client` connections based on the `type` query parameter (`ws://host:port/ws?type=[provider|client]`).
        *   Allows only *one* provider connection at a time.
        *   Subscribes clients to specific staves based on the `staves` query parameter (`&staves=1,3,5` or defaults to `all`). Maintains counts of subscribers per stave set (`subscribedStaves`).
    *   **Messages (`handle_message`):**
        *   Only processes messages from the connected `provider`.
        *   Cleans the incoming MEI data (`cleanMei`).
        *   Adds the MEI string to a queue (`meiQueue`).
        *   Triggers asynchronous processing (`processNextMEI`).
    *   **MEI Processing (`processNextMEI`):**
        *   Processes one MEI message from the queue at a time.
        *   For each unique set of `staves` that have active client subscriptions:
            *   Filters the full MEI data to include only the required staves (`filterStaves`).
            *   Minifies the resulting XML (`minifyXML`).
            *   Compresses the minified MEI using Pako (`pako.deflate`).
            *   Publishes the compressed data to the WebSocket topic corresponding to the `staves` set.
    *   **Disconnection (`handle_close`):**
        *   Resets the `providerConnected` flag if the provider disconnects.
        *   Decrements the subscription count for the client's `staves` set and removes the set if the count reaches zero.

4.  **Service Discovery (`src/server/discovery.ts`):**
    *   Publishes an mDNS/DNS‑SD (Bonjour/Zeroconf) service so providers can discover the broker on the local network automatically.
    *   Uses the `bonjour-service` npm package for mDNS advertising.
    *   **Service characteristics:**
        *   Service type: `_flowscore._tcp.local.`
        *   Service name: `FlowScore Broker (hostname:port-XXXXXX)` - includes a random 6-character alphanumeric suffix to allow multiple instances
        *   TXT records:
            *   `path=/ws` - WebSocket endpoint path
            *   `role=broker` - Server role identifier
            *   `proto=ws` - Protocol type
    *   **Startup behavior:**
        *   Automatically starts advertising when the server starts (unless disabled)
        *   Returns an object with `serviceName` (for display) and `stop()` function (for cleanup)
        *   The service name is printed to console on startup
    *   **Configuration:**
        *   Disabled when `DISABLE_MDNS=1` or `DISABLE_MDNS=true` environment variable is set
        *   Cleanly unregisters the service on server shutdown (SIGINT handler)
    *   **Implementation notes:**
        *   Uses `crypto.randomBytes()` to generate unique service name suffixes
        *   Service names are unique per instance, allowing multiple servers on the same network

## Frontend Overview (`src/ui/`)

The frontend is a web application built using:
- **Framework:** [SolidJS](https://www.solidjs.com/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **WebSocket Client:** [robust-websocket](https://github.com/nathanboktae/robust-websocket)
- **MEI Rendering:** [Verovio](https://www.verovio.org/) (via `verovio-toolkit`)
- **Compression:** [Pako](https://github.com/nodeca/pako) (for decompressing data from server)

The main application logic resides in `src/ui/src/App.tsx`. It utilizes several custom hooks (`useSettings`, `useScoreProvider`, `useHighlighting`, `useInputHandler`) to manage functionality:
*   **WebSocket Connection (`useScoreProvider`):** Connects to the server (`ws://host:port/ws?type=client&staves=...`) using `robust-websocket`. It receives compressed MEI data.
*   **Data Processing (`useScoreProvider`):** Decompresses the incoming data using Pako (likely in a web worker). Renders the MEI data to SVG using Verovio (likely in a web worker).
*   **Rendering (`App.tsx`):** Displays the generated SVG strings using a `VirtualScroller` for efficient rendering of potentially long scores.
*   **UI/UX:** Provides a settings modal (`SettingsModal`) for configuration, uses `NoSleep.js` to prevent screen lock, and displays a connection status indicator.

*(See `src/ui/src/App.tsx` and the `src/ui/src/hooks/` directory for detailed implementation.)*

## Development Setup

1.  **Install Bun:** Follow the instructions at [bun.sh](https://bun.sh/).
2.  **Install Dependencies:** Navigate to the project root directory and run the setup script:
    ```bash
    # Clones the repo if you haven't already
    # git clone <repository-url>
    cd flowscore
    bun run setup
    ```
    This script runs `bun install` in both the root directory and the `src/ui` directory.

3.  **Run Development Servers:**
    *   **Backend Server:** In the project root directory, run:
        ```bash
        bun run dev
        ```
        This uses `bun run --hot src/index.ts` to start the ElysiaJS server with hot reloading.
    *   **Frontend Dev Server:** In a separate terminal, navigate to the UI directory and run:
        ```bash
        cd src/ui
        bun run dev
        ```
        This uses `vite` to start the frontend development server, typically accessible at `http://localhost:5173` (Vite's default, check terminal output). The backend server (running on port 8765 by default) will be proxied automatically if configured in `vite.config.ts` (verification needed).

## Building for Production

To create a production build, run the following command from the project's root directory:

```bash
bun run build
```

This script performs the following steps:
1.  Navigates into `src/ui` and runs `bun run build` (which executes `tsc && vite build && bun run scripts/build_static.js`) to build the static frontend assets.
2.  Navigates back to the root directory.
3.  Uses `bun build --compile` to bundle the server-side TypeScript code (`src/index.ts`) and its dependencies into a single, standalone executable file named `FlowScoreApp` in the project root.
