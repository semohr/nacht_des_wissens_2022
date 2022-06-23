document.addEventListener("DOMContentLoaded", main);

// some global variables for debugging
var data = [];
var dataTable;
var accHist;
var column_ids;
var column_labels;
// match bootstrap colors
const colors = ["#027BFF", "#DC3645", "#FFC207", "#28A745",
    "#19A2B7", "#343A41", "#6C757D"]

// initialize after dom is loaded
async function main() {
    // Create table by loading data via php
    const data_new = await fetch("get_exp_results.php").then(response => response.json());
    console.log("main")
    // Check if data length changed changed
    // As we run a page refresh every 15 seconds
    // see at top
    if (data_new.length == data.length) {
        return
    } else {
        data = data_new;

    }

    // sort data according to some key
    const sort_by = "mi_bits_s";
    data.sort(function (a, b) {
        return b[sort_by] - a[sort_by];
    });

    // now data is ordered and we can set a rank
    for (let i = 0; i < data.length; i++) {
        data[i].rank = i + 1;
    }
    // console.log(data)


    column_ids = ["rank", "team_name", "mi_bits_s", "accuracy", "duration"];
    column_labels = column_ids.map(id => { return $LANG[id] });

    // create table in html
    let dataTable = create_table(data, keys = column_ids, row_first = true);
    dataTable.id = "leaderboard";
    dataTable.style.width = "100%";
    document.getElementById("leaderboard-container").appendChild(dataTable);


    const series = data.map(d => d["accuracy"]).flat();

    // we want around ~ 1-10 entries per bin, right?
    // if someone has the patience you can add a button for this.
    var bw = 10;
    if (series.length > 10) {
        bw = 5;
    }
    if (series.length > 100) {
        bw = 2.5;
    }
    if (series.length > 1000) {
        bw = 1;
    }

    // Create graphs
    accHist = create_histogram_plot(series, bw);

    miScatter = create_scatter_plot(
        x = data.map(d => d["accuracy"]).slice(),
        y = data.map(d => d["mi_bits_s"]).slice(),
        teamnames = data.map(d => d["team_name"]).slice(),
    );


    // define the number formatters for differen columns
    formatters = {
        "mi_bits_s": DataTable.render.number(null, null, 2),
        "mi_bits": DataTable.render.number(null, null, 2),
        "duration": DataTable.render.number(null, null, 2),
        // "accuracy": DataTable.render.number(null, null, 0),
        "accuracy": DataTable.render.text()
    }

    // text alignments for different columns
    alignments = {
        "rank": "dt-body-left dt-head-left",
        "mi_bits_s": "dt-body-right dt-head-right",
        "mi_bits": "dt-body-right dt-head-right",
        "duration": "dt-body-right dt-head-right",
        "accuracy": "dt-body-right dt-head-right",
        "team_name": "dt-body-center dt-head-center",
    }

    // init DataTable for sorting and the likes
    dataTable = new DataTable('#leaderboard',
        {
            columns: column_ids.map(
                id => {
                    return {
                        title: $LANG[id],
                        data: id,
                        searchable: id == "team_name" ? true : false,
                        render: (Object.keys(formatters).includes(id)) ?
                            formatters[id] : DataTable.render.text(),
                        className: (Object.keys(alignments).includes(id)) ?
                            alignments[id] : '',
                    }
                }
            ),
            select: 'single',
            scrollX: true,
            language: {
                // url: "//cdn.datatables.net/plug-ins/1.10.18/i18n/English.json",
                url: "//cdn.datatables.net/plug-ins/1.10.18/i18n/" + $LANG['language'] + ".json",
                search: "",
                searchPlaceholder: $LANG['datatable_search_placeholder'],
            },
            // paging: false,
            // customize the created dom https://datatables.net/reference/option/dom
            // "dom": 'ft'
            // needed tweaking to have search on the left
            // "dom": "<'row'<'col-2'f> <'col-8'> <'col-2'l> > <'row'<'col-12'tr>> <'row px-2'<'col-6'p>>"
            "dom": "<'d-flex flex-wrap' <'me'f>>" +
                "<'row'<'col-12 table-responsive'tr>>" +
                "<'d-flex flex-wrap mt-2 mx-2' <'my-1 me-auto'l> <p> >",

            // once the table is fully setup, check if teamname was passed in url and
            // highlight the row
            "initComplete": function () {
                // fetch the teamname from the url so we can link to a team via qr code
                let queries = get_url_queries();
                // select the row matching the teamname that has the highest rank
                if (queries.teamname) {
                    console.log(queries.teamname)
                    // search teamname occurences in data. since we ordered by rank,
                    // first occurence is highest rank already
                    let team_index = data.findIndex(d => d["team_name"] == queries.teamname);

                    if (team_index != -1) {
                        let pageSize = dataTable.page.len();
                        dataTable.page(parseInt(team_index / pageSize, 10)).draw(false);
                        row = dataTable.row(team_index).select();
                    }
                }
            }

        }
    );

    // we will need to make sure that we always have at least one row of data!
    keys = Object.keys(data[0]);

    // make the search highlight the highest point of all teams currently shown
    dataTable.on('search.dt', function () {
        // johannes did not like it.
        // click is required to highlight!
        return;

        // only do sth if we have a searchterm
        if (dataTable.search().length == 0) return;

        // get rows that are still visible after filtering
        rows = dataTable.rows({ filter: 'applied' }).data().toArray()
        // visible_hashes = visible_rows.map(row => row[col_index_for_hash]);

        mi = rows.map(row => Math.abs(parseFloat(row["accuracy"])));
        mi_per_sec = rows.map(row => Math.abs(parseFloat(row["mi_bits_s"])));

        // set the tooltip of the prob dist to the highest mi that is still visible!
        mi_max = Math.max(...mi);
        highlight_scatter(accHist, mi_max);

        // for scatter, highlight all matches
        highlight_scatter(miScatter, mi, mi_per_sec);

    });

    // make pressing a row highlight the result in plots
    dataTable.on('select', function (e, dt, type, indexes) {
        // type should always be row!
        if (type === 'row') {
            // we only allow selecting one item
            let row = dataTable.rows(indexes).data()[0];

            mi = parseFloat(row["accuracy"]);
            mi_per_sec = parseFloat(row["mi_bits_s"]);

            // set the tooltip of the prob dist to the highest mi that is still visible!
            highlight_hist(accHist, mi);

            // for scatter, highlight all matches
            highlight_scatter(miScatter, mi, mi_per_sec);
        }

    });

    dataTable.on('deselect', function (e, dt, type, indexes) {
        unhighlight_all(accHist);
        unhighlight_all(miScatter);
    });


}

