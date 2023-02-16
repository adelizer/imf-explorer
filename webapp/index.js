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
        queryIndicator();
    });
}
startDate.addEventListener('change', function() {
    startDateValue = startDate.value
    queryIndicator();
    console.log(startDateValue)
})
endDate.addEventListener('change', function() {
    endDateValue = endDate.value
    queryIndicator();
    console.log(endDateValue)
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
    console.log(c.srcElement)
    if (c.srcElement.checked == true){
        selectedIndicator = selectedIndicator + `+${c.srcElement.value}`
    } else{
        selectedIndicator = selectedIndicator.replace(c.srcElement.value, '')
    }
    if (selectedIndicator.startsWith("+")){
        selectedIndicator = selectedIndicator.substring(1)
    }
    if (selectedIndicator.endsWith("+")){
        selectedIndicator = selectedIndicator.slice(0, -1)
    }
    console.log(selectedIndicator)
    // selectedIndicator = newValue;

    // let options = document.querySelectorAll(".indicator-multiselect-options label");

    // options.forEach(function(option) {
    //     if (option.children[0].value != newValue){
    //         option.children[0].checked = false;
    //     }
        
    // });
    queryIndicator();
}

function updateSelectedArea(c){
    console.log(c.srcElement)
    if (c.srcElement.checked == true){
        selectedArea = selectedArea + `+${c.srcElement.value}`
    } else{
        selectedArea = selectedArea.replace(c.srcElement.value, '')
    }
    if (selectedArea.startsWith("+")){
        selectedArea = selectedArea.substring(1)
    }
    if (selectedArea.endsWith("+")){
        selectedArea = selectedArea.slice(0, -1)
    }
    // let options = document.querySelectorAll(".area-multiselect-options label");

    // options.forEach(function(option) {
    //     if (option.children[0].value != newValue){
    //         option.children[0].checked = false;
    //     }
    // });
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
    if (res.data.length > 0){

        let traces = []
        for (let i= 0; i<res.data.length; i++){
            let curr = res.data[i]
            let trace = {
                x: curr["x"],
                y: curr["y"],
                mode: 'lines+markers',
                type: 'scatter',
                marker: {
                    opacity: 0.5,
                },
                name: curr["identifier"],
            };
            traces.push(trace);
        }

        
        var layout = {
            title: {
                text: `IMF Data Chart`
            },
            margin: { t: 100 },
            xaxis: {
                title: {
                    text: `Date`
                }
            },
            }
            Plotly.newPlot(chart, traces, layout);
        };
        
    
        
    // }
    // else{
    //     window.alert(["No data found with the specified values choose different indicators/areas/freq/time range"]);
    // }
    })
    
}


function entrypoint(){
    console.log("Entrypoint function");
    populateAreas();
    populateIndicators();
    queryIndicator();
    
}



document.addEventListener("DOMContentLoaded", function() {
    entrypoint();
});


