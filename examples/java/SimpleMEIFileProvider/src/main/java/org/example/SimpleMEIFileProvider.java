package org.example;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class SimpleMEIFileProvider extends WebSocketClient {
    private static final long RECONNECT_INTERVAL = 250;

    public SimpleMEIFileProvider(URI serverUri) {
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

    @Override
    public void reconnect() {
        new Thread(() -> {
            try {
                Thread.sleep(RECONNECT_INTERVAL);
                this.reconnectBlocking();
            } catch (InterruptedException | IllegalStateException e) {
                System.out.println("Reconnect failed: " + e.getMessage());
            }
        }).start();
    }

    public static void main(String[] args) throws URISyntaxException, InterruptedException {
        SimpleMEIFileProvider client = new SimpleMEIFileProvider(new URI("ws://localhost:8765/ws?type=provider"));

        // Wait for successful connection
        client.connect();
        while (!client.isOpen()) {
            Thread.sleep(100);
        }

        // Read MEI file and send it via web socket
        String filePath = "../../Brahms_StringQuartet_Op51_No1.mei";
        try {
            String content = new String(Files.readAllBytes(Paths.get(filePath)));
            client.send(content);
            System.out.println("MEI file was sent.");
        } catch (IOException e) {
            System.out.println("Failed to read file: " + e.getMessage());
        }
    }
}