/** Returns table from cols data, data hast to be dict of arrays with
 * the key being the header. It is assumed that all arrays have the same length.
 * @param {dict} data e.g. {'header1': [1, 2, 3], 'header2': [4, 5, 6]}
 * ps: I added `row_first` so we can pass data as we get it from php.
 * we could detect this but focus, lennard.
 */
function create_table(data, keys = null, row_first = false) {

    if (keys == null) {
        const keys = (row_first) ? Object.keys(data[0]) : Object.keys(data);
    }
    let num_rows = (row_first) ? data.length : data[keys[0]].length;

    // console.log(keys);
    // console.log(num_rows);

    const table = document.createElement("table");
    table.classList.add("table", "table-striped");

    // Create table head
    const table_head = document.createElement("thead");
    const tr = document.createElement("tr");
    for (const key of keys) {
        var th = document.createElement("th");
        th.innerHTML = key;
        tr.appendChild(th);
    }
    table_head.appendChild(tr);
    table.appendChild(table_head);

    // Create table body
    const table_body = document.createElement("tbody");


    for (let row = 0; row < num_rows; row++) {
        const tr = document.createElement("tr");
        for (const key of keys) {
            var td = document.createElement("td");
            if (row_first) {
                td.innerHTML = data[row][key];
            } else {
                td.innerHTML = data[key][row];
            }
            tr.appendChild(td);
        }
        table_body.appendChild(tr);
    }

    table.appendChild(table_body);
    return table;
}

function GaussKDE(xi, x, sigma = 1) {
    return (1 / sigma / Math.sqrt(2 * Math.PI)) * Math.exp(Math.pow((xi - x) / sigma, 2) / -2);
}

