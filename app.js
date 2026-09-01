```javascript
// ============================================================
// Edmonton YSA Ward Finder
// ============================================================

// Create the map centered on Edmonton
const map = L.map('map').setView([53.5461, -113.4938], 10);

// Add OpenStreetMap tiles
L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);


// ============================================================
// Variables
// ============================================================

let wardLayer;


// ============================================================
// Load the ward boundaries from wards.kml
// ============================================================

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


        // ====================================================
        // Add boundaries to the map
        // ====================================================

        wardLayer = L.geoJSON(geojson, {

            style: function(feature) {

                const name =
                    feature.properties?.name ||
                    feature.properties?.Name ||
                    'Ward';

                const ward = name.toLowerCase();


                // Garneau Ward
                if (ward.includes('garneau')) {
                    return {
                        color: '#f1c40f',
                        weight: 3,
                        fillColor: '#f1c40f',
                        fillOpacity: 0.25
                    };
                }


                // Gateway Ward
                if (ward.includes('gateway')) {
                    return {
                        color: '#e74c3c',
                        weight: 3,
                        fillColor: '#e74c3c',
                        fillOpacity: 0.25
                    };
                }


                // Whitemud Creek Ward
                if (ward.includes('whitemud')) {
                    return {
                        color: '#3498db',
                        weight: 3,
                        fillColor: '#3498db',
                        fillOpacity: 0.25
                    };
                }


                // Windsor Park Ward
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


            // =================================================
            // What happens when someone clicks a ward
            // =================================================

            onEachFeature: function(feature, layer) {

                const name =
                    feature.properties?.name ||
                    feature.properties?.Name ||
                    'Ward';

                layer.bindPopup(
                    '<strong>' + name + '</strong>'
                );


                // Highlight ward when mouse moves over it
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


        // Make sure boundaries were found
        if (!wardLayer.getLayers().length) {
            throw new Error('No boundaries were found in wards.kml');
        }


        // Zoom map to the four wards
        map.fitBounds(wardLayer.getBounds());


        document.getElementById('result').innerHTML =
            'Ward boundaries loaded successfully.';

    })


    // ========================================================
    // Error handling for the KML
    // ========================================================

    .catch(error => {

        console.error('Boundary loading error:', error);

        document.getElementById('result').innerHTML =
            'There was a problem loading the ward boundaries: ' +
            error.message;
    });



// ============================================================
// ADDRESS SEARCH
// ============================================================

function findWard() {

    const streetAddress =
        document.getElementById('address').value.trim();

    const city =
        document.getElementById('city').value.trim();


    // Make sure both fields have something in them
    if (!streetAddress || !city) {

        document.getElementById('result').innerHTML =
            '<strong>Please enter both your street address and city.</strong>';

        return;
    }


    // Show that the search is happening
    document.getElementById('result').innerHTML =
        'Searching for your address...';


    // Combine the address fields
    const fullAddress =
        streetAddress + ', ' + city + ', Alberta, Canada';


    // ========================================================
    // Use OpenStreetMap/Nominatim to find the address
    // ========================================================

    const url =
        'https://nominatim.openstreetmap.org/search?format=json' +
        '&q=' + encodeURIComponent(fullAddress) +
        '&limit=1';


    fetch(url, {
        headers: {
            'Accept': 'application/json'
        }
    })

        .then(response => {

            if (!response.ok) {
                throw new Error('Unable to search for the address.');
            }

            return response.json();
        })


        .then(data => {

            if (!data.length) {

                document.getElementById('result').innerHTML =
                    '<strong>Address not found.</strong><br>' +
                    'Please check the address and make sure you included NW or SW.';

                return;
            }


            // Get the coordinates returned by the address search
            const lat =
                parseFloat(data[0].lat);

            const lon =
                parseFloat(data[0].lon);


            console.log('Address coordinates:', lat, lon);


            // =================================================
            // Put a marker on the address
            // =================================================

            if (window.addressMarker) {
                map.removeLayer(window.addressMarker);
            }


            window.addressMarker =
                L.marker([lat, lon])
                    .addTo(map);


            // Zoom to the address
            map.setView([lat, lon], 14);


            // =================================================
            // Determine which ward contains the address
            // =================================================

            let foundWard = null;


            wardLayer.eachLayer(function(layer) {

                if (foundWard) {
                    return;
                }


                const feature =
                    layer.feature;


                if (!feature || !feature.geometry) {
                    return;
                }


                if (
                    pointInPolygon(
                        [lon, lat],
                        feature.geometry
                    )
                ) {

                    foundWard =
                        feature.properties?.name ||
                        feature.properties?.Name ||
                        'Unknown Ward';
                }

            });


            // =================================================
            // Display the result
            // =================================================

            if (foundWard) {

                document.getElementById('result').innerHTML =
                    '<strong>Your YSA Ward is: ' +
                    foundWard +
                    '</strong>';

            } else {

                document.getElementById('result').innerHTML =
                    '<strong>This address is outside the four YSA ward boundaries.</strong>';

            }

        })


        .catch(error => {

            console.error('Address search error:', error);

            document.getElementById('result').innerHTML =
                '<strong>There was a problem finding that address.</strong><br>' +
                'Please check the address and try again.';
        });
}



// ============================================================
// POINT-IN-POLYGON FUNCTION
// ============================================================

function pointInPolygon(point, geometry) {

    if (geometry.type === 'Polygon') {

        return pointInPolygonRings(
            point,
            geometry.coordinates
        );

    }


    if (geometry.type === 'MultiPolygon') {

        for (const polygon of geometry.coordinates) {

            if (
                pointInPolygonRings(
                    point,
                    polygon
                )
            ) {
                return true;
            }
        }

    }


    return false;
}



// ============================================================
// Check polygon rings
// ============================================================

function pointInPolygonRings(point, rings) {

    // Check the outside boundary
    if (
        !pointInRing(
            point,
            rings[0]
        )
    ) {
        return false;
    }


    // Check holes inside the polygon
    for (let i = 1; i < rings.length; i++) {

        if (
            pointInRing(
                point,
                rings[i]
            )
        ) {
            return false;
        }
    }


    return true;
}



// ============================================================
// Ray-casting algorithm
// ============================================================

function pointInRing(point, ring) {

    const x = point[0];
    const y = point[1];

    let inside = false;


    for (
        let i = 0, j = ring.length - 1;
        i < ring.length;
        j = i++
    ) {

        const xi = ring[i][0];
        const yi = ring[i][1];

        const xj = ring[j][0];
        const yj = ring[j][1];


        const intersect =
            ((yi > y) !== (yj > y)) &&
            (
                x <
                (xj - xi) *
                (y - yi) /
                (yj - yi) +
                xi
            );


        if (intersect) {
            inside = !inside;
        }
    }


    return inside;
}
```
