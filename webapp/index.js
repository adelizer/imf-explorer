const INTERNAL_SERVER = "http://localhost:8000/"
let chart = document.getElementById('chart');
const dropdown = document.getElementById('dropdown');

// options.forEach(function(option) {
//     const optionElement = document.createElement('option');
//     optionElement.value = option;
//     optionElement.textContent = option;
//     dropdown.appendChild(optionElement);
//   });

function query_indicator(q) {
    let options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            q: q,
        })
      }
    fetch(INTERNAL_SERVER + "indicator/", options)
    .then(res => res.json())
    .then(res => {
    x = res["date"]
    y = res["value"]

    var trace0 = {
        x: x,
        y: y,
        mode: 'lines+markers',
        type: 'scatter',
        marker: {
            opacity: 0.5,
        }
      };
    Plotly.newPlot(chart, 
        [trace0], {
    margin: { t: 0 } } );
    })
}

function query_metadata() {
    fetch(INTERNAL_SERVER + "metadata")
    .then(res => res.json())
    .then(res => {
        indicators = res["CL_INDICATOR_IFS"]
        console.log(indicators[0])
        for (const key in indicators) {
            // console.log(`${key}: ${indicators[key]}`);
            const optionElement = document.createElement('option');
            optionElement.value = key;
            optionElement.textContent = key + ": " + indicators[key];
            dropdown.appendChild(optionElement);
          }
    })
}

function entrypoint(){
    console.log("Entrypoint function")
    // Display the first chart
    // Get a list of all available indicators
    let indicators = query_metadata();
    let data = query_indicator(`M.US.PMP_IX?startPeriod=2001-01-01&endPeriod=2022-12-31`);
    // console.log(data);
}


function modifyIndicator(){

    indicator = dropdown.value
    let data = query_indicator(`M.US.${indicator}?startPeriod=2001-01-01&endPeriod=2022-12-31`);
}

document.addEventListener("DOMContentLoaded", function() {
    entrypoint();
});




// plotly.newPlot( TESTER, [{
//     x: [1, 2, 3, 4, 5],
//     y: [1, 2, 4, 8, 16] }], {
//     margin: { t: 0 } } );