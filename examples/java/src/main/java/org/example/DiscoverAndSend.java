package org.example;

import javax.jmdns.JmDNS;
import javax.jmdns.ServiceInfo;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.net.InetAddress;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;

public class DiscoverAndSend {
    private static final String SERVICE_TYPE = "_flowscore._tcp.local.";

    static class Broker {
        String name;
        String host;
        int port;
        String path;
        Broker(String name, String host, int port, String path) {
            this.name = name; this.host = host; this.port = port; this.path = path;
        }
        @Override public String toString() {
            return String.format("%s -> ws://%s:%d%s", name, host, port, path);
        }
    }

    public static List<Broker> discoverBrokers(long timeoutMs) throws IOException {
        List<Broker> brokers = new ArrayList<>();
        // Let JmDNS choose the appropriate network interface
        try (JmDNS jmdns = JmDNS.create()) {
            ServiceInfo[] infos = jmdns.list(SERVICE_TYPE, (int) timeoutMs);
            for (ServiceInfo info : infos) {
                String[] hosts = info.getHostAddresses();
                if (hosts == null || hosts.length == 0) continue;
                // Only use IPv4 addresses (skip IPv6)
                String host = null;
                for (String h : hosts) {
                    // IPv4 addresses don't contain colons (except in some edge cases)
                    // IPv6 addresses contain colons, so we check for absence of colons
                    if (h.indexOf(':') < 0) {
                        host = h;
                        break;
                    }
                }
                // Skip this broker if no IPv4 address found
                if (host == null) continue;
                int port = info.getPort();
                String path = info.getPropertyString("path");
                if (path == null || path.isEmpty()) path = "/ws";
                brokers.add(new Broker(info.getName(), host, port, path));
            }
        }
        return brokers;
    }

    static class SimpleClient extends WebSocketClient {
        public SimpleClient(URI serverUri) { super(serverUri); }
        @Override public void onOpen(ServerHandshake handshake) { System.out.println("Connected"); }
        @Override public void onMessage(String message) { System.out.println("Message: " + message); }
        @Override public void onClose(int code, String reason, boolean remote) { System.out.println("Closed: " + reason); }
        @Override public void onError(Exception ex) { System.out.println("Error: " + ex.getMessage()); }
    }

    public static void main(String[] args) throws Exception {
        if (args.length < 1) {
            System.out.println("Usage: DiscoverAndSend <path-to-mei-file>");
            return;
        }
        String meiPath = args[0];
        File f = new File(meiPath);
        if (!f.exists()) {
            System.out.println("MEI file not found: " + meiPath);
            return;
        }

        System.out.println("Discovering FlowScore brokers (mDNS)...");
        List<Broker> brokers = discoverBrokers(5000);
        if (brokers.isEmpty()) {
            System.out.println("No brokers found on the local network.");
            return;
        }

        for (int i = 0; i < brokers.size(); i++) {
            System.out.println("  " + (i + 1) + ") " + brokers.get(i));
        }

        // Allow optional selection index as second CLI argument
        int idx = 1;
        if (args.length >= 2) {
            try { idx = Integer.parseInt(args[1]); } catch (NumberFormatException ignored) {}
        } else {
            System.out.print("Select broker [1]: ");
            Scanner sc = new Scanner(System.in);
            String line = null;
            try {
                if (System.console() != null) {
                    line = System.console().readLine();
                } else if (sc.hasNextLine()) {
                    line = sc.nextLine();
                }
            } catch (Exception ignored) {}
            if (line != null) {
                line = line.trim();
                if (!line.isEmpty()) {
                    try { idx = Integer.parseInt(line); } catch (NumberFormatException ignored) {}
                }
            } else {
                System.out.println("No interactive input detected; defaulting to 1.");
            }
        }
        if (idx < 1 || idx > brokers.size()) {
            System.out.println("Invalid selection");
            return;
        }
        Broker b = brokers.get(idx - 1);
        String url = String.format("ws://%s:%d%s?type=provider", b.host, b.port, b.path);
        System.out.println("Connecting to " + url);

        SimpleClient client = new SimpleClient(new URI(url));
        client.connectBlocking();
        try (BufferedReader br = new BufferedReader(new FileReader(f))) {
            StringBuilder sb = new StringBuilder();
            String l;
            while ((l = br.readLine()) != null) sb.append(l).append('\n');
            client.send(sb.toString());
            System.out.println("MEI file sent.");
        }
        client.closeBlocking();
    }
}