function create_histogram_plot(series, bw, base_color = "#6C757D", highlight_color = "#027BFF") {

    // plot mutual information as smoothed histogram
    // const N = y.reduce((a, b) => a + b);

    // a dummy series for debugging
    // let series = [71, 43, 16, 24, 44, 62, 24, 57, 26, 23, 15, 61, 74, 81, 55, 80, 47,
    //     61, 77, 85, 47, 3, 51, 76, 38, 61, 91, 58, 76, 88, 0, 59, 72, 42,
    //     9, 26, 10, 85, 27, 89, 28, 98, 98, 2, 12, 77, 37, 5, 7, 68, 15,
    //     6, 74, 27, 7, 67, 7, 27, 84, 12, 64, 60, 24, 4, 8, 80, 2, 57,
    //     22, 95, 70, 34, 75, 37, 67, 7, 14, 33, 34, 63, 10, 11, 75, 17, 94,
    //     89, 91, 8, 61, 69, 93, 41, 32, 7, 87, 31, 17, 81, 98, 49, 47, 86,
    //     38, 37, 10, 14, 17, 15, 32, 67, 72, 38, 67, 28, 0, 86, 44, 78, 32,
    //     88, 42, 17, 49, 97, 38, 32, 62, 52, 86, 6, 72, 49, 98, 14, 6, 36,
    //     21, 81, 12, 33, 65, 45, 59, 76, 32, 28, 95, 91, 96, 48, 24, 1, 34,
    //     96, 9, 53, 51, 50, 73, 6, 93, 64, 67, 7, 90, 21, 9, 41, 67, 24,
    //     15, 15, 88, 38, 18, 33, 74, 6, 3, 22, 36, 96, 63, 4, 84, 75, 17,
    //     39, 61, 13, 59, 24, 24, 42, 7, 29, 74, 12, 65, 47, 22, 89, 73, 2,
    //     42, 63, 49, 33, 93, 43, 1, 73, 61, 93, 15, 5, 58, 50, 75, 74, 75,
    //     86, 69, 17, 79, 60, 83, 13, 57, 35, 10, 89, 78, 38, 64, 71, 63, 5,
    //     36, 6, 19, 29, 93, 65, 72, 95, 72, 69, 53, 36, 86, 20, 58, 61, 1,
    //     44, 79, 66, 63, 20, 46, 29, 1, 92, 98, 6, 91, 82, 72, 11, 64, 30,
    //     98, 57, 90, 15, 17, 73, 80, 55, 91, 17, 69, 19, 77, 47, 58, 65, 82,
    //     63, 43, 89, 93, 93, 26, 43, 41, 52, 56, 49, 67, 14, 48, 68, 88, 76,
    //     69, 34, 57, 12, 22, 23, 74, 35, 38, 80, 42, 4, 9, 43, 12, 96, 41,
    //     19, 77, 14, 2, 88, 62, 86, 49, 43, 31, 16, 79, 43, 68, 43, 21, 79,
    //     12, 98, 48, 15, 50, 16, 56, 78, 27, 65, 54, 45, 3, 0, 7, 81, 46,
    //     48, 28, 24, 60, 22, 86, 67, 98, 34, 58, 30, 66, 11, 61, 27, 27, 67,
    //     25, 23, 20, 30, 74, 96, 65, 71, 41, 22, 71, 93, 28, 17, 37, 97, 80,
    //     50, 0, 79, 54, 92, 19, 66, 87, 54, 92, 97, 0, 82, 8, 98, 7, 86,
    //     10, 82, 48, 99, 42, 71, 35, 9, 19, 63, 69, 53, 36, 38, 30, 85, 10,
    //     91, 45, 34, 80, 85, 32, 94, 5, 11, 17, 35, 28, 84, 31, 99, 59, 75,
    //     32, 7, 73, 9, 38, 11, 63, 35, 7, 36, 41, 58, 52, 16, 13, 65, 44,
    //     13, 29, 94, 91, 93, 21, 87, 92, 16, 2, 90, 59, 15, 86, 72, 13, 70,
    //     24, 24, 60, 76, 57, 29, 41, 77, 97, 98, 57, 39, 10, 24, 2, 84, 43,
    //     89, 3, 38, 66, 42, 23, 28, 69, 80, 7, 40, 93, 69, 95, 42, 49, 55,
    //     98, 97, 15, 92, 53, 82, 64, 15, 60, 36, 12, 51, 54, 20, 21, 92, 80,
    //     62, 98, 19, 30, 4, 55, 89, 39, 54, 88, 40, 62, 37, 6, 95, 59, 26,
    //     58, 11, 9, 2, 68, 13, 93, 9, 54, 20, 65, 8, 23, 51, 90, 48, 22,
    //     64, 47, 38, 69, 67, 40, 35, 9, 70, 98, 83, 53, 28, 5, 92, 4, 43,
    //     63, 27, 58, 46, 13, 25, 1, 68, 41, 76, 97, 9, 24, 48, 99, 34, 30,
    //     22, 82, 62, 31, 52, 91, 11, 74, 74, 93, 87, 39, 42, 74, 3, 47, 43,
    //     9, 22, 99, 93, 87, 82, 37, 60, 52, 94, 83, 38, 97, 83, 7, 40, 1,
    //     26, 91, 58, 71, 94, 66, 11, 10, 50, 28, 54, 17, 24, 30, 93, 43, 15,
    //     15, 95, 97, 19, 63, 46, 39, 49, 34, 92, 25, 46, 43, 12, 60, 16, 38,
    //     82, 82, 38, 21, 89, 5, 5, 64, 98, 47, 23, 82, 56, 35, 56, 76, 88,
    //     36, 54, 86, 16, 66, 13, 44, 6, 32, 23, 7, 14, 68, 70, 28, 19, 92,
    //     97, 47, 48, 49, 98, 77, 78, 80, 80, 29, 80, 75, 11, 64, 71, 83, 66,
    //     66, 59, 3, 76, 98, 56, 6, 54, 86, 88, 48, 51, 22, 13, 66, 34, 88,
    //     72, 0, 94, 92, 12, 99, 81, 55, 53, 56, 2, 43, 57, 73, 55, 44, 28,
    //     21, 23, 58, 15, 11, 73, 65, 0, 77, 16, 67, 70, 99, 10, 88, 16, 58,
    //     10, 73, 93, 13, 90, 66, 92, 0, 3, 30, 50, 87, 23, 65, 53, 30, 36,
    //     46, 38, 10, 40, 45, 8, 75, 6, 53, 78, 47, 1, 2, 24, 25, 42, 54,
    //     86, 18, 42, 58, 30, 85, 21, 72, 89, 73, 7, 67, 74, 48, 47, 48, 23,
    //     1, 35, 64, 8, 68, 99, 24, 26, 42, 73, 99, 54, 75, 41, 41, 61, 26,
    //     90, 42, 97, 81, 24, 36, 93, 83, 12, 88, 80, 7, 31, 73, 84, 81, 31,
    //     27, 4, 71, 4, 0, 93, 81, 99, 47, 48, 58, 69, 80, 58, 78, 88, 82,
    //     79, 57, 11, 62, 54, 56, 76, 0, 9, 49, 71, 21, 73, 37, 21, 73, 88,
    //     30, 3, 33, 96, 45, 5, 82, 94, 22, 61, 99, 33, 46, 34, 14, 17, 44,
    //     92, 89, 44, 94, 39, 43, 0, 90, 58, 42, 69, 70, 28, 37, 23, 82, 60,
    //     81, 6, 97, 3, 83, 13, 24, 58, 91, 31, 81, 62, 12, 17, 45, 83, 96,
    //     22, 91, 35, 16, 93, 95, 83, 41, 57, 29, 79, 50, 96, 67, 21, 17, 9,
    //     27, 37, 13, 54, 6, 8, 76, 74, 83, 64, 4, 91, 70, 91, 9, 91, 77,
    //     17, 27, 68, 32, 80, 89, 83, 63, 61, 91, 40, 61, 37, 5, 9, 27, 32,
    //     59, 87, 63, 39, 74, 33, 99, 4, 37, 30, 6, 36, 28, 92, 100, 0];

    const N = series.length;
    const [edges, centers, counts] = calculate_histogram(series, bw);

    const data = centers.map((centers, i) => [centers, counts[i] / N]);

    // console.log("centers");
    // console.log(centers);
    // console.log("edges");
    // console.log(edges);

    // localised tootlip formatter
    function localised_formatter(chart) {

        let counts = chart.series.options.counts
        let edges = chart.series.options.edges
        idx = hist_index_from_value(edges, chart.x);
        left_edge = edges[idx];
        right_edge = edges[idx + 1];
        exps_reached = cumsum(counts, from = counts.length - 1, to = idx);
        var str = '≥<b>'
        str += left_edge
        // str += right_edge
        str += '%</b> '
        str += ($locale == "de") ? 'wurden in <b>' : 'were reached in <br><b>'
        str += exps_reached
        str += '</b>'
        str += '/' + N
        str += ($locale == "de") ? '<br>Experimenten erreicht' : ' experiments'
        return str;
    }

    let chart = Highcharts.chart("miDist", {
        chart: {
            type: "column",
            animation: true,
            zoomType: "x",
        },

        title: {
            text: ""
        },
        xAxis: {
            type: "",
            title: { text: $LANG['mi_xlabel'] },
            min: bw / 2.1,
            max: 100 - bw / 2.1,
            maxPadding: 0.,
            crosshair: false,
            tickLength: 0,
            labels: {
                formatter: function () {
                    return this.value + '%';
                }
            }
        },
        yAxis: {
            title: { text: $LANG['mi_ylabel'] }
        },
        legend: {
            enabled: false,
        },
        // for the tooltip we want to say sth like ~ 3 teams reached such a score.
        // to convert the plotted kde (a probability) to something like a histogram,
        // we just need to multiply with the number of teams and cast to int.
        tooltip: {
            valueDecimals: 3,
            formatter: function () {
                return localised_formatter(this);
            },
        },
        // assume only one series.
        // match bootstrap colors so we can match the headers of the card button etc
        colors: [base_color],

        // plotOptions: {
        //     series: {
        //         marker: {
        //             enabled: false
        //         },
        //     }
        // },
        plotOptions: {
            column: {
                pointPadding: 0.0,
                borderWidth: 2,
                groupPadding: 0,
                shadow: false
            }
        },
        series: [{
            name: "P(MI)",
            data: data,
            allowPointSelect: false,
            states: {
                select: {
                    color: highlight_color,
                    // transparent
                    borderColor: "#00000000",
                },
            },
            // add some of our custom stuff to the series so we can use it in the tootltip
            edges: edges,
            centers: centers,
            bw: bw,
            counts: counts,
        }],
        // hide the highcharts logo. make sure to acknowledge in the credits section
        credits: {
            enabled: false
        },
    })

    // i know doing this twice sucks, but i need this outside again.
    // and seems like i cannot access the series options.
    chart.edges = edges;
    chart.centers = centers;
    chart.bw = bw;
    chart.counts = counts;

    return chart;
}

