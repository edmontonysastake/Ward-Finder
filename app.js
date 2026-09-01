// ============================================================
// Edmonton YSA Ward Finder
// ============================================================


// ------------------------------------------------------------
// Create the map
// ------------------------------------------------------------

const map = L.map('map').setView(
    [53.5461, -113.4938],
    10
);


// ------------------------------------------------------------
// Add OpenStreetMap
// ------------------------------------------------------------

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution:
            '&copy; OpenStreetMap contributors'
    }
).addTo(map);


// ------------------------------------------------------------
// Variables
// ------------------------------------------------------------

let wardLayer = null;

let addressMarker = null;


// ------------------------------------------------------------
// Load wards.kml
// ------------------------------------------------------------

fetch('wards.kml')

    .then(function(response) {

        if (!response.ok) {

            throw new Error(
                'Could not load wards.kml.'
            );

        }

        return response.text();

    })


    .then(function(kmlText) {

        console.log('KML loaded successfully.');


        // Parse KML
        const parser =
            new DOMParser();

        const kml =
            parser.parseFromString(
                kmlText,
                'text/xml'
            );


        // Check for XML parsing errors
        const parserError =
            kml.querySelector(
                'parsererror'
            );


        if (parserError) {

            throw new Error(
                'The KML file could not be parsed.'
            );

        }


        // Convert KML to GeoJSON
        const geojson =
            toGeoJSON.kml(kml);


        console.log(
            'Converted KML to GeoJSON:',
            geojson
        );


        // ----------------------------------------------------
        // Create ward layer
        // ----------------------------------------------------

        wardLayer =
            L.geoJSON(
                geojson,
                {

                    style:
                        function(feature) {

                            const name =
                                getWardName(
                                    feature
                                );

                            const ward =
                                name.toLowerCase();


                            // Garneau
                            if (
                                ward.includes(
                                    'garneau'
                                )
                            ) {

                                return {
                                    color: '#f1c40f',
                                    weight: 3,
                                    fillColor: '#f1c40f',
                                    fillOpacity: 0.25
                                };

                            }


                            // Gateway
                            if (
                                ward.includes(
                                    'gateway'
                                )
                            ) {

                                return {
                                    color: '#e74c3c',
                                    weight: 3,
                                    fillColor: '#e74c3c',
                                    fillOpacity: 0.25
                                };

                            }


                            // Whitemud Creek
                            if (
                                ward.includes(
                                    'whitemud'
                                )
                            ) {

                                return {
                                    color: '#3498db',
                                    weight: 3,
                                    fillColor: '#3498db',
                                    fillOpacity: 0.25
                                };

                            }


                            // Windsor Park
                            if (
                                ward.includes(
                                    'windsor'
                                )
                            ) {

                                return {
                                    color: '#2ecc71',
                                    weight: 3,
                                    fillColor: '#2ecc71',
                                    fillOpacity: 0.25
                                };

                            }


                            // Default
                            return {
                                color: '#333',
                                weight: 3,
                                fillColor: '#999',
                                fillOpacity: 0.25
                            };

                        },


                    // ------------------------------------------------
                    // Ward interaction
                    // ------------------------------------------------

                    onEachFeature:
                        function(
                            feature,
                            layer
                        ) {

                            const name =
                                getWardName(
                                    feature
                                );


                            layer.bindPopup(
                                '<strong>' +
                                name +
                                '</strong>'
                            );


                            layer.on({

                                mouseover:
                                    function(e) {

                                        e.target.setStyle({
                                            weight: 5,
                                            fillOpacity: 0.4
                                        });

                                    },


                                mouseout:
                                    function(e) {

                                        wardLayer.resetStyle(
                                            e.target
                                        );

                                    }

                            });

                        }

                }
            )
            .addTo(map);


        // Make sure we actually found wards
        if (
            wardLayer.getLayers().length === 0
        ) {

            throw new Error(
                'No ward boundaries were found in wards.kml.'
            );

        }


        console.log(
            'Number of wards:',
            wardLayer.getLayers().length
        );


        // Zoom to the wards
        map.fitBounds(
            wardLayer.getBounds()
        );


        document.getElementById(
            'result'
        ).innerHTML =
            'Ward boundaries loaded successfully.';

    })


    .catch(function(error) {

        console.error(
            'Boundary loading error:',
            error
        );


        document.getElementById(
            'result'
        ).innerHTML =
            '<strong>There was a problem loading the ward boundaries.</strong><br>' +
            error.message;

    });


