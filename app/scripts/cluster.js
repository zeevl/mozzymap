
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

    map = L.mapbox.map('map', 'zeevl.8706ca86')
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
        // maybe use markers.on('clustermouseover', ...) ?
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


        return new L.DivIcon({ html: '<div class="marker-score"><span>'  + childCount + '</span></div>',
          className: 'marker-cluster ' + scoreClass,
          iconSize: new L.Point(size, size)
        });
      }
    });

    var locationFlags = [];
    for(var i = 0; i < locationData.length; i++) {
      var location = locationData[i];
      if(!location.latitude || !location.longitude)
        continue;

      var marker = L.marker(L.latLng(location.latitude, location.longitude), {
        riseOnHover: true,
        score: location.data.scores
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

      // marker.addTo(map);
      locationFlags.push(marker);
    }

    markers.addLayers(locationFlags);
    map.addLayer(markers);
  }


});


