# Alternative for YOLO for detecting people on thermal camera

This is a simple opencv algo for detecting people (in out case blobs because drone is flying at 40m above ground) used in case YOLO fails for some reason.

### Usage

`main.py` has a `detect` function which can be used on any image. It also has a simple side-by-side visualization of original frame in input video with processed frame.