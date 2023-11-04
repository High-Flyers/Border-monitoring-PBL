import cv2
import os

cap= cv2.VideoCapture(0)

width= int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height= int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

color = 1 # 1

photodir = '/home/kris/Nagrania'

if not os.path.exists(photodir):
    os.makedirs(photodir)
    
# writer = cv2.VideoWriter('basicvideo.mp4', cv2.VideoWriter_fourcc(*"mp4v"), 9, (width,heigh    print(key)

writer = None

save = False

print("Press q to start recording and press q once again to stop. Press space to save a photo")

i=0
j=0

# ... (previous code)

while True:
    ret, frame = cap.read()

    # if not color:
    #     frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    if save:
        writer.write(frame)

    cv2.imshow('frame', frame)

    key = cv2.waitKey(1)
    if key == ord(' '):
        cv2.VideoWriter(os.path.join(photodir, f"photo-{i}.png"), frame)
        i += 1
        i += 1
        print("Saved image ", i)
    elif key == ord('q'):
        if not save:
            save = True
            print("Started recording")
            writer = cv2.VideoWriter(os.path.join(photodir, f'video{j}.mp4'), cv2.VideoWriter_fourcc(*"mp4v"), 9, (width, height))
            j += 1
        else:
            print("Saved video ", j)
            if writer is not None:  # Check if writer is not None before trying to release it
                writer.release()
            writer = None
            save = False
    elif key == 27:
        break

# Check if writer is not None before trying to release it
if writer is not None:
    writer.release()

cap.release()
cv2.destroyAllWindows()
