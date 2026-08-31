let wardLayer;
let map;

// Create the map centered on Edmonton
map = L.map('map').setView([53.5461, -113.4938], 10);

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

        const parser = new DOMParser();
        const kml = parser.parseFromString(kmlText, 'text/xml');

        const geojson = toGeoJSON.kml(kml);

        // Add boundaries to the map
        wardLayer = L.geoJSON(geojson, {

            style: function(feature) {

                const name =
                    feature.properties?.name ||
                    feature.properties?.Name ||
                    'Region';

                const ward = name.toLowerCase();

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

            }

        }).addTo(map);

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


// Find which ward contains an address
function findWard() {

    const streetAddress =
        document.getElementById('streetAddress').value.trim();

    const city =
        document.getElementById('city').value.trim();

    // Make sure both fields have something in them
    if (!streetAddress || !city) {

        document.getElementById('result').innerHTML =
            'Please enter both a street address and city.';

        return;
    }

    document.getElementById('result').innerHTML =
        'Searching for address...';

    // Combine the two fields for geocoding
    const fullAddress =
        streetAddress + ', ' + city + ', Alberta, Canada';

    // Use OpenStreetMap's free geocoding service
    const url =
        'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ca&q=' +
        encodeURIComponent(fullAddress);

    fetch(url)
        .then(response => response.json())
        .then(results => {

            if (!results.length) {

                document.getElementById('result').innerHTML =
                    'Address not found. Please check the street address and city.';

                return;
            }

            const lat = parseFloat(results[0].lat);
            const lon = parseFloat(results[0].lon);

            // Put a marker at the searched address
            const marker = L.marker([lat, lon]).addTo(map);

            marker.bindPopup(
                '<strong>Address</strong><br>' +
                fullAddress
            ).openPopup();

            map.setView([lat, lon], 15);

            document.getElementById('result').innerHTML =
                'Address found. Checking region...';

            // Check each ward polygon
            let foundWard = null;

            wardLayer.eachLayer(function(layer) {

                const geojson = layer.toGeoJSON();

                if (pointInPolygon([lon, lat], geojson.geometry)) {

                    foundWard =
                        layer.feature.properties?.name ||
                        layer.feature.properties?.Name ||
                        'Unknown region';
                }

            });

            if (foundWard) {

                document.getElementById('result').innerHTML =
                    '<strong>Your YSA Ward is:</strong><br>' +
                    foundWard;

            } else {

                document.getElementById('result').innerHTML =
                    '<strong>This address is outside the four YSA wards for ages 18-25.</strong>';

            }

        })
        .catch(error => {

            console.error(error);

            document.getElementById('result').innerHTML =
                'There was a problem searching for that address.';

        });
}


// Determine whether a point is inside a polygon
function pointInPolygon(point, geometry) {

    const x = point[0];
    const y = point[1];

    const coordinates = geometry.coordinates;

    // Polygon
    if (geometry.type === 'Polygon') {
        return polygonContainsPoint(coordinates[0], x, y);
    }

    // MultiPolygon
    if (geometry.type === 'MultiPolygon') {

        for (const polygon of coordinates) {

            if (polygonContainsPoint(polygon[0], x, y)) {
                return true;
            }

        }

    }

    return false;
}


// Ray-casting algorithm
function polygonContainsPoint(polygon, x, y) {

    let inside = false;

    for (
        let i = 0, j = polygon.length - 1;
        i < polygon.length;
        j = i++
    ) {

        const xi = polygon[i][0];
        const yi = polygon[i][1];

        const xj = polygon[j][0];
        const yj = polygon[j][1];

        const intersect =
            ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

        if (intersect) {
            inside = !inside;
        }
    }

    return inside;
}
