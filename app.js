var map;
function initMap() {
  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN; // defined in credentials.js
   map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
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
  let lines = toFeatures(activities);

  map.addSource('strava', lines);
  map.addLayer({
    id: 'ride',
    type: 'line',
    source: 'strava',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': ['rgb', 0, ['-', 255, ['get', 'age']], 0],
      'line-width': 4,
    },
    filter: ['==', ['get', 'type'], 'Ride'],
  });
  map.addLayer({
    id: 'run',
    type: 'line',
    source: 'strava',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': ['rgb', ['-', 255, ['get', 'age']], 0, 0],
      'line-width': 4,
    },
    filter: ['==', ['get', 'type'], 'Run'],
  });
  map.addLayer({
    id: 'walk',
    type: 'line',
    source: 'strava',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': ['rgb', 0, 0, ['-', 255, ['get', 'age']]],
      'line-width': 4,
    },
    filter: ['==', ['get', 'type'], 'Walk'],
  });
}

function toActivity(activity) {
  var path = null;
  if (activity.map.summary_polyline) {
    path = polyline.toGeoJSON(activity.map.summary_polyline);
  }
  return {
    name: activity.name,
    type: activity.type,
    date: activity.start_date_local,
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
              'age': (new Date() - new Date(a.date)) / 1000 / 60 / 60 / 24,
              'type': a.type,
            },
            'geometry': a.path,
          };
        }),
    }
  };
}

readActivities();
initMap();

