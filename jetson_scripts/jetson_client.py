import cv2
import time
import subprocess
import base64
from io import BytesIO
import requests
import socketio
from dotenv import load_dotenv
import os

# Run roboflow server
# sudo docker run -it --net=host roboflow/roboflow-inference-server-cpu:latest

load_dotenv()
API_KEY = os.getenv("API_KEY")

SERVER_URL = "http://127.0.0.1:3000/detection"
MODEL_URL = f"http://127.0.0.1:9001/pbl-2023/2?api_key={API_KEY}"

sio = socketio.Client()

mission_active = False

@sio.event
def connect():
    sio.emit("new_drone")
    print('connection established')

@sio.event
def start_mission():
    global mission_active
    mission_active = True
    print('Mission started')

@sio.event
def end_mission():
    global mission_active
    mission_active = False
    cv2.destroyAllWindows()
    print('Mission ended')

@sio.event
def disconnect():
    res = requests.get("http://127.0.0.1:3000/end-mission")
    print(res)
    print('disconnected from server')

sio.connect('http://127.0.0.1:3000')

# cap = cv2.VideoCapture(0)
cap = cv2.VideoCapture('opencv_algo/video46.mp4')

while cap.isOpened():
    if not mission_active:
        time.sleep(1)
        continue

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
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    res = requests.post(MODEL_URL, data=base64_image, headers=headers)

    # Send detection to server
    data = {"timestamp": int(time.time()), "latitude": 90, "longitude": 12, "image": base64_image, "predictions": res.text}
    res = requests.post(SERVER_URL, json=data)

    key = cv2.waitKey(1)
    if key == 27:
        break

sio.disconnect()
cap.release()
cv2.destroyAllWindows()
