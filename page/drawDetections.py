import sys
import json
import cv2

cap = cv2.VideoCapture(sys.argv[1])
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

writer = cv2.VideoWriter(sys.argv[2], cv2.VideoWriter_fourcc(*"avc1"), 9, (width, height))

while cap.isOpened():
    ret, frame = cap.read()

    if not ret:
        break
    # TODO draw bboxes

    writer.write(frame)

writer.release()
cap.release()
