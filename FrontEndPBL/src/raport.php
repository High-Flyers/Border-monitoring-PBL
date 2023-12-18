<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PBL - RAPORT</title>
    <link rel="stylesheet" href="./style.css">
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

    <!-- <div class="raport_background">
        <div class="main_container">
            <h3><span class="first_two_words">Real-Time</span> Drone Data:</h3>
            <div class="id_container">
                <div class="info_container">
                    <h4>Date: 2023-11-18,<br> Time: 12:34:56,<br> Latitude: 50.12,<br> Longitude: 120.53</h4>
                </div>
                <img src="../public/img1.png" class="image_container">
            </div>
        </div>
    </div> -->

    <?php

$mysqli = new mysqli('db', 'pbl', 'password', 'pbl_highflyers') or die($mysqli->connect_error);

    $table = 'uav';

    $result = $mysqli->query("SELECT * FROM $table") or die($mysqli->error);
    ?>

    <div class="raport_background">
        <div class="main_container">
        <h3><span class="first_two_words">Real-Time</span> Drone Data:</h3>
            <?php
            while ($data = $result->fetch_assoc()){
                echo "<div class='id_container'>";
                    echo "<div class='info_container'>";
                        echo "<h4>Date: {$data['date']},<br> Time: {$data['time']},<br> Latitude: {$data['latitude']},<br> Longitude: {$data['longtitude']}</h4>";
                    echo "</div>";
                    echo "<img src='{$data['image_path']}' class='image_container'>";
                echo "</div>";
            }
            ?>
        </div>
    </div>
</body>
</html>