import React, { useEffect, useCallback, useState } from 'react';
import Tooltip from '../../components/Tooltip.js';
import '../modelconfig/subPopulation.css'

export default function FeatureSelector({ onUpdate, jobId, model, zone, type, id }) {
    const [feature, setFeature] = useState("");
    const [jobResultFolder, setJobResultFolder] = useState();
    const [fullFeatureList, setFullFeatureList] = useState([]);
    const [featureType, setFeatureType] = useState("");
    const [selectedValues, setSelectedValues] = useState({});
    const [isAllUnselected, setIsAllUnselected] = useState(false);
    const [numFeatMinMax, setNumFeatMinMax] = useState([0, 0]);
    const [commaSeparatedValues, setCommaSeparatedValues] = useState("");
    const [message, setMessage] = useState(null);

    const fetchLatestJob = useCallback(async () => {
        try {
            const response = await fetch(
                `/api/get_job_run?model=${model}&type=${type}&jobId=${jobId}&end_date=`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                }
            );
            if (response.status === 200) {
                const data = await response.json();
                const jobResultFolder = `${model}/${zone}/${type}_metrics/${data.run_id}`;
                setJobResultFolder(jobResultFolder);
            } else {
                setMessage("Execution error: " + response.message);
            }
        } catch (error) {
            console.error(message);
        }
    }, [model, type, jobId]);

    const getFeatureName = (featureFolder) => {
        if (!featureFolder || (typeof featureFolder != "string")) {
            return undefined;
        }
        const splitBlob = featureFolder.split("/");
        return splitBlob[splitBlob.length - 2].replace("feature=", "");
    }

    const fetchFeatureList = useCallback(async () => {
        try {
            if (jobResultFolder) {
                const prefix = `${jobResultFolder}/details.parquet/feature=`;
                const response = await fetch(`/api/list_blobs?prefix=${prefix}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                        }
                    });
                if (response.status === 200) {
                    const data = await response.json();
                    const featureList = data.map((blob) => {
                        return { featureName: getFeatureName(blob), featureFolder: blob };
                    });
                    setFullFeatureList(featureList);
                    return featureList;
                } else {
                    setMessage("Execution error fetch job by date: " + response.message);
                }
            }
        } catch (error) {
            console.error(message);
        }
    }, [jobResultFolder]);

    const fetchFolderValues = async (featureFolder) => {
        try {
            if (featureFolder) {
                const response = await fetch(`/api/download_table?folder=${featureFolder}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                        }
                    });
                const data = await response.json();
                return data[0];
            }
        } catch (error) {
            console.error(message);
        }
    };

    const fetchFullDetails = async () => {
        try {
            console.time("fetchFullDetails");
            const response = await fetch(`/api/download_parq?folder=${jobResultFolder}/details.parquet/`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            if (response.status === 200) {
                const data = await response.json();
                const fullFeatureList = data.map((item) => {
                    return { featureName: item.feature, featureFolder: item };
                });
                console.timeEnd("fetchFullDetails");
                // Create a list of feature names
                setFullFeatureList(fullFeatureList);
            } else {
                setMessage("Execution error at fetchFeatureDetails: " + response.message);
            }
        } catch (error) {
            console.error(error);
        }
    }

    const processData = (data) => {
        if (data) {
            setFeatureType(data.type);
            const jsonForHist = JSON.parse(data?.json_for_hist);
            jsonForHist.sort((a, b) => (a.x - b.x));
            const values = jsonForHist.map(item => item.x);
            let smallestValue = isNaN(values[0]) ? values[1] : values[0];
            let largestValue = isNaN(values[values.length - 1]) ? values[values.length - 2] : values[values.length - 1];
            setNumFeatMinMax([smallestValue, largestValue]);            
            const selectedValues = {};
            for (let i in values) {
                selectedValues[values[i]] = true;
            }
            setSelectedValues(selectedValues);
            setIsAllUnselected(false);
        } else {
            setSelectedValues({});
            setIsAllUnselected(false);
        }
    }

    const fetchValues = async (selectedOption) => {
        if (typeof selectedOption === 'string') {
            const featureData = await fetchFolderValues(selectedOption);
            processData(featureData);
        } else if (typeof selectedOption === 'object' && selectedOption !== null) {
            processData(selectedOption);
        }
    }

    const onChange = (e) => {
        const selectedOption = e.target.value;
        const featureObject = fullFeatureList.find(item => item.featureName === selectedOption);
        setFeature(selectedOption);
        // Reset the state before fetching new values
        setSelectedValues({});
        setFeatureType("");
        setCommaSeparatedValues("");
        setIsAllUnselected(false);
        // Fetch selected feature values
        fetchValues(featureObject.featureFolder);
    }

    const handleCheckboxUpdate = (featureValue) => {
        setSelectedValues(prevSelectedValues => {
            const newSelectedValues = {
                ...prevSelectedValues,
                [featureValue]: !prevSelectedValues[featureValue]
            };
            // If any feature value is selected, uncheck the "isAllUnselected"
            if (Object.values(newSelectedValues).includes(true)) {
                setIsAllUnselected(false);
            }
            return newSelectedValues;
        });
    }

    // Select/Unselect all feature values
    const handleUnselectAll = () => {
        setIsAllUnselected(prevState => {
            const newState = !prevState;
            setSelectedValues(prevSelectedValues => {
                const newSelectedValues = { ...prevSelectedValues };
                for (let key in newSelectedValues) {
                    newSelectedValues[key] = !newState;
                }
                return newSelectedValues;
            });
            return newState;
        });
    }

    // Update the selectedValues state variable when the comma-separated values change
    useEffect(() => {
        if (featureType === 'num') {
            setSelectedValues({});
            const values = commaSeparatedValues.split(',').map(val => val.trim());
            const newSelectedValues = {};
            for (let value of values) {
                newSelectedValues[value] = true;
            }
            setSelectedValues(newSelectedValues);
        }
    }, [commaSeparatedValues]);

    // Update the parent component when the selectedValues change
    useEffect(() => {
        if (feature && selectedValues && Object.keys(selectedValues).length > 0) {
            onUpdate(feature, selectedValues);
        };
    }, [selectedValues]);

    useEffect(() => {
        fetchLatestJob();
    }, []);

    useEffect(() => {
        const fetchFeatures = async() => {
            if (jobResultFolder) {
                const featureList = await fetchFeatureList();
                if (featureList.length == 0) {
                    fetchFullDetails();
                }
            }
        };
        fetchFeatures();
    }, [jobResultFolder]);

    return (
        <div>
            <div className="select-box panel-bar-selector" style={{alignItems: 'center', marginBottom: "4px" }}>
                <label className="feature-selector" style={{ marginRight: '10px' }}>
                    Select Feature:
                    <select value={feature} onChange={onChange}>
                        <option value="">--feature--</option>
                        {fullFeatureList.map((item) => (
                            <option value={item.featureName} key={item.featureName}>{item.featureName}</option>
                        ))}
                    </select>
                </label>
            </div>
            <div style={{ marginTop: "30px", marginBottom: "10px", fontSize: "10pt" }}>Feature Type: {featureType}</div>
            {selectedValues && featureType === "cat" &&
                <>
                    <input type="checkbox"
                        className="checkbox dense"
                        id={"unselectAll"+id}
                        checked={isAllUnselected}
                        onChange={handleUnselectAll}
                        style={{ display: "none" }}
                    />
                    <label htmlFor={"unselectAll"+id} className="checkbox dense">
                        Unselect All
                    </label>
                    {Object.keys(selectedValues).map((value, index) => (
                        <div key={index+id}>
                            <input type="checkbox"
                                className="checkbox dense"
                                id={index+id}
                                name={index+id}
                                checked={selectedValues[value]}
                                onChange={() => handleCheckboxUpdate(value) }
                                style={{ display: "none" }}
                                />
                            <label htmlFor={index+id} className="checkbox dense">
                                {value}
                            </label>
                        </div>
                    ))}
                </>
            }
            {featureType === "num" &&
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
                    <div className="subpopulation-tooltip-container">
                        min, max: <span style={{marginLeft: "8px", fontSize: "13pt"}}>
                        [{numFeatMinMax.join(', ')}]</span>
                        <Tooltip text="Minimum and Maximum values of the selected feature."/>
                    </div>
                    <div className="subpopulation-tooltip-container">
                        Comma separated values:
                        <Tooltip text="Input values should be separated by semicolons. Accepted input style example: 1, 2, 4:5, 0-3. 
                        If range provided, the data will be filtered to include values that are equal to and fall within that range."/>

                        <input id="feature_valuebins"
                            name="feature_valuebins"
                            value={commaSeparatedValues}
                            onChange={(e) => setCommaSeparatedValues(e.target.value)}
                            type="text" 
                            size="20"
                            style={{ marginLeft: "8px", height: '50px', width: '200px', marginTop: "20px", fontSize: '18px' }}
                        />
                    </div>
                </div>
            }
        </div>
    );
}