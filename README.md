# IoD50 - Imagery Object Detection
#### Video Demo:  <https://youtu.be/_EtAuQGjsKI>
#### Description:
This web application allows object detection (airplanes) on satellite images. It uses [coco-ssd](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd) tensorflow model and a javascript version of tensorflow framework (`tensorflow.js`) to detect objects using the web.

The map was created using [Leaflet.js](https://leafletjs.com/), an open-source JavaScript library for mobile-friendly interactive maps. The leaflet map is composed of several tiles that are updated at different zoom levels. To be able to use the map as a single input image for the model: `1)` a canvas is generated from the `img` tags derived from the leaflet map using [static-map](https://github.com/rkaravia/static-map) library; `2)` converted into an image (mosaic) saved in the server blob (`canvas.toBlob`) that is later used as input for the model to make predictions:

Install static map as:
```npm install @rz0/static-map```
and add the link as bellow in your html:
```<script type="text/javascript" src="node_modules\@rz0\static-map/static-map.js"></script>```

The coco-ssd model used is a pre-trained mobilenetv2 model trained on COCO dataset. By default, the tensorflow.js version uses a lite version of mobilenetv2 model loaded as `cocoSsd.load()`, but the base model can be modified if available in tensorflow hub as `cocoSsd.load({base: 'mobilenet_v2'})`.

To draw the bounding boxes of the predicted objects, leaflet rectangle function is used `L.rectangle`. Leaflet rectangle uses a list of SW and NE location tuples. Tensorflow.js models predict the `top left coordinates`, `width` and `height` of the object's bounding box, hence, it is required to convert top left coordinates (NW) into bottom left coordinates (SW) to get the box starting point. Another important step is to convert the predicted bounding boxes coordinates from pixel coordinates to latlng coordinates by using leaflets `L.layerPointToLatLng` function. To be able to update the map with the detections during drag action, the function `L.featureGroup` is used to create an additional layer with new objects bounding boxes in the end of zoom/drag action and remove previously created layers in the start of zoom/drag action.

TODO
- Fine tune the pre-trained model to perform a better prediction on airplane class with input image resolution to around (640 x 1080, 640 x 640, 420 x 420). Use [cgi-planes-in-satellite-imagery-w-bboxes](https://www.kaggle.com/datasets/aceofspades914/cgi-planes-in-satellite-imagery-w-bboxes) dataset. Currently, the application uses mobilene_v2 model from [tensorflow hub](https://tfhub.dev/tensorflow/ssd_mobilenet_v2/2) trained on coco dataset whose input image resolution is 320 x 320, limiting the map to this same size since downscaling the map resolution to 320 x 320 is not performing well.
