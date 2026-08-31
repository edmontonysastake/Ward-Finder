// Create the map centered on Edmonton
const map = L.map('map').setView([53.5461, -113.4938], 10);

// Add OpenStreetMap tiles
L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);

// Test message
document.getElementById('result').innerHTML =
    'Map loaded successfully.';
