document.addEventListener("DOMContentLoaded", main);

// some global variables for debugging
var data;
var dataTable;
var miChart;

// initialize after dom is loaded
async function main() {
    // Create table by loading data via php
    data = await fetch("get_exp_results.php").then(response => response.json());

    console.log(data);

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
    miChart = create_graph();


    // init DataTable for sorting and the likes
    dataTable = new DataTable('#leaderboard',
        {
            // paging: false,
            language: {
                search: "",
                searchPlaceholder: "Search hash"
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

    // currently search still searches everything.
    dataTable.on('search.dt', function () {
        console.log(dataTable.search());
        // this gives us the rows that are still visible. we could get
        // the id and highligh those points in the distribution graph.
        console.log(dataTable.rows({ filter: 'applied' }));
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

    console.log(keys);
    console.log(num_rows);

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
            console.log(td.innerHTML);
            tr.appendChild(td);
        }
        table_body.appendChild(tr);
    }

    table.appendChild(table_body);
    return table;
}

function GaussKDE(xi, x) {
    return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(Math.pow(xi - x, 2) / -2);
}

function create_graph() {



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

    // Create the density estimate
    for (i = 0; i < xiData.length; i++) {
        let temp = 0;
        kernel.push([]);
        kernel[i].push(new Array(dataSource.length));
        for (j = 0; j < dataSource.length; j++) {
            temp = temp + GaussKDE(xiData[i], dataSource[j]);
            kernel[i][j] = GaussKDE(xiData[i], dataSource[j]);
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
            title: { text: "Mutual Information in bits" },
            min: 0,
        },
        yAxis: {
            title: { text: "Probability" }
        },
        legend: {
            enabled: false,
        },
        tooltip: {
            valueDecimals: 3
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
