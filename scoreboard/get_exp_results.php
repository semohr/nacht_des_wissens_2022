<?php
    // check the folder and get the MI from all json files,
    // return the prepared array as json
    header('Content-type: application/json');

    $results = array();

    foreach (glob("exp_results/*.json") as $file) {
        // decode json file
        $json = json_decode(file_get_contents($file), true);

        // because we change convention we do not show the MI but the accuracy,
        // lets calculate that quickly.
        $true_data = $json['emitted'][0];
        $guessed_data = $json['received'][0];

        // check overlap between true and guessed data
        $overlap = array_intersect_assoc($true_data, $guessed_data);
        $accuracy = count($overlap) / count($true_data) * 100;

        $row = array(
            "accuracy" => number_format($accuracy,0),
            "mi_bits" => abs($json["mi_bits"][0]),
            "mi_bits_s" => abs($json["mi_bits_s"][0]),
            "team_name" => $json["team_name"],
            "duration" => array_sum($json["duration"][0])/1000.0,
            // we can use this to highlight in the table the team that did the
            // latest experiment.
            "start_last_event" => $json["start_last_event"],
        );
        array_push($results, $row);
    }
    // return prepared array as json
    echo json_encode($results);

?>
