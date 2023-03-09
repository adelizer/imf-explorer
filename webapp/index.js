const url = "https://fastapi-traefik.moabdelhady.com/"
const AreaSearchInput = document.getElementById("area-search");
const AreasOptionsContainer = document.getElementById("multiselect-area");
const IndicatorSearchInput = document.getElementById("indicator-search");
const IndicatorsOptionsContainer = document.getElementById("multiselect-indicator");
const radioButtons = document.querySelectorAll('input[type="radio"]');
const downloadButton = document.getElementById("download-data");
const correlationButton = document.getElementById("correlation-button");
const updateChartButton = document.getElementById("update-chart-button");
const sa = document.getElementById("display-selected-area");
const si = document.getElementById("display-selected-indicator");
const queryMethod = 'POST';
const queryHeaders = { 'Content-Type': 'application/json' }
var selectedFrequency = "M"
var startDateValue = "2001-01-01"
var endDateValue = "2023-01-01"
var selectedArea = "US";
var selectedIndicator = "PMP_IX";
function updateDisplay() {
  sa.textContent = `Selected: ${selectedArea}`
  si.textContent = `Selected: ${selectedIndicator}`
}
for (const button of radioButtons) { if (button.value == "M") { button.checked = true; break; } }
function updateSelectedFrequency() {
  for (const button of radioButtons) {
    if (button.checked) {
      selectedFrequency = button.value;
      console.log("Radio buttons: " + selectedFrequency)
      break;
    }
  }
  queryIndicator();
}
for (const button of radioButtons) {
  button.addEventListener('change', function () {
    updateSelectedFrequency();
    queryIndicator();
  });
}
function showErrorMessage(errorElement, msg) {
  errorElement.textContent = msg
  errorElement.classList.add("error");
  setTimeout(function () {
    errorElement.textContent = "";
    errorElement.classList.remove("error");
  }, 3000);
}
function validateQuery() {
  const errorElement = document.getElementById("error-message");
  if (selectedArea.length == 0 && selectedIndicator.length == 0) {
    let message = `Select at least 1 area or 1 indicator to download the data you have selected the following areas`
    showErrorMessage(errorElement, message);
    return false;
  }
  if ((selectedArea.split("+").length > 1 && selectedIndicator.length == 0) || (selectedIndicator.split("+").length > 1 && selectedArea.length == 0)) {
    let message = `Please refine the query more or remove multiple areas/indicators selected`
    showErrorMessage(errorElement, message);
    return false;
  }
  return true;
}
updateChartButton.addEventListener("click", function () {
  if (!validateQuery()) {
    return;
  }
  updateDisplay();
  queryIndicator();
})
function showCorrelation() {
  let indicatorList = selectedIndicator.split("+")
  if (indicatorList.length > 1 || selectedIndicator.length == 0) {
    const errorElement = document.getElementById("correlation-error-message");
    let message = "Select only 1 indicator to calculate correlation, you have selected: " + selectedIndicator;
    showErrorMessage(errorElement, message);
    return;
  }
  let q = `${selectedFrequency}..${selectedIndicator}?startPeriod=${startDateValue}&endPeriod=${endDateValue}`
  let options = {
    method: queryMethod,
    headers: queryHeaders,
    body: JSON.stringify({ q: q, })
  }
  fetch(url + "query-correlation", options)
    .then(res => res.json())
    .then(res => {
      if (res.x.length > 0) {
        var layout = { title: { text: `${selectedIndicator}` }, }
        var data = [{ z: res.z, x: res.x, y: res.y, type: 'heatmap', hoverongaps: false }];
        Plotly.newPlot('correlation-chart', data, layout);
      }
    })
}
correlationButton.addEventListener("click", showCorrelation())
downloadButton.addEventListener("click", function () {
  if (!validateQuery()) {
    return;
  }
  updateDisplay();
  let q = `${selectedFrequency}.${selectedArea}.${selectedIndicator}?startPeriod=${startDateValue}&endPeriod=${endDateValue}`
  let options = {
    method: 'POST',
    headers: queryHeaders,
    body: JSON.stringify({ q: q, })
  }
  fetch(url + "query-csv", options)
    .then(res => res.blob())
    .then(res => {
      const blob = new Blob([res], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'data.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    })
})
function updateList(options, searchTerm) {
  const regex = new RegExp(searchTerm, "gi");
  options.forEach(function (option) {
    if (regex.test(option.textContent.toLowerCase())) {
      option.style.display = "block";
    } else {
      option.style.display = "none";
    }
  });
}
AreaSearchInput.addEventListener("input", function () {
  const searchTerm = this.value.toLowerCase();
  const options = AreasOptionsContainer.querySelectorAll("label");
  updateList(options, searchTerm);
});
IndicatorSearchInput.addEventListener("input", function () {
  const searchTerm = this.value.toLowerCase();
  let options = IndicatorsOptionsContainer.querySelectorAll("label");
  updateList(options, searchTerm);
});
function cleanField(field) {
  if (field.startsWith("+")) { field = field.substring(1) }
  if (field.startsWith("+")) { field = field.substring(1) }
  if (field.endsWith("+")) { field = field.slice(0, -1) }
  if (field.endsWith("+")) { field = field.slice(0, -1) }
  field = field.replace("++", "+");
  return field;
}
function updateSelectedArea(c) {
  if (c.srcElement.checked == true) {
    selectedArea = selectedArea + `+${c.srcElement.value}`
  } else { selectedArea = selectedArea.replace(c.srcElement.value, '') }
  selectedArea = cleanField(selectedArea);
  updateDisplay();
}
function updateSelectedIndicator(c) {
  if (c.srcElement.checked == true) {
    selectedIndicator = selectedIndicator + `+${c.srcElement.value}`
  } else { selectedIndicator = selectedIndicator.replace(c.srcElement.value, '') }
  selectedIndicator = cleanField(selectedIndicator);
  updateDisplay();
}
function populateAreas() {
  fetch(url + "available-areas")
    .then(res => res.json())
    .then(areas => {
      for (const key in areas) {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = key;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" " + key + ": " + areas[key]));
        AreasOptionsContainer.appendChild(label);
        checkbox.addEventListener("change", updateSelectedArea)
        if (key == "US") {
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
          checkbox.checked = true;
        }
      }
    })
}
function queryIndicator() {
  if (selectedArea.length == 0 && selectedIndicator.length == 0) {
    const errorElement = document.getElementById("error-message");
    let message = `Select at least 1 area or 1 indicator to download the data you have selected the following areas`
    showErrorMessage(errorElement, message);
    return;
  }
  let q = `${selectedFrequency}.${selectedArea}.${selectedIndicator}?startPeriod=${startDateValue}&endPeriod=${endDateValue}`
  console.log("query string: " + q)
  let options = {
    method: queryMethod,
    headers: queryHeaders,
    body: JSON.stringify({ q: q, })
  }
  let areaList = selectedArea.split("+")
  let indicatorList = selectedIndicator.split("+")
  let requiredData = {}
  for (let i = 0; i < areaList.length; i++) {
    for (let j = 0; j < indicatorList.length; j++) {
      requiredData[selectedFrequency + "-" + areaList[i] + "-" + indicatorList[j]] = 1
    }
  }
  fetch(url + "query", options)
    .then(res => res.json())
    .then(res => {
      if (res.data.length > 0) {
        let traces = []
        for (let i = 0; i < res.data.length; i++) {
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
          delete requiredData[curr["identifier"]]
          traces.push(trace);
        }
        var layout = {
          title: { text: `IMF Data Chart` },
          margin: { t: 100 },
          xaxis: { title: { text: `Date` } },
        }
        Plotly.newPlot("chart", traces, layout);
      };
      if (Object.keys(requiredData).length > 0) {
        const errorElement = document.getElementById("error-message");
        let message = "IMF did not provide the full data for the following query: " + Object.keys(requiredData)
        showErrorMessage(errorElement, message);
      }
    })
}
function entrypoint() {
  populateAreas();
  populateIndicators();
  queryIndicator();
  showCorrelation();
}
document.addEventListener("DOMContentLoaded", function () { entrypoint(); });
