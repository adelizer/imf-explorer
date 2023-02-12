const express = require('express')
const plotly = require('plotly')
const PORT = 8000
const app = express()
const IMF_BASE_URL = "http://dataservices.imf.org/REST/SDMX_JSON.svc/"
// app.use(express.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(express.json());


const getData = async (url) => {
    try {
      let response = await fetch(url);
      let data = await response.json();
      
      return data
    } catch (error) {
      console.error(error);
      return error;
    }
  };


async function getDatasetIndicators(dataset_id) {
    let response = await getData(IMF_BASE_URL + "DataStructure/" + dataset_id)
    let dimensions = []
    let code_names = []
    let codes = []
    response["Structure"]["KeyFamilies"]["KeyFamily"]["Components"]["Dimension"].forEach((x) => dimensions.push(x["@codelist"]))
    response["Structure"]["CodeLists"]["CodeList"].forEach((x) => code_names.push(x["@id"]))
    response["Structure"]["CodeLists"]["CodeList"].forEach((x) => codes.push(x["Code"]))
    result = {}
    let i = 0;
    while (i < codes.length) {
        let name = code_names[i]
        let c = codes[i]
        result[name] = {}
        for (let j = 0; j < c.length; j++) {
            x = c[j]
            result[name][x["@value"]] = x["Description"]["#text"]
        }
        i++;
    }
    return result
}

function processRawResponse(raw) {
    if (!"Series" in raw['CompactData']['DataSet']){
        console.error("Series data is empty")
        return null
    }
    date = []
    value = []
    raw['CompactData']['DataSet']["Series"]["Obs"].forEach((x) => {
        date.push(x["@TIME_PERIOD"])
        value.push(x["@OBS_VALUE"])
    })
    let metadata = raw['CompactData']['DataSet']["Series"]
    delete metadata["Obs"]
    console.log(metadata)

    return {
        date: date,
        value: value,
        metadata: metadata
    }

}

async function query(query_string) {
    console.log("The result query string is " + query_string)
    let result = await getData(IMF_BASE_URL + "CompactData/" + query_string)
    return processRawResponse(result)
}



app.post('/indicator', function(req, res) {
    console.log("query endpoint received the following request: ", req.body)
    q = req["body"]["q"]
    query("IFS/" + q).then(data => {
      res.json(data)
    }).catch((err => console.log(err)))
  });

app.get('/metadata', function(req, res) {
  getDatasetIndicators("IFS")
  .then(data => {
    res.json(data)
  })
});


app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))




// let data = [];

// function display() { 
//     console.log(data);
// }

// app.get('/imf', (req, res) => {
//     getData("http://dataservices.imf.org/REST/SDMX_JSON.svc/Dataflow").then((result) => {
//         res.json(result)
//         data.push(result)
//         display();
//     }).catch((err) => console.log(err))

// })




// let result = getData(url)
// console.log(result)


// let data;
// let id;
// fetch(url)
//     .then((response) => response.json())
//     .then(_data => {
//         data = _data;
//         id = data["Structure"]["Header"]["ID"]
//     })
//     .catch(error => {
//         console.error(error);
//     });
// console.log(id)

// dataset = new IFSDataset()
// console.log("initialized dataset: ")
// console.log(dataset.dataset_id)


// app.get('/', (req, res) => {
//     res.json('Welcome to my climate change news api')

// })

// const articles = []
// app.get('/news', (req, res) => {

//     axios.get('https://www.theguardian.com/environment/climate-crisis')
//     .then((response) => {
//         const html = response.data
//         const $  = cheerio.load(html)

//         $('a:contains("climate")', html).each(function () {
//             const title = $(this).text()
//             const url = $(this).attr('href')
//             articles.push({
//                 title,
//                 url
//             })
//         })
//         res.json(articles)
//     }).catch((err) => console.log(err))
// })

// // app.get('/imf', (req, res) => {
// //     axios.get('http://dataservices.imf.org/REST/SDMX_JSON.svc/Dataflow')
// //     .then((response) => {
// //         const data = response.data
// //         res.json(response)
// //     }).catch((err) => console.log(err))
// // })





