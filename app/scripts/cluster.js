
// TODO: need to merge the zipcode polygons. Looks like the topojson api
// can do that.  need to compile the smallest zipcodes into one for the merge
// zipcode areas are in us-atlas repo.


$(function() {
  // what level we toggle zip detail
  var COUNTY_ZOOM = 6
  var ZIP_ZOOM = 8

  var map = null;
  var tooltip = null;
  var locationData = null;
  var minScore, maxScore;
  var layers = {counties: {}};

  $("#map").height($(window).innerHeight() - 100);

  $.getJSON('location_data2.json', function(data) {
    locationData = data;

    initMap();
  });

  var ICON_MIN_SIZE = 30;
  var ICON_MAX_SIZE = 100;
  var BIG_ICON_CLUSTER_COUNT = 100;

  var MAX_SCORE = 90;
  var MIN_SCORE = 60;

  function initMap() {
    L.mapbox.accessToken = 'pk.eyJ1IjoiemVldmwiLCJhIjoicFJzVU8zMCJ9.q6b4Uw5qGAULFaNrCGM7DA';

    map = L.mapbox.map('map', 'zeevl.8706ca86', {attributionControl: false, infoControl: true})
      .setView([37.02, -98.965], 4)
      // .on('zoomend', zoomChanged)
      // .on('moveend', positionChanged);

    markers = new L.MarkerClusterGroup({
      showCoverageOnHover: false,
      iconCreateFunction: function(cluster) {
        var childCount = cluster.getChildCount();
        var children = cluster.getAllChildMarkers();

        var total = _.reduce(children, function(memo, child) {
          return memo + child.options.score;
        }, 0);

        var score = Math.round(total / children.length);
        var pct = (score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
        var scoreClass = 'marker-score-' + (Math.round(pct * 10) % 10)

        var size = ((childCount / BIG_ICON_CLUSTER_COUNT) * (ICON_MAX_SIZE - ICON_MIN_SIZE)) + ICON_MIN_SIZE;
        size = Math.round(Math.min(size, 100));

        cluster.bindPopup('<div class="marker-popup">' +
          '<p>Locations: ' + childCount + '</p>' +
          '<p>Average Score: ' + score + '</p></div>');

        // there's a flash as the mouse moves from the outer div to the span..
        // so wait a moment before removing the popup
        var popupTimeout = null;
        cluster.on('mouseover', function(e) {
          clearTimeout(popupTimeout);
          e.target.openPopup();
        });

        cluster.on('mouseout', function(e) {
          popupTimeout = setTimeout(function() {
            e.target.closePopup();
          }, 100);
        });


        return new L.DivIcon({ html: '<div class="marker-score"><span>' + score + '</span></div>',
          className: 'marker-cluster ' + scoreClass,
          iconSize: new L.Point(size, size)
        });
      }
    });

    for(var i = 0; i < locationData.length; i++) {
      var location = locationData[i];
      if(!location.latitude || !location.longitude)
        continue;

      var marker = L.marker(L.latLng(location.latitude, location.longitude), {
        score: location.data.scores,
        title: 'Location ID: ' + i,
        description: 'Location Score: ' + location.data.scores
      });

      marker.bindPopup('<div class="marker-popup">' +
        '<p>Location ID: ' + i + '</p>' +
        '<p>Score: ' + location.data.scores + '</p></div>');

      marker.on('mouseover', function(e) {
        e.target.openPopup();
      });

      marker.on('mouseout', function(e) {
        e.target.closePopup();
      });


      markers.addLayer(marker);
    }

    map.addLayer(markers);
  }

  function getStyle(feature) {
    if(_.isUndefined(feature.properties.score))
      feature.properties.score = getStateScore(feature.properties.abbrev);

    color = getColorForScore(feature.properties.score);
    return {
        weight: 2,
        opacity: 0.1,
        color: 'white',
        fillOpacity: 0.7,
        fillColor: color
    };
  }

  function getZipStyle(feature) {
    return {
        weight: 0,
        opacity: 0.1,
        fillOpacity: 0.7,
        fillColor: getZipColor(feature.properties.zip)

    };
  }

  function getCountiesStyle(feature) {
    if(_.isUndefined(feature.properties.score))
      feature.properties.score = getZipcodesScore(feature.properties.zipcodes);

    var color = getColorForScore(feature.properties.score);

    return {
        weight: 0,
        opacity: 0.1,
        color: 'white',
        fillOpacity: 0.7,
        fillColor: color
    };
  }

  function getZipcodesScore(zipcodes) {
    var locations = 0;
    var total = _.reduce(locationData, function(memo, location) {
      if(zipcodes.indexOf(location.zip_code) > -1) {
        memo += location.data.scores;
        locations++;
      }

      return memo;
    }, 0);

    return (locations == 0 ? 0 : total / locations);
  }



  function getStateScore(name) {
    var lname = name.toLowerCase();
    var locations = 0;
    var total = _.reduce(locationData, function(memo, location) {
      if(location.state.toLowerCase() == lname) {
        locations++;
        memo += location.data.scores;
      }
      return memo;
    }, 0);

    return (locations == 0 ? 0 : total / locations);
  }


  var maxR = 220;
  var maxG = 36;
  var maxB = 36;

  var minR = 0x4a;
  var minG = 0x56;
  var minB = 0x9d;


  function getColorForScore(score) {
    if(!score) {
      return 'rgba(0, 0, 0, 0)';
    }
    var pct = (score - minScore) / (maxScore - minScore);

    return 'rgba(' +
      + Math.round(minR - ((minR - maxR) * pct)) + ','
      + Math.round(minG - ((minG - maxG) * pct)) + ','
      + Math.round(minB - ((minB - maxB) * pct)) + ','
      + '0.8)'
  }

  function zoomChanged() {
    zoom = map.getZoom();
    console.log('zoom: ', zoom);

    if(zoom > ZIP_ZOOM)
      showZipcodeLayer();
    else if(zoom >= COUNTY_ZOOM)
      showCountyLayer();
    else
      showStatesLayer();
  }

  function showZipcodeLayer() {
    removeStates();
    removeCounties();
    showVisibleZipcodes();
  }

  function showCountyLayer() {
    removeStates();
    removeZipcodes();
    showVisibleCounties();
  }

  function showStatesLayer() {
    removeZipcodes();
    removeCounties();

    if(!map.hasLayer(layers.states))
      map.addLayer(layers.states);
  }

  function removeStates() {
    map.removeLayer(layers.states);
  }

  function removeZipcodes() {
    for(var key in layers.zipcodes) {
      if(layers.zipcodes.hasOwnProperty(key))
        map.removeLayer(layers.zipcodes[key]);
    }
  }

  function removeCounties() {
    for(var key in layers.counties) {
      if(layers.counties.hasOwnProperty(key))
        map.removeLayer(layers.counties[key]);
    }
  }

  function positionChanged() {
    zoomChanged();
    // if(map.getZoom() <= GROUP_ZOOM)
    //   return;

    // showVisibleZipcodes();
  }

  function showVisibleZipcodes() {
    var states = getVisibleStates();

    var removeStates = _.difference(_.keys(layers.zipcodes), states);
    _.each(removeStates, function(state) {
      map.removeLayer(layers.zipcodes[state]);
      delete layers.zipcodes[state];
    });

    _.each(states, function(state) {
      if(!layers.zipcodes[state]) {
        layers.zipcodes[state] = omnivore.topojson('zipcode/' + state + '.json',
          null,
          L.geoJson(null, {
            style: getZipStyle,
            onEachFeature: onEachFeature
          })
        );
      }

      if(!map.hasLayer(layers.zipcodes[state])) {
        map.addLayer(layers.zipcodes[state]);
      }
    });
  }

  function showVisibleCounties() {
    var states = getVisibleStates();

    var removeStates = _.difference(_.keys(layers.counties), states);
    _.each(removeStates, function(state) {
      map.removeLayer(layers.counties[state]);
      delete layers.counties[state];
    });

    _.each(states, function(state) {
      if(!layers.counties[state]) {
        layers.counties[state] = omnivore.topojson('state-counties/' + state + '.json',
          null,
          L.geoJson(null, {
            style: getCountiesStyle,
            onEachFeature: onEachFeature
          })
        );
      }

      if(!map.hasLayer(layers.counties[state])) {
        map.addLayer(layers.counties[state]);
      }
    });
  }

  function onEachFeature(feature, layer) {
    layer.on({
      mousemove: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    });
  }

  // returns list of states that are visible within the
  // current viewport, by looking for intersections of the maximum bounding
  // box around each state with the viewport box.
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

  function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
      weight: 3,
      color: '#000',
      dashArray: '',
      fillOpacity: 0.7
    });

    tooltip.show(e.containerPoint,
      '<b>' + layer.feature.properties.name + '</b><br />' +
      '<p>Avg. Score: ' + layer.feature.properties.score.toFixed(2) + '</b>');

    // layer.bringToFront causes problems on ie and opera..
    // (http://leafletjs.com/examples/choropleth.html)
    // if (!L.Browser.ie && !L.Browser.opera) {
    //   layer.bringToFront();
    // }

    // info.update(layer.feature.properties);
  }

  function resetHighlight(e) {
    zoom = map.getZoom();

    if(zoom >= ZIP_ZOOM) {
      _.each(layers.zipcodes, function(layer) {
        layer.resetStyle(e.target);
      });
    }
    else if(zoom >= COUNTY_ZOOM) {
      _.each(layers.counties, function(layer) {
        layer.resetStyle(e.target);
      });
    }
    else
      layers.states.resetStyle(e.target);

    // info.update();
  }

  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
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


