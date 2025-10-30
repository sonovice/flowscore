from websockets.sync.client import connect  # Uses `websockets` library

with open('../Bach-JS_BrandenburgConcert_No2_I_BWV1047.mei') as fp:
    mei_string = fp.read()

with connect("ws://localhost:8765/ws?type=provider") as ws:
    ws.send(mei_string)
