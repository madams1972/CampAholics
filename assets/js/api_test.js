$('#mapbox_form').submit( function(e) {
  e.preventDefault();
  // Gather data from the search form.
  let query = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'+$('#mapbox_search').val().trim()+'.json?access_token=pk.eyJ1IjoiYmluZGVyYiIsImEiOiJjbDh5aDB4YmMwZ2hkM3VubjYxNnkzOGU5In0.-VmsT6OjBY12TuPgeei8bQ';
  let mile_radius = $('#radius').val();
  // Search for the requested location.
  fetch(query)
  .then(function(response) {return response.json()})
  .then(function(data) {
    let s = '';
    $('#results_list').empty();
    if (data.features.length == 0) {
      // No results.
      s += 'Sorry, no results returned.';
    } else {
      // Search found a matching location!
      // First, convert miles into degrees of latitude
      // and longitude.
      let latitude_tolerance = parseFloat(mile_radius) / 69;
      let longitude_tolerance = parseFloat(mile_radius) / 54.6;
      let filtered_nps = window.nps_data.data.filter(e => 
        parseFloat(e.longitude) >= parseFloat(data.features[0].center[0])-longitude_tolerance &&
        parseFloat(e.longitude) <= parseFloat(data.features[0].center[0])+longitude_tolerance &&
        parseFloat(e.latitude) >= parseFloat(data.features[0].center[1])-latitude_tolerance &&
        parseFloat(e.latitude) <= parseFloat(data.features[0].center[1])+latitude_tolerance
      );

      s += 'Place returned: '+data.features[0].place_name+'<br/>';
      s += 'Latitude: '+data.features[0].center[1]+'<br/>';
      s += 'Longitude: '+data.features[0].center[0]+'<br/>';
      s += 'Campgrounds within '+mile_radius+' miles: ';

        if (filtered_nps.length > 0) {
          s += '<ul>';
          for (var i=0;i<filtered_nps.length;i++) {
            s += '<li>';
              s += '<b>'+filtered_nps[i].name+'</b><br/>';
              s += '<b>Distance: </b>'+get_distance_miles(
                {x: filtered_nps[i].latitude, y: filtered_nps[i].longitude},
                {x: data.features[0].center[1], y: data.features[0].center[0]}
              )+' miles away.<br/>';
              s += 'Latitude: '+filtered_nps[i].latitude+'<br/>';
              s += 'Longitude: '+filtered_nps[i].longitude+'<br/>';
              if (filtered_nps[i].images.length > 0) {
                s += '<img height="75" src="'+filtered_nps[i].images[0].url+'"/>';
              } else {
                s += '(no image available)';
              }
            s += '</li>';
          }
          s += '</ul>';
        } else {
          s += '<br/><b>No campgrounds found within '+mile_radius+' miles.</b>';
        }
    }    
    $('#results_list').append(s);
  });
});

function init_map () {
  const map = new Map({
    target: 'map',
    layers: [
      new TileLayer({
        source: new OSM()
      })
    ],
    view: new View({
      center: [0, 0],
      zoom: 2
    })
  });

  // create the marker
  // new mapboxgl.Marker()
  // .setLngLat([-0.1404545, 51.5220163])
  // .addTo(map);

}

function get_distance_miles (coords_1, coords_2) {
  // Radius of Earth, in miles.
  const r = 3958.8;
  // Get coordinates in radians.
  let rad_1 = {
    x: parseFloat(coords_1.x) * (Math.PI/180),
    y: parseFloat(coords_1.y) * (Math.PI/180)
  }
  let rad_2 = {
    x: parseFloat(coords_2.x) * (Math.PI/180),
    y: parseFloat(coords_2.y) * (Math.PI/180)
  }
  // Get cartesian coordinates from lat/long values.
  let cart_1 = {
    x: r*Math.cos(rad_1.x)*Math.cos(rad_1.y),
    y: r*Math.cos(rad_1.x)*Math.sin(rad_1.y),
    z: r*Math.sin(rad_1.x)
  }

  let cart_2 = {
    x: r*Math.cos(rad_2.x)*Math.cos(rad_2.y),
    y: r*Math.cos(rad_2.x)*Math.sin(rad_2.y),
    z: r*Math.sin(rad_2.x)
  }
  // Get linear distance between the two points
  let linear_dist = Math.pow(Math.pow(cart_1.x - cart_2.x,2)+Math.pow(cart_1.y - cart_2.y,2)+Math.pow(cart_1.z - cart_2.z,2),0.5);
  // Get the distance along Earth's surface (arc distance).
  let arc_dist = 2*r*Math.asin(linear_dist/(2*r));
  // Round to the tenth's place.
  return arc_dist.toFixed(1);
}

$( function() {
  // Build the map
  init_map();

  // Pull ALL the park data from the API and store it in
  // a global variable. Have to do this because the NPS API
  // doesn't have an endpoint for city or coordinate-based
  // park searches.
  window.nps_data = [];
  let nps_query = 'https://developer.nps.gov/api/v1/campgrounds?limit=800&api_key=n9ZtO9IBzmlj5LnxQQ1WWSUaPbniCC1eIPJUIX0F';
  fetch(nps_query)
  .then(function(response) {return response.json()})
  .then(function(data) {
    window.nps_data = data;
  });
});