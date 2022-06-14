<?php
    // check the folder and get the MI from all json files,
    // return the prepared array as json
    header('Content-type: application/json');

    $results = array();

    foreach (glob("exp_results/*.json") as $file) {
        // decode json file
        $json = json_decode(file_get_contents($file), true);
        $row = array(
            "MI" => $json["data"]["MI"],
            "expID" => $json["data"]["expID"],
            "duration" => $json["data"]["totalDuration"],
        );
        array_push($results, $row);
    }
    // return prepared array as json
    echo json_encode($results);

?>
