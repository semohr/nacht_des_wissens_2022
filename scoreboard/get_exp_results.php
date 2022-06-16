<?php
    // check the folder and get the MI from all json files,
    // return the prepared array as json
    header('Content-type: application/json');

    $results = array();

    foreach (glob("exp_results/*.json") as $file) {
        // decode json file
        $json = json_decode(file_get_contents($file), true);
        $row = array(
            "mi_bits" => $json["mi_bits"],
            "mi_bits_s" => $json["mi_bits_s"],
            "team_name" => $json["team_name"],
            "duration" => array_sum($json["duration"][0])/1000.0,
        );
        array_push($results, $row);
    }
    // return prepared array as json
    echo json_encode($results);

?>
