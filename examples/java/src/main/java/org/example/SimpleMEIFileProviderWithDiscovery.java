package org.example;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Paths;

/**
 * Example provider that uses SSDP discovery to automatically find and connect to the FlowScore broker server.
 * This demonstrates how to use the discovery client to connect without hardcoding the server URL.
 */
public class SimpleMEIFileProviderWithDiscovery extends WebSocketClient {
    private static final long RECONNECT_INTERVAL = 250;
    private boolean shouldReconnect = true;

    public SimpleMEIFileProviderWithDiscovery(URI serverUri) {
        super(serverUri);
    }

    @Override
    public void onOpen(ServerHandshake handshakedata) {
        System.out.println("Connected to server");
    }

    @Override
    public void onMessage(String message) {
        System.out.println("Received message: " + message);
    }

    @Override
    public void onClose(int code, String reason, boolean remote) {
        System.out.println("Disconnected from server: " + reason);
        reconnect();
    }

    @Override
    public void onError(Exception ex) {
        System.out.println("An error occurred: " + ex.getMessage());
        this.reconnect();
    }

    public void closeBlocking(boolean preventReconnect) throws InterruptedException {
        if (preventReconnect) {
            this.shouldReconnect = false;
        }
        super.closeBlocking();
    }

    @Override
    public void reconnect() {
        if (this.shouldReconnect) {
            new Thread(() -> {
                try {
                    Thread.sleep(RECONNECT_INTERVAL);
                    this.reconnectBlocking();
                } catch (InterruptedException | IllegalStateException e) {
                    System.out.println("Reconnect failed: " + e.getMessage());
                }
            }).start();
        }
    }

    public static void main(String[] args) throws URISyntaxException, InterruptedException, IOException {
        // Discover the server using SSDP
        System.out.println("Discovering FlowScore broker server...");
        FlowScoreDiscovery.DiscoveredServer server = FlowScoreDiscovery.discoverFirstServer();

        if (server == null) {
            System.err.println("No FlowScore broker server found on the network.");
            System.err.println("   Make sure the server is running and on the same network.");
            System.exit(1);
        }

        System.out.println("Found server at " + server.getAddress() + ":" + server.getPort());

        // Connect to the discovered server
        SimpleMEIFileProviderWithDiscovery provider = new SimpleMEIFileProviderWithDiscovery(
            new URI(server.getWsUrl())
        );
        provider.connectBlocking();

        // Read MEI file and send it via web socket
        String filePath = "../Brahms_StringQuartet_Op51_No1.mei";
        String content = new String(Files.readAllBytes(Paths.get(filePath)));
        provider.send(content);
        System.out.println("MEI file was sent successfully!");

        provider.closeBlocking(true);
    }
}

