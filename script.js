/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

/********************************************************************
 * Demo created by Jason Mayes 2020. Modified by armstrong ngolo (https://github.com/arngolo)
 *
 * Got questions? Reach out to me on social:
 * Twitter: @jason_mayes
 * LinkedIn: https://www.linkedin.com/in/creativetech
 ********************************************************************/
document.addEventListener('DOMContentLoaded', function() {

  // Load the yolov8n airplane detector model
  var yolo = tf.loadGraphModel(
    "https://cdn.jsdelivr.net/gh/arngolo/tfjs-models/yolov8n-airplanes/model.json"
  );
  console.log("Model loaded!", yolo);

  function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  function iou(a, b) {
    const interLeft   = Math.max(a.left, b.left);
    const interTop    = Math.max(a.top, b.top);
    const interRight  = Math.min(a.right, b.right);
    const interBottom = Math.min(a.bottom, b.bottom);

    const interW = Math.max(0, interRight - interLeft);
    const interH = Math.max(0, interBottom - interTop);
    const interArea = interW * interH;

    const areaA = (a.right - a.left) * (a.bottom - a.top);
    const areaB = (b.right - b.left) * (b.bottom - b.top);

    return interArea / (areaA + areaB - interArea);
  }

  function nonMaxSuppression(boxes, iouThresh = 0.5, maxDet = 100) {
    // sort by confidence
    boxes.sort((a, b) => b.conf - a.conf);

    const selected = [];

    while (boxes.length && selected.length < maxDet) {
      const best = boxes.shift();
      selected.push(best);

      boxes = boxes.filter(box => iou(best, box) < iouThresh);
    }

    return selected;
  }

  // Create the map
  var map = L.map('map').setView([0, 0], 1);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'openstreet map'
  }).addTo(map);

  // A layerGroup will allow us to add layers into it, then remove the layerGroup without removing the tileLayer.
  var layerGroup = L.featureGroup().addTo(map);

  // // Send custom event when the map is zoomed (action is taken in the end of zoom)
  map.on('zoomend moveend', function () {
    console.log("BOUNDS: ", layerGroup.getBounds());

    layerGroup.clearLayers();


    /********************************************************************
    // Using leaflet map, Continuously grab image from maptiles (tag is img) and classify them
    // upon merge.
    // Note: You must access the maptiles using a map url and iteractively classify the maptiles. Maybe merge the maptiles before classification !!? :
    ********************************************************************/
    // console.log(yolo);

    if (yolo) {
      console.log('model loaded successfully!');

      console.log('zoom level: ', map.getZoom());
      console.log('lat: ', map.getCenter().lat);
      console.log('long: ', map.getCenter().lng);
      console.log('width: ', map.getSize().x);
      console.log('height: ', map.getSize().y);
    }
    else {
      console.log('Wait for model to load before clicking!');
      return;
    }

    if (map.getZoom() > 17) {

      /********************************************************************
      // mosaicing the maptiles into a canvas using static-map API.
      // https://github.com/rkaravia/static-map
      ********************************************************************/
      // Once you have drawn content into a canvas, you can convert it into a file of any supported image format.
      // The code snippet below, for example, takes the image in the <canvas> element whose ID is "map2",
      // obtains a copy of it as a PNG image, then appends a new <img> element to the document,
      // whose source image is the one created using the canvas.
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
      var canvas = document.getElementById('map2');
      canvas.innerHTML = ""; // clear canvas content if exists
      canvas.width = map.getSize().x;
      canvas.height = map.getSize().y;
      canvas.position = "relative"; // relative to its div parent "content"

      var map_url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      var center_lng = map.getCenter().lng;
      var center_lat = map.getCenter().lat;
      var zoom = map.getZoom();
      var staticMap = StaticMap(map_url);

      staticMap.getMap(canvas, center_lng, center_lat, zoom, function() {
        canvas.toBlob(function(blob) {
          console.log("canvas_image: ", blob)
          const newImg = document.getElementById('image');

          // remove (if any) previously created image from blob
          URL.revokeObjectURL(newImg.src);

          const url = URL.createObjectURL(blob);
          newImg.src = url;
          newImg.crossorigin="anonymous";
          console.log(url)
      });

      });
      // console.log('staticMap: ', staticMap);
      console.log('canvas width is: ', canvas.width);
      console.log('canvas height is: ', canvas.height);

      //MODEL.PREDICT has the format:[1, 1024, 1024, 3]
      var image = document.getElementById('image');
      // console.log("IMAGE: ", image);
      console.log("IMAGE WIDTH: ", image.width);
      console.log("IMAGE HEIGHT: ", image.height);

      image.onload = async () => {
        console.log("Image fully loaded → running detection");

        // Preprocess image
        var input = tf.browser.fromPixels(image)
          .resizeBilinear([1024, 1024])   // must match model
          .div(255.0)
          .expandDims(0);               // [1, 1024, 1024, 3] 

        yolo.then(model => {
          console.log("YOLO model loaded");
          

          var predictions = model.predict(input); // Tensor [1, 5, 21504]
          var data = predictions.dataSync(); // 1D array

          var [, numAttrs, numBoxes] = predictions.shape;
          console.log(numAttrs, numBoxes )
          // Lets write the predictions to a new paragraph element and
          // add it to the DOM.
          // for (let n = 0; n < numAttrs; n++) {

          // get the DINAMIC map bounds, lat difference and lng difference
          var bounds = map.getBounds(); 
          var northWest = bounds.getNorthWest();
          var southEast = bounds.getSouthEast();

          var lat_dif = southEast.lat - northWest.lat;
          var lng_dif = southEast.lng - northWest.lng;

          // Leaflet rectangle uses a list of SW and NE location tuples. Yolov8n tensorflow.js model predicts the central coordinate (x, y), width and height
          // we need to get a list of SW and NE from the predicted format.

          //data is an array of size numAttrs * numBoxes. numAttrs = 5 (x, y, width, height, score), so, we will be using a stride of 5.

          const CONF_THRESH = 0.55;
          const detections = [];

          // DECODING DETECTIONS
          for (let i = 0; i < numBoxes; i++) {
            var conf = sigmoid(data[i + 4*numBoxes]);
            if (conf < CONF_THRESH) continue;
            const xc = data[i];
            const yc = data[i + numBoxes];
            const w  = data[i + 2*numBoxes];
            const h  = data[i + 3*numBoxes];


            // From [x_coord, y_coord, width, height] format to top left / right bottom [top, left, right, bottom]
            var left   = xc - w / 2;
            var right  = xc + w / 2;
            var top    = yc - h / 2;
            var bottom = yc + h / 2;

            // detections.push({ xc, yc, w, h, conf });
            detections.push({ left, right, top, bottom, conf });
          }

          // NMS over all detected boxes
          const finalBoxes = nonMaxSuppression(detections, 0.5); // array of plain JavaScript objects

          // DRAWING FILTERED BOXES AFTER NMS
          for (let i = 0; i < finalBoxes.length; i++) {

            var box = finalBoxes[i];

            var left   = box.left;
            var right  = box.right;
            var top    = box.top;
            var bottom = box.bottom;
            var conf   = box.conf;

            console.log("left: ", left, "px");
            console.log("right: ", right, "px");
            console.log("top: ", top, "px");
            console.log("bottom: ", bottom, "px");
            console.log("confidence: ", conf);

            // from pixel coordinate to lat long
            var box_west = northWest.lng + pixelDim_to_latlngDim(left, map.getSize().x, lng_dif);
            var box_east = northWest.lng + pixelDim_to_latlngDim(right, map.getSize().x, lng_dif);
            var box_north = northWest.lat + pixelDim_to_latlngDim(top, map.getSize().y, lat_dif);
            var box_south = northWest.lat + pixelDim_to_latlngDim(bottom, map.getSize().y, lat_dif);
            console.log("box west: ", box_west);
            console.log("box east: ", box_east);
            console.log("box north: ", box_north);
            console.log("box south: ", box_south);

            // [lat, lng]
            var rect_sw = [box_south, box_west];
            var rect_ne = [box_north, box_east];
            var latlngs = [rect_sw, rect_ne];
            console.log('BOX START: ', rect_sw);
            console.log('BOX END: ', rect_ne);

            var rectOptions = {color: 'Red', weight: 1}
            var rectangle = L.rectangle(latlngs, rectOptions);
            rectangle.addTo(layerGroup);

            // // add text to map
            L.tooltip({permanent: true, direction: 'auto'})
              .setContent(`airplane: ${conf.toFixed(2)}%`)
              .setLatLng(rect_ne).addTo(layerGroup);
          };

        });
      }
    }
  });
});

function pixelDim_to_latlngDim(desired_size, map_size_x_y, lat_long_diff) {
  // takes x or y dimension and converts to lat or lng dimension given the lat difference or lng difference between 2 points.
  //for example, given the lat difference between the min and max lat of a rectangle.
  var result = (desired_size * lat_long_diff) / map_size_x_y;
  return result;
}
