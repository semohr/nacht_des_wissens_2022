document.addEventListener("DOMContentLoaded", main);

// some global variables for debugging
var data;
var dataTable;
var miChart;

// initialize after dom is loaded
async function main() {
    // Create table by loading data via php
    data = await fetch("get_exp_results.php").then(response => response.json());

    // console.log(data);

    // sort data according to some key
    const sort_by = "MI";
    data.sort(function (a, b) {
        return b[sort_by] - a[sort_by];
    });

    // const table_data = { "ID": [0, 1, 2, 3, 4, 5, 6], "Mutual Information": [0, 0, 0, 0, 0, 0, 0] }
    let table = create_table(data, row_first = true);
    table.id = "leaderboard";
    table.style.width = "100%";

    document.getElementById("leaderboard-container").appendChild(table);

    // Create graph
    miChart = create_mi_dist();


    // init DataTable for sorting and the likes
    dataTable = new DataTable('#leaderboard',
        {
            // paging: false,
            language: {
                // url: "//cdn.datatables.net/plug-ins/1.10.18/i18n/English.json",
                url: "//cdn.datatables.net/plug-ins/1.10.18/i18n/" + $LANG['language'] + ".json",
                search: "",
                searchPlaceholder: $LANG['datatable_search_placeholder'],
            },
            // customize the created dom https://datatables.net/reference/option/dom
            // "dom": 'ft'
            // needed tweaking to have search on the left
            // "dom": "<'row'<'col-2'f> <'col-8'> <'col-2'l> > <'row'<'col-12'tr>> <'row px-2'<'col-6'p>>"
            "dom": "<'d-flex justify-content-between mx-2' <f> <l> >" +
                "<'row'<'col-12'tr>>" +
                "<'d-flex flex-row-reverse mx-2' <p> >"

        }
    );

    // we will need to make sure that we always have at least one row of data!
    keys = Object.keys(data[0]);

    // currently search still searches everything.
    dataTable.on('search.dt', function () {
        // this gives us the rows that are still visible. we could get
        // the id and highligh those points in the distribution graph.
        // console.log(dataTable.rows({ filter: 'applied' }));
        visible_rows = dataTable.rows({ filter: 'applied' }).data().toArray()
        // visible_hashes = visible_rows.map(row => row[col_index_for_hash]);
        if (visible_rows.length == 1) {
            // render special tootlip in high charts
            hash = visible_rows[0][keys.indexOf("expID")];
            mi = visible_rows[0][keys.indexOf("MI")];
            console.log(mi);
            highlight_point_in_chart(miChart, x_val = mi);
        }
    });
}

/** Returns table from cols data, data hast to be dict of arrays with
 * the key being the header. It is assumed that all arrays have the same length.
 * @param {dict} data e.g. {'header1': [1, 2, 3], 'header2': [4, 5, 6]}
 * ps: I added `row_first` so we can pass data as we get it from php.
 * we could detect this but focus, lennard.
 */
function create_table(data, row_first = false) {

    let keys = (row_first) ? Object.keys(data[0]) : Object.keys(data);
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

function GaussKDE(xi, x, sigma=1) {
    return (1 / sigma / Math.sqrt(2 * Math.PI)) * Math.exp(Math.pow((xi - x)/sigma, 2) / -2);
}

function create_mi_dist() {

    // ps 22-06-14:
    // i think we should not use the gaussian kernel (sorry)
    // * simple smoothing can be enabled via highcharts builtin: https://jsfiddle.net/5g4m3nLz/
    // * the tooltip becomes messy with kernel. x points are not constrained to data, histogram like y values are not that trivial. also having 1.5 teams reach 91 bits seems weird.


    let dataSource = [93, 93, 96, 100, 101, 102, 102];
    let xiData = [];
    let range = 105,
        startPoint = 0;
    for (i = 0; i < range; i++) {
        xiData[i] = startPoint + i;
    }

    let data_plot = [];
    let N = dataSource.length;
    let kernelChart = [];
    let kernel = [];
    let data = [];
    // MI range over which the kernel smoothes
    let sigma = 2.0;

    // Create the density estimate
    for (i = 0; i < xiData.length; i++) {
        let temp = 0;
        kernel.push([]);
        kernel[i].push(new Array(dataSource.length));
        for (j = 0; j < dataSource.length; j++) {
            temp = temp + GaussKDE(xiData[i], dataSource[j], sigma);
            kernel[i][j] = GaussKDE(xiData[i], dataSource[j], sigma);
        }
        data.push([xiData[i], (1 / N) * temp]);
    }

    return Highcharts.chart("graph", {
        chart: {
            type: "spline",
            animation: true,
            zoomType: "x",
        },

        title: {
            text: ""
        },
        xAxis: {
            type: "",
            title: { text: $LANG['mi_xlabel'] },
            min: 0,
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
                return '~ <b>' + Math.floor(this.y * N / sigma * 10) + '</b> teams<br>reached <b>' + this.x + '</b> bits';
            }
        },
        // match bootstrap colors so we can match the headers of the card button etc
        colors: ["#027BFF", "#DC3645", "#FFC207", "#28A745",
            "#19A2B7", "#343A41", "#6C757D"],
        plotOptions: {
            series: {
                marker: {
                    enabled: false
                },
            }
        },
        series: [
            { name: "P(MI)", data: data },
        ],
        // hide the highcharts logo. make sure to acknowledge in the credits section
        credits: {
            enabled: false
        },
    })
}

function highlight_point_in_chart(chart, x_val) {
    // we need to find the point in the series via the desired x-value,
    // and customzie the tooltip

    var poi;
    Highcharts.each(chart.series[0].points, function (point) {
        console.log(point.x)
        if (point.x == x_val) {
            poi = point;
            // break
            // return false;
        }
    });

    // chart.series[0].data[50].setState("hover")
    // chart.tooltip.refresh([chart.series[0].points[50]]);
    poi.setState("hover");
    chart.tooltip.refresh([poi]);
}
