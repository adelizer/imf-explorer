import os
import requests
import pandas as pd

IMF_BASE_URL = "http://dataservices.imf.org/REST/SDMX_JSON.svc/"
METADATA_KEYS = ["@FREQ"]


def get_available_datasets():
    raw = requests.get(os.path.join(IMF_BASE_URL, "Dataflow")).json()
    available_datasets = raw["Structure"]["Dataflows"]["Dataflow"]
    print(f"Number of available datasets: {len(available_datasets)}")
    id_name_mapping = {data["KeyFamilyRef"]["KeyFamilyID"]: data["Name"]["#text"] for data in available_datasets}
    print(f"Number of available ids: {len(id_name_mapping)}")
    return id_name_mapping


class IFSDataset:
    def __init__(self):
        self.dataset_id = "IFS"
        self.code_list, self.dimensions = self.get_dataset_indicators()

    def get_dataset_indicators(self):
        raw = requests.get(os.path.join(IMF_BASE_URL, f"DataStructure/{self.dataset_id}")).json()
        dimensions = [x["@codelist"] for x in raw["Structure"]["KeyFamilies"]["KeyFamily"]["Components"]["Dimension"]]
        code_names = [x["@id"] for x in raw["Structure"]["CodeLists"]["CodeList"]]
        codes = [x["Code"] for x in raw["Structure"]["CodeLists"]["CodeList"]]
        codes_dict = {}
        for name, c in zip(code_names, codes):
            codes_dict[name] = {x["@value"]: x["Description"]["#text"] for x in c}
        return codes_dict, dimensions

    def is_valid_query_freq(self, freq):
        return freq in self.code_list["CL_FREQ"]

    def is_valid_query_unit(self, unit):
        return unit in self.code_list["CL_UNIT_MULT"]

    def is_valid_query_area(self, area):
        return area in self.code_list["CL_AREA_IFS"]

    def is_valid_query_indicator(self, indicator):
        return indicator in self.code_list["CL_INDICATOR_IFS"]

    def is_valid_query_time_format(self, time_format):
        return time_format in self.code_list["CL_TIME_FORMAT"]

    def get_available_freqs(self, with_description=False):
        if with_description:
            return self.code_list["CL_FREQ"]
        else:
            return list(self.code_list["CL_FREQ"].keys())

    def get_available_areas(self, with_description=False):
        if with_description:
            return self.code_list["CL_AREA_IFS"]
        else:
            return list(self.code_list["CL_AREA_IFS"].keys())

    def get_available_indicators(self, with_description=False):
        if with_description:
            return self.code_list["CL_INDICATOR_IFS"]
        else:
            return list(self.code_list["CL_INDICATOR_IFS"].keys())

    def find_indicator(self, query_list):
        result = {}
        for ind, d in self.get_available_indicators(with_description=True).items():
            for q in query_list:
                if q.lower() in d.lower():
                    result[ind] = d
        return result

    def query(self, freq="", area="", indicator="", start_period="2001-01-01", end_period="2001-12-31"):
        assert (self.is_valid_query_freq(freq) and self.is_valid_query_area(area)
                and self.is_valid_query_indicator(indicator)
                )
        query_string = f"IFS/{freq}.{area}.{indicator}?startPeriod={start_period}&endPeriod={end_period}"
        raw = requests.get(os.path.join(IMF_BASE_URL, "CompactData", query_string)).json()
        if "Series" not in raw['CompactData']['DataSet']:
            print("Series data not found, try again with a different frequency and/or time periods")
            return None, None

        data = raw['CompactData']['DataSet']["Series"]
        data_list = [[obs.get('@TIME_PERIOD'), obs.get('@OBS_VALUE')]
                     for obs in data['Obs']]

        df = pd.DataFrame(data_list, columns=['date', indicator])

        df = df.set_index(pd.to_datetime(df['date']))[indicator].astype('float')
        data.pop("Obs")
        return df, data