function create_scatter_plot(x, y, teamnames, base_color = "#6C757D", highlight_color = "#027BFF") {

    x = x.flat();
    y = y.flat();
    teamnames = teamnames.flat();
    // let teamnames = []
    // for (let i = 0; i < x.length; i++) {
    //     teamnames.push("lorem " + i);
    // }
    var data = [];
    for (let i = 0; i < x.length; i++) {
        data.push({
            x: x[i],
            y: y[i],
            name: teamnames[i],
        });
    }
    // let data = x.map((x, i) => [x , y[i]]);

    return Highcharts.chart("miScatter", {
        chart: {
            type: "scatter",
            animation: true,
            zoomType: "xy",
        },

        boost: {
            useGPUTranslations: true,
            usePreAllocated: true
        },

        title: {
            text: ""
        },
        xAxis: {
            type: "",
            title: { text: $LANG['scatter_xlabel'] },
            min: 0,
            max: 100,
            crosshair: false,
            tickLength: 5,
            labels: {
                formatter: function () {
                    return this.value + '%';
                }
            }
        },
        yAxis: {
            title: { text: $LANG['scatter_ylabel'] },
            min: 0,
            crosshair: false,
            color: "#6C757D",
            tickLength: 5,
            lineWidth: 1,
        },
        legend: {
            enabled: false,
        },
        // for the tooltip we want to say sth like ~ 3 teams reached such a score.
        // to convert the plotted kde (a probability) to something like a histogram,
        // we just need to multiply with the number of teams and cast to int.
        tooltip: {
            enabled: true,
            formatter: function () {
                return this.point.name;
            }
        },
        // assume only one series.
        // match bootstrap colors so we can match the headers of the card button etc
        colors: [base_color],

        // plotOptions: {
        //     series: {
        //         marker: {
        //             enabled: false
        //         },
        //     }
        // },
        series: [{
            name: "MIPS vs MI",
            data: data,
            allowPointSelect: false,
            marker: {
                states: {
                    select: {
                        fillColor: highlight_color,
                        lineWidth: 0,
                        radius: 6,
                    },
                },
            },
        }],
        // hide the highcharts logo. make sure to acknowledge in the credits section
        credits: {
            enabled: true
        },
    });
}

