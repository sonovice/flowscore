# FlowScore Operator Guide

This guide provides instructions for operators responsible for running and managing the FlowScore server.

## Overview

The FlowScore server acts as a central hub that receives a full musical score in MEI format from a single source (the "provider") and distributes filtered views (specific staves) to multiple web-based clients (the "musicians") in real-time using WebSockets.

## Prerequisites

*   **Bun Runtime:** The server is built to run using Bun. Ensure Bun is installed on the server machine. See [bun.sh](https://bun.sh/) for installation instructions.
*   **Network Configuration:** Ensure the server machine's IP address and the chosen port are accessible to both the MEI provider and the clients on the network.
*   **MEI Provider:** You need a separate application or system capable of sending MEI data strings via a WebSocket connection.

## Installation

1.  **Get the Code:** Obtain the FlowScore application code (e.g., by cloning the repository).
2.  **Install Dependencies:** Navigate to the project's root directory in a terminal and run:
    ```bash
    bun install
    ```
    *Note: If the UI (`src/ui`) needs to be built or served statically, ensure its dependencies are also installed (`cd src/ui && bun install`) and any necessary build steps (`bun run build`) are performed according to the `DEVELOPERS.md` guide or `package.json` scripts.*

## Running the Server

1.  **Navigate to Root:** Open a terminal in the FlowScore project root directory.
2.  **Start the Server:** Execute the main script using Bun:
    ```bash
    bun src/index.ts [OPTIONS]
    ```
    Alternatively, if a start script is defined in `package.json` (e.g., `"start": "bun src/index.ts"`), you can use:
    ```bash
    bun start [OPTIONS]
    ```
    Or, if the project is built into an executable (e.g., `FlowScoreApp`):
    ```bash
    ./FlowScoreApp [OPTIONS]
    ```

## Configuration

*   **Port:** By default, the server runs on port `8765`. You can specify a different port using the `-p` or `--port` command-line option:
    ```bash
    # Run on port 8080
    bun src/index.ts -p 8080
    ```
    ```bash
    bun src/index.ts --port 9000
    ```

## Connecting Provider and Clients

Once the server is running, it will print the necessary connection details:

```
🚀 Server is running.
Connect provider to "ws://[server-ip]:[port]/ws?type=provider"
Connect clients to "http://[server-ip]:[port]/"
```

*   **Provider:** Configure your MEI sending application to connect to the WebSocket URL shown (e.g., `ws://192.168.1.100:8765/ws?type=provider`). The server only accepts *one* provider connection at a time. If a provider is already connected, subsequent attempts will be rejected until the first one disconnects.
*   **Clients (Musicians):** Instruct users to open the HTTP URL in their web browsers (e.g., `http://192.168.1.100:8765/`).
    *   To view specific staves, clients need to append `?staves=[numbers]` to the URL (e.g., `http://192.168.1.100:8765/?staves=1,4`). You will need to inform the musicians which stave number corresponds to which instrument/part based on the MEI data being sent by the provider.

*   **Example Files:** The `examples/` directory in the project contains sample MEI files (e.g., `.mei`). These can be useful for testing the server setup or for use with a test provider application. You might also find example provider implementations (e.g., in Python or Java) within the `examples/` subdirectories, which can serve as a starting point for connecting your own MEI source.

## Monitoring

*   **Console Logs:** The server prints logs to the console, indicating when it starts, when providers/clients connect/disconnect, when they subscribe/unsubscribe to staves, and when MEI data is received and published. These logs include timestamps and color-coding for readability.
    *   `PROVIDER New MEI data`: Logged when the provider sends data.
    *   `PUBLISHED Staves "..."`: Logged when processed data is sent to clients for specific staves.
    *   `SUBSCRIBED Staves "..."`: Logged when a client connects and subscribes.
    *   `UNSUBSCRIBED Staves "..."`: Logged when a client disconnects.
*   **Stats Endpoint:** The server provides a basic statistics page at `http://[server-ip]:[port]/stats`. This page might show information like the number of connected clients, active subscriptions, etc. (The exact content depends on the implementation of `src/server/handlers/stats.ts`).

## Deployment (Production)

For a more robust deployment, it's recommended to build the application into a standalone executable and build the static frontend assets.

1.  **Build the Application:** From the project root directory, run:
    ```bash
    bun run build
    ```
    This command first builds the static UI assets inside `src/ui/dist-static/` and then compiles the server code into a single executable file named `FlowScoreApp` in the project root.

2.  **Run the Executable:** You can then run the compiled application directly:
    ```bash
    ./FlowScoreApp [OPTIONS]
    ```
    For example, to run on port 80:
    ```bash
    ./FlowScoreApp -p 80
    ```
    Ensure the executable has execute permissions (`chmod +x FlowScoreApp`).

3.  **Serving:** The compiled `FlowScoreApp` includes the server logic and serves the pre-built static UI files. Clients connect to `http://[server-ip]:[port]/` and the provider connects to `ws://[server-ip]:[port]/ws?type=provider` as usual.

4.  **Process Management:** For long-running production deployments, consider using a process manager like `pm2` or `systemd` to manage the `FlowScoreApp` process (e.g., automatically restart it if it crashes).

## Stopping the Server

Press `Ctrl+C`