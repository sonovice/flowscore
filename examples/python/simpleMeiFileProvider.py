from websockets.sync.client import connect  # Uses `websockets` library

with open('../Brahms_StringQuartet_Op51_No1.mei') as fp:
    mei_string = fp.read()

with connect("ws://localhost:8765/ws?type=provider") as ws:
    ws.send(mei_string)
