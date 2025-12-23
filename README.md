# IoD50 - Imagery Object Detection
#### Video Demo:  <https://youtu.be/_EtAuQGjsKI> `OUTDATED`
#### Description:
This web application allows object detection (airplanes) on satellite images. It uses [yolov8n](https://github.com/arngolo/tfjs-models/tree/main/yolov8n-airplanes) tensorflow.js object detection model trained on Airplanes Detection Dataset from the Kaggler [mrcsgh](https://www.kaggle.com/datasets/mgarch/airplane-detection-dataset).

The map was created using [Leaflet.js](https://leafletjs.com/), an open-source JavaScript library for mobile-friendly interactive maps. The leaflet map is composed of several tiles that are updated at different zoom levels. To be able to use the map as a single input image for the model: `1)` a canvas is generated from the `img` tags derived from the leaflet map using [static-map](https://github.com/rkaravia/static-map) library; `2)` converted into an image (mosaic) saved in the server blob (`canvas.toBlob`) that is later used as input for the model to make predictions:

Install static map as:
```npm install @rz0/static-map```
and add the link as bellow in your html:
```<script type="text/javascript" src="node_modules\@rz0\static-map/static-map.js"></script>```

To draw the bounding boxes of the predicted objects, leaflet rectangle function is used `L.rectangle`. Leaflet rectangle uses a list of SW and NE location tuples. The Yolov8n tensorflow.js model predicts the `central coordinate` (x, y), `width` and `height`. We need to get a list of SW and NE from the predicted format. Another important step is to convert the predicted bounding boxes coordinates from pixel coordinates to latlng coordinates by using leaflets `L.layerPointToLatLng` function. To be able to update the map with the detections during drag action, the function `L.featureGroup` is used to create an additional layer with new objects bounding boxes in the end of zoom/drag action and remove previously created layers in the start of zoom/drag action.
