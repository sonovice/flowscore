"""
Example Python provider that uses SSDP discovery to automatically find the FlowScore broker server.
This demonstrates how to discover the server without hardcoding the server URL.
"""

import socket
import time
from urllib.parse import urlparse

SSDP_MULTICAST_ADDRESS = "239.255.255.250"
SSDP_PORT = 1900
SERVICE_TYPE = "flowscore:broker:1"
DISCOVERY_TIMEOUT = 10  # seconds


def discover_servers(timeout=DISCOVERY_TIMEOUT):
    """
    Discovers FlowScore broker servers on the local network using SSDP.

    Returns a list of dictionaries with server information:
    - address: IP address of the server
    - port: Port number
    - url: HTTP URL
    - ws_url: WebSocket URL for provider connection
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    # Use a shorter socket timeout so we can check multiple times
    sock.settimeout(1.0)  # 1 second per recv call

    discovered_servers = {}

    try:
        # Bind to any available port
        sock.bind(("", 0))

        # Join multicast group
        sock.setsockopt(
            socket.IPPROTO_IP,
            socket.IP_ADD_MEMBERSHIP,
            socket.inet_aton(SSDP_MULTICAST_ADDRESS) + socket.inet_aton("0.0.0.0"),
        )

        # Create M-SEARCH request
        search_request = (
            f"M-SEARCH * HTTP/1.1\r\n"
            f"HOST: {SSDP_MULTICAST_ADDRESS}:{SSDP_PORT}\r\n"
            f'MAN: "ssdp:discover"\r\n'
            f"ST: {SERVICE_TYPE}\r\n"
            f"MX: {timeout}\r\n"
            f"\r\n"
        )

        # Send M-SEARCH request
        sock.sendto(search_request.encode(), (SSDP_MULTICAST_ADDRESS, SSDP_PORT))

        # Listen for responses - keep trying until timeout expires
        end_time = time.time() + timeout
        while time.time() < end_time:
            try:
                remaining_time = end_time - time.time()
                if remaining_time <= 0:
                    break
                # Adjust socket timeout to remaining time if less than 1 second
                sock.settimeout(min(1.0, remaining_time))

                data, addr = sock.recvfrom(4096)
                message = data.decode("utf-8", errors="ignore")

                # Parse response headers
                location = None
                st = None

                for line in message.split("\r\n"):
                    line_upper = line.upper()
                    if line_upper.startswith("LOCATION:"):
                        location = line[9:].strip()
                    elif line_upper.startswith("ST:"):
                        st = line[3:].strip()

                # Check if this is a response for our service type
                if st == SERVICE_TYPE and location:
                    try:
                        parsed_url = urlparse(location)
                        address = parsed_url.hostname
                        port = int(parsed_url.port or 8765)
                        ws_url = f"ws://{address}:{port}/ws?type=provider"

                        # Use address:port as unique key
                        key = f"{address}:{port}"
                        if key not in discovered_servers:
                            discovered_servers[key] = {
                                "address": address,
                                "port": port,
                                "url": location,
                                "ws_url": ws_url,
                            }
                    except Exception:
                        # Invalid URL, skip
                        pass
            except socket.timeout:
                # Continue looping if we still have time left
                continue

    finally:
        sock.close()

    return list(discovered_servers.values())


def discover_first_server(timeout=DISCOVERY_TIMEOUT):
    """
    Discovers the first available FlowScore broker server.

    Returns a dictionary with server information or None if no server is found.
    """
    servers = discover_servers(timeout)
    return servers[0] if servers else None


if __name__ == "__main__":
    print("Discovering FlowScore broker server...")

    server = discover_first_server()

    if not server:
        print("No FlowScore broker server found on the network.")
        print("   Make sure the server is running and on the same network.")
        exit(1)

    print(f"Found server at {server['address']}:{server['port']}")
    print(f"   WebSocket URL: {server['ws_url']}")
    print("\nTo connect, use the WebSocket URL shown above.")
    print("\nExample usage:")
    print("```python")
    print("from websockets.sync.client import connect")
    print(f"with connect('{server['ws_url']}') as ws:")
    print("    ws.send(mei_data)")
    print("```")
