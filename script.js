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

  var coco = cocoSsd.load({base: 'mobilenet_v2'});
  console.log(coco);

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
    console.log(coco);

    if (coco) {
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
      var lon = map.getCenter().lng;
      var lat = map.getCenter().lat;
      var zoom = map.getZoom();
      var staticMap = StaticMap(map_url);

      staticMap.getMap(canvas, lon, lat, zoom, function() {
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
      console.log('staticMap: ', staticMap);
      console.log('canvas width is: ', canvas.width);
      console.log('canvas height is: ', canvas.height);

        //MODEL.DETECT takes 1) the image, video or canvas element, 2) maxNumBoxes and 3) minScore as arguments
        var image = document.getElementById('image');
        console.log("IMAGE: ", image);
        console.log("IMAGE WIDTH: ", image.width);
        console.log("IMAGE HEIGHT: ", image.height);

      coco.then(model => {model.detect(image, 10, 0.3).
        then(function (predictions) {

          // Lets write the predictions to a new paragraph element and
          // add it to the DOM.
          console.log(predictions);
          for (let n = 0; n < predictions.length; n++) {

            // get the map bounds, lat difference and lng difference
            var min_height_width = map.layerPointToLatLng([0, 0]);
            var max_height_width = map.layerPointToLatLng([map.getSize().x, map.getSize().y]);
            console.log("MIN HEIGHT WIDTH: ", min_height_width.lat, min_height_width.lng);
            console.log("MAX HEIGHT WIDTH: ", max_height_width.lat, max_height_width.lng);
            var lat_dif = max_height_width.lat - min_height_width.lat;
            var lng_dif = max_height_width.lng - min_height_width.lng;
            console.log("lat diff: ", lat_dif);
            console.log("lng diff: ", lng_dif);

            // get the map center latlng which will allow us to get dynamic bounds
            console.log("Center lat long: ", map.getCenter().lat, map.getCenter().lng);
            console.log('FRAME: ', map.getCenter().lat - (lat_dif/2), map.getCenter().lng - (lng_dif/2), "//", map.getCenter().lat + (lat_dif/2), map.getCenter().lng + (lng_dif/2));
            var dynamic_min_lat = map.getCenter().lat - (lat_dif/2);
            var dynamic_min_lng = map.getCenter().lng - (lng_dif/2);

            // predictions = [x, y, width, height]
            // box_start = [x, y]; // box_end = [x + width, y + height]
            // Leaflet rectangle uses a list of SW and NE location tuples. tensorflow.js models predict the top left coordinates, width and height
            // we need to convert top left coordinates (NW) into bottom left coordinates (SW)
            var left = predictions[n].bbox[0];
            var right = left + predictions[n].bbox[2];
            var top = predictions[n].bbox[1];
            var bottom = top + predictions[n].bbox[3];
            console.log("left: ", left, "px");
            console.log("right: ", right, "px");
            console.log("top: ", top, "px");
            console.log("bottom: ", bottom, "px");

            // from pixel coordinate to lat long
            var box_west = dynamic_min_lng + pixelDim_to_latlngDim(left, map.getSize().x, lng_dif);
            var box_east = dynamic_min_lng + pixelDim_to_latlngDim(right, map.getSize().x, lng_dif);
            var box_north = dynamic_min_lat + pixelDim_to_latlngDim(top, map.getSize().y, lat_dif);
            var box_south = dynamic_min_lat + pixelDim_to_latlngDim(bottom, map.getSize().y, lat_dif);
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
              .setContent(`${predictions[n].class}: ${predictions[n].score.toFixed(2)}%`)
              .setLatLng(rect_ne).addTo(layerGroup);

            console.log('RECTANGLE: ', rectangle);
            // console.log('TEST: ', box_start, box_end);


            console.log(predictions[n]).class;
          };

        });
      });
    }
  });
});

function pixelDim_to_latlngDim(desired_size, map_size_x_y, lat_long_diff) {
  // takes x or y dimension and converts to lat or lng dimension given the lat difference or lng difference between 2 points.
  //for example, given the lat difference between the min and max lat of a rectangle.
  var result = (desired_size * lat_long_diff) / map_size_x_y;
  return result;
}
