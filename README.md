# IoD50 - Imagery Object Detection
#### App Demo: https://arngolo.github.io/IoD50
#### Video Demo:  <https://youtu.be/_EtAuQGjsKI> `OUTDATED`
#### Description:
This web application allows object detection (airplanes) on satellite images. It uses [yolov8n](https://github.com/arngolo/tfjs-models/tree/main/yolov8n-airplanes) tensorflow.js object detection model trained on Airplanes Detection Dataset from the Kaggler [mrcsgh](https://www.kaggle.com/datasets/mgarch/airplane-detection-dataset).

The map was created using [Leaflet.js](https://leafletjs.com/), an open-source JavaScript library for mobile-friendly interactive maps. The leaflet map is composed of several tiles that are updated at different zoom levels. To be able to use the map as a single input image for the model: `1)` a canvas is generated from the `img` tags derived from the leaflet map using [static-map](https://github.com/rkaravia/static-map) library; `2)` converted into an image (mosaic) saved in the server blob (`canvas.toBlob`) and later re-used as input for the model to make predictions:

use static map as:  
```
<script src="https://cdn.jsdelivr.net/npm/@rz0/static-map/static-map.js"></script>
```

## Yolo prediction
The yolov8n tensorflow.js model prediction is a tensor of shape `[nClasses, 5, numBoxes]` where the second element is the number of attributes: `(x, y, width, height, score)`. `predictions.dataSync()` function converts the tensor into a 1D array of size `numAttrs * numBoxes`. The 1D array is split into five sections: all x values first, then all y values, then all widths, all heights, and finally all confidence score values per box in each section.

## Draw predicted rectangles
To draw the bounding boxes of the predicted objects, leaflet rectangle function `L.rectangle` is used. Leaflet rectangle uses a list of SW and NE location tuples. We need to get a list of SW and NE from the yolov8n predicted format. Another important step is to convert the predicted bounding boxes coordinates from pixel coordinates to latlng coordinates by using leaflets `L.layerPointToLatLng` function. To be able to update the map with the detections during drag action, the function `L.featureGroup` is used to create an additional layer with new objects bounding boxes in the end of zoom/drag action and remove previously created layers in the start of zoom/drag action.

## Run model locally (Optional)
This project uses TensorFlow.js, which requires loading models over HTTP. Opening index.html directly with file:// will not work due to browser security (CORS). A server is needed if loading model locally.

- Make sure your model is inside the project. 

```
IoD50/
├── index.html
├── script.js
├── style.css
└── tfjs-models/
    └── yolov8n-airplanes/
        ├── model.json
        └── group1-shard1of3.bin
        └── group1-shard2of3.bin
        └── group1-shard3of3.bin

```

- Start a local HTTP server
```
python -m http.server 8000
```

You should see output similar to:
```
Serving HTTP on :: port 8000 (http://[::]:8000/) ...

```

- Open the application in the browser
```
http://localhost:8000

```

- Load the model
```
const model = await tf.loadGraphModel(
  './tfjs-models/yolov8n-airplanes/model.json'
);
```