// elements
let chart = document.getElementById('chart');
const AreaSearchInput = document.getElementById("AreaSearchInput");
const AreasOptionsContainer = document.getElementById("AreasOptionsContainer");
const IndicatorSearchInput = document.getElementById("IndicatorSearchInput");
const IndicatorsOptionsContainer = document.getElementById("IndicatorsOptionsContainer");
const radioButtons = document.querySelectorAll('input[name="options"]');
const updateChartButton = document.getElementById("updateChart")
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
startDate.defaultValue = "2001-01-01";
endDate.defaultValue = "2023-01-01";

// global variables
var selectedFrequency = "M"
var startDateValue = "2001-01-01"
var endDateValue = "2023-01-01"
var selectedArea = "US";
var selectedIndicator = "PMP_IX";



// utils
function updateSelectedFrequency(){
    for (const button of radioButtons) {
      if (button.checked) {
        selectedFrequency = button.value;
        console.log("Radio buttons: " + selectedFrequency)
        break;
      }
    }
    queryIndicator();
}

// event listeners
for (const button of radioButtons) {
    button.addEventListener('change', function() {
        updateSelectedFrequency();
    });
}
startDate.addEventListener('change', function() {
    startDateValue = startDate.value
    console.log(startDateValue)
})
endDate.addEventListener('change', function() {
    endDateValue = endDate.value
    console.log(endDateValue)
})
updateChartButton.addEventListener("click", function() {
    console.log("clicked")
})

AreaSearchInput.addEventListener("input", function() {
    const searchTerm = this.value.toLowerCase();
    const regex = new RegExp(searchTerm, "gi");
    let options = document.querySelectorAll(".area-multiselect-options label");

    options.forEach(function(option) {
      if (regex.test(option.textContent.toLowerCase())) {
        option.style.display = "block";
      } else {
        option.style.display = "none";
      }
    });
  });


IndicatorSearchInput.addEventListener("input", function() {
    const searchTerm = this.value.toLowerCase();
    const regex = new RegExp(searchTerm, "gi");
    let options = document.querySelectorAll(".indicator-multiselect-options label");

    options.forEach(function(option) {
      if (regex.test(option.textContent.toLowerCase())) {
        option.style.display = "block";
      } else {
        option.style.display = "none";
      }
    });
  });

function updateSelectedIndicator(c){
    let newValue = c.srcElement.value;
    selectedIndicator = newValue;

    let options = document.querySelectorAll(".indicator-multiselect-options label");

    options.forEach(function(option) {
        if (option.children[0].value != newValue){
            option.children[0].checked = false;
        }
        
    });
    queryIndicator();
}

function updateSelectedArea(c){
    console.log("updateSelectedArea callback")
    let newValue = c.srcElement.value;
    selectedArea = newValue;
    let options = document.querySelectorAll(".area-multiselect-options label");

    options.forEach(function(option) {
        if (option.children[0].value != newValue){
            option.children[0].checked = false;
        }
    });
    queryIndicator();
    console.log("selected area: " + selectedArea)
}


function populateAreas() {
    fetch("http://localhost:8000/available-areas")
    .then(res => res.json())
    .then(areas => {
        console.log("creating areas elements")
        for (const key in areas) {
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = key;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(key + ": " + areas[key]));
            AreasOptionsContainer.appendChild(label);
            checkbox.addEventListener("change", updateSelectedArea)
            if (key == "US"){
                console.log("US found, setting as initial value")
                checkbox.checked = true;
            }
          }
    })
}

function populateIndicators() {
    fetch("http://localhost:8000/available-indicators")
    .then(res => res.json())
    .then(areas => {
        console.log("creating indicator elements")
        for (const key in areas) {
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = key;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(key + ": " + areas[key]));
            IndicatorsOptionsContainer.appendChild(label);
            checkbox.addEventListener("change", updateSelectedIndicator)
            if (key == "PMP_IX") {
                console.log("PMP_IX found, setting as initial value")
                checkbox.checked = true;
            }
          }
    })
}


function queryIndicator() {
    let q = `${selectedFrequency}.${selectedArea}.${selectedIndicator}?startPeriod=${startDateValue}&endPeriod=${endDateValue}`
    console.log("query string: "+q)
    let options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            q: q,
        })
      }
    fetch("http://localhost:8000/query", options)
    .then(res => res.json())
    .then(res => {
    if ("metadata" in res){
        x = res["date"]
        y = res["value"]
        metadata = res["metadata"]
        console.log(metadata)
        var trace0 = {
            x: x,
            y: y,
            mode: 'lines+markers',
            type: 'scatter',
            marker: {
                opacity: 0.5,
            }
        };
        var layout = {
            title: {
                text: `${metadata.Area} - ${metadata.Indicator}`
            },
            margin: { t: 100 },
            xaxis: {
                title: {
                    text: `TimeFormat: ${metadata.TimeFormat}`
                }
            },
            yaxis: {
                title: {
                    text: `Units: ${metadata.Units}`
                }
            }
        };
        Plotly.newPlot(chart, [trace0], layout);
    }
    else{
        window.alert(["No data found with the specified values choose different indicators/areas/freq/time range"]);
    }
    })
    
}


function entrypoint(){
    console.log("Entrypoint function");
    populateAreas();
    populateIndicators();
    queryIndicator();
    
    // .then(res => console.log(res)))
    // Display the first chart
    // Get a list of all available indicators
    // let indicators = query_metadata();
    // let data = query_indicator(`M.US.PMP_IX?startPeriod=2001-01-01&endPeriod=2022-12-31`);
    // console.log(data);
}


// function modifyIndicator(){
//     indicator = dropdown.value
//     freq = getSelectedFrequency()
//     let data = query_indicator(`${freq}.US.${indicator}?startPeriod=2001-01-01&endPeriod=2022-12-31`);
// }

document.addEventListener("DOMContentLoaded", function() {
    entrypoint();
});