var stateAbbrevs = {
  'alabama': 'al',
  'alaska': 'ak',
  'arizona': 'az',
  'arkansas': 'ar',
  'california': 'ca',
  'colorado': 'co',
  'connecticut': 'ct',
  'delaware': 'de',
  'florida': 'fl',
  'georgia': 'ga',
  'hawaii': 'hi',
  'idaho': 'id',
  'illinois': 'il',
  'indiana': 'in',
  'iowa': 'ia',
  'kansas': 'ks',
  'kentucky': 'ky',
  'louisiana': 'la',
  'maine': 'me',
  'maryland': 'md',
  'massachusetts': 'ma',
  'michigan': 'mi',
  'minnesota': 'mn',
  'mississippi': 'ms',
  'missouri': 'mo',
  'montana': 'mt',
  'nebraska': 'ne',
  'nevada': 'nv',
  'new hampshire': 'nh',
  'new jersey': 'nj',
  'new mexico': 'nm',
  'new york': 'ny',
  'north carolina': 'nc',
  'north dakota': 'nd',
  'ohio': 'oh',
  'oklahoma': 'ok',
  'oregon': 'or',
  'pennsylvania': 'pa',
  'rhode island': 'ri',
  'south carolina': 'sc',
  'south dakota': 'sd',
  'tennessee': 'tn',
  'texas': 'tx',
  'utah': 'ut',
  'vermont': 'vt',
  'virginia': 'va',
  'washington': 'wa',
  'west virginia': 'wv',
  'wisconsin': 'wi',
  'wyoming': 'wy'
};
