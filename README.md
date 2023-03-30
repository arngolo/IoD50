# IoD50 - Imagery Object Detection
#### Video Demo:  <https://youtu.be/_EtAuQGjsKI>
#### Description:
This web application allows object detection (airplanes) on satellite images. It uses [coco-ssds](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd) tensorflow model and a javascript version of tensorflow framework (`tensorflow.js`) to detect objects using the web.

A canvas is generated from the `img` tags derived from leaflet map using [static-map](https://github.com/rkaravia/static-map), converted into an image (mosaic) saved in the server blob (`canvas.toBlob`) that will be used as input for the model to make predictions:  
Install static map as:  
```npm install @rz0/static-map```  
and add the link as bellow in your html:  
```<script type="text/javascript" src="node_modules\@rz0\static-map/static-map.js"></script>```

TODO
- Fine tune the pre-trained model to perform a better prediction on airplane class with input image resolution to around (640 x 1080, 640 x 640, 420 x 420). Use [cgi-planes-in-satellite-imagery-w-bboxes](https://www.kaggle.com/datasets/aceofspades914/cgi-planes-in-satellite-imagery-w-bboxes) dataset. Currently, the application uses mobilene_v2 model from [tensorflow hub](https://tfhub.dev/tensorflow/ssd_mobilenet_v2/2) trained on coco dataset whose input image resolution is 320 x 320, limiting the map to this same size since downscaling the map resolution to 320 x 320 is not performing well.
