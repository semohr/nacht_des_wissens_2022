<html>

<!-- localisation -->

<?php
    $locale = 'de';

    if (isset($_GET['lang']))
        $locale = $_GET['lang'];
    include('locales/'. $locale . '.php');
    echo '<script type="text/javascript">';
    echo 'var $LANG = ' . json_encode($LANG) . ';';
    echo 'var $locale = "' . $locale . '";';
    echo '</script>';
?>

<head>
    <meta charset="utf-8">
    <title>Information Theory</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
    <link href="main.css" rel="stylesheet">

</head>

<body>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM"
        crossorigin="anonymous"></script>
    <script src="https://code.highcharts.com/highcharts.js"></script>

    <!-- DataTables dependencies, if we do not want bells and whistles for tables,
    we can drop jquery -->
    <script type="text/javascript" src="https://code.jquery.com/jquery-3.5.1.js"></script>
    <script type="text/javascript" src="https://cdn.datatables.net/v/bs5/dt-1.12.1/datatables.min.js"></script>
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/v/bs5/dt-1.12.1/datatables.min.css" />

    <div class="languageSelector">
            <a id="lang-de-btn"
                href = "index.php?lang=de"
                <?php if ($locale == 'de') echo 'hidden'; ?>
                >
                <img src="./public/de.svg"></img>
            </a>
            <a id="lang-en-btn"
                href = "index.php?lang=en"
                <?php if ($locale == 'en') echo 'hidden'; ?>
                >
                <img src="./public/gb.svg"></img>
            </a>
        </div>
    <div class="container">
        <div class="row align-items-start my-2">

            <!-- leaderboard -->
            <div class="col-lg-6 my-2">
                <div class="card">
                <h5 class="card-header text-center">
                    <?php echo $LANG['leaderboard_title']; ?>
                </h5>
                    <div class="card-body px-0 py-2">
                        <div id="leaderboard-container" class="px-0"></div>
                    </div>
                </div>
            </div>

            <div class="col-lg-6 my-0">
                <div class="row">
                    <!-- mi dist -->
                    <div class="col-12 my-2">
                        <div class="card">
                            <h5 class="card-header d-flex justify-content-between align-items-center">
                                <span></span> <!-- this is a dummy to center the text -->
                                <span>
                                    <?php echo $LANG['mi_title']; ?>
                                </span>
                                <!-- avoid stretching the header in y direction by overwriting the button padding -->
                                <button class="btn btn-sm btn-outline-primary py-0" type="button" data-bs-toggle="collapse" data-bs-target="#MI_info"
                                    aria-expanded="false" aria-controls="MI_info">
                                    ?
                                </button>
                            </h5>
                            <div class="card-body py-0"></div>

                                <div class="collapse" id="MI_info">
                                    <div class="card card-body m-2">
                                        <?php echo $LANG["mi_info"]; ?>
                                    </div>
                                </div>

                                <div id="miDist" class="p-1 mt-1"></div>
                            </div>
                        </div>
                    </div>

                    <!-- scatterplot of mi_per_time vs mi -->
                    <div class="col-12 my-2">
                        <div class="card">
                            <h5 class="card-header d-flex justify-content-between align-items-center">
                                <span></span> <!-- this is a dummy to center the text -->
                                <span>
                                    <?php echo $LANG['scatter_title']; ?>
                                </span>
                                <!-- avoid stretching the header in y direction by overwriting the button padding -->
                                <button class="btn btn-sm btn-outline-primary py-0" type="button" data-bs-toggle="collapse" data-bs-target="#scatter_info"
                                    aria-expanded="false" aria-controls="scatter_info">
                                    ?
                                </button>
                            </h5>
                            <div class="card-body py-0"></div>

                                <div class="collapse" id="scatter_info">
                                    <div class="card card-body m-2">
                                        <?php echo $LANG["scatter_info"]; ?>
                                    </div>
                                </div>

                                <div id="miScatter" class="p-1 mt-1"></div>
                            </div>
                        </div>
                    </div>
                <div> <!-- end row -->
            </div>
        </div>
    </div>


</body>

<script type="text/javascript" src="main.js"></script>

</html>