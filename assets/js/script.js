$('#mapbox_form').submit( function(e) {
  e.preventDefault();
  window.user_loc = null;
  // Gather data from the search form.
  let query = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'+$('#mapbox_search').val().trim()+'.json?access_token=pk.eyJ1IjoiYmluZGVyYiIsImEiOiJjbDh5aDB4YmMwZ2hkM3VubjYxNnkzOGU5In0.-VmsT6OjBY12TuPgeei8bQ';
  let mile_radius = $('#radius').val();
  // Search for the requested location.
  fetch(query)
  .then(function(response) {return response.json()})
  .then(function(data) {
    $('#results_list').empty();
    if (data.features.length == 0) {
      // No results.
      $('#results_list').append('<p>Sorry, no results returned. Please try again.</p>');
    } else {
      // Filter the park data down to a list that falls within the specified
      // distance from the user's searched location.
      window.user_loc = data.features[0];
      update_map(window.user_loc.center[0],window.user_loc.center[1]);
      let filtered_nps = window.nps_data.data.filter(e => 
        parseFloat(get_distance_miles(
          {x: e.latitude, y: e.longitude},
          {x: window.user_loc.center[1], y: window.user_loc.center[0]}
        )) < parseFloat(mile_radius)
      );
      // Sort the filtered park list by distance 
      // from the user's searched location.
      filtered_nps.sort(function (a,b) {
        let dist_a = get_distance_miles(
          {x: a.latitude, y: a.longitude},
          {x: window.user_loc.center[1], y: window.user_loc.center[0]}
        );
        let dist_b = get_distance_miles(
          {x: b.latitude, y: b.longitude},
          {x: window.user_loc.center[1], y: window.user_loc.center[0]}
        );
        if (parseFloat(dist_a) > parseFloat(dist_b)) return 1;
        if (parseFloat(dist_b) > parseFloat(dist_a)) return -1;
      });
      // Display location information in results.
      $('#results_list').append(
        '<ul><li><b>Place returned:<br/></b> ' + window.user_loc.place_name + '</li>' +
          '<li><b>Campgrounds within '+mile_radius+' miles:<br/></b> '+filtered_nps.length+' result(s).</li>'+
        '</ul>');
      // Iterate through the list of found 
      if (filtered_nps.length > 0) {
        $('#results_list').append('<ol></ol>');
        for (let i=0;i<filtered_nps.length;i++) {
          // Add an ordered list item for each campsite.
          $('#results_list ol').append('<li><ul id="campsite-' + i + '"></ul></li>');
          // Populate the ordered list with general info about the campsite.
          $('#campsite-'+i).append('<li><b>' + filtered_nps[i].name + '</b></li>');
          $('#campsite-'+i).append('<li><b>Distance: </b>' + get_distance_miles(
            {x: filtered_nps[i].latitude, y: filtered_nps[i].longitude},
            {x: window.user_loc.center[1], y: window.user_loc.center[0]}
          )+' miles away.</li>');
          // Weather data needs to be fetched, so create a placeholder list item
          // for it and populate when the fetch request completes.
          $('#campsite-'+i).append('<li class="weather-data"></li>');
          if (filtered_nps[i].images.length > 0) {
            $('#campsite-' + i).append('<li><img height="75" src="' + filtered_nps[i].images[0].url + '"/></li>');
          } else {
            $('#campsite-' + i).append('<li>(no image available)</li>');
          };

          // Look up the weather conditions at each site
          fetch("https://api.openweathermap.org/data/2.5/forecast?lat=" + filtered_nps[i].latitude + "&lon=" + filtered_nps[i].longitude + "&appid=1168898d2e6677ed97caa56280826004&units=imperial")
          .then(function(response) {return response.json();})
          .then(function(data) {
            $('#campsite-'+i+' .weather-data').append('<b>Weather:</b><ul><li> Temp at Campsite: ' + data.list[0].main.temp + '°F </li>' +
            '<li> Current Weather at Campsite: ' + data.list[0].weather[0].description + '</li></ul>');
          }); 
        }
      } else {
        $('#results_list').append('<p>Sorry, no campsites found within '+mile_radius+' miles.');
      }
    }   
  });
});

function init_map () {
  // WORK IN PROGRESS

  window.map = new ol.Map({
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      })
    ],
    target: 'map',
    view: new ol.View({
      center: [0,0],
      zoom: 2
    })
  });

  // create the marker
  // new mapboxgl.Marker()
  // .setLngLat([-0.1404545, 51.5220163])
  // .addTo(map);

}

function update_map (lon,lat) {
  // console.log(typeof(lat));
  // console.log(window.map.getView());
  // console.log(ol.proj.fromLonLat([0, 0]));
  window.map.getView().animate({
    center: ol.proj.fromLonLat([lon, lat]),
    zoom: 10,
    duration: 500
  });
  // var layer = new ol.layer.Vector({
  //   source: new ol.source.Vector({
  //     features: [
  //       new ol.Feature({
  //         geometry: new ol.geom.Point(ol.proj.fromLonLat([4.35247, 50.84673]))
  //       })
  //     ]
  //   })
  // });
  // map.addLayer(layer);
}

// This function assumes Earth is a perfect sphere, which it isn't...
// but the results should be within ~95% accuracy.
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