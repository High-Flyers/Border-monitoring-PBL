<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PBL - MAPA</title>
    <link rel="stylesheet" href="./style.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""></script>
    
</head>

<body>
    <div class="main">
        <nav>
            <div class="logo">
                <img src="../public/polsl_logo.png">
            </div>
            <div class="logo_hf">
                <h1 class="animate_character">HIGH<br>FLYERS</h1>
            </div>
            <div class="nav-links">
                <ul>
                    <li><a href="./index.php">Map</a></li>
                    <li><a href="./raport.php">Raport</a></li>
                </ul>
            </div>
        </nav>
    </div>


    
    <div class="background">
        <div id="map"></div>
    </div>
<script>

    var map = L.map('map').setView([52.05, 23.657], 14);
    var icon1 = L.icon({
        iconUrl: '../public/img1.png',
        iconSize: [120,95],
        iconAnchor: [22,94],
        popupAnchor: [-3,-76]
    })
    var icon2 = L.icon({
        iconUrl: '../public/img2.png',
        iconSize: [120,95],
        iconAnchor: [22,94],
        popupAnchor: [-3,-76]
    })

   
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);
  
    map.on('click', function(e) {
        var coordinates = e.latlng;
        L.popup()
            .setLatLng(coordinates)
            .setContent('Współrzędne: ' + coordinates.lat.toFixed(4) + ', ' + coordinates.lng.toFixed(4))
            .openOn(map);
    });
    L.marker([52.05, 23.720],{icon:icon2}).addTo(map)
    .bindPopup('Wykrycie 1')
    .openPopup();
    L.marker([52.04,23.789], {icon:icon1}).addTo(map).
    bindPopup('Wykrycie 2')
    .openPopup();


</script>
</body>
</html>