function highlight_scatter(chart, x_val, y_val = null) {
    // we need to find the point in the series via the desired x-value
    //  (and, optionally, y-value) to customzie the tooltip
    chart.tooltip.hide();

    if (Array.isArray(x_val)) {
        x_val = x_val.flat();
        y_val = y_val.flat();
    } else {
        x_val = [x_val];
        y_val = [y_val];
    }

    var poi;
    Highcharts.each(chart.series[0].points, function (point) {
        // unselect all points by default
        point.select(false);
        // select the ones that match
        for (let i = 0; i < x_val.length; i++) {
            if (point.x == x_val[i]) {
                if (y_val[i] == null || y_val[i] == point.y) {
                    // console.log("highlighting: " + point.x + " " + point.y);
                    chart.tooltip.refresh([point]);
                    point.setState("select");
                }
            }
        }
    });
}

function highlight_hist(chart, x_val) {

    chart.tooltip.hide();

    let idx = hist_index_from_value(chart.edges, x_val);

    var poi;
    Highcharts.each(chart.series[0].points, function (point) {
        // unselect all points by default
        point.select(false);
        // select the one that matches
        if (hist_index_from_value(chart.edges, point.x) == idx) {
            // console.log("highlighting: " + point.x + " " + point.y);
            chart.tooltip.refresh([point]);
            point.setState("select");
            return false;
        }
    });
}

