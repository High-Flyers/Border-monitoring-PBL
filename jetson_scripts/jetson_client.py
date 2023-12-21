import cv2
import time
import subprocess
import base64
from io import BytesIO
import requests

SERVER_URL = "http://127.0.0.1:3000/detection"
MODEL_URL = "http://127.0.0.1:9001/pbl-2023/2?api_key=[apikey]"

# img = cv2.imread("ok.png")

# start = time.time()
# _, encoded = cv2.imencode(".png", img)
# base64_image = base64.b64encode(encoded.tobytes()).decode('utf-8')

# data = {"timestamp": 12345, "latitude": 90, "longitude": 12, "image": base64_image}

# # Send detection to server
# res = requests.post("http://127.0.0.1:3000/detection", json=data)
# print(res.text)

# # Get detections from roboflow model

# headers = {"Content-Type": "application/x-www-form-urlencoded"}
# res = requests.post("http://127.0.0.1:9001/pbl-2023/2?api_key=kY5y1URLQQGG8D9Fp5LP", data=base64_image, headers=headers)
# print(res.text)

# end = time.time()
# print(end - start)

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()

    cv2.namedWindow('frame', cv2.WND_PROP_FULLSCREEN)
    cv2.setWindowProperty('frame', cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
    cv2.imshow('frame', frame)

    _, encoded = cv2.imencode(".png", frame)
    base64_image = base64.b64encode(encoded.tobytes()).decode('utf-8')

    # Get detections from roboflow model
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    res = requests.post(MODEL_URL, data=base64_image, headers=headers)
    print(res.text)

    # Send detection to server
    data = {"timestamp": int(time.time()), "latitude": 90, "longitude": 12, "image": base64_image}

    res = requests.post(SERVER_URL, json=data)
    print(res.text)

    key = cv2.waitKey(1)
    if key == 27:
        break

cap.release()
cv2.destroyAllWindows()
