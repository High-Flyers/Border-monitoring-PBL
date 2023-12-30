import cv2
import time
import subprocess
import base64
from io import BytesIO
import requests
import socketio
from dotenv import load_dotenv
import os
import json

# Run roboflow server
# sudo docker run -it --net=host roboflow/roboflow-inference-server-cpu:latest

load_dotenv()
API_KEY = os.getenv("API_KEY")

MODEL_URL = f"http://127.0.0.1:9001/pbl-2023/3?api_key={API_KEY}"

cap = cv2.VideoCapture('opencv_algo/video46.mp4')

while cap.isOpened():
    ret, frame = cap.read()

    if not ret:
        break

    # Get detections from roboflow model
    _, encoded = cv2.imencode(".png", frame)
    base64_image = base64.b64encode(encoded.tobytes()).decode('utf-8')
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    res = requests.post(MODEL_URL, data=base64_image, headers=headers)
    
    # Clear detections
    detections = json.loads(res.text)['predictions']
    for det in detections:
        del det['confidence']
        del det['class']
        del det['class_id']

    print(detections)

    for det in detections:
        frame = cv2.circle(frame, (int(det['x']), int(det['y'])), 5, (0,0,255), 2)

    cv2.imshow("okmej", frame)

    key = cv2.waitKey(1)
    if key == 27:
        break

cap.release()
cv2.destroyAllWindows()
