from fastapi import FastAPI
import uvicorn
import requests
from imf_explorer.data_api import IFSDataset, get_available_datasets
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware


dataset = IFSDataset()
codes_dict, dimensions = dataset.get_dataset_indicators()
indicators = dataset.get_available_indicators(with_description=True)
available_datasets = get_available_datasets()
app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Item(BaseModel):
    q: str = ""


@app.get("/available-datasets")
async def get_available_datsets():
    return available_datasets


@app.get("/available-indicators")
async def get_indicators():
    return indicators


@app.get("/available-dimensions")
async def get_indicators():
    return dimensions


@app.get("/available-areas")
async def get_indicators():
    return codes_dict["CL_AREA_IFS"]


@app.get("/available-frequencies")
async def get_indicators():
    return codes_dict["CL_FREQ"]


@app.get("/available-formats")
async def get_indicators():
    return codes_dict["CL_TIME_FORMAT"]


@app.get("/available-units")
async def get_indicators():
    return codes_dict["CL_UNIT_MULT"]


@app.post("/query")
async def get_data(item: Item):
    q = item.dict()["q"]
    query_string = f"http://dataservices.imf.org/REST/SDMX_JSON.svc/CompactData/IFS/{q}"
    try:
        raw = requests.get(query_string).json()
        response = raw['CompactData']['DataSet']["Series"]
        data_list = [[obs.get('@TIME_PERIOD'), obs.get('@OBS_VALUE')]
                     for obs in response['Obs']]
        result = {"date": [x[0] for x in data_list], "value": [x[1] for x in data_list]}
        metadata = {
            "Frequency": response['@FREQ'] + " - " + codes_dict["CL_FREQ"][response['@FREQ']],
            "Area": response['@REF_AREA'] + " - " + codes_dict["CL_AREA_IFS"][response['@REF_AREA']],
            "Indicator": response['@INDICATOR'] + " - " + indicators[response['@INDICATOR']],
            "Units": response['@UNIT_MULT'] + " - " + codes_dict["CL_UNIT_MULT"][response['@UNIT_MULT']],
            "TimeFormat": response['@TIME_FORMAT'] + " - " + codes_dict["CL_TIME_FORMAT"][response['@TIME_FORMAT']],
        }
        result["metadata"] = metadata
        return result
    except:
        return {}


if __name__ == "__main__":
    uvicorn.run("app:app", port=8000, reload=True)
