$(function() {
  $("#map").height($(window).innerHeight() - 100);

  var locationData = null;
  var minScore, maxScore;

  $.getJSON('location_data.json', function(data) {
    locationData = data;

    maxScore = 0;
    minScore = 100;

    _.each(locationData, function(location) {
      minScore = Math.min(minScore, location.data.scores);
      maxScore = Math.max(maxScore, location.data.scores);
    });

    minScore = Math.max(minScore, 0);

    range = maxScore - minScore;

    initMap();
  });

  function initMap() {
    var po = org.polymaps;
    var map = po.map()
        .container(document.getElementById("map").appendChild(po.svg("svg")))
        .center({lat: 39, lon: -96})
        .zoom(4)
        .zoomRange([3, 7])
        .add(po.interact());

    map.add(po.image()
        .url(po.url('http://api.tiles.mapbox.com/v4/mapbox.streets-basic'
          + '/{Z}/{X}/{Y}.png'
          + '?access_token=pk.eyJ1IjoiemVldmwiLCJhIjoicFJzVU8zMCJ9.q6b4Uw5qGAULFaNrCGM7DA')));


    map.add(po.geoJson()
        .url("http://polymaps.appspot.com/state/{Z}/{X}/{Y}.json")
        .on("load", load))

  }

  function load(e) {
    for (var i = 0; i < e.features.length; i++) {
      var value = getStateScore(e.features[i].data.properties.name);
      var color = getColorForScore(value);

      console.log(e.features[i].element);

      e.features[i].element.setAttribute('fill', color);

      // var feature = e.features[i], d = states[feature.data.id.substring(6)];
      // if (d == undefined) {
      //   feature.element.setAttribute("display", "none");
      // } else {
      //   feature.element.setAttribute("class", "q" + quantile(d) + "-" + 9);
      //   feature.element.appendChild(po.svg("title").appendChild(
      //       document.createTextNode(feature.data.properties.name + ": "
      //       + format(d).replace(/ [ ]+/, " ")))
      //       .parentNode);
      // }
    }
  }

  function getStateScore(name) {
    var abbrev = stateAbbrevs[name.toLowerCase()];
    var locations = 0;
    var total = _.reduce(locationData, function(memo, location) {
      if(location.state.toLowerCase() == abbrev) {
        locations++;
        memo += location.data.scores;
      }
      return memo;
    }, 0);

    return (locations == 0 ? 0 : total / locations);
  }

  var minR = 247;
  var minG = 251;
  var minB = 255;

  var maxR = 8;
  var maxG = 69;
  var maxB = 148;

  function getColorForScore(score) {
    if(!score) {
      return 'rgba(0, 0, 0, 0)';
    }
    var pct = (score - minScore) / (maxScore - minScore);

    console.log('pct ' + (minR - ((minR - maxR) * pct)));

    return 'rgba(' +
      + Math.round(minR - ((minR - maxR) * pct)) + ','
      + Math.round(minG - ((minG - maxG) * pct)) + ','
      + Math.round(minB - ((minB - maxB) * pct)) + ','
      + '0.8)'
  }

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


});
