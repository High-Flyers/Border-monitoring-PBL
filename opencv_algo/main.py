import cv2
import numpy as np;
 

def detect(img):
    # Read image
    im = cv2.bitwise_not(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
    
    im = cv2.GaussianBlur(im,(5,5),0)
    # ret,th1 = cv2.threshold(im,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)
    # cv2.imshow("GLOBAL", th1)
    # cv2.waitKey(0)


    im = cv2.adaptiveThreshold(im, 
                                255, 
                                cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                cv2.THRESH_BINARY, 
                                101, 
                                15)
    # cv2.imshow("ADAPTIVE", im)
    # cv2.waitKey(0)

    im = cv2.rectangle(im, (310, 25), (395, 50), (255,255,255), -1)


    params = cv2.SimpleBlobDetector_Params()

    params.minThreshold = 5
    params.maxThreshold = 200
    
    # Filter by Area.
    params.filterByArea = True
    params.minArea = 50
    params.maxArea = 200
    
    # Filter by Circularity
    params.filterByCircularity = True
    params.minCircularity = 0.2
    
    # Filter by Convexity
    params.filterByConvexity = True
    params.minConvexity = 0.4
    
    # Filter by Inertia
    params.filterByInertia = True
    params.minInertiaRatio = 0.1

    # Set up the detector with default parameters.
    detector = cv2.SimpleBlobDetector_create(params)
    
    # Detect blobs.
    keypoints = detector.detect(im)
    
    # Draw detected blobs as red circles.
    # cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS ensures the size of the circle corresponds to the size of blob
    im_with_keypoints = cv2.drawKeypoints(im, keypoints, np.array([]), (0,0,255), cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)

    return im_with_keypoints

vidcap = cv2.VideoCapture('./opencv_algo/video46.mp4')
success,image = vidcap.read()
count = 0
success = True
while success:
  success,image = vidcap.read()

  print(count)
  count += 1
  image = image[20:303, 43:447]
  im = detect(image)

  numpy_horizontal = np.hstack((image, im))
  cv2.imshow('Numpy Horizontal', numpy_horizontal)
  cv2.waitKey(0)
