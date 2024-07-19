import { useState, useEffect } from 'react';
import '../../gdk/css/geico-design-kit.css';
import '../cards/cards.css';
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { FaCog, FaToggleOn, FaSave } from "react-icons/fa";
import { toast } from '../ToastNotification';

//datadrift imports
import DataDriftDetailsCard from "../cards/MonitoringDataDriftDetailsCard.js";
import LazyListLoader from "../LazyListLoader.js";
import LoadingMessage from '../errors/LoadingMessage';
import FeatureFilter from "../FeatureFilter.js";
import Tooltip from '../Tooltip.js';


/** 
 * This component is for the Monitoring Summary page (Model Landing). It initially displays all performance metrics.
 * The Config icon interaction allows users to select metrics to be displayed (between 1 and 4) and  assign a custom order to them.
 * THe Save icon is for saving the updated configuration in the backend.
 * The bottom part dispalys the top 10 features, based on feature importance.
 */

export const MonitoringLandingPanel = ({ fullConfig, model, modelConfig, jobId, type }) => {
    const zone = modelConfig?.zone;
    const [jobResultFolder, setJobResultFolder] = useState();           // holds the folder path for the job results
    const [message, setMessage] = useState("");
    const [summary, setSummary] = useState();                           // holds summary data (metrics and their values)
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);  // State to control visibility of the dropdown
    const [metricOrders, setMetricOrders] = useState({});               // State to hold the order of each metric
    const [selectedMetrics, setSelectedMetrics] = useState([]);         // an array of selected metrics displayed on the page
    const [filteredMetrics, setFilteredMetrics] = useState([]);         // an array to hold metrics with assigned orders
    const [originalMetrics, setOriginaldMetrics] = useState([]);        // an array of original metrics
    const [initialMetricValues, setInitialMetricValues] = useState({}); // holds initial metrics and their initial values
    const [metricValues, setMetricValues] = useState({});               // holds the current metric values fetched
    const [saveVisible, setSaveVisible] = useState(false);              // holds the state for the Save icon visibility
    const [isLoading, setIsLoading] = useState(true);                   // holds the loading message state

    //parameters from datadrift panel
    const [fullDetails, setFullDetails] = useState([]);
    const [details, setDetails] = useState([]);
    // parameters for sorting details data
    const [sortColumn, setSortColumn] = useState('feature');
    const [sortDirection, setSortDirection] = useState('asc');
    const [selectedColumn, setSelectedColumn] = useState('feature');
    const [dataDriftJobResultFolder, setDataDriftJobResultFolder] = useState();                      //holds the job result folder for data drift job
    const [featureImportanceJobResultFolder, setfeatureImportanceJobResultFolder] = useState();      //holds the job result folder for feature importance job
    const [featureFilter, setFeatureFilter] = useState("");
    const [top10SortedMeanValues, setTop10SortedMeanValues] = useState("");  //holds top 10 feature mean values to show mean values for top 10 features in the UI 
    const [top10FeatureNames, setTop10FeatureNames] = useState("");          //holds top 10 feature names from feature importance api to be used as filter for details 
    const [prevDetails, setPrevDetails] = useState([]);                      //holds the prevoius details data in order to repopulate after feature filter is reset



    // Fetch databricks jobs for a specific model, job type and job ID. If successful, setJobResultFolder with the path
    const fetchLatestJob = async (type, jobId) => {
        try {
            const response = await fetch(`/api/get_job_run?model=${model}&type=${type}&jobId="${jobId}"`);

            if (response.status == 200) {
                const data = await response.json();
                const jobResultFolder = `${model}/${zone}/${type}_metrics/${parseInt(data.run_id)}`;
                setJobResultFolder(jobResultFolder);
            } else {
            }
        } catch (error) {
            console.error(error);

        }
    }

    // Fetch the summary data based on the job result folder. If successful, setSummary with the list of metrics
    const fetchSummary = async (jobResultFolder) => {
        try {
            const summaryFolder = `${jobResultFolder}/summary.parquet/`;
            const response = await fetch(`/api/download_table?folder=${summaryFolder}`,

                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            if (response.status == 200) {
                const data = await response.json();
                const summary = data[0];
                if (summary) {
                    setSummary(summary);
                    let metrics = [];

                    // Retrieve an original list of metrics from modelConfig into originalMetrics  
                    const originalMetrics = Object.keys(summary)
                        .filter(item => item.startsWith("current_") && item.split("_").length === 2)
                        .map(item => item.replace("current_", ""));
                    setOriginaldMetrics(originalMetrics);

                    // Set the metrics variable (selectedMetrics) to either the original list or to a prior user selection (savedMetrics)   
                    if (modelConfig.savedMetrics && modelConfig.savedMetrics.length > 0) {
                        metrics = modelConfig.savedMetrics
                    } else {
                        metrics = originalMetrics;
                    }

                    setSelectedMetrics([...metrics]);
                    const initialValues = getMetricValues(metrics, summary);
                    setInitialMetricValues(initialValues);
                    setMetricValues(initialValues);
                } else {
                    setSummary(null);
                    setMessage("No summary data available.");
                }
            } else {
                setMessage("Execution error at fetchSummary: " + response.message);
            }
        } catch (error) {
            console.error("Error fetching summary: ", error);
        } finally {
            setIsLoading(false);
        }
    }

    // Fetches the latest job when a jobId changes
    useEffect(() => {
        if (jobId) {
            setIsLoading(true);
            fetchLatestJob("model_performance", jobId);
        } else {
            setIsLoading(false);
            setMessage("No Job ID avaialble")
        }
    }, [jobId]);


    // Fetches the summary if job details change
    useEffect(() => {
        if (jobResultFolder) {
            fetchSummary(jobResultFolder);
        }
    }, [jobResultFolder]);

    // Re-render when selectedMetrics change
    useEffect(() => {
        console.log("Selected metrics have changed");
    }, [selectedMetrics]
    )

    // Update order for a specific metric
    const setOrder = (metric, order) => {
        setMetricOrders(prev => {
            const numericalOrder = parseInt(order, 10);             // Ensure to parse as integer base 10
            const updated = { ...prev, [metric]: numericalOrder };  // Update the order

            // Filter keys where the value is not NaN
            const validKeys = Object.keys(updated).filter(key => !Number.isNaN(updated[key]));
            setFilteredMetrics(validKeys);                          // Set filtered metrics with valid keys

            return updated;
        });
    }

    // Validation to check for duplicate orders
    useEffect(() => {
        const orders = Object.values(metricOrders).filter(order => !Number.isNaN(order));
        const uniqueOrders = new Set(orders);
        if ((orders.length !== uniqueOrders.size)) {
            setSaveVisible(false);
            toast('Duplicate orders detected, please ensure all selected metrics have unique orders. The Save button is disabled.');
        } else if (uniqueOrders.size != 0) {
            setSaveVisible(true);
        }

    }, [metricOrders]);

    // Load saved metrics on re-render
    useEffect(() => {

        if (modelConfig?.savedMetrics && modelConfig?.savedMetrics?.length > 0) {
            setSelectedMetrics(modelConfig.savedMetrics);
        } else {
            setSelectedMetrics(originalMetrics);                // reset to original metrics
        }
    }, [modelConfig])


    // Set initialValues to metric values for each metrics (either original ones or saved ones)
    const getMetricValues = (metrics, summary) => {

        return metrics.reduce((acc, metric) => {

            // Extract raw values.  Check if the values are direct numbers or (NaN), i.e. nested inside of an object
            const currentValue = JSON.parse(summary["current_" + metric]);
            const referenceValue = JSON.parse(summary["reference_" + metric]);

            // Extract raw values if nested inside an object under `value`
            const currentRaw = !isNaN(parseFloat(currentValue))
                ? parseFloat(currentValue).toFixed(2)
                : parseFloat(currentValue.value).toFixed(2);
            const referenceRaw = !isNaN(parseFloat(referenceValue))
                ? parseFloat(referenceValue).toFixed(2)
                : parseFloat(referenceValue.value).toFixed(2);

            // Store raw values into the accumulator object for easy access  
            acc[metric] = {
                current: currentRaw,
                reference: referenceRaw,
            };
            return acc;                                     // return an object with metrics labels and their corresponding values
        }, {});
    };

    // Resets the metrics to the intial state
    const showInitialMetrics = () => {

        setSelectedMetrics(originalMetrics);
        setInitialMetricValues(getMetricValues(originalMetrics, summary));
        setMetricValues(getMetricValues(originalMetrics, summary));
        setFilteredMetrics([]);
        setIsDropdownVisible(true);                                 // Show the dropdowns
        setSaveVisible(true)                                        // Show the Save icon
            ;
        setMetricOrders({});                                        // empty the previously stored order on the reset

        toast(`Showing the original metrics list. Please assign new orders and save your selection.`)
    };

    // Handle saving the selected metrics list in modelConfig
    const handleSave = async () => {

        if (filteredMetrics.length === 0) {
            toast('No metrics with assigned order. Please assign order before saving. ');
            return;
        }

        // Sort selected metrics based on their orders before saving
        const sortedMetrics = filteredMetrics
            .filter(metric => metricOrders[metric])
            .sort((a, b) => metricOrders[a] - metricOrders[b]);

        // Update selectedMetrics to only metrics that have assigned orders
        setSelectedMetrics(filteredMetrics);


        // Find the index of the current model in the fullConfig array and update the model's config
        const modelIndex = fullConfig["deployed_models"].findIndex(
            model => model.model_name === modelConfig.model_name
        );

        // Update the modelConfig within the fullConfig with the new configuration
        modelConfig["savedMetrics"] = sortedMetrics;
        fullConfig["deployed_models"].splice(modelIndex, 1, modelConfig);

        // Save the updated configuration in the backend
        try {
            const response = await fetch(`/api/update_blob?file=/config/model_configs.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                },
                body: JSON.stringify(fullConfig)
            });

            if (response.ok) {
                setIsDropdownVisible(false);                                 // Hide the dropdowns   
                setSaveVisible(false);
                setFilteredMetrics([]);
                toast('Selected metrics saved successfully')
            } else {
                throw new Error('Failed to save metrics');
            }
        } catch (error) {
            console.error("Error saving metrics:", error);
            toast('Error saving metrics selection');
        }
    };

    //function to construct job result folder for data drift job
    const constructJobResultFolder = (model, zone, metricsType, jobRunId) => {
        let jobResultsFolder;
        if (zone) {
            jobResultsFolder = `${model}/${zone}/${metricsType}/${jobRunId}`;
        } else {
            jobResultsFolder = `${model}/${metricsType}/${jobRunId}`;
        }
        return jobResultsFolder;
    }

    //datadrift and featureimp changes
    const fetchDataDriftLatestJob = async (modelConfig) => {
        try {
            const response = await fetch(`/api/get_job_run?model=${model}&type=data_drift&jobId=${modelConfig?.jobsMap?.data_drift}&end_date=`,


                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            const data = await response.json();
            if (response.ok && data.run_id) {
                // Construct the job result folder - should match it on the server side
                // TODO: get this path from config
                const jobResultFolder = constructJobResultFolder(model, zone, "drift_metrics", parseInt(data.run_id));
                setDataDriftJobResultFolder(jobResultFolder);

            } else {
                console.error(response);
                console.error(data);
                setMessage("Execution error at fetchLatestJob: " + response.message);
            }
        } catch (error) {
            console.error(error);

        }
    }

    //getting all the feature list 
    const fetchFeatureList = async () => {
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
                if (response.status == 200) {
                    const data = await response.json();
                    return data;
                } else {
                    setMessage("Execution error at fetchFeatureList: " + response.message);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    //getting full data drift details data
    const fetchFullDetails = async () => {
        try {
            if (dataDriftJobResultFolder) {

                const response = await fetch(`/api/download_parq?folder=${dataDriftJobResultFolder}/details.parquet/`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                        }
                    });
                if (response.status === 200) {
                    const data = await response.json();
                    const sortedDetails = data.sort((a, b) => a.feature.localeCompare(b.feature));
                    setFullDetails(sortedDetails);
                    setDetails(sortedDetails);
                } else {

                    setMessage("Execution error at fetchFeatureDetails: " + response.message);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    //fetching the top 10 features and their mean values from feature importance api
    const fetchTopFeaturesAndmeanValues = async (fullFeatureList) => {
        try {

            const path = `${featureImportanceJobResultFolder}/shap_data.json`;
            const response = await fetch(`/api/download_blob?file=${path}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            if (response.status == 200) {
                const data = await response.json();
                const regex = /{[^{}]*}/g;
                const jsonObjects = data.match(regex).map((obj) => JSON.parse(obj));
                //setShapValues(jsonObjects);

                const featureMeanValues = {};
                //Initialize feature sum values to 0
                Object.keys(jsonObjects[0]).map((feature) => {
                    featureMeanValues[feature] = 0;
                });
                //Calculate sum of feature values for each sample 
                jsonObjects.map((sample) => {
                    Object.entries(sample).map(([feature, value]) => {
                        featureMeanValues[feature] += Math.abs(value);
                    });
                });

                //Calculate mean absolute value for each feature
                Object.keys(featureMeanValues).map((feature) => {
                    featureMeanValues[feature] /= jsonObjects.length;
                });

                //Sort feature names and mean absolute values in descending order
                const sortedFeatureMeanValues = Object.entries(featureMeanValues).sort((a, b) => b[1] - a[1]);

                const sortedFeatureNames = sortedFeatureMeanValues.map(([feature]) => feature);
                const sortedMeanValues = sortedFeatureMeanValues.map(([_, meanValue]) => meanValue);
                const top10SortedMeanValues = sortedMeanValues.slice(0, 11);
                const top10FeatureNames = sortedFeatureNames.slice(0, 11);
                setTop10FeatureNames(top10FeatureNames);
                setTop10SortedMeanValues(top10SortedMeanValues);

            }
        } catch (error) {
            console.error(error);
        }
    }

    //filtering out details data based on the top 10 features and adding feature and mean value to the data
    const fetchFeatureDetails = async (fullFeatureList) => {
        try {
            let allData = [];
            const promises = fullFeatureList.map(item => fetch(`/api/download_table?folder=${item.replace(/featureMeanvalue=([^\/]+)/, '')}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                }).then(async response => {
                    if (response.status == 200) {
                        const data = await response.json();
                        // Add feature name to the details data
                        data[0].feature = item.match(/feature=([^\/]+)/)[1];
                        data[0].feature_importance_value = item.match(/featureMeanvalue=([^\/]+)/)[1];
                        setDetails(prevdetails => [...prevdetails, data[0]]);
                        allData.push(data[0]);
                    } else {
                        setMessage("Execution error at fetchFeatureDetails: " + response.message);
                    }
                }).catch(error => {
                    console.error(error);
                }));
            await Promise.allSettled(promises);
            const sortedDetails = allData.sort((a, b) => b.feature_importance_value.localeCompare(a.feature_importance_value));
            setFullDetails(sortedDetails);
            setDetails(sortedDetails);

        } catch (error) {
            console.error(error);
        }
    }


    const fetchDetails = async () => {
        try {

            const fullFeatureList = await fetchFeatureList();
            if (fullFeatureList && fullFeatureList.length > 0) {

                fetchFeatureDetails(fullFeatureList);


            }
            else {
                fetchFullDetails();

            }
            // }

        } catch (error) {
            console.error(error);
        }
    }


    const handleSort = (column) => {
        const direction = (sortColumn === column && sortDirection === 'asc') ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(direction);
        setSelectedColumn(column);

        const sortedDetails = [...details].sort((a, b) => {
            let aValue, bValue;

            aValue = isNaN(+a[column]) ? a[column] : +a[column];
            bValue = isNaN(+b[column]) ? b[column] : +b[column];

            return (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) * (direction === 'asc' ? 1 : -1);
        });

        setDetails(sortedDetails);
    };


    //feature importance code
    const fetchLatestfIJob = async (modelConfig) => {
        try {
            const response = await fetch(`/api/get_latest_job_run?model=${model}&type=feature_importance&jobId=${modelConfig?.jobsMap?.feature_importance}`,

                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            if (response.status == 200) {
                const data = await response.json();
                // Construct the job result folder - should match it on the server side
                const jobResultFolder = `${model}/${zone}/feature_importance/${parseInt(data.run_id)}`;
                setfeatureImportanceJobResultFolder(jobResultFolder);

            } else {
                setMessage("Execution error at fetchLatestJob: " + response.message);
            }
        } catch (error) {
            console.error(error);
            setMessage(error);
        }
    }


    useEffect(() => {
        if (modelConfig === undefined) {
            return;

        }
        fetchDataDriftLatestJob(modelConfig);
        fetchLatestfIJob(modelConfig);


    }, [modelConfig]);


    useEffect(() => {
        if (featureImportanceJobResultFolder) {
            fetchTopFeaturesAndmeanValues();

        }

    }, [featureImportanceJobResultFolder]);


    useEffect(() => {
        if (dataDriftJobResultFolder) {
            fetchDetails();

        }

    }, [dataDriftJobResultFolder]);

    useEffect(() => {
        if (details.length > 0 && top10FeatureNames.length > 0 && top10SortedMeanValues.length > 0) {
            let timeOutId
            const featureNameToMeanValues = top10FeatureNames.reduce((acc, key, index) => { acc[key] = top10SortedMeanValues[index]; return acc; }, {});
            const filteredData = fullDetails.filter(item => { return Object.keys(featureNameToMeanValues).some(key => item.feature.includes(key)); });
            const updatedList = filteredData.map(item => ({

                ...item,

                feature_importance_value: featureNameToMeanValues[item.feature]

            }));
            const sortedDetails = updatedList.sort((a, b) => b.feature_importance_value - a.feature_importance_value);
            
            timeOutId = setTimeout(() => {
                if (!featureFilter) {
                    setDetails(sortedDetails);
                } else {
                    const filtered_details = sortedDetails.filter(d => d.feature.includes(featureFilter));
                    setPrevDetails(details);
                    setDetails(filtered_details);
                }
            }, 500);
            return () => clearTimeout(timeOutId);

        }
        else {
            if (prevDetails.length > 0) {
                setDetails(prevDetails);
            }

        }
    }, [top10FeatureNames, top10SortedMeanValues, fullDetails, featureFilter]);

    return (
        <div style={{ padding: "20px 0 0 0" }} >
            <div className='summary_row' style={{ position: "relative" }} >

                {/* Header displays the title and action icons in the upper right corner: Config and Save. */}
                <div style={{ marginTop: "10px" }}>
                    <h3 style={{ marginBottom: "3px" }}>
                        Performance Highlights
                        <FaCog onClick={showInitialMetrics} style={{ marginLeft: '10px', cursor: 'pointer', top: "5px", right: "5px", position: "absolute" }}
                            title="Assign orders to metrics, ensuring minimum of 1 and maximum of 4 are selected. Hit Save upon completion." />

                        <FaSave onClick={handleSave}
                            style={{ marginLeft: '10px', cursor: 'pointer', display: saveVisible ? 'block' : 'none', position: "absolute", top: "5px", right: "45px" }}
                            title="Save selected metrics" />
                    </h3>
                </div>

                {/* Display each metrics in a box with a vertical divider between Current and Reference values. If a current value >= than
                /*  a reference value, place a green check mark next to the metrcis label; otherwise place a red exclamation point next to it.
                */}
                {isLoading ? (
                    <p> This information is loading...</p>
                ) : summary ? (
                    <div style={{ display: "flex" }}>
                        {Object.keys(metricValues)
                            .filter(metric => selectedMetrics.includes(metric))                                 // Filter selected metrics
                            .sort((a, b) => {
                                const orderA = metricOrders[a];
                                const orderB = metricOrders[b];
                                const isInRangeA = orderA >= 1 && orderA <= 4;
                                const isInRangeB = orderB >= 1 && orderB <= 4;

                                if (isInRangeA && isInRangeB) {
                                    // Both orders are in the range; perform normal sort
                                    return orderA - orderB;
                                } else if (isInRangeA) {
                                    // Only A is in the range; A should come before B
                                    return -1;
                                } else if (isInRangeB) {
                                    // Only B is in the range; B should come before A
                                    return 1;
                                }

                                // Both orders are out of the range; sort by their values to preserve loaded order or any other criteria
                                return orderA - orderB;
                            })                                                                              // Sort according to order preset
                            .map((metric, index) => {
                                const current = parseFloat(metricValues[metric].current);
                                const reference = parseFloat(metricValues[metric].reference);
                                const orderValue = metricOrders[metric] || '';                              // Ensure the order is taken or it's empty
                                return (

                                    <div style={{ flex: 1, border: '1px solid gray', margin: '8px', padding: '5px', }} key={index}>

                                        <h5>
                                            {metric.toUpperCase()}
                                            <span style={{ color: current >= reference ? 'green' : 'red', marginLeft: '10px', }}>
                                                {current >= reference ? <FiCheckCircle /> : <FiAlertCircle />}
                                            </span>
                                            {isDropdownVisible && (
                                                <select
                                                    value={orderValue}
                                                    onChange={(e) => setOrder(metric, e.target.value)}
                                                    style={{ marginLeft: '10px', color: "#6a6e75" }}>
                                                    <option value="">Select Order</option>
                                                    {[1, 2, 3, 4].map(n => (
                                                        <option key={n} value={n}>{n}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </h5>

                                        <div style={{ display: "flex", flex: 1, width: "100%" }}>
                                            <div style={{ flex: 1, textAlign: "center", }}>
                                                <h6 style={{ whiteSpace: "nowrap" }}>Current</h6>
                                                <h3 style={{ whiteSpace: "nowrap" }}>{current}</h3>
                                            </div>

                                            <div style={{ flex: 1, borderLeft: "2px solid grey", marginLeft: "12px", paddingLeft: "10px" }}>
                                                <div style={{ flex: 1, textAlign: "center", }}>
                                                    <h6 style={{ whiteSpace: "nowrap" }}>Reference</h6>
                                                    <h3 style={{ whiteSpace: "nowrap" }}>{reference}</h3>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                ) : (
                    <p>No performance metrics found</p>
                )}
            </div>


            <div className='summary_row'>
                <div style={{ marginTop: "10px" }}>
                    <h4>Feature Drift Details
                        <Tooltip text="Feature drift details, including data quality results and histogram of feature distribution in the drilldown" />
                    </h4>
                </div>
            </div>
            {fullDetails.length > 0 &&
                <FeatureFilter onChange={setFeatureFilter} filterName="Filter Feature Details" />
            }
            {
                details && details.length > 0 &&
                <div className='data_drift_details_row' style={{ display: 'flex', fontSize: '1.4em', fontWeight: 'bold', paddingLeft: '20px', width: "90%", justifyContent: 'space-evenly' }}>

                    <div onClick={() => handleSort('feature')} style={{ width: '10%', color: selectedColumn === 'feature' ? '#eee19c' : '#e695e6' }}>Feature {sortColumn === 'feature' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>
                    <div onClick={() => handleSort('feature_importance_value')} style={{ width: '10%', color: selectedColumn === 'feature_importance_value' ? '#eee19c' : '#e695e6', marginRight: '-20px' }}>Feature Importance Value {sortColumn === 'feature_importance_value' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>
                    <div onClick={() => handleSort('type')} style={{ width: '10%', color: selectedColumn === 'type' ? '#eee19c' : '#e695e6' }}>Type {sortColumn === 'type' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>
                    <div onClick={() => handleSort('drift_detected')} style={{ width: '10%', color: selectedColumn === 'drift_detected' ? '#eee19c' : '#e695e6' }}>Data Drift {sortColumn === 'drift_detected' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>
                    <div onClick={() => handleSort('drift_score')} style={{ width: '10%', color: selectedColumn === 'drift_score' ? '#eee19c' : '#e695e6', marginRight: '-20px' }}>Drift Score {sortColumn === 'drift_score' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>

                </div>
            }

            {
                details.length > 0 ?
                    (<LazyListLoader
                        items={details}
                        rowHeight={110}>
                        {({ item, index }) => (
                            <div key={index}>
                                <DataDriftDetailsCard detailsRow={item} />
                            </div>
                        )}
                    </LazyListLoader>) : (<LoadingMessage />)
            }

        </div>
    );
}