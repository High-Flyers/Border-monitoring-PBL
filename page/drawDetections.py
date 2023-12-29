import sys
import json
import cv2

cap = cv2.VideoCapture(sys.argv[1])
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

writer = cv2.VideoWriter(sys.argv[2], cv2.VideoWriter_fourcc(*"avc1"), 9, (width, height))

line = sys.stdin.readlines()[0]

detections = json.loads(line)['bboxes']

print(line)
print(detections)
print(type(line), type(detections))

current_detection = 0
current_frame = 0
while cap.isOpened():
    ret, frame = cap.read()

    if not ret:
        break

    if len(detections) <= current_detection:
        current_frame += 1 
        writer.write(frame)
        continue
    
    if current_frame == detections[current_detection]['frame']:
        x = int(detections[current_detection]['x'])
        y = int(detections[current_detection]['y'])
        width = int(detections[current_detection]['width'])
        height = int(detections[current_detection]['height'])
        x1 = int(x-width/2)
        y1 = int(y-height/2)

        frame = cv2.rectangle(frame, (x1, y1), (x1+width, y1+height), (255, 0, 0), 1) 

        current_detection +=1 

    current_frame += 1 
    writer.write(frame)

writer.release()
cap.release()
