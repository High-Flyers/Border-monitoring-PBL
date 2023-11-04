# Webcam (Flir thermal camera in our case) Recording and Image Capture

This script allows you to capture video from your webcam, start and stop recording, and save individual frames as images. Below is an explanation of how the script works and how to use it.

## Prerequisites

Before using the script, make sure you have the following prerequisites:
- Python installed on your system
- OpenCV (cv2) library installed. You can install it using `pip` with `pip install opencv-python`.

## Usage

1. Run the script in your Python environment.

2. The script will open your default webcam (camera 0).

3. The script allows you to perform the following actions using keyboard commands:

   - Press `q` to start and stop recording video. A new video file will be created for each recording session.
   
   - Press `space` to capture a photo. Each photo will be saved as a separate image file in the specified directory.

4. Video files will be saved in the directory specified by `photodir`. If the directory does not exist, it will be created automatically.

5. Captured photos will be saved as image files in the same directory.

6. To exit the script, press `Esc` (the `27` key code).

## Customization

You can customize the script by modifying the following variables:

- `photodir`: Specify the directory where video files and captured photos will be saved.

- `width` and `height`: Define the width and height of the video frames.

- `writer`: Customize the video writer settings, such as codec and frame rate.

- You can also adjust other parameters to meet your requirements.

Feel free to modify and enhance the script to suit your specific needs or integrate it into your projects.

## License

This script is provided under the [MIT License](LICENSE).
