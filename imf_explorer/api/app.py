import pandas as pd
from fastapi import FastAPI
import uvicorn
import requests
from fastapi.responses import StreamingResponse

from imf_explorer.data_api import IFSDataset, get_available_datasets
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

start_date = "2000-01-01"
end_date = "2023-02-01"
month_range = pd.date_range(start=start_date, end=end_date, freq="M").strftime("%Y-%m").tolist()
t = pd.date_range(start=start_date, end=end_date, freq="Y").strftime("%Y").tolist()
quarter_range = []
for ind in t:
    for i in range(1, 5):
        quarter_range.append(f"{ind}-Q{i}")

year_range = t

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
        data = raw['CompactData']['DataSet']["Series"]
        if isinstance(data, dict):
            data = [data]
        data_list = []
        for series in data:
            if len(series["Obs"]) <= 1:
                continue
            else:
                tmp = [[obs.get('@TIME_PERIOD'), obs.get('@OBS_VALUE')] for obs in series['Obs']]
                data_list.append({"identifier": f'{series["@FREQ"]}-{series["@REF_AREA"]}-{series["@INDICATOR"]}', "x": [x[0] for x in tmp], "y": [x[1] for x in tmp]})

        return {"data": data_list}
    except:
        return {}

@app.post("/query-csv")
async def get_data(item: Item):
    q = item.dict()["q"]
    query_string = f"http://dataservices.imf.org/REST/SDMX_JSON.svc/CompactData/IFS/{q}"
    if q.split(".")[0] == "M":
        date_range = month_range
    elif q.split(".")[0] == "Q":
        date_range = quarter_range
    else:
        date_range = year_range

    df = pd.DataFrame({"date": date_range})
    try:
        raw = requests.get(query_string).json()
        data = raw['CompactData']['DataSet']["Series"]
        if isinstance(data, dict):
            data = [data]
        for series in data:
            if len(series["Obs"]) <= 1:
                continue
            else:
                tmp = [[obs.get('@TIME_PERIOD'), obs.get('@OBS_VALUE')] for obs in series['Obs']]
                tmp_df = pd.DataFrame(tmp, columns=["date", f'{series["@FREQ"]}-{series["@REF_AREA"]}-{series["@INDICATOR"]}'])
                df = df.merge(tmp_df, on="date", how="left")
        output = df.to_csv(index=False)
        return StreamingResponse(
            iter([output]),
            media_type='text/csv',
            headers={"Content-Disposition":
                         "attachment;filename=data.csv"})
    except:
        return {}


@app.post("/query-correlation")
async def get_data(item: Item):
    q = item.dict()["q"]
    print(q)
    query_string = f"http://dataservices.imf.org/REST/SDMX_JSON.svc/CompactData/IFS/{q}"
    if q.split(".")[0] == "M":
        date_range = month_range
    elif q.split(".")[0] == "Q":
        date_range = quarter_range
    else:
        date_range = year_range

    df = pd.DataFrame({"date": date_range})
    try:
        raw = requests.get(query_string).json()
        data = raw['CompactData']['DataSet']["Series"]
        if isinstance(data, dict):
            data = [data]
        for series in data:
            if "Obs" not in series or len(series["Obs"]) <= 1:
                continue
            else:
                tmp = [[obs.get('@TIME_PERIOD'), obs.get('@OBS_VALUE')] for obs in series['Obs']]
                col_name = f'{series["@REF_AREA"]}'
                tmp_df = pd.DataFrame(tmp, columns=["date", col_name])
                tmp_df[col_name] = tmp_df[col_name].astype(float).pct_change()
                df = df.merge(tmp_df, on="date", how="left")
        corr = df.drop("date", axis=1).corr()
        corr = corr.round(decimals=2).fillna(0)
        return {"x": corr.columns.to_list(),
                "y": corr.columns.to_list(),
                "z": corr.values.tolist()}
    except:
        return {}


if __name__ == "__main__":
    uvicorn.run("app:app", port=8000, reload=True)
