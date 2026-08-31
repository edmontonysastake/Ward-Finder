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
    .then(response => {
        if (!response.ok) {
            throw new Error('Could not load wards.kml');
        }
        return response.text();
    })
    .then(kmlText => {

        console.log('KML loaded');

        // Convert KML XML into GeoJSON
        const parser = new DOMParser();
        const kml = parser.parseFromString(kmlText, 'text/xml');

        // Check for XML parsing errors
        const parserError = kml.querySelector('parsererror');

        if (parserError) {
            throw new Error('The KML file could not be parsed.');
        }

        const geojson = toGeoJSON.kml(kml);

        console.log('Converted KML to GeoJSON:', geojson);

        // Add boundaries to the map
        const wardLayer = L.geoJSON(geojson, {

            style: function(feature) {

                // Get the name from the KML
                const name =
                    feature.properties?.name ||
                    feature.properties?.Name ||
                    'Region';

                const ward = name.toLowerCase();

                // Choose colours based on the region name
                if (ward.includes('garneau')) {
                    return {
                        color: '#f1c40f',
                        weight: 3,
                        fillColor: '#f1c40f',
                        fillOpacity: 0.25
                    };
                }

                if (ward.includes('gateway')) {
                    return {
                        color: '#e74c3c',
                        weight: 3,
                        fillColor: '#e74c3c',
                        fillOpacity: 0.25
                    };
                }

                if (ward.includes('whitemud')) {
                    return {
                        color: '#3498db',
                        weight: 3,
                        fillColor: '#3498db',
                        fillOpacity: 0.25
                    };
                }

                if (ward.includes('windsor')) {
                    return {
                        color: '#2ecc71',
                        weight: 3,
                        fillColor: '#2ecc71',
                        fillOpacity: 0.25
                    };
                }

                // Default appearance
                return {
                    color: '#333',
                    weight: 3,
                    fillColor: '#999',
                    fillOpacity: 0.25
                };
            },

            onEachFeature: function(feature, layer) {

                const name =
                    feature.properties?.name ||
                    feature.properties?.Name ||
                    'Region';

                layer.bindPopup(
                    '<strong>' + name + '</strong>'
                );

                // Highlight region when mouse moves over it
                layer.on({
                    mouseover: function(e) {
                        e.target.setStyle({
                            weight: 5,
                            fillOpacity: 0.4
                        });
                    },

                    mouseout: function(e) {
                        wardLayer.resetStyle(e.target);
                    }
                });
            }

        }).addTo(map);

        // Make sure we actually received boundaries
        if (!wardLayer.getLayers().length) {
            throw new Error('No boundaries were found in wards.kml');
        }

        // Zoom map to the boundaries
        map.fitBounds(wardLayer.getBounds());

        document.getElementById('result').innerHTML =
            'Region boundaries loaded successfully.';

    })
    .catch(error => {

        console.error('Boundary loading error:', error);

        document.getElementById('result').innerHTML =
            'There was a problem loading the region boundaries: ' +
            error.message;

    });
