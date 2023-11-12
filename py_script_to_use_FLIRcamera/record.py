import cv2
import os

cap = cv2.VideoCapture(0)

width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

color = 1  # 1

photodir = '/home/hf/Nagrania'

if not os.path.exists(photodir):
    os.makedirs(photodir)

writer = None

save = False

print("Press q to start recording and press q once again to stop. Press space to save a photo")

i = 0
j = 0

while True:
    ret, frame = cap.read()

    if save:
        writer.write(frame)

    cv2.namedWindow('frame', cv2.WND_PROP_FULLSCREEN)
    cv2.setWindowProperty('frame', cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

    screen_width = 1920  # Replace with your screen resolution
    screen_height = 1080  # Replace with your screen resolution

    cv2.resizeWindow('frame', screen_width, screen_height)

    cv2.imshow('frame', frame)

    key = cv2.waitKey(1)

    if key == ord('q'):
        if not save:
            save = True
            print("Started recording")
            while os.path.exists(os.path.join(photodir, f'video{j}.mp4')):
                j += 1
            writer = cv2.VideoWriter(os.path.join(photodir, f'video{j}.mp4'), cv2.VideoWriter_fourcc(*"mp4v"), 9,(width, height))
        else:
            print("Saved video ", j)
            if writer is not None:  # Check if writer is not None before trying to release it
                writer.release()
            writer = None
            save = False
            j += 1
    elif key == 27:
        break

# Check if writer is not None before trying to release it
if writer is not None:
    writer.release()

cap.release()
cv2.destroyAllWindows()