// ============================================================
// Get ward name
// ============================================================

function getWardName(feature) {

    if (
        feature &&
        feature.properties
    ) {

        return (
            feature.properties.name ||
            feature.properties.Name ||
            feature.properties.ward ||
            feature.properties.Ward ||
            'Unknown Ward'
        );

    }


    return 'Unknown Ward';
}


// ============================================================
// FIND MY WARD
// ============================================================

function findWard() {

    // --------------------------------------------------------
    // Get address
    // --------------------------------------------------------

    const address =
        document
            .getElementById('address')
            .value
            .trim();


    const city =
        document
            .getElementById('city')
            .value
            .trim();


    const result =
        document.getElementById(
            'result'
        );


    const button =
        document.getElementById(
            'findWardButton'
        );


    // --------------------------------------------------------
    // Validate fields
    // --------------------------------------------------------

    if (!address) {

        result.innerHTML =
            '<strong>Please enter your street address.</strong>';

        return;

    }


    if (!city) {

        result.innerHTML =
            '<strong>Please enter your city.</strong>';

        return;

    }


    // --------------------------------------------------------
    // Check that the ward boundaries are loaded
    // --------------------------------------------------------

    if (!wardLayer) {

        result.innerHTML =
            '<strong>The ward boundaries are still loading. Please try again in a moment.</strong>';

        return;

    }


    // --------------------------------------------------------
    // Disable button while searching
    // --------------------------------------------------------

    button.disabled = true;

    button.textContent =
        'Searching...';


    result.innerHTML =
        'Searching for your address...';


    // --------------------------------------------------------
    // Build complete address
    // --------------------------------------------------------

    const fullAddress =
        address +
        ', ' +
        city +
        ', Alberta, Canada';


    console.log(
        'Searching for:',
        fullAddress
    );


    // --------------------------------------------------------
    // OpenStreetMap address search
    // --------------------------------------------------------

    const url =
        'https://nominatim.openstreetmap.org/search' +
        '?format=json' +
        '&q=' +
        encodeURIComponent(
            fullAddress
        ) +
        '&limit=1';


    fetch(url)

        .then(function(response) {

            if (!response.ok) {

                throw new Error(
                    'The address search service could not be reached.'
                );

            }

            return response.json();

        })


        .then(function(data) {

            // ------------------------------------------------
            // Address not found
            // ------------------------------------------------

            if (
                !data ||
                data.length === 0
            ) {

                result.innerHTML =
                    '<strong>Address not found.</strong><br>' +
                    'Please check the address and make sure you included NW or SW.';

                return;

            }


            // ------------------------------------------------
            // Coordinates
            // ------------------------------------------------

            const lat =
                parseFloat(
                    data[0].lat
                );


            const lon =
                parseFloat(
                    data[0].lon
                );


            console.log(
                'Address coordinates:',
                lat,
                lon
            );


            // ------------------------------------------------
            // Remove old marker
            // ------------------------------------------------

            if (addressMarker) {

                map.removeLayer(
                    addressMarker
                );

            }


            // ------------------------------------------------
            // Add new marker
            // ------------------------------------------------

            addressMarker =
                L.marker(
                    [lat, lon]
                )
                .addTo(map);


            addressMarker.bindPopup(
                '<strong>Your address</strong>'
            );


            // ------------------------------------------------
            // Zoom to address
            // ------------------------------------------------

            map.setView(
                [lat, lon],
                14
            );


            // ------------------------------------------------
            // Find ward
            // ------------------------------------------------

            let foundWard =
                null;


            wardLayer.eachLayer(
                function(layer) {

                    if (foundWard) {
                        return;
                    }


                    const feature =
                        layer.feature;


                    if (
                        !feature ||
                        !feature.geometry
                    ) {

                        return;

                    }


                    if (
                        pointInGeometry(
                            [lon, lat],
                            feature.geometry
                        )
                    ) {

                        foundWard =
                            getWardName(
                                feature
                            );

                    }

                }
            );


            // ------------------------------------------------
            // Display result
            // ------------------------------------------------

            if (foundWard) {

                result.innerHTML =
                    '<strong>Your YSA Ward is: ' +
                    foundWard +
                    '</strong>';


                addressMarker.bindPopup(
                    '<strong>Your YSA Ward is:</strong><br>' +
                    foundWard
                );


                addressMarker.openPopup();

            }


            else {

                result.innerHTML =
                    '<strong>This address is outside the four YSA ward boundaries.</strong>';

            }

        })


        .catch(function(error) {

            console.error(
                'Address search error:',
                error
            );


            result.innerHTML =
                '<strong>There was a problem finding that address.</strong><br>' +
                'Please check the address and try again.';

        })


        .finally(function() {

            button.disabled = false;

            button.textContent =
                'Find My Ward';

        });

}


