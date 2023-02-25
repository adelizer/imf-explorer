const url = document.currentScript.getAttribute('url')
console.log(url)
const AreaSearchInput = document.getElementById("area-search");
const AreasOptionsContainer = document.getElementById("multiselect-area");
const IndicatorSearchInput = document.getElementById("indicator-search");
const IndicatorsOptionsContainer = document.getElementById("multiselect-indicator");
const radioButtons = document.querySelectorAll('input[type="radio"]');
const downloadButton = document.getElementById("download-data");
const correlationButton = document.getElementById("correlation-button");
// global variables
var selectedFrequency = "M"
var startDateValue = "2001-01-01"
var endDateValue = "2023-01-01"
var selectedArea = "US";
var selectedIndicator = "PMP_IX";
for (const button of radioButtons) {
    if (button.value == "M") {
        button.checked = true;
      break;
    }
  }
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
correlationButton.addEventListener("click", function() {
    let indicatorList = selectedIndicator.split("+")
    if (indicatorList.length > 1) {
            const errorMessage = document.getElementById("correlation-error-message");
            errorMessage.textContent = "Select only 1 indicator to calculate correlation, you have selected: " + selectedIndicator;
            errorMessage.classList.add("error");
            setTimeout(function() {
                errorMessage.textContent = "";
                errorMessage.classList.remove("error");
              }, 3000);
    }
    let q = `${selectedFrequency}..${selectedIndicator}?startPeriod=${startDateValue}&endPeriod=${endDateValue}`
    let options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            q: q,
        })
      }
    fetch(url + "query-correlation", options)
    .then(res => res.json())
    .then(res => {
      if (res.x.length > 0){
        var data = [
        {
          z: res.z,
          x: res.x,
          y: res.y,
          type: 'heatmap',
          hoverongaps: false
        }
      ];
      Plotly.newPlot('correlation-chart', data);
      }
    })
})
downloadButton.addEventListener("click", function() {
    console.log("download requested")
    let q = `${selectedFrequency}.${selectedArea}.${selectedIndicator}?startPeriod=${startDateValue}&endPeriod=${endDateValue}`
    let options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            q: q,
        })
    }
    fetch(url + "query-csv", options)
    .then(res => res.blob())
    .then(res => {
        // create a new blob object from the CSV data
        const blob = new Blob([res], {type: 'text/csv'});
        // create a URL object from the blob
        const url = URL.createObjectURL(blob);
        // create a new anchor tag with the download attribute
        const link = document.createElement('a');
        link.href = url;
        link.download = 'data.csv';
        // trigger a click event on the anchor tag to download the file
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // revoke the URL object to free up memory
        URL.revokeObjectURL(url);
    })
})
AreaSearchInput.addEventListener("input", function() {
    const searchTerm = this.value.toLowerCase();
    const regex = new RegExp(searchTerm, "gi");
    const options = AreasOptionsContainer.querySelectorAll("label");
    options.forEach(function(option) {
        console.log(option)
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
    let options = IndicatorsOptionsContainer.querySelectorAll("label");
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
    selectedIndicator = selectedIndicator.replace("++", "+")
    queryIndicator();
}
function updateSelectedArea(c){
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
    selectedArea = selectedArea.replace("++", "+")
    queryIndicator();
    console.log("selected area: " + selectedArea)
}
function populateAreas() {
    fetch(url + "available-areas")
    .then(res => res.json())
    .then(areas => {
        console.log("creating areas elements")
        for (const key in areas) {
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = key;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(" " + key + ": " + areas[key]));
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
    fetch(url + "available-indicators")
    .then(res => res.json())
    .then(areas => {
        console.log("creating indicator elements")
        for (const key in areas) {
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = key;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(" " + key + ": " + areas[key]));
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
    console.log("query string: " + q)
    let options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            q: q,
        })
      }
    let areaList = selectedArea.split("+")
    let indicatorList = selectedIndicator.split("+")
    let requiredData = {}
    for (let i = 0; i < areaList.length; i++){
        for (let j = 0; j < indicatorList.length; j++){
            requiredData[selectedFrequency + "-" + areaList[i] + "-" + indicatorList[j]] = 1
        }
    }
    fetch(url + "query", options)
    .then(res => res.json())
    .then(res => {
    if (res.data.length > 0){
        let traces = []
        for (let i= 0; i < res.data.length; i++){
            let curr = res.data[i]
            let trace = {
                x: curr["x"],
                y: curr["y"],
                mode: 'lines+markers',
                type: 'scatter',
                fill: 'tozeroy',
                marker: {
                    opacity: 0.5,
                },
                name: curr["identifier"],
            };
            // downloadData = {"date": curr["x"], "indicator": curr["y"]}
            delete requiredData[curr["identifier"]]
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
            Plotly.newPlot("chart", traces, layout);
        };
        if (Object.keys(requiredData).length > 0){
            const errorMessage = document.getElementById("error-message");
            errorMessage.textContent = "IMF did not provide data for the following query: " + Object.keys(requiredData);
            errorMessage.classList.add("error");
            setTimeout(function() {
                errorMessage.textContent = "";
                errorMessage.classList.remove("error");
              }, 3000);
        }
    })
}
function entrypoint(){
    populateAreas();
    populateIndicators();
    queryIndicator();
}
document.addEventListener("DOMContentLoaded", function() {
    entrypoint();
});
