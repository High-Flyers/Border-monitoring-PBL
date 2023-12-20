import cv2
import os
import time

cap = cv2.VideoCapture(0)

width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

photodir = '/home/hf/Nagrania'

if not os.path.exists(photodir):
    os.makedirs(photodir)

writer = None

save = False

print("Press q to start recording and press q once again to stop. Press space to save a photo")

j = 0
interval = 60 # Interval to save video (in seconds)
record_duration =  60 # Duration to record video (in seconds)
start_time = time.time()

while True:
    ret, frame = cap.read()

    if save:
        if writer is None:
            while os.path.exists(os.path.join(photodir, f'video{j}.mp4')):
                j += 1
            writer = cv2.VideoWriter(os.path.join(photodir, f'video{j}.mp4'), cv2.VideoWriter_fourcc(*"mp4v"), 9, (width, height))

        writer.write(frame)
        current_time = time.time()

        # Check if the recording duration is reached
        if (current_time - start_time) >= record_duration:
            print(f"Saved video {j}")
            writer.release()
            writer = None
            j += 1
            start_time = time.time()

    cv2.namedWindow('frame', cv2.WND_PROP_FULLSCREEN)
    cv2.setWindowProperty('frame', cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

    screen_width = 1920  # Replace with your screen resolution
    screen_height = 1080  # Replace with your screen resolution

    #cv2.resizeWindow('frame', screen_width, screen_height)

    cv2.imshow('frame', frame)

    key = cv2.waitKey(1)

    if key == ord('q'):
        save = not save
        if save:
            print("Started recording")

    elif key == 27:
        break

# Check if writer is not None before trying to release it
if writer is not None:
    writer.release()

cap.release()
cv2.destroyAllWindows()
