var parks_data = require("./parks.json");
console.log(parks_data[0]);

var fs = require("fs");

var filtered_parks = [];
for (let i=0;i<parks_data.length;i++) {
  filtered_parks.push({
    "name" : parks_data[i].name,
    "latitude" : parks_data[i].latitude,
    "longitude" : parks_data[i].longitude,
    "images" : parks_data[i].images
  });
}

fs.writeFileSync("nps_data.json",JSON.stringify(filtered_parks));