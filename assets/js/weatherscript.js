
window.nps_data = [];
let nps_query = 'https://developer.nps.gov/api/v1/campgrounds?limit=800&api_key=n9ZtO9IBzmlj5LnxQQ1WWSUaPbniCC1eIPJUIX0F';

fetch(nps_query)
.then(function(response) {
    return response.json()})
.then(function(data) {
    console.log(data);
    window.nps_data = data;
});

$('#mapbox_form').submit( function(e) {
    e.preventDefault();

    let query = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'+$('#mapbox_search').val().trim()+'.json?access_token=pk.eyJ1IjoiYmluZGVyYiIsImEiOiJjbDh5aDB4YmMwZ2hkM3VubjYxNnkzOGU5In0.-VmsT6OjBY12TuPgeei8bQ';
    fetch(query)
    .then(function(response) {
        return response.json()
    })
    .then(function(data) {
        console.log(data);
        let s = '';
        $('#results').empty();
        if (data.features.length == 0) {
            $('#results').append('<p>Sorry, no results returned.</p>');
        } else {
            let filtered_nps = window.nps_data.data.filter(e => 
            parseFloat(e.longitude) >= parseFloat(data.features[0].center[0])-1 &&
            parseFloat(e.longitude) <= parseFloat(data.features[0].center[0])+1 &&
            parseFloat(e.latitude) >= parseFloat(data.features[0].center[1])-1 &&
            parseFloat(e.latitude) <= parseFloat(data.features[1].center[1])+1
          );
    
        //s += 'Place returned: '+data.features[0].place_name+'<br/>';
        $('#results').append('<ul> <li>Place returned: ' + data.features[0].place_name + '</li>' +
        //s += 'Latitude: '+data.features[0].center[1]+'<br/>';
        '<li>Latitude: ' + data.features[0].center[1] + '</li>' +
        //s += 'Longitude: '+data.features[0].center[0]+'<br/>';
        '<li>Longitude: ' + data.features[0].center[0] + '</li>' +
        //s += 'Campgrounds within 1 degree latitude/longitude: ';
        '<li> Campgrounds within 1 degree latitude/longitude: </li></ul>');

        console.log(filtered_nps);
        //
        if (filtered_nps.length > 0) {

            console.log("Lat/Lon of Campsite 1 " + filtered_nps[0].latitude + " " + filtered_nps[0].longitude);
            console.log("Lat/Lon of Campsite 2 " + filtered_nps[1].latitude + " " + filtered_nps[1].longitude);
            
            $('#results').append('<ol>');
            for (let i = 0; i < filtered_nps.length; i++) {
                $('#results ol').append('<li> <ul id=campsite-' + i + '></ul> </li>');

                $('#campsite-' + i).append('<li>' + filtered_nps[i].name + '</li>' +
                '<li> Latitude: ' + filtered_nps[i].latitude + '</li>' +
                '<li> Longitude: ' + filtered_nps[i].longitude + '</li>');

                //WEATHER LOOKUP
                fetch("https://api.openweathermap.org/data/2.5/forecast?lat=" + filtered_nps[i].latitude + "&lon=" + filtered_nps[i].longitude + "&appid=1168898d2e6677ed97caa56280826004&units=imperial")
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    console.log('Temp at site: ' + data.list[0].main.temp);
                    $('#campsite-' + i).append('<li> Temp at Campsite: ' + data.list[0].main.temp + '</li>' +
                    '<li> Current Weather at Campsite: ' + data.list[0].weather[0].description + '</li>');
                })
                .then(function() {
                    if (filtered_nps[i].images.length > 0) {
                        $('#campsite-' + i).append('<img height="75" src="' + filtered_nps[i].images[0].url + '"/>');
                    } else {
                        $('#campsite-' + i).append('(no image available)');
                    };
                });
              };
        } else {
            $('#results').append('<p>No campgrounds found within 1 degree latitude/longitude.</p>');
        };
    };
    });
});