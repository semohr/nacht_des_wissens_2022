document.addEventListener("DOMContentLoaded", main);

// some global variables for debugging
var data = [];
var dataTable;
var miChart;
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


    column_ids = ["rank", "team_name", "mi_bits_s", "mi_bits", "duration"];
    column_labels = column_ids.map(id => { return $LANG[id] });

    // create table in html
    let table = create_table(data, keys = column_ids, row_first = true);
    table.id = "leaderboard";
    table.style.width = "100%";
    document.getElementById("leaderboard-container").appendChild(table);


    const [edges, bin_centers, counts] = calculate_histogram(data.map(d => d["mi_bits"]));
    // console.log(bin_centers);
    // console.log(edges);
    // console.log(counts);

    // Create graphs
    miChart = create_mi_dist(
        x = bin_centers,
        y = counts,
    );
    miScatter = create_scatter_plot(
        x = data.map(d => d["mi_bits"]),
        y = data.map(d => d["mi_bits_s"]),
    );

    // init DataTable for sorting and the likes
    dataTable = new DataTable('#leaderboard',
        {
            columns: column_ids.map(
                id => {
                    return {
                        title: $LANG[id],
                        data: id,
                        searchable: id == "team_name" ? true : false,
                        render: (["mi_bits_s", "mi_bits", "duration"].includes(id)) ?
                            DataTable.render.number(null, null, 2) :
                            DataTable.render.text()
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
                "<'d-flex flex-wrap mt-2 mx-2' <'my-1 me-auto'l> <p> >"

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

        mi = rows.map(row => Math.abs(parseFloat(row["mi_bits"])));
        mi_per_sec = rows.map(row => Math.abs(parseFloat(row["mi_bits_s"])));

        // set the tooltip of the prob dist to the highest mi that is still visible!
        mi_max = Math.max(...mi);
        highlight_points_in_chart(miChart, mi_max);

        // for scatter, highlight all matches
        highlight_points_in_chart(miScatter, mi, mi_per_sec);

    });

    dataTable.on('select', function (e, dt, type, indexes) {
        // type should always be row!
        if (type === 'row') {
            // we only allow selecting one item
            let row = dataTable.rows(indexes).data()[0];

            mi = parseFloat(row["mi_bits"]);
            mi_per_sec = parseFloat(row["mi_bits_s"]);

            // set the tooltip of the prob dist to the highest mi that is still visible!
            highlight_points_in_chart(miChart, mi);

            // for scatter, highlight all matches
            highlight_points_in_chart(miScatter, mi, mi_per_sec);
        }

    });

    dataTable.on('deselect', function (e, dt, type, indexes) {
        unhighlight_all(miChart);
        unhighlight_all(miScatter);
    });

    // fetch the teamname from the url so we can link to a team via qr code
    get_url_queries();
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

function create_mi_dist(x, y, base_color = "#6C757D", highlight_color = "#027BFF") {

    // plot mutual information as smoothed histogram
    const N = y.reduce((a, b) => a + b);

    // normalize y
    y = y.map(y_i => y_i / N);

    // zip x and y into array of tuples
    const data = x.map((x, i) => [x, y[i]]);

    // localised tootlip formatter
    function localised_formatter(x, y) {
        if ($locale == "de") {
            return '<b>' + x.toFixed(2) + '</b> bits wurden in<br><b>' + Math.floor(y * N) + '</b> von ' + N + ' Experimenten erreicht';
        } else {
            return '<b>' + x.toFixed(2) + '</b> bits were reached in<br><b>' + Math.floor(y * N) + '</b> out of ' + N + ' experiments';
        }
    }


    return Highcharts.chart("miDist", {
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
            min: 0,
            crosshair: false,
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
                return localised_formatter(this.x, this.y);
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
                pointPadding: 0,
                borderWidth: 0,
                groupPadding: 0.01,
                shadow: false,
                colorByPoint: true,
            }
        },
        series: [{
            name: "P(MI)",
            data: data,
            allowPointSelect: false,
            states: {
                select: {
                    color: highlight_color,
                },
            },
        }],
        // hide the highcharts logo. make sure to acknowledge in the credits section
        credits: {
            enabled: false
        },
    })
}

function create_scatter_plot(x, y, base_color = "#6C757D", highlight_color = "#027BFF") {

    x = x.flat();
    y = y.flat();
    data = x.map((x, i) => [x, y[i]])

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
            crosshair: false,
        },
        yAxis: {
            title: { text: $LANG['scatter_ylabel'] },
            min: 0,
            crosshair: false,
        },
        legend: {
            enabled: false,
        },
        // for the tooltip we want to say sth like ~ 3 teams reached such a score.
        // to convert the plotted kde (a probability) to something like a histogram,
        // we just need to multiply with the number of teams and cast to int.
        tooltip: {
            enabled: false,
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

function highlight_points_in_chart(chart, x_val, y_val = null) {
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

    console.log(x_val);
    console.log(y_val);
    var poi;
    Highcharts.each(chart.series[0].points, function (point) {
        // unselect all points by default
        point.select(false);
        // select the ones that match
        for (let i = 0; i < x_val.length; i++) {
            if (point.x == x_val[i]) {
                if (y_val[i] == null || y_val[i] == point.y) {
                    console.log("highlighting: " + point.x + " " + point.y);
                    chart.tooltip.refresh([point]);
                    point.setState("select");
                }
            }
        }
    });
}

function unhighlight_all(chart) {
    chart.tooltip.hide();
    Highcharts.each(chart.series[0].points, function (point) {
        point.select(false);
    });
}

function calculate_histogram(data) {
    // pass a series of data assuming events are discrete.
    // automatically calculate bin edges.

    // returns bin_edges (length n+1), bin_centers (length n) and counts (length n)

    sorted_data = data;
    sorted_data = sorted_data.flat();
    sorted_data = sorted_data.sort(function (a, b) { return a - b; });
    // console.log("data");
    // console.log(sorted_data);

    const unique = (value, index, self) => {
        // check that the floating point value is not the same as the previous one
        return self.indexOf(value) === index
    }
    var unique_values = sorted_data.filter(unique);

    edges = [unique_values[0] - 0.1];
    for (let i = 0; i < unique_values.length - 1; i++) {
        edges.push(unique_values[i] + (unique_values[i + 1] - unique_values[i]) / 2);
    }
    edges.push(unique_values[unique_values.length - 1] + 0.1);

    counts = new Array(edges.length - 1).fill(0);

    for (let val of sorted_data) {
        idx = hist_index_from_value(edges, val);
        console.log(idx + ' ' + val);
        counts[idx] = counts[idx] + 1;
    }

    // console.log("edges");
    // console.log(edges);
    // console.log("unique_values");
    // console.log(unique_values);
    // console.log("counts");
    // console.log(counts);

    // dirty temporary hack
    let mi_max = 3.14;
    let mi_min = 0;

    num_bins = 10;
    bw = (mi_max - mi_min) / num_bins;

    bin_centers = new Array(num_bins).fill(0);
    for (let i = 0; i < bin_centers.length; i++) {
        bin_centers[i] = mi_min + i * bw;
    }

    edges = new Array(num_bins + 1).fill(0);
    for (let i = 0; i < edges.length; i++) {
        edges[i] = mi_min + i * bw; - bw / 2;
    }

    counts = new Array(num_bins).fill(0);
    for (let d of sorted_data) {
        idx = hist_index_from_value(edges, d);
        counts[idx] = counts[idx] + 1;
    }


    return [edges, bin_centers, counts];
}

function hist_index_from_value(edges, value) {
    // return the index of the bin that contains the value
    // if the value is outside the range, return -1
    for (let i = 0; i < edges.length; i++) {
        if (value < edges[i]) {
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

    let params = new URLSearchParams(url.search.slice(1));

    for (let p of params) {
        console.log(p);
    }

}