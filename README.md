# FlowScore
FlowScore is a web-based score viewer app that enables real-time reception, rendering, and display of musical material on digital music stands.

![Screenshot](.github/screenshot.png)

## Contributors

- Ideator and Conceptual Advisor: [Prof. Dr. Axel Berndt](https://github.com/axelberndt)
- Lead Developer and Project Author: [Simon Waloschek](https://github.com/sonovice)

## Concept
This project aims to provide a streaming-based solution, divided into three main components: Provider, Server, and Client:

- Provider: Sends musical material to the host. This part is developed externally. (A naive provider that streams MEI files can be found in the /tests folder.)
- Server: Receives musical material from the Music Provider, generates voice parts, and sends them to the clients.
- Client: The client application is accessed by musicians on their devices via a browser. It offers various settings and the display of musical scores.

## Documentation

Detailed documentation is available for different user groups:

-   **[Developer Documentation](docs/DEVELOPERS.md):** For those contributing to the FlowScore codebase.
-   **[Operator Guide](docs/OPERATORS.md):** For individuals running and managing the FlowScore server.
-   **[Musician/User Guide](docs/MUSICIANS.md):** For end-users viewing scores in their browser.

## Run server
To run the server, simply download and execute the binary file for your operating system from the [Releases](https://github.com/sonovice/flowscore/releases) page. The server will start on port 8765 by default.

For now the CLI options are restricted to selecting a custom port:
```
$ ./FlowScore
FlowScore server v1.0.2
    Usage: ./FlowScore [OPTIONS]
    Options:
     --port      Set custom port number. Default is 8765.
```

Clients then have to connect to the given IP/Port via HTTP, e.g. `http://192.168.1.1:8765/`.

##  Notes for Providers

### WebSocket Connection

You can connect to the FlowScore server in two ways:

1. **Manual connection**: Connect directly to `ws://[IP]:[Port]/ws?type=provider` using the WebSocket protocol.
2. **Automatic discovery (recommended)**: Use mDNS/DNS‑SD to automatically discover the broker on the local network. See the [Autodiscovery](#autodiscovery-mdnsdns‑sd) section below for details.

### Other Provider Requirements

- **Responsibility for Reconnects**: As a provider, you are responsible for maintaining your connection. If the connection to the WebSocket server is interrupted for any reason, you must ensure that your provider can automatically reconnect. Therefore, implement a reliable reconnect logic to ensure the stability and reliability of your services.

- **Data Format**: Ensure that all MEI data you submit is valid.

- **Inclusion of Labels**: When transmitting MEI data, it is important to include the `@label` and `@label.abbr` attributes in `<scoreDef>` elements **for each MEI snippet**.

- **Ignoring MEI header**: Note that the server ignores the `<meiHead>` part of the MEI data. This means that any information provided in this section will not be processed or considered.

- **Examples**: See the `examples/` directory for provider examples in Python and Java that demonstrate both manual connection and autodiscovery.

## Autodiscovery (mDNS/DNS‑SD)

FlowScore automatically advertises itself on the local network using mDNS/DNS‑SD (Bonjour/Zeroconf), allowing provider applications to discover and connect to the broker without needing to know its IP address or port beforehand.

### How It Works

When the server starts, it publishes a DNS‑SD service with the following characteristics:

- **Service name**: `FlowScore Broker (hostname:port-XXXXXX)` (includes random suffix for uniqueness)
- **Service type**: `_flowscore._tcp.local.`
- **TXT records**:
  - `path=/ws` - WebSocket endpoint path
  - `role=broker` - Server role identifier
  - `proto=ws` - Protocol type

The server prints its discoverable service name on startup, for example:
```
Discoverable as: FlowScore Broker (myhost:8765-aB3cD9)
```

### For Provider Developers

To implement autodiscovery in your provider application:

1. **Use an mDNS/DNS‑SD library** for your platform:
   - **Python**: Use `zeroconf` library (see `examples/python/discover_and_send.py`)
   - **Java**: Use `JmDNS` library (see `examples/java/src/main/java/org/example/DiscoverAndSend.java`)
   - **Other platforms**: Use appropriate mDNS/Zeroconf/Bonjour libraries

2. **Browse for service type** `_flowscore._tcp.local.`

3. **Extract connection details** from discovered services:
   - Host address (prefer IPv4 addresses for better compatibility)
   - Port number
   - WebSocket path from TXT record `path` (defaults to `/ws` if not present)

4. **Connect** to `ws://[host]:[port][path]?type=provider`

### Disabling Autodiscovery

If you need to disable mDNS advertising (e.g., for testing or in restricted network environments), set the `DISABLE_MDNS` environment variable before starting the server:

```bash
DISABLE_MDNS=1 ./FlowScoreApp
# or
DISABLE_MDNS=true bun src/index.ts
```

When disabled, providers must connect using the manual IP address method.

<sub>The development of FlowScore is supported by KreativInstitut.OWL, a consortium consisting of OWL University of Applied Sciences and Arts, Detmold University of Music, and Paderborn University, funded by the Ministry of Economic Affairs, Industry, Climate Action and Energy of the State of North Rhine-Westphalia, Germany.</sub>
