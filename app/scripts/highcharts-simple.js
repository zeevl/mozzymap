$(function() {
  $("#map").height($(window).height());
  $.getJSON('wa-from-shp.geojson', function(geojson) {
    console.log(geojson);
    $('#map').highcharts('Map', {
        series: [{
            mapData: geojson
        }]
    });
  });

});
