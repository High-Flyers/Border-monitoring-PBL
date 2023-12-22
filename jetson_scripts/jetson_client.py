import cv2
import time
import subprocess
import base64
from io import BytesIO
import requests
import socketio

SERVER_URL = "http://127.0.0.1:3000/detection"
MODEL_URL = "http://127.0.0.1:9001/pbl-2023/2?api_key=[apikey]"

sio = socketio.Client()

@sio.event
def connect():
    print('connection established')

@sio.event
def disconnect():
    print('disconnected from server')

sio.connect('http://89.38.128.27:3000')

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

# cap = cv2.VideoCapture(0)
cap = cv2.VideoCapture('opencv_algo/video46.mp4')

while cap.isOpened():
    ret, frame = cap.read()

    if not ret:
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        continue

    try:
        cv2.namedWindow('frame')
        cv2.setWindowProperty('frame', 200, 200)
        cv2.imshow('frame', frame)
    except:
        continue

    _, encoded = cv2.imencode(".png", frame)
    base64_image = base64.b64encode(encoded.tobytes()).decode('utf-8')

    sio.emit("stream", base64_image)

    # Get detections from roboflow model
    # headers = {"Content-Type": "application/x-www-form-urlencoded"}
    # res = requests.post(MODEL_URL, data=base64_image, headers=headers)
    # print(res.text)

    # # Send detection to server
    # data = {"timestamp": int(time.time()), "latitude": 90, "longitude": 12, "image": base64_image}

    # res = requests.post(SERVER_URL, json=data)
    # print(res.text)

    time.sleep(0.05)

    key = cv2.waitKey(1)
    if key == 27:
        break

cap.release()
cv2.destroyAllWindows()
