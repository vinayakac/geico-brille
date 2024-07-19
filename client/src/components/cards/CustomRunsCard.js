import React from 'react';
import { useState, useEffect } from 'react';
import '../cards/cards.css';
import { ColorRing } from 'react-loader-spinner';
import ErrorMessage from '../errors/SectionLoadingError';
import LineChart from '../widgets/LineChart';
import DateRangeSelector from '../panelbar/DateRangeSelector';
import DriftAlgorithmSelector from '../panelbar/DriftAlgorithmSelector';
import SelectBox from '../widgets/SelectBox';

/**
 * A component that displays custom runs result over time.
 * 
 * @param {string} model - The model name
 * @param {string} jobId - The job id name
 * @param {string} modelConfig - The model configuration
 * @returns {JSX.Element} A react component
 */
export default function CustomRunsCard({ model, jobId, modelConfig }) {
    const [message, setMessage] = useState("");
    const [jobResultFolder, setJobResultFolder] = useState();
    const [loading, setLoading] = useState(false);
    const [runJobStatus, setRunJobStatus] = useState('');

    const [jobType, setJobType] = useState("");
    const [currStartDateStr, setCurrStartDateStr] = useState();
    const [currEndDateStr, setCurrEndDateStr] = useState();
    const [refStartDateStr, setRefStartDateStr] = useState();
    const [refEndDateStr, setRefEndDateStr] = useState();
    const [numAlgorithm, setNumAlgorithm] = useState("");
    const [catAlgorithm, setCatAlgorithm] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [timestamps, setTimestamps] = useState([]);
    const [featuresDrift, setFeaturesDrift] = useState({});
    const [datePoints, setDatePoints] = useState([]);
    const [annotations, setAnnotations] = useState({});
    const [targetOrPerformance, setTargetOrPerformance] = useState({});

    // data drift algorithms list
    const numAlgorithmList = ["ks", "wasserstein", "jensenshannon", "hellinger", "kl_div", "psi"];
    const catAlgorithmList = ["chisquare", "z", "psi", "jensenshannon"];
    // get enabledJobTypes
    const enabledJobTypes = modelConfig.monitoring_features_enabled;
    // set title for the graph for target or performance
    let title = "";
    let yLable = "";
    if (jobType == "target_drift") {
        title = "Concept drift over time";
        yLable = "Drift score";
    }
    else if (jobType == "model_performance") {
        title = "Performance metrics over time";
        yLable = "Metric score";
    }

    const runCustomJob = async (jobType, currStartDateStr, currEndDateStr, refStartDateStr, refEndDateStr, numAlgorithm, catAlgorithm) => {
        try {
            setRunJobStatus(null);
            setLoading(true);
            console.log('Running a custom job with analysis dates and reference dates for ',
                currStartDateStr, currEndDateStr, refStartDateStr, refEndDateStr);
            
            const response = await fetch(
                `/api/run_job?model=${model}&type=custom&job_type=${jobType}&model_type=${modelConfig.model_type}&jobId=${jobId}
                &analysis_date_start=${currStartDateStr}&analysis_date_end=${currEndDateStr}
                &reference_date_start=${refStartDateStr}&reference_date_end=${refEndDateStr}
                &num_features_stattest=${numAlgorithm}&cat_features_stattest=${catAlgorithm}
                &logs_path=${encodeURIComponent(modelConfig.logs_path)}&logs_format=${modelConfig.logs_format}
                &targets_path=${encodeURIComponent(modelConfig.targets_path)}&targets_format=${modelConfig.targets_format}
                &target_column=${modelConfig.target_column}&prediction_column=${modelConfig.prediction_column}
                &target_id_column=${modelConfig.target_id_column}&prediction_id_column=${modelConfig.prediction_id_column}
                &feature_names_json_path=${modelConfig.feature_names_json_path}`,
                // {
                //     method: 'GET',
                //     headers: {
                //         Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                //     }
                // }
                );
            if (response.status == 200) {
                setRunJobStatus('succeded');
                const data = await response.json();
                // Construct the job result folder - should match it on the server side
                const jobResultFolder = `custom_runs/${data.run_id}/results.csv`;
                setJobResultFolder(jobResultFolder);
            }
            else {
                const data = await response.json();
                setRunJobStatus('Failed: ' + data.message);
            }
        } catch (error) {
            console.error(error);
            setMessage("Execution error at runCustomJob: " + error);
        }
        setLoading(false);
    }

    const onRunReport = (event) => {
        if (!currStartDateStr || !currEndDateStr || !refStartDateStr || !refEndDateStr) {
            setErrorMessage("Start and End date can't be empty");
        }
        else if (currStartDateStr > currEndDateStr || refStartDateStr > refEndDateStr) {
            setErrorMessage("Start date can't be after the End date");
        }
        else if (currStartDateStr < refStartDateStr) {
            setErrorMessage("Start date of analysis can't be before the Reference End date");
        }
        else {
            event.preventDefault();
            setErrorMessage("");
            runCustomJob(jobType, currStartDateStr, currEndDateStr, refStartDateStr, refEndDateStr, numAlgorithm, catAlgorithm);
        }
    }

    const getPageData = async () => {
        try {
            if (jobResultFolder) {
                const response = await fetch(`/api/download_csv?file=${jobResultFolder}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                        }
                    });

                if (response.status == 200) {
                    const data = await response.json();

                    // sort custom runs data by date and get time stamps
                    data.sort((a, b) => new Date(a.logs_date) - new Date(b.logs_date));
                    setTimestamps(data.map(d => d.logs_date));

                    // get features list
                    const keys = Object.keys(data[0]);
                    let featuresList = keys.slice(2);
                    if (jobType == "target_drift") {
                        const targetName = data[0].target_name_col;
                        // remove "target_name_col" and targetName
                        featuresList = featuresList.filter((d) => {
                            return d != "target_name_col" && d != targetName;
                        })
                        // add target drift to targetOrPerformance
                        let targetOrPerformance = {};
                        targetOrPerformance[targetName] = data.map(d => parseFloat(d[targetName]));
                        setTargetOrPerformance(targetOrPerformance);
                    }
                    else if (jobType == "model_performance") {
                        let metrics = data[0].metrics_names_col;
                        metrics = metrics.replace(/'/g, '"');
                        metrics = JSON.parse(metrics);
                        // remove "metrics_names_col" and all metrics columns
                        featuresList = featuresList.filter((d) => {
                            return d != "metrics_names_col" && !metrics.includes(d);
                        })
                        // add performance of all metrics to targetOrPerformance
                        let targetOrPerformance = {};
                        metrics.forEach((metric) => {
                            targetOrPerformance[metric] = data.map(d => parseFloat(d[metric]));
                        })
                        setTargetOrPerformance(targetOrPerformance);
                    }

                    // get data drift score for each feature
                    let featuresDrift = {};
                    featuresList.forEach((feature) => {
                        featuresDrift[feature] = data.map(d => parseFloat(d[feature]));
                    })
                    setFeaturesDrift(featuresDrift);

                    // datesRange contains the time stamps string where there is a vertical dot line
                    const datePoints = [refStartDateStr, refEndDateStr, currStartDateStr, currEndDateStr];
                    setDatePoints(datePoints);

                    // add text of "reference" and "analysis" at middle date between start date and end date
                    // annotations is a dict and key is x location and value is the text
                    let refStartDate = new Date(refStartDateStr);
                    let refEndDate = new Date(refEndDateStr);
                    const refMiddleDate = new Date((refStartDate.getTime() + refEndDate.getTime()) / 2);
                    let currStartDate = new Date(currStartDateStr);
                    let currEndDate = new Date(currEndDateStr);
                    const currMiddleDate = new Date((currStartDate.getTime() + currEndDate.getTime()) / 2);
                    const annotations = {
                        "reference": refMiddleDate.toISOString().split('T')[0],
                        "analysis": currMiddleDate.toISOString().split('T')[0]
                    }
                    setAnnotations(annotations);

                } else {
                    setMessage("Execution error at getPageData: " + response.message);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        getPageData();
    }, [jobResultFolder, jobType]);

    return (
        <>
            <div><h4>Run model drift analysis</h4> </div>

            {message ? <ErrorMessage error={message} /> : null}

            {enabledJobTypes.length > 0 ? (
                <div>
                    <h5>Select Custom Job Type</h5>
                    <SelectBox onUpdate={setJobType} optionsList={enabledJobTypes} defaultOption="data_drift" />
                </div>
            ) : (
                <h5>Please enable custom job in model configuration file</h5>
            )
            }

            <h5>Select Dates Period for Current Dataset</h5>
            <div style={{ marginBottom: "0px", display: "flex" }}>
                <DateRangeSelector onStartUpdate={setCurrStartDateStr} onEndUpdate={setCurrEndDateStr} errorMessage={errorMessage} />
            </div>

            <h5>Select Dates Period for Reference Dataset</h5>
            <div style={{ marginBottom: "0px", display: "flex" }}>
                <DateRangeSelector onStartUpdate={setRefStartDateStr} onEndUpdate={setRefEndDateStr} errorMessage={errorMessage} />
            </div>

            <h5>Select Drift Algorithm for Numerical Features</h5>
            <div style={{ marginBottom: "0px" }}>
                <DriftAlgorithmSelector onUpdate={setNumAlgorithm} algorithmList={numAlgorithmList} />
            </div>

            {
                jobType == "target_drift" ? (
                    <h5>Select Drift Algorithm for Categorical Features and Target Column</h5>
                ) : (
                    <h5>Select Drift Algorithm for Categorical Features</h5>
                )
            }
            <div style={{ marginBottom: "0px" }}>
                <DriftAlgorithmSelector onUpdate={setCatAlgorithm} algorithmList={catAlgorithmList} />
            </div>

            <div>
                <button className="btn btn--primary btn--full-mobile btn--pull-left" style={{ float: "none" }} onClick={onRunReport}>
                    <span>Run Report</span>
                </button>
            </div>

            {loading &&
                <ColorRing visible={true} height="50" width="50" ariaLabel="blocks-loading" />
            }
            {runJobStatus && runJobStatus != "succeded" &&
                <div>{`Job ${runJobStatus}`}</div>
            }

            {
                Object.keys(targetOrPerformance).length > 0 &&
                <div>
                    <LineChart x={timestamps}
                        y={targetOrPerformance}
                        title={title}
                        x_label="Timestamps"
                        y_label={yLable}
                        xBounds={datePoints}
                        annotations={annotations}
                        margin={{ t: 30, b: 8, pad: 4 }}
                        plotHeight={200}
                        showlegend={true} />
                </div>
            }

            {
                Object.keys(featuresDrift).length > 0 &&
                <div>
                    <LineChart x={timestamps}
                        y={featuresDrift}
                        title={"Feature drift score over time"}
                        x_label="Timestamps"
                        y_label="Drift score"
                        xBounds={datePoints}
                        annotations={annotations}
                        margin={{ t: 30, b: 8, pad: 4 }}
                        plotHeight={400}
                        showlegend={true} />
                </div>
            }
        </>
    );
}