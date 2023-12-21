import cv2
import os
import time
import subprocess
import base64
from io import BytesIO
import requests

img = cv2.imread("ok.png")

start = time.time()
_, encoded = cv2.imencode(".png", img)
base64_image = base64.b64encode(encoded.tobytes()).decode('utf-8')
cv2.imwrite("/tmp/detection.png", img)

data = {"timestamp": 12345, "latitude": 90, "longitude": 12, "image": base64_image}

res = requests.post("http://127.0.0.1:3000/detection", json=data)
print(res)

out = subprocess.check_output(f"base64 /tmp/detection.png | curl -d @- \"http://127.0.0.1:9001/pbl-2023/2?api_key=kY5y1URLQQGG8D9Fp5LP\"", shell=True, text=True)
end = time.time()
print(end - start)

print(out)
# cap = cv2.VideoCapture(0)

# width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
# height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# while True:
#     ret, frame = cap.read()

#     cv2.namedWindow('frame', cv2.WND_PROP_FULLSCREEN)
#     cv2.setWindowProperty('frame', cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
#     cv2.imshow('frame', frame)

#     key = cv2.waitKey(1)
#     if key == 27:
#         break

# # Check if writer is not None before trying to release it
# if writer is not None:
#     writer.release()

# cap.release()
# cv2.destroyAllWindows()
