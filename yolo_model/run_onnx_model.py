import onnx
import onnxruntime as ort
import numpy as np
import cv2

# Load the ONNX model
onnx_model = onnx.load("./yolo_model/model.onnx")

# Create an ONNX Runtime session
session = ort.InferenceSession(onnx_model.SerializeToString())

# Prepare input data
input_data = cv2.imread("./yolo_model/example-img.png")
input_data = cv2.cvtColor(input_data, cv2.COLOR_BGR2RGB)
input_data.resize((640, 640, 3))
input_data = input_data.astype(np.float32)
input_data = input_data.reshape((1,3,640,640))
print(input_data.shape)

# Make predictions
output = session.run(None, {'onnx::Slice_0': input_data})
print("Model output:", len(output))