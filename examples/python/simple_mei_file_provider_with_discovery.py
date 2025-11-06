"""
Example Python provider that uses SSDP discovery to automatically find and connect to the FlowScore broker server.
"""

from websockets.sync.client import connect
from discovery_example import discover_first_server

# Read MEI file
with open('../Bach-JS_BrandenburgConcert_No2_I_BWV1047.mei') as fp:
    mei_string = fp.read()

# Discover the server
print("Discovering FlowScore broker server...")
server = discover_first_server()

if not server:
    print("No FlowScore broker server found on the network.")
    print("   Make sure the server is running and on the same network.")
    exit(1)

print(f"Found server at {server['address']}:{server['port']}")

# Connect and send MEI data
with connect(server['ws_url']) as ws:
    ws.send(mei_string)
    print("MEI data sent successfully!")