function unhighlight_all(chart) {
    chart.tooltip.hide();
    Highcharts.each(chart.series[0].points, function (point) {
        point.select(false);
    });
}

function cumsum(arr, to, from = 0) {
    let sum = 0;
    var di = 1;
    if (to < from) {
        di = -1;
    }
    for (let i = from; i <= to; i += di) {
        sum += arr[i];
    }
    return sum;
}

function calculate_histogram(series, bw = 2.5) {
    // let bw = 5;
    // this is by our data, accuracy including [0, 100]
    let right_most_edge = 100;
    let left_most_edge = 0;

    var edges = [right_most_edge];
    let e = right_most_edge;
    while (e > left_most_edge) {
        e = e - bw;
        edges.push(e);
    }
    edges.reverse();
    // if (edges[0] < left_most_edge) {
    //     edges[0] = left_most_edge;
    // }

    centers = [];
    for (let i = 0; i < edges.length - 1; i++) {
        centers.push((edges[i + 1] + edges[i]) / 2);
    }

    counts = new Array(centers.length).fill(0);
    for (let s of series) {
        idx = hist_index_from_value(edges, s);
        counts[idx]++;
    }

    return [edges, centers, counts];
}

function hist_index_from_value(edges, value) {
    // return the index of the bin that contains the value
    // if the value is outside the range, return -1
    for (let i = 1; i < edges.length; i++) {
        if (value <= edges[i]) {
            return i - 1;
        }
    }
    // return edges.length - 1;
    return null
}


function get_url_queries() {
    // get the url queries as a dict
    // returns a dict with the query names as keys and the values as values

    let url = new URL(window.location.href);

    let params = new URLSearchParams(url.search.slice(0));

    // build a dict with the query names as keys and the values as values
    let queries = {};
    for (let param of params) {
        queries[param[0]] = param[1];
    }

    return queries;

}
