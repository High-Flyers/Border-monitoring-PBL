# Webcam (Flir thermal camera in our case) Recording and Image Capture

This folder contains scripts for a save dataset recording (`record.py`) and script for sending detections to a server through http requests (`jetson_client.py`). 

## `record.py` usage

0. OpenCV (cv2) library installed. You can install it using `pip` with `pip install opencv-python`.

1. Run the script in your Python environment.

2. The script will open your default webcam (camera 0).

3. The script allows you to perform the following actions using keyboard commands:

   - Press `q` to start and stop recording video. A new video file will be created for each recording session.
   
   - Press `space` to capture a photo. Each photo will be saved as a separate image file in the specified directory.

4. Video files will be saved in the directory specified by `photodir`. If the directory does not exist, it will be created automatically. If recording will be online for more than `record_duration`, each fragment will be saved as seperate video to prevent data loss.

5. Captured photos will be saved as image files in the same directory.

6. To exit the script, press `Esc` (the `27` key code).



## License

This script is provided under the [MIT License](LICENSE).