// ============================================================
// POINT IN GEOMETRY
// ============================================================

function pointInGeometry(
    point,
    geometry
) {

    if (
        geometry.type ===
        'Polygon'
    ) {

        return pointInPolygon(
            point,
            geometry.coordinates
        );

    }


    if (
        geometry.type ===
        'MultiPolygon'
    ) {

        for (
            let i = 0;
            i < geometry.coordinates.length;
            i++
        ) {

            if (
                pointInPolygon(
                    point,
                    geometry.coordinates[i]
                )
            ) {

                return true;

            }

        }

    }


    return false;
}


// ============================================================
// POINT IN POLYGON
// ============================================================

function pointInPolygon(
    point,
    rings
) {

    // --------------------------------------------------------
    // Outside boundary
    // --------------------------------------------------------

    if (
        !pointInRing(
            point,
            rings[0]
        )
    ) {

        return false;

    }


    // --------------------------------------------------------
    // Interior holes
    // --------------------------------------------------------

    for (
        let i = 1;
        i < rings.length;
        i++
    ) {

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
// POINT IN RING
// ============================================================

function pointInRing(
    point,
    ring
) {

    const x =
        point[0];

    const y =
        point[1];


    let inside =
        false;


    for (
        let i = 0,
        j = ring.length - 1;

        i < ring.length;

        j = i++
    ) {

        const xi =
            ring[i][0];

        const yi =
            ring[i][1];


        const xj =
            ring[j][0];

        const yj =
            ring[j][1];


        const intersects =
            (
                (yi > y) !==
                (yj > y)
            )
            &&
            (
                x <
                (
                    (xj - xi) *
                    (y - yi) /
                    (yj - yi)
                ) +
                xi
            );


        if (intersects) {

            inside =
                !inside;

        }

    }


    return inside;
}


// ============================================================
// BUTTON
// ============================================================

// Use an event listener instead of inline onclick.
// This avoids the "findWard is not defined" problem we
// encountered earlier.

document
    .getElementById(
        'findWardButton'
    )
    .addEventListener(
        'click',
        findWard
    );


// Allow pressing Enter in either address field
document
    .getElementById('address')
    .addEventListener(
        'keydown',
        function(event) {

            if (
                event.key === 'Enter'
            ) {

                findWard();

            }

        }
    );


document
    .getElementById('city')
    .addEventListener(
        'keydown',
        function(event) {

            if (
                event.key === 'Enter'
            ) {

                findWard();

            }

        }
    );
