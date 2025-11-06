package org.example;

import java.io.IOException;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Discovers FlowScore broker servers on the local network using SSDP (Simple Service Discovery Protocol).
 * This implementation uses only standard Java libraries - no external dependencies required.
 */
public class FlowScoreDiscovery {
    private static final String SSDP_MULTICAST_ADDRESS = "239.255.255.250";
    private static final int SSDP_PORT = 1900;
    private static final String SERVICE_TYPE = "flowscore:broker:1";
    private static final int DEFAULT_DISCOVERY_TIMEOUT = 5000; // 5 seconds

    /**
     * Represents a discovered FlowScore broker server.
     */
    public static class DiscoveredServer {
        private final String address;
        private final int port;
        private final String url;
        private final String wsUrl;

        public DiscoveredServer(String address, int port, String url, String wsUrl) {
            this.address = address;
            this.port = port;
            this.url = url;
            this.wsUrl = wsUrl;
        }

        public String getAddress() {
            return address;
        }

        public int getPort() {
            return port;
        }

        public String getUrl() {
            return url;
        }

        public String getWsUrl() {
            return wsUrl;
        }

        @Override
        public String toString() {
            return String.format("DiscoveredServer{address='%s', port=%d, wsUrl='%s'}", 
                address, port, wsUrl);
        }
    }

    /**
     * Discovers FlowScore broker servers on the local network using SSDP.
     *
     * @param timeout Maximum time to wait for responses in milliseconds (default: 5000ms)
     * @return List of discovered servers
     * @throws IOException if network error occurs
     */
    public static List<DiscoveredServer> discoverServers(int timeout) throws IOException {
        Map<String, DiscoveredServer> discoveredServers = new ConcurrentHashMap<>();
        MulticastSocket socket = null;

        try {
            // Create multicast socket
            socket = new MulticastSocket();
            socket.setReuseAddress(true);
            socket.setSoTimeout(timeout);

            // Join multicast group
            InetAddress multicastGroup = InetAddress.getByName(SSDP_MULTICAST_ADDRESS);
            boolean joined = false;
            // Try to join on a specific network interface first
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements() && !joined) {
                NetworkInterface netInterface = interfaces.nextElement();
                if (netInterface.isUp() && !netInterface.isLoopback()) {
                    try {
                        socket.setNetworkInterface(netInterface);
                        socket.joinGroup(multicastGroup);
                        joined = true;
                    } catch (IOException e) {
                        // Try next interface
                    }
                }
            }
            // If no interface worked, try default join
            if (!joined) {
                socket.joinGroup(multicastGroup);
            }

            // Create M-SEARCH request
            String searchRequest = String.join("\r\n",
                "M-SEARCH * HTTP/1.1",
                "HOST: " + SSDP_MULTICAST_ADDRESS + ":" + SSDP_PORT,
                "MAN: \"ssdp:discover\"",
                "ST: " + SERVICE_TYPE,
                "MX: " + (timeout / 1000),
                "",
                ""
            );

            // Send M-SEARCH request
            byte[] requestBytes = searchRequest.getBytes(StandardCharsets.UTF_8);
            DatagramPacket requestPacket = new DatagramPacket(
                requestBytes,
                requestBytes.length,
                multicastGroup,
                SSDP_PORT
            );
            socket.send(requestPacket);

            // Listen for responses
            long endTime = System.currentTimeMillis() + timeout;
            byte[] buffer = new byte[4096];

            while (System.currentTimeMillis() < endTime) {
                try {
                    DatagramPacket responsePacket = new DatagramPacket(buffer, buffer.length);
                    socket.receive(responsePacket);

                    String message = new String(
                        responsePacket.getData(),
                        0,
                        responsePacket.getLength(),
                        StandardCharsets.UTF_8
                    );

                    // Parse response
                    DiscoveredServer server = parseResponse(message);
                    if (server != null) {
                        String key = server.getAddress() + ":" + server.getPort();
                        discoveredServers.putIfAbsent(key, server);
                    }
                } catch (SocketTimeoutException e) {
                    // Timeout is expected, continue to check if we should keep waiting
                    if (System.currentTimeMillis() >= endTime) {
                        break;
                    }
                }
            }
        } finally {
            if (socket != null && !socket.isClosed()) {
                try {
                    InetAddress multicastGroup = InetAddress.getByName(SSDP_MULTICAST_ADDRESS);
                    socket.leaveGroup(multicastGroup);
                } catch (IOException e) {
                    // Ignore errors when leaving group
                }
                socket.close();
            }
        }

        return new ArrayList<>(discoveredServers.values());
    }

    /**
     * Discovers FlowScore broker servers with default timeout (5 seconds).
     *
     * @return List of discovered servers
     * @throws IOException if network error occurs
     */
    public static List<DiscoveredServer> discoverServers() throws IOException {
        return discoverServers(DEFAULT_DISCOVERY_TIMEOUT);
    }

    /**
     * Discovers the first available FlowScore broker server.
     *
     * @param timeout Maximum time to wait for responses in milliseconds
     * @return First discovered server or null if none found
     * @throws IOException if network error occurs
     */
    public static DiscoveredServer discoverFirstServer(int timeout) throws IOException {
        List<DiscoveredServer> servers = discoverServers(timeout);
        return servers.isEmpty() ? null : servers.get(0);
    }

    /**
     * Discovers the first available FlowScore broker server with default timeout.
     *
     * @return First discovered server or null if none found
     * @throws IOException if network error occurs
     */
    public static DiscoveredServer discoverFirstServer() throws IOException {
        return discoverFirstServer(DEFAULT_DISCOVERY_TIMEOUT);
    }

    /**
     * Parses an SSDP response message and extracts server information.
     *
     * @param message SSDP response message
     * @return DiscoveredServer or null if parsing fails
     */
    private static DiscoveredServer parseResponse(String message) {
        String[] lines = message.split("\r\n");
        String location = null;
        String st = null;

        for (String line : lines) {
            String upperLine = line.toUpperCase();
            if (upperLine.startsWith("LOCATION:")) {
                location = line.substring(9).trim();
            } else if (upperLine.startsWith("ST:")) {
                st = line.substring(3).trim();
            }
        }

        // Check if this is a response for our service type
        if (SERVICE_TYPE.equals(st) && location != null) {
            try {
                URI uri = new URI(location);
                String address = uri.getHost();
                int port = uri.getPort() != -1 ? uri.getPort() : 8765;
                String wsUrl = String.format("ws://%s:%d/ws?type=provider", address, port);

                return new DiscoveredServer(address, port, location, wsUrl);
            } catch (URISyntaxException e) {
                // Invalid URL, skip
                return null;
            }
        }

        return null;
    }

    /**
     * Example usage: discovers and prints available FlowScore broker servers.
     */
    public static void main(String[] args) {
        System.out.println("Discovering FlowScore broker server...");

        try {
            DiscoveredServer server = discoverFirstServer();

            if (server == null) {
                System.err.println("No FlowScore broker server found on the network.");
                System.err.println("   Make sure the server is running and on the same network.");
                System.exit(1);
            }

            System.out.println("Found server at " + server.getAddress() + ":" + server.getPort());
            System.out.println("   WebSocket URL: " + server.getWsUrl());
            System.out.println("\nTo connect, use the WebSocket URL shown above.");
        } catch (IOException e) {
            System.err.println("Discovery failed: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}

