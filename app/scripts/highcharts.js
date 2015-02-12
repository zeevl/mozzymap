
$(function() {
  $("#map").height($(window).innerHeight() - 100);

  var level = 0;
  var drillingDown = false;
  var state = '';
  var currentCountyFeature = null;
  var fail = null;


  function onDrilldown(e) {
    if (drillingDown)
      return;

    drillingDown = true;

    console.log(e);

    if (e.seriesOptions) {
      console.log("** e.seriesOptions!");
      return;
    }


    var chart = this;
    var url = '';
    var key = '';
    level++;

    switch(level) {
      case 1:
        state = e.point.drilldown;
        key = state;
        url = 'states/' + state + '.json';
        break;

      case 2:
        url = 'counties/' + state + '/' + e.point.drilldown + '.json';
        key = 'zipcodes';
        break;
    }

    // Handle error, the timeout is cleared on success
    fail = setTimeout(function () {
      chart.showLoading('<i class="icon-frown"></i> Failed loading ' + e.point.name);

      fail = setTimeout(function () {
        chart.hideLoading();
      }, 1000);
    }, 3000);

    // Show the spinner
    chart.showLoading('<i class="icon-spinner icon-spin icon-3x"></i>'); // Font Awesome spinner


    if(level == 3) {
      feature = {
        type: 'FeatureCollection',
        features: _.filter(currentCountyFeature.features, function(feature) {
          return feature.id == e.point.drilldown
        })
      };
      addGeoJson(chart, e.point, feature);
      drillingDown = false;
    }
    else {
      // Load the drilldown map
      $.getJSON(url, function (data) {
        feature = topojson.feature(data, data.objects[key]);

        if(level == 2)
          currentCountyFeature = feature

        addGeoJson(chart, e.point, feature);

        drillingDown = false;

      });
    }

    console.log(e.point);
    this.setTitle(null, { text: e.point.name || e.point.drilldown });
  }


  function addGeoJson(chart, point, json) {
    var geojson = Highcharts.geojson(json);

    if(level < 3) {
      // Set a non-random bogus value
      $.each(geojson, function (i) {
        if(level == 1)
          this.drilldown = this.name.toLowerCase().replace(' ', '_').replace('\'', '');

        if(level == 2) {
          this.drilldown = this.properties.name;
        }


        this.value = i;
      });
    }

    // Hide loading and add series
    chart.hideLoading();
    clearTimeout(fail);
    chart.addSeriesAsDrilldown(point, {
      name: point.name,
      data: geojson,
      dataLabels: {
        enabled: true,
        format: '{point.name}'
      }
    });
  }

  function onDrillup() {
    level--;
    this.setTitle(null, { text: 'USA' });
  }


  $.getJSON('countries/us-all.json', function(json) {
    feature = topojson.feature(json, json.objects['us-all']);
    geojson = Highcharts.geojson(feature);

    // Set a non-random bogus value
    $.each(geojson, function (i) {
      this.drilldown = this.properties['postal-code'].toLowerCase();
      this.value = i;
    });

    // Instanciate the map
    $('#map').highcharts('Map', {
      chart : {
        events: {
          drilldown: onDrilldown,
          drillup: onDrillup
        }
      },

      title : {
        text : 'Highcharts Map Drilldown'
      },

      subtitle: {
        text: 'USA',
        floating: true,
        align: 'right',
        y: 50,
        style: {
          fontSize: '16px'
        }
      },

      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle'
      },

      colorAxis: {
        min: 0,
        minColor: '#E6E7E8',
        maxColor: '#005645'
      },

      mapNavigation: {
        enabled: false,
        buttonOptions: {
          verticalAlign: 'bottom'
        }
      },

      plotOptions: {
        map: {
          states: {
            hover: {
              color: '#EEDD66'
            }
          }
        }
      },

      series : [{
        data : geojson,
        name: 'USA',
        dataLabels: {
          enabled: true,
          format: '{point.properties.postal-code}'
        }
      }],

      drilldown: {
        activeDataLabelStyle: {
          color: 'white',
          textDecoration: 'none'
        },
        drillUpButton: {
          relativeTo: 'spacingBox',
          position: {
            x: 0,
            y: 60
          }
        }
      }

    });
  });
});

