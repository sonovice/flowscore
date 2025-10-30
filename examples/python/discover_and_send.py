#!/usr/bin/env python3
import sys
import time
import socket
from dataclasses import dataclass
from typing import List, Optional

from zeroconf import Zeroconf, ServiceBrowser, ServiceStateChange
from websockets.sync.client import connect  # Uses `websockets` library

SERVICE_TYPE = "_flowscore._tcp.local."


@dataclass
class Broker:
    name: str
    host: str
    port: int
    path: str


def discover_brokers(timeout_s: float = 3.0) -> List[Broker]:
    zc = Zeroconf()
    found: List[Broker] = []

    def on_service(
        zeroconf: Zeroconf,
        service_type: str,
        name: str,
        state_change: ServiceStateChange,
    ) -> None:
        if state_change is ServiceStateChange.Added:
            info = zeroconf.get_service_info(service_type, name)
            if not info:
                return
            if not info.addresses:
                return
            host = socket.inet_ntoa(info.addresses[0])
            port = info.port
            props = info.properties or {}
            path = props.get(b"path", b"/ws").decode("utf-8", "ignore")
            found.append(Broker(name=info.name, host=host, port=port, path=path))

    browser = ServiceBrowser(zc, SERVICE_TYPE, handlers=[on_service])
    t0 = time.time()
    try:
        while time.time() - t0 < timeout_s:
            time.sleep(0.1)
    finally:
        zc.close()
    return found


def choose_broker(brokers: List[Broker]) -> Optional[Broker]:
    if not brokers:
        return None
    print("Discovered FlowScore brokers:")
    for i, b in enumerate(brokers, start=1):
        print(f"  {i}) {b.name} -> ws://{b.host}:{b.port}{b.path}")
    choice = input("Select broker [1]: ").strip()
    if not choice:
        return brokers[0]
    try:
        idx = int(choice)
        if 1 <= idx <= len(brokers):
            return brokers[idx - 1]
    except ValueError:
        pass
    print("Invalid selection", file=sys.stderr)
    return None


def send_mei(url: str, mei_path: str) -> None:
    with open(mei_path, "r", encoding="utf-8") as f:
        data = f.read()
    print(f"Connecting to {url} ...")
    with connect(url) as ws:
        print(f"Sending {len(data)} chars from {mei_path} ...")
        ws.send(data)
        print("Done. Closing.")


def main() -> int:
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <path-to-mei-file>")
        return 2

    mei_path = sys.argv[1]

    print("Discovering brokers (mDNS) ...")
    brokers = discover_brokers(timeout_s=3.0)
    if not brokers:
        print("No FlowScore brokers found on the local network.")
        return 1

    broker = choose_broker(brokers)
    if not broker:
        return 1

    url = f"ws://{broker.host}:{broker.port}{broker.path}?type=provider"
    send_mei(url, mei_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
