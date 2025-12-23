# IoD50 - Imagery Object Detection
#### Video Demo:  <https://youtu.be/_EtAuQGjsKI> `OUTDATED`
#### Description:
This web application allows object detection (airplanes) on satellite images. It uses [yolov8n](https://github.com/arngolo/tfjs-models/tree/main/yolov8n-airplanes) tensorflow.js object detection model trained on Airplanes Detection Dataset from the Kaggler [mrcsgh](https://www.kaggle.com/datasets/mgarch/airplane-detection-dataset).

A canvas is generated from the `img` tags derived from leaflet map using [static-map](https://github.com/rkaravia/static-map), converted into an image (mosaic) saved in the server blob (`canvas.toBlob`) that will be used as input for the model to make predictions:  
Install static map as:  
```npm install @rz0/static-map```  
and add the link as bellow in your html:  
```<script type="text/javascript" src="node_modules\@rz0\static-map/static-map.js"></script>```

