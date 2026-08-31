// Create the map centered on Edmonton
const map = L.map('map').setView([53.5461, -113.4938], 10);

// Add OpenStreetMap tiles
L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);


// Load the ward boundaries
fetch('wards.kml')
    .then(response => response.text())
    .then(kmlText => {

        // Convert KML into GeoJSON
        const parser = new DOMParser();
        const kml = parser.parseFromString(kmlText, 'text/xml');
        const geojson = toGeoJSON.kml(kml);

        // Add the ward boundaries to the map
        const wardLayer = L.geoJSON(geojson, {

            style: function(feature) {

                const ward = feature.properties.name;

                if (ward === 'Garneau Ward') {
                    return {
                        color: '#f1c40f',
                        weight: 2,
                        fillOpacity: 0.25
                    };
                }

                if (ward === 'Gateway Ward') {
                    return {
                        color: '#e74c3c',
                        weight: 2,
                        fillOpacity: 0.25
                    };
                }

                if (ward === 'Whitemud Creek Ward') {
                    return {
                        color: '#3498db',
                        weight: 2,
                        fillOpacity: 0.25
                    };
                }

                if (ward === 'Windsor Park Ward') {
                    return {
                        color: '#2ecc71',
                        weight: 2,
                        fillOpacity: 0.25
                    };
                }

                return {
                    color: '#333',
                    weight: 2,
                    fillOpacity: 0.25
                };
            },

            onEachFeature: function(feature, layer) {

                if (feature.properties.name) {
                    layer.bindPopup(
                        '<strong>' +
                        feature.properties.name +
                        '</strong>'
                    );
                }

            }

        }).addTo(map);

        // Automatically zoom to the four wards
        map.fitBounds(wardLayer.getBounds());

        document.getElementById('result').innerHTML =
            'Ward boundaries loaded successfully.';

    })
    .catch(error => {

        console.error(error);

        document.getElementById('result').innerHTML =
            'There was a problem loading the ward boundaries.';

    });
