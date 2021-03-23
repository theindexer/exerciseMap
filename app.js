var map;
const dateSlider = document.getElementById('dateSlider');

// various paint expressions
const mostRecent = ['==', ['get', 'mostRecent'], true];
const aged255 = ['-', 255, ['get', 'age']];
const visibilityFilter = ['>', ['get', 'age'], 0];
const isRide = ['==', ['get', 'type'], 'Ride'];
const isWalk = ['==', ['get', 'type'], 'Walk'];
const isRun = ['==', ['get', 'type'], 'Run'];

function rideRunWalk(ride, run, walk, otherwise) {
  return ['case',
    isRide, ride,
    isRun, run,
    isWalk, walk,
    otherwise,
  ]
}

function getVisibilityFilter(isMostRecent, restrictions) {
  var mostRecentFilter = mostRecent;
  if (!isMostRecent) {
    mostRecentFilter = ['!', mostRecentFilter];
  }
  return ['all', mostRecentFilter, visibilityFilter, restrictions];
}

function toggleLayers() {
  document.querySelectorAll('input[type=checkbox]').forEach(e => e.addEventListener('change', e => {
    if (e.target.name == 'age') {
      var ageDegrade = aged255;
      if (!e.target.checked) {
        ageDegrade = 255;
      }
      map.setPaintProperty('all', 'line-color', ['rgb', rideRunWalk(0, ageDegrade, 0, 0), rideRunWalk(ageDegrade, 0, 0, 0), rideRunWalk(0, 0, ageDegrade, 0)]);
    } else {
      const toggleFilter = rideRunWalk(
        document.getElementsByName("ride")[0].checked,
        document.getElementsByName("run")[0].checked,
        document.getElementsByName("walk")[0].checked,
        false);
      map.setFilter('all', getVisibilityFilter(false, toggleFilter));
      map.setFilter('mostRecent', getVisibilityFilter(true, toggleFilter));
    }
  }));
}

function initMap() {
  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN; // defined in credentials.js
   map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/outdoors-v11?optimize=true',
    center: [-72.7, 41.5],
    zoom: 9
  });
}

function readActivities() {
  const swarmInput = document.getElementById('activityjson');
  swarmInput.addEventListener('change', handleJson, false);
}

function handleJson() {
  const file = this.files[0];
  const reader = new FileReader();
  reader.onload = event => {
    addPaths(JSON.parse(reader.result).reverse());
  };
  reader.readAsText(file);
}

function addPaths(rawActivities) {
  let activities = rawActivities.map(a => toActivity(a));
  dateSlider.min = activities[0].date;
  dateSlider.max = activities[activities.length - 1].date;
  dateSlider.value = dateSlider.max;
  lines = toFeatures(activities);

  map.addSource('strava', lines);

  function lineWidth(max) {
    return ['interpolate', ['linear'], ['zoom'], 5, 1, 20, max];
  }
  map.addLayer({
    id: 'all',
    type: 'line',
    source: 'strava',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': ['rgb', rideRunWalk(0, aged255, 0, 0), rideRunWalk(aged255, 0, 0, 0), rideRunWalk(0, 0, aged255, 0)],
      'line-opacity': .5,
      'line-width': lineWidth(4),

    },
    filter: getVisibilityFilter(false, ["literal", true]),
  });
    
  map.addLayer({
    id: 'mostRecent',
    type: 'line',
    source: 'strava',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': ['rgb', rideRunWalk(255, 255, 0, 0), rideRunWalk(255, 128, 255, 0), rideRunWalk(0, 255, 255, 0)],
      'line-width': lineWidth(8),

    },
    filter: getVisibilityFilter(true, ["literal", true]),
  });
//
//  map.addLayer({
//    id: 'ride',
//    type: 'line',
//    source: 'strava',
//    layout: {
//      'line-join': 'round',
//      'line-cap': 'round',
//    },
//    paint: {
//      'line-color': ['rgb', ['case', ['==', ['get', 'mostRecent'], true], 255, 0], ['-', 255, ['get', 'age']], 0],
//      'line-width': ['interpolate', ['linear'], ['zoom'], 1, mostRecentWidth(1), 20, mostRecentWidth(4)],
//
//    },
//    filter: ['all', visibilityFilter, ['==', ['get', 'type'], 'Ride']],
//  });
//  map.addLayer({
//    id: 'run',
//    type: 'line',
//    source: 'strava',
//    layout: {
//      'line-join': 'round',
//      'line-cap': 'round',
//    },
//    paint: {
//      'line-color': ['rgb', ['-', 255, ['get', 'age']], 0, ['case', ['==', ['get', 'mostRecent'], true], 255, 0]],
//      'line-width': lineWidth,
//    },
//    filter: ['all', visibilityFilter, ['==', ['get', 'type'], 'Run']],
//  });
//  map.addLayer({
//    id: 'walk',
//    type: 'line',
//    source: 'strava',
//    layout: {
//      'line-join': 'round',
//      'line-cap': 'round',
//    },
//    paint: {
//      'line-color': ['rgb', 0, ['case', ['==', ['get', 'mostRecent'], true], 255, 0], ['-', 255, ['get', 'age']]],
//      'line-width': lineWidth,
//    },
//    filter: ['all', visibilityFilter, ['==', ['get', 'type'], 'Walk']],
//  });
}

function toActivity(activity) {
  var path = null;
  if (activity.map.summary_polyline) {
    path = polyline.toGeoJSON(activity.map.summary_polyline);
  }
  return {
    name: activity.name,
    type: activity.type,
    date: new Date(activity.start_date_local).getTime(),
    distance: activity.distance,
    elapsedTime: activity.elapsed_time,
    movingTime: activity.moving_time,
    path: path,
  };
}

function toFeatures(activities) {
  activities = activities.filter(a => a.path);
  return {
    'type': 'geojson',
    'data': {
      'type': 'FeatureCollection',
      'features': 
        activities.map(a => {
          return {
            'type': 'Feature',
            'properties': {},
            'properties': {
              'age': (new Date() - a.date) / 1000 / 60 / 60 / 24,
              'time': a.date,
              'type': a.type,
            },
            'geometry': a.path,
          };
        }),
    }
  };
}

const dateOutput = document.getElementById('dateOutput');

dateSlider.oninput = function() {
  const time = parseInt(this.value);
  dateOutput.innerHTML = new Date(time).toISOString().split("T")[0];
  let mostRecentFeature = null;
  lines.data.features.forEach(f => {
    f.properties.age = (time - f.properties.time) / 1000 / 60 /60 / 24;
    f.properties.mostRecent = false;
    if (f.properties.age > 0) {
      mostRecentFeature = f;
    }
  });

  if (mostRecentFeature) {
    mostRecentFeature.properties.mostRecent = true;
    var coordinates = mostRecentFeature.geometry.coordinates;
    var bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
    var curBounds = map.getBounds();
    if (!(curBounds.contains(bounds.getNorthWest()) &&
        curBounds.contains(bounds.getNorthEast()) &&
        curBounds.contains(bounds.getSouthWest()) &&
        curBounds.contains(bounds.getSouthEast()))) {
      map.fitBounds(bounds, {
        duration: 500,
        padding: 60,
        maxZoom: 13,
        easing: i => i,
      });
    }
  }
  map.getSource('strava').setData(lines.data);
}

lastMoveTime = 0;
document.body.addEventListener('keydown', e => {
  if (e.key == ']' || e.key == '[') {
    if (map.isMoving()) {
      lastMoveTime = Date.now();
      return;
    }
    if (Date.now() - lastMoveTime < 1000) {
      return;
    }
    if (e.key == ']') {
      dateSlider.value = dateSlider.valueAsNumber + 1 * 24 * 60 * 60 * 1000;
    } else if (e.key == '[') {
      dateSlider.value = dateSlider.valueAsNumber - 1 * 24 * 60 * 60 * 1000;
    }
    dateSlider.dispatchEvent(new Event('input'));
  }
});

readActivities();
initMap();
toggleLayers();

