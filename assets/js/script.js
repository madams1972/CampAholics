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
      let filtered_nps = window.nps_data.filter(e => 
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
          $('#results_list ol').append('<li><div id="campsite-' + i + '"></div></li>');
          //Stores the LAT LON data for forecast lookup later
          $('#campsite-'+i).data('lat', filtered_nps[i].latitude);
          $('#campsite-'+i).data('lon', filtered_nps[i].longitude);
          $('#campsite-'+i).data('campname', filtered_nps[i].name);
          //console.log('Campsite'+i+ 'LAT LON Data: '+$('#campsite-'+i).data('lat')+" "+$('#campsite-'+i).data('lon'));
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
            //Add button to view a 5-Day forecast for each campsite
            $('#campsite-'+i+' .weather-data').append('<button class="forecast-button" id="button-for-campsite-'+i+'">View Forecast</button>');
          }); 
        }
      } else {
        $('#results_list').append('<p>Sorry, no campsites found within '+mile_radius+' miles.');
      }
      // Update the map.
      update_map();
    }   
  });
});

//VIEW FORECAST BUTTON
$(document).on('click', '.forecast-button', function () {
  forecast_call($(this).parents(':eq(1)').data('lat'), $(this).parents(':eq(1)').data('lon'), $(this).parents(':eq(1)').data('campname'))
});

function forecast_call (lat, lon, camp) {
  //console.log("Lat Lon being passed into forecast_call function: " + lat + " " +lon);
  fetch("https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon + "&appid=1168898d2e6677ed97caa56280826004&units=imperial")
  .then(function(response) {return response.json();})
  .then(function(data) {

  console.log(data);

    let indexDay = moment.unix(data.list[0].dt).format("MM/DD/YYYY");
    let maxTemp 
    let minTemp
    let humidity = []
    let rainTime 
    let indexRain = false;
  console.log("Showing weather data for: " + camp);
    // Crunches Weather Data
    for (let i = 0; i < data.list.length; i++) {
      //Adds humidity to the array
      humidity.push(data.list[i].main.humidity);
      //Will only keep the highest max temp
      if (maxTemp < data.list[i].main.temp_max || maxTemp === undefined) {
        maxTemp = data.list[i].main.temp_max;
      };
      //Will only keep the lowest temp
      if (minTemp > data.list[i].main.temp_min || minTemp === undefined) {
        minTemp = data.list[i].main.temp_min;
      };
      //Checks for rain if the description for that 3 hour block includes rain at all
      if (data.list[i].weather[0].description.includes('rain')) {
        indexRain = true;
        if (rainTime === undefined) {
          if (moment.unix(data.list[i].dt).format("HH") >= 12) {
            rainTime = moment.unix(data.list[i].dt).format("hh") + " PM";
          } else {
            rainTime = moment.unix(data.list[i].dt).format("hh") + " AM";
          };
          //Removes the first character if it's a 0
          if (rainTime.charAt(0) == 0) {
            rainTime = rainTime.substring(1);
          };
        };
      };
      //Checks for a new day
      if (indexDay != moment.unix(data.list[i].dt).format("MM/DD/YYYY")) {
        //Calculate humidity
        let humidOp = 0;
        for (let x = 0; x < humidity.length; x++) {
          humidOp = humidOp + humidity[x];
        };
        let aveHumid = Math.round(humidOp / humidity.length);
        
        // Make the weather note
        let weatherNote = "Weather data for " + indexDay + ": Max Temp: " + maxTemp + " Min Temp: " + minTemp + " Average Humidity of " + aveHumid + "% "
        if (indexRain) {
          weatherNote += "Expect rain at " + rainTime;
        };
        console.log(weatherNote);
        maxTemp = undefined;
        minTemp = undefined;
        indexRain = false;
        rainTime = undefined;
        humidity = [];
        indexDay = moment.unix(data.list[i].dt).format("MM/DD/YYYY");
      };
    }
  });
}

function init_map () {

  window.map = new ol.Map({
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
        name: "base-layer"
      })
    ],
    target: 'map',
    view: new ol.View({
      center: [0,0],
      zoom: 2
    })
  });

}

function update_map () {
  // Remove all layers.
  let layers_to_remove = [];
  window.map.getLayers().forEach(layer => {
    if (layer.get('name') && (layer.get('name') === "user_layer" || layer.get('name') === "park_layer")) layers_to_remove.push(layer);
  });
  for (let i=0;i<layers_to_remove.length;i++) window.map.removeLayer(layers_to_remove[i]);

  // Marker for the user.
  var user_layer = new ol.layer.Vector({
    name: 'user_layer',
    source: new ol.source.Vector({
      features: [
        new ol.Feature({
          geometry: new ol.geom.Point(ol.proj.fromLonLat([window.user_loc.center[0], window.user_loc.center[1]]))
        })
      ]
    }),
    style: new ol.style.Style({
      image: new ol.style.RegularShape({
        radius1: 10,
        radius2: 5,
        points: 5,
        fill: new ol.style.Fill({
          color: '#FF0000AA'
        }),
        stroke: new ol.style.Stroke({
          color: '#444',
          width: 2
        })
      })
    })
  });
  window.map.addLayer(user_layer);

  // If there are campsite results to display, build a layer
  // and display them here.   
  if ($('ul[id^="campsite-"]').length > 0) {
    
    let park_features = [];
    $('ul[id^="campsite-"]').each(function() {
      park_features.push(
        new ol.Feature({
          geometry: new ol.geom.Point(ol.proj.fromLonLat([$(this).data('lon'), $(this).data('lat')]))
        })
      );
    });
    var park_layer = new ol.layer.Vector({
      name: 'park_layer',
      source: new ol.source.Vector({
        features: park_features
      }),
      style: new ol.style.Style({
        image: new ol.style.RegularShape({
          points: 3,
          radius: 8,
          fill: new ol.style.Fill({
            color: '#00CC00AA'
          }),
          stroke: new ol.style.Stroke({
            color: '#444',
            width: 2
          })
        })
      })
    });
    window.map.addLayer(park_layer);
    // Zooming the map properly requires extra steps when there are
    // multiple markers.
    let bounds = ol.extent.extend(park_layer.getSource().getExtent(),user_layer.getSource().getExtent())
    let geom = ol.geom.Polygon.fromExtent(bounds);
    geom.scale(1.2);
    window.map.getView().fit(geom, {duration: 1000});
    
  } else {
    window.map.getView().animate({
      center: ol.proj.fromLonLat([window.user_loc.center[0], window.user_loc.center[1]]),
      zoom: 10,
      duration: 1000
    });
  }


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


  // UPDATE: The code below is no longer necessary.
  // Park data is now stored in a local file, which was fetched from the
  // NPS API once and then filtered down to a smaller file with only the
  // relevant data using a node.js script.

  // window.nps_data = [];
  // let nps_query = 'https://developer.nps.gov/api/v1/campgrounds?limit=800&api_key=n9ZtO9IBzmlj5LnxQQ1WWSUaPbniCC1eIPJUIX0F';
  // fetch(nps_query)
  // .then(function(response) {return response.json()})
  // .then(function(data) {
  //   window.nps_data = data;
  // });
});