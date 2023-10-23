from roboflow import Roboflow
rf = Roboflow(api_key="kY5y1URLQQGG8D9Fp5LP")
project = rf.workspace().project("thermal-detection-of-humans")
model = project.version(1).model

# infer on a local image
model.predict("./yolo_model/example-img.png", confidence=40, overlap=30).save("./yolo_model/prediction.jpg")