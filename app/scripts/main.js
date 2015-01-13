
$(function() {
  // what level we toggle zip detail
  var DETAIL_ZOOM = 7

  $("#map").height($(window).innerHeight() - 100);

  L.mapbox.accessToken = 'pk.eyJ1IjoiemVldmwiLCJhIjoicFJzVU8zMCJ9.q6b4Uw5qGAULFaNrCGM7DA';

  var map = L.mapbox.map('map', 'zeevl.kmnm0b2n')
    .setView([37.02, -98.965], 4)
    .on('zoomend', zoomChanged)
    .on('moveend', positionChanged);

  var statesLayer = omnivore.topojson('../topo/states.json', null, L.geoJson(null, {
    style: getStyle,
    onEachFeature: onEachFeature
  })
  ).addTo(map);

  var ziplayers = {};
  

  function getStyle(feature) {
    fillColor = feature.properties.density ?
      getColor(feature.properties.density) :
      getZipColor(feature.properties.zip);

    return {
        weight: 2,
        opacity: 0.1,
        color: 'black',
        fillOpacity: 0.7,
        fillColor: fillColor
    };
  }

  var pallet = [
    'rgb(247,251,255)',
    'rgb(222,235,247)',
    'rgb(198,219,239)',
    'rgb(158,202,225)',
    'rgb(107,174,214)',
    'rgb(66,146,198)',
    'rgb(33,113,181)',
    'rgb(8,69,148)'
  ];

  function getColor(d) {
    return d > 1000 ? pallet[0] :
      d > 500  ? pallet[1] :
      d > 200  ? pallet[2] :
      d > 100  ? pallet[3] :
      d > 50   ? pallet[4] :
      d > 20   ? pallet[5] :
      d > 10   ? pallet[6] :
      pallet[7];
  }

  function getZipColor(zip) {
    return pallet[zip % 5]
  }

  function zoomChanged() {
    if(map.getZoom() > DETAIL_ZOOM) {
      map.removeLayer(statesLayer);
      showVisibleZipcodes();
    }
    else {
      if(map.hasLayer(statesLayer))
        return;

      for(var key in ziplayers) {
        if(ziplayers.hasOwnProperty(key)) 
          map.removeLayer(ziplayers[key]);
      }

      map.addLayer(statesLayer);
    }
  }

  function positionChanged() {
    if(map.getZoom() <= DETAIL_ZOOM)
      return;

    showVisibleZipcodes();
  }

  function showVisibleZipcodes() {
    var states = getVisibleStates();

    var removeStates = _.difference(_.keys(ziplayers), states);
    _.each(removeStates, function(state) {
      map.removeLayer(ziplayers[state]);
      delete ziplayers[state];
    });

    _.each(states, function(state) {
      if(!ziplayers[state]) {
        ziplayers[state] = omnivore.topojson('../topo/' + state + '-zipcodes-10m.json', 
          null, 
          L.geoJson(null, {
            style: getStyle,
            onEachFeature: onEachFeature
          })
        );
      }

      if(!map.hasLayer(ziplayers[state])) {
        map.addLayer(ziplayers[state]);
      }      
    });

  }

  function onEachFeature(feature, layer) {
      // layer.on({
      //     mousemove: mousemove,
      //     mouseout: mouseout,
      //     click: zoomToFeature
      // });
  }

  function getVisibleStates() {
    var states = [];
    var viewport = map.getBounds();

    for(i = 0; i < stateBoxes.length; i++) {
      var box = stateBoxes[i]
      if(viewport._northEast.lat < box.sw[0]) continue;
      if(viewport._northEast.lng < box.sw[1]) continue;
      if(viewport._southWest.lat > box.ne[0]) continue;
      if(viewport._southWest.lng > box.ne[1]) continue;
      states.push(box.state);
    }

    return states;
  }


// lat/long extremes of each state
//
stateBoxes = [
  { state: 'me',
    ne: [ 47.4592, -66.9804 ],
    sw: [ 43.0595, -71.0831 ] },
  { state: 'ma',
    ne: [ 42.8724, -69.9358 ],
    sw: [ 41.4957, -73.4859 ] },
  { state: 'mi',
    ne: [ 48.1176, -82.4122 ],
    sw: [ 41.6977, -90.4193 ] },
  { state: 'mt',
    ne: [ 49.0005, -104.043 ],
    sw: [ 44.4475, -116.0508 ] },
  { state: 'nv',
    ne: [ 42.0007, -114.0445 ],
    sw: [ 35.001, -120.0033 ] },
  { state: 'nj',
    ne: [ 41.3573, -73.9004 ],
    sw: [ 39.1574, -75.5583 ] },
  { state: 'ny',
    ne: [ 45.0124, -72.1163 ],
    sw: [ 40.5417, -79.7631 ] },
  { state: 'nc',
    ne: [ 36.5872, -75.7145 ],
    sw: [ 33.8524, -84.3223 ] },
  { state: 'oh',
    ne: [ 41.9783, -80.52 ],
    sw: [ 38.4204, -84.8209 ] },
  { state: 'pa',
    ne: [ 42.2701, -74.6933 ],
    sw: [ 39.7186, -80.52 ] },
  { state: 'ri',
    ne: [ 42.0195, -71.2273 ],
    sw: [ 41.3198, -71.858 ] },
  { state: 'tn',
    ne: [ 36.6508, -81.6793 ],
    sw: [ 34.986, -90.3112 ] },
  { state: 'tx',
    ne: [ 36.5012, -93.5489 ],
    sw: [ 25.8874, -106.62 ] },
  { state: 'ut',
    ne: [ 42.0007, -109.0467 ],
    sw: [ 36.9988, -114.0505 ] },
  { state: 'wa',
    ne: [ 49.0005, -116.9158 ],
    sw: [ 45.5474, -124.7067 ] },
  { state: 'wi',
    ne: [ 46.9578, -87.0495 ],
    sw: [ 42.4908, -92.8822 ] },
  { state: 'pr',
    ne: [ 18.506, -65.6349 ],
    sw: [ 17.9336, -67.2688 ] },
  { state: 'md',
    ne: [ 39.7224, -75.0477 ],
    sw: [ 37.949, -79.4868 ] },
  { state: 'al',
    ne: [ 34.9972, -84.893 ],
    sw: [ 30.2496, -88.4731 ] },
  { state: 'ak',
    ne: [ 71.2869, -129.9808 ],
    sw: [ 52.7941, 172.6288 ] },
  { state: 'az',
    ne: [ 36.9988, -109.0467 ],
    sw: [ 31.3308, -114.8134 ] },
  { state: 'ar',
    ne: [ 36.5012, -89.6565 ],
    sw: [ 33.0032, -94.6182 ] },
  { state: 'ca',
    ne: [ 42.0082, -114.1346 ],
    sw: [ 32.5355, -124.4124 ] },
  { state: 'co',
    ne: [ 41.0018, -102.0427 ],
    sw: [ 36.9913, -109.0588 ] },
  { state: 'ct',
    ne: [ 42.0494, -71.798 ],
    sw: [ 40.9869, -73.7262 ] },
  { state: 'de',
    ne: [ 39.8009, -75.0477 ],
    sw: [ 38.4503, -75.7865 ] },
  { state: 'dc',
    ne: [ 38.9966, -76.9098 ],
    sw: [ 38.7908, -77.1201 ] },
  { state: 'fl',
    ne: [ 31.0016, -80.0334 ],
    sw: [ 25.1204, -87.6321 ] },
  { state: 'ga',
    ne: [ 35.001, -80.8864 ],
    sw: [ 30.5676, -85.6078 ] },
  { state: 'hi',
    ne: [ 22.221, -154.8133 ],
    sw: [ 18.9175, -159.757 ] },
  { state: 'id',
    ne: [ 49.0005, -111.047 ],
    sw: [ 41.9933, -117.2402 ] },
  { state: 'il',
    ne: [ 42.5096, -87.512 ],
    sw: [ 36.9838, -91.4946 ] },
  { state: 'in',
    ne: [ 41.7613, -84.8029 ],
    sw: [ 37.7844, -88.0286 ] },
  { state: 'ia',
    ne: [ 43.501, -90.1611 ],
    sw: [ 40.3771, -96.6305 ] },
  { state: 'ks',
    ne: [ 40.0029, -94.6062 ],
    sw: [ 36.9913, -102.0547 ] },
  { state: 'ky',
    ne: [ 39.1163, -81.9676 ],
    sw: [ 36.4974, -89.4162 ] },
  { state: 'la',
    ne: [ 33.0181, -89.0257 ],
    sw: [ 29.0075, -94.0415 ] },
  { state: 'mn',
    ne: [ 49.3859, -89.6985 ],
    sw: [ 43.501, -97.2312 ] },
  { state: 'ms',
    ne: [ 34.9972, -88.1007 ],
    sw: [ 30.1823, -91.6267 ] },
  { state: 'mo',
    ne: [ 40.6128, -89.1339 ],
    sw: [ 35.9961, -95.7655 ] },
  { state: 'ne',
    ne: [ 42.9996, -95.309 ],
    sw: [ 39.9992, -104.055 ] },
  { state: 'nh',
    ne: [ 45.3042, -70.7047 ],
    sw: [ 42.6966, -72.5428 ] },
  { state: 'nm',
    ne: [ 36.9988, -103.0038 ],
    sw: [ 31.3308, -109.0528 ] },
  { state: 'nd',
    ne: [ 49.0005, -96.5644 ],
    sw: [ 45.9365, -104.049 ] },
  { state: 'ok',
    ne: [ 36.9988, -94.432 ],
    sw: [ 33.6392, -103.0038 ] },
  { state: 'or',
    ne: [ 46.2582, -116.4653 ],
    sw: [ 41.9933, -124.5506 ] },
  { state: 'sc',
    ne: [ 35.1992, -78.5437 ],
    sw: [ 32.0342, -83.3372 ] },
  { state: 'sd',
    ne: [ 45.944, -96.4443 ],
    sw: [ 42.4908, -104.055 ] },
  { state: 'vt',
    ne: [ 45.0124, -71.5036 ],
    sw: [ 42.7265, -73.4378 ] },
  { state: 'va',
    ne: [ 39.4642, -75.2399 ],
    sw: [ 36.5423, -83.6736 ] },
  { state: 'wv',
    ne: [ 40.6389, -77.7208 ],
    sw: [ 37.2083, -82.6344 ] },
  { state: 'wy',
    ne: [ 45.0012, -104.055 ],
    sw: [ 40.9981, -111.053 ] } ];


});