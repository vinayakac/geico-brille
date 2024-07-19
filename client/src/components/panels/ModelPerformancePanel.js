import { useState, useEffect } from 'react';
import '../../gdk/css/geico-design-kit.css';
import ClassPerformanceSummaryCard from '../cards/ClassPerformanceSummaryCard';
import ClassPerformanceDetailsCard from '../cards/ClassPerformanceDetailsCard';
import ModelPerformanceTrendCard from '../cards/ModelPerformanceTrendCard';
import FeatureFilter from "../FeatureFilter.js";
import LazyListLoader from "../LazyListLoader";
import ErrorMessage from '../errors/SectionLoadingError';
import LoadingMessage from '../errors/LoadingMessage';
import Tooltip from '../../components/Tooltip.js';
import PearsonCorrelation from '../PearsonCorrelation';
import CollabFilterPerformanceSummaryCard from '../cards/CollabFilterPerformanceSummaryCard.js';
import CollabFilterPerformanceDetailsCard from '../cards/CollabFilterPerformanceDetailsCard.js';
import RegPerformanceSummaryCard from '../cards/RegPerformanceSummaryCard.js';
import RegPerformanceDetailsCard from '../cards/RegPerformanceDetailsCard.js';

export default function ModelPerformancePanel({ model, modelType, zone, jobId, type, baselinePath, metrics_type = "model_performance_metrics" }) {
    const [message, setMessage] = useState("");
    const [reportEndDate, setReportEndDate] = useState();
    const [jobResultFolder, setJobResultFolder] = useState();
    const [fullFeatureList, setFullFeatureList] = useState([]);
    const [featureFilter, setFeatureFilter] = useState("");
    const [summary, setSummary] = useState();
    const [targetNames, setTargetNames] = useState({ "0": "0", "1": "1" });
    const [metricsList, setMetricsList] = useState([]);
    const [metric, setMetric] = useState();
    const [correlationByFeature, setCorrelationByFeature] = useState({});
    const [dataDriftScoreByFeature, setDataDriftScoreByFeature] = useState();
    const [performanceScoreOverTime, setPerformanceScoreOverTime] = useState();
    const [dataDriftByFeature, setDataDriftByFeature] = useState();
    const [timestamps, setTimestamps] = useState();
    const [fullDetails, setFullDetails] = useState([]);
    const [details, setDetails] = useState([]);
    // parameters for sorting details data
    const [sortColumn, setSortColumn] = useState('feature');
    const [sortDirection, setSortDirection] = useState('asc');
    const [selectedColumn, setSelectedColumn] = useState('feature');

    const fetchLatestJob = async () => {
        try {
            const response = await fetch(`/api/get_job_run?model=${model}&type=${type}&jobId=${jobId}&end_date=`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            if (response.status == 200) {
                const data = await response.json();
                console.log("data: ", data);
                // Construct the job result folder - should match it on the server side
                const jobResultFolder = `${model}/${zone}/${metrics_type}/${parseInt(data.run_id)}`;
                console.log(`Job result folder set: ${jobResultFolder}`);
                setJobResultFolder(jobResultFolder);
            } else {
                setMessage("Execution error at fetchLatestJob: " + response.message);
            }
        } catch (error) {
            console.error(error);
            setMessage(error);
        }
    }

    const fetchJobByDate = async (endDate) => {
        try {
            const response = await fetch(`/api/get_job_run?model=${model}&type=${type}&jobId=${jobId}&end_date=${endDate}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            const data = await response.json();
            if (response.ok && data.run_id) {
                const jobResultFolder = `${model}/${zone}/${metrics_type}/${parseInt(data.run_id)}`;
                setJobResultFolder(jobResultFolder);
            } else {
                setMessage("Execution error at fetchJobByDate: " + response.message);
            }
        } catch (error) {
            console.error(error);
        }
    }

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
                console.log("response2: ",response)
                const data = await response.json();
                console.log("data2: ", data);
                const summary = data[0];
                console.log("Summary fetched successfully: ", summary);
                setSummary(summary);
                return summary;
            } else {
                setMessage("Execution error at fetchSummary: " + response.message);
            }
        } catch (error) {
            console.error(error);
        }
    }

    const fetchFeatureList = async (jobResultFolder) => {
        try {
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
                    setFullFeatureList(data);
                    return data;
                } else {
                    setMessage("Execution error at fetchFeatureList: " + response.message);
                }
            
        } catch (error) {
            console.error(error);
        }
    }

    const fetchDataDriftByFeature = async () => {
        try {
            const file = `${model}/drift_summary/results.csv`;
            const response = await fetch(`/api/download_csv?file=${file}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            const data = await response.json();
            // filter out the rows with empty string for data_drift_by_feature column in data and save to dataDriftByFeature
            const dataDriftByFeature = data.filter(d => d.data_drift_by_feature);
            return dataDriftByFeature;

        } catch (error) {
            console.error(error);
        }
    }

    const fetchPerformanceScore = async () => {
        try {
            const file = `${model}/model_performance_summary/results.csv`;
            const response = await fetch(`/api/download_csv?file=${file}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            const data = await response.json();

            // filter out the rows that "deprecated" column value is True
            const actualData = data.filter(d => (
                !d.hasOwnProperty('deprecated') || d.deprecated == null || d.deprecated == 'False'
            ));
            return actualData;

        } catch (error) {
            console.error(error);
        }
    }

    const getPageData = async (summary) => {
        try {
            if (summary) {
                // get targetNames only available in classification model
                if (modelType == "classification") {
                    const targetNames = JSON.parse(summary?.target_name);
                    setTargetNames(targetNames);
                }

                // get data from data drift trend analysis summary
                const dataDataDriftByFeature = await fetchDataDriftByFeature();

                // use start_date and end_date create timestamps1 array
                const timestamps1 = dataDataDriftByFeature.map((d) => (d.start_date + " " + d.end_date))

                // get data from performance trend analysis summary 
                const dataPerformanceTrendSummary = await fetchPerformanceScore();
                // use start_date and end_date create timestamps2 array
                const timestamps2 = dataPerformanceTrendSummary.map((d) => (d.start_date + " " + d.end_date))

                // create timestamps array, an intersection of timestamps1 and timestamp2
                const timestamps = timestamps2.filter(d => timestamps1.includes(d));

                // filter by timestamps and sort
                const dataDriftByFeature = dataDataDriftByFeature.filter((d) => timestamps.includes(d.start_date + " " + d.end_date));
                dataDriftByFeature.sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
                setDataDriftByFeature(dataDriftByFeature);
                const performanceTrendSummary = dataPerformanceTrendSummary.filter((d) => timestamps.includes(d.start_date + " " + d.end_date));
                performanceTrendSummary.sort((a, b) => new Date(a.end_date) - new Date(b.end_date));

                // compute performance score array (yArr in PearsonCorrelation) depends on model type
                let metrics = [];
                let performanceScoreOverTime = {};
                if (modelType == "classification") {
                    // set metrics list
                    const keys = Object.keys(dataPerformanceTrendSummary[0]);
                    keys.forEach((item) => {
                        if (item.startsWith("current_") && item.split("_").length == 2) {
                            metrics.push(item.replace("current_", ""));
                        }
                    })
                    setMetricsList(metrics);
                    setMetric(metrics[0]);

                    // get performance score array (yArr in PearsonCorrelation)
                    metrics.forEach((metric) => {
                        performanceScoreOverTime[metric] = performanceTrendSummary.map((d) => {
                            if (!isNaN(parseFloat(JSON.parse(d["current_" + metric])))) {
                                return parseFloat(JSON.parse(d["current_" + metric]));
                            }
                            else {
                                return parseFloat(JSON.parse(d["current_" + metric]).value);
                            }
                        });
                    })
                    setPerformanceScoreOverTime(performanceScoreOverTime);
                    setTimestamps(performanceTrendSummary.map(d => d.end_date));
                }
                else if (modelType == "regression") {
                    // set metrics list
                    const keys = Object.keys(dataPerformanceTrendSummary[0]);
                    keys.forEach((item) => {
                        if (item.startsWith("current_") && item.split("_").length == 2) {
                            metrics.push(item.replace("current_", ""));
                        }
                    })
                    setMetricsList(metrics);
                    setMetric(metrics[0]);

                    // get performance score array (yArr in PearsonCorrelation)
                    metrics.forEach((metric) => {
                        performanceScoreOverTime[metric] = performanceTrendSummary.map((d) => {
                            if (!isNaN(parseFloat(JSON.parse(d["current_" + metric])))) {
                                return parseFloat(JSON.parse(d["current_" + metric]));
                            }
                            else {
                                return parseFloat(JSON.parse(d["current_" + metric]).value);
                            }
                        });
                    })
                    setPerformanceScoreOverTime(performanceScoreOverTime);
                    setTimestamps(performanceTrendSummary.map(d => d.end_date));
                }
                else if (modelType == "recommendation") {
                    // set metrics list
                    const cur_performance = JSON.parse(dataPerformanceTrendSummary[0].cur_performance);
                    metrics = Object.keys(cur_performance);
                    setMetricsList(metrics);
                    setMetric(metrics[0]);

                    // get performance score array (yArr in PearsonCorrelation)
                    metrics.forEach((metric) => {
                        performanceScoreOverTime[metric] = performanceTrendSummary.map((d) => JSON.parse(d.cur_performance)[metric]["overall"]);
                    })
                    setPerformanceScoreOverTime(performanceScoreOverTime);
                    setTimestamps(performanceTrendSummary.map(d => d.end_date));
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
    
    // calculate data drift socre array for each feature and save to a dict with key of feature
    const getDriftScore = () => {
        try {
            if (dataDriftByFeature && performanceScoreOverTime){
                const correlationByFeature = {};
                const dataDriftScoreByFeature = {};
                if (fullFeatureList.length > 0) {
                    let feature;
                    fullFeatureList.map((item) => {
                        if (item.includes("/feature=")) {
                            feature = item.match(/feature=([^\/]+)/)[1];
                        } else {feature = item;}
                        let xArr = dataDriftByFeature.map(d => 
                            parseFloat(JSON.parse(d.data_drift_by_feature)[feature]));
                        correlationByFeature[feature] = PearsonCorrelation(xArr, performanceScoreOverTime[metric]);
                        dataDriftScoreByFeature[feature] = xArr;
                    })
                    setCorrelationByFeature(correlationByFeature);
                    setDataDriftScoreByFeature(dataDriftScoreByFeature);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    const fetchFeatureDetails = async (fullFeatureList) => {
        try {
            let allData = [];
            const promises = fullFeatureList.map(item => 
                fetch(`/api/download_table?folder=${item}`,
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
                        setDetails(prevdetails => [...prevdetails, data[0]]);
                        allData.push(data[0]);
                    } else {
                        setMessage("Execution error at fetchFeatureDetails: " + response.message);
                    }
                }).catch(error => {
                    console.error(error);
                }));
            await Promise.allSettled(promises);
            const sortedDetails = allData.sort((a, b) => a.feature.localeCompare(b.feature));
            setFullDetails(sortedDetails);
            setDetails(sortedDetails);
        } catch (error) {
            console.error(error);
        }
    }

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
                // Sort the details by feature column
                const sortedDetails = data.sort((a, b) => a.feature.localeCompare(b.feature));
                setFullDetails(sortedDetails);
                setDetails(sortedDetails);
                // Create a list of feature names
                const fullFeatureList = sortedDetails.map(item => item.feature);
                setFullFeatureList(fullFeatureList);
            } else {
                setMessage("Execution error at fetchFeatureDetails: " + response.message);
            }
        } catch (error) {
            console.error(error);
        }
    }

    const fetchDetails = async (featureList) => {
        try {
            if (jobResultFolder) {
                if (featureList && featureList.length > 0) {
                    await fetchFeatureDetails(featureList);
                } else {
                    await fetchFullDetails();
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    // Sort details by column
    const handleSort = (column) => {
        let direction = 'asc';
        if (sortColumn === column && sortDirection === 'asc') {
            direction = 'desc';
        }
        setSortColumn(column);
        setSortDirection(direction);
        setSelectedColumn(column);

        const sortedDetails = [...details].sort((a, b) => {
            let aValue = a[column];
            let bValue = b[column];
            if (column === 'correlation_score') {
                aValue = Math.abs(aValue);
                bValue = Math.abs(bValue);
            } else {
                aValue = isNaN(+aValue) ? aValue : +aValue;
                bValue = isNaN(+bValue) ? bValue : +bValue;
            }            
            return (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) * 
                    (direction === 'asc' ? 1 : -1);
        });

        setDetails(sortedDetails);
    };

    const onOptionChangeHandler = (event) => {
        setMetric(event.target.value);
    }

    useEffect(() => {
        const timeOutId = setTimeout(() => {
            if (!featureFilter) {
                setDetails(fullDetails);
            } else {
                const filtered_details = fullDetails.filter(d => d.feature.includes(featureFilter));
                setDetails(filtered_details);
            }
        }, 500);
        return () => clearTimeout(timeOutId);
    }, [featureFilter]);

    useEffect(() => {
        if (reportEndDate) {
            fetchJobByDate(reportEndDate);
        }
    }, [reportEndDate]);

    useEffect(() => {
        fetchLatestJob();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (jobResultFolder) { 
                const summary = await fetchSummary(jobResultFolder);
                const featureList = await fetchFeatureList(jobResultFolder);
                await getPageData(summary);
                fetchDetails(featureList);
            }
        };
        fetchData();
    }, [jobResultFolder]);

    useEffect(() => {
        if (fullFeatureList.length > 0) {
            getDriftScore();
        }
    }, [fullFeatureList, dataDriftByFeature]);

    useEffect(() => {
        if (correlationByFeature && details.length > 0) {
            details.map((detail) => {
                detail.correlation_score = 
                    correlationByFeature[detail.feature];
            })
            setDetails(details);
        }
    }, [details, correlationByFeature]);

    return (
        <>
            {message ? <ErrorMessage error={message} /> : null}

            <div className="page-header--wrapper" style={{ "marginTop": "1.5em", flex: 1, padding: "0 20px 0 10px" }}>
                <ModelPerformanceTrendCard model={model} modelType={modelType} onClickHandle={setReportEndDate} />
            </div>

            {modelType == "classification" &&
                <>
                    {summary ? (
                        <ClassPerformanceSummaryCard summary={summary} baselinePath={baselinePath} />
                    ) : (<LoadingMessage />)}

                    <div className='summary_row'>
                        <div style={{ marginTop: "10px" }}>
                            <h4>Classification Performance Details By Feature
                                <Tooltip text="Accuracy by feature, including the tabs of grouping count of feature by confusion matrix labels in the drilldown" />
                            </h4>
                        </div>
                    </div>

                    {fullDetails.length > 0 &&
                        <FeatureFilter onChange={setFeatureFilter} filterName="Filter Model Performance Details By Feature" />}

                    <form>
                        <div className="form-field" style={{ marginTop: "10px", marginLeft: "50px", marginRight: "50px", width: "25%" }}>
                            <label htmlFor="demo-select-1" className="text">Performance Metrics</label>
                            <div className="select-box">
                                <select id="demo-select-1" name="demo-select-1" onChange={onOptionChangeHandler}>
                                    {
                                        metricsList.map((metric, index) => {
                                            return <option key={index} > {metric} </option>
                                        })
                                    }
                                </select>
                            </div>
                        </div>
                    </form>

                    {details && details.length > 0 &&
                        <div style={{ display: 'flex', fontSize: '1.4em', fontWeight: 'bold', paddingLeft:'10px',  width: "90%", justifyContent: 'space-evenly' }}>
                            <div onClick={() => handleSort('feature')} style={{ color: selectedColumn === 'feature' ? '#eee19c' : '#e695e6' }}>Feature {sortColumn === 'feature' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>                
                            <div onClick={() => handleSort('correlation_score')} style={{color: selectedColumn === 'correlation_score' ? '#eee19c' : '#e695e6' }}>Correlation Score {sortColumn === 'correlation_score' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>
                        </div>
                    }

                    {(details.length > 0 && dataDriftScoreByFeature) ?
                        (<LazyListLoader
                            items={details}
                            rowHeight={149.6}>
                            {({ item, index }) => (
                                <div key={index}>
                                    <ClassPerformanceDetailsCard
                                        detailsRow={item}
                                        lazyLoad={false}
                                        targetNames={targetNames}
                                        metric={metric}
                                        timestamps={timestamps}
                                        performanceScore={performanceScoreOverTime}
                                        dataDriftScore={dataDriftScoreByFeature[item.feature]}
                                        />
                                </div>
                            )}
                    </LazyListLoader>): (<LoadingMessage />)}
                </>
            }

            {modelType == "recommendation" &&
                <>
                    {summary && <CollabFilterPerformanceSummaryCard summary={summary} baselinePath={baselinePath} />}

                    <div className='summary_row'>
                        <div style={{ marginTop: "10px" }}>
                            <h4>Collaborative Filtering Performance Details By Feature
                                <Tooltip text="Model performance by feature, including historgram of feature in the drilldown" />
                            </h4>
                        </div>
                    </div>

                    {fullDetails.length > 0 &&
                        <FeatureFilter onChange={setFeatureFilter} filterName="Filter Model Performance Details By Feature" />}

                    <form>
                        <div className="form-field" style={{ marginTop: "10px", marginLeft: "50px", marginRight: "50px", width: "25%" }}>
                            <label htmlFor="demo-select-1" className="text">Performance Metrics</label>
                            <div className="select-box">
                                <select id="demo-select-1" name="demo-select-1" onChange={onOptionChangeHandler}>
                                    {
                                        metricsList.map((metric, index) => {
                                            return <option key={index} > {metric} </option>
                                        })
                                    }
                                </select>
                            </div>
                        </div>
                    </form>

                    {details && details.length > 0 &&
                        <div style={{ display: 'flex', fontSize: '1.4em', fontWeight: 'bold', paddingLeft:'10px',  width: "90%", justifyContent: 'space-evenly' }}>
                            <div onClick={() => handleSort('feature')} style={{ color: selectedColumn === 'feature' ? '#eee19c' : '#e695e6' }}>Feature {sortColumn === 'feature' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>                
                            <div onClick={() => handleSort('correlation_score')} style={{color: selectedColumn === 'correlation_score' ? '#eee19c' : '#e695e6' }}>Correlation Score {sortColumn === 'correlation_score' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>
                        </div>
                    }

                    {(details.length > 0 && dataDriftScoreByFeature) ?
                        (<LazyListLoader
                            items={details}
                            rowHeight={149.6}>
                            {({ item, index }) => (
                                <div key={index}>
                                    <CollabFilterPerformanceDetailsCard
                                        detailsRow={item}
                                        lazyLoad={false}
                                        metric={metric}
                                        timestamps={timestamps}
                                        performanceScore={performanceScoreOverTime}
                                        dataDriftScore={dataDriftScoreByFeature[item.feature]} />
                                </div>
                            )}
                    </LazyListLoader>): (<LoadingMessage />)}
                </>
            }

            {modelType == "regression" &&
                <>
                    {summary && <RegPerformanceSummaryCard summary={summary} baselinePath={baselinePath} />}

                    <div className='summary_row'>
                        <div style={{ marginTop: "10px" }}>
                            <h4>Regression Performance Details By Feature
                                <Tooltip text="Model performance by feature, including historgram of feature in the drilldown" />
                            </h4>
                        </div>
                    </div>

                    {fullDetails.length > 0 &&
                        <FeatureFilter onChange={setFeatureFilter} filterName="Filter Model Performance Details By Feature" />}

                    <form>
                        <div className="form-field" style={{ marginTop: "10px", marginLeft: "50px", marginRight: "50px", width: "25%" }}>
                            <label htmlFor="demo-select-1" className="text">Performance Metrics</label>
                            <div className="select-box">
                                <select id="demo-select-1" name="demo-select-1" onChange={onOptionChangeHandler}>
                                    {
                                        metricsList.map((metric, index) => {
                                            return <option key={index} > {metric} </option>
                                        })
                                    }
                                </select>
                            </div>
                        </div>
                    </form>

                    {details && details.length > 0 &&
                        <div style={{ display: 'flex', fontSize: '1.4em', fontWeight: 'bold', paddingLeft:'10px',  width: "90%", justifyContent: 'space-evenly' }}>
                            <div onClick={() => handleSort('feature')} style={{ color: selectedColumn === 'feature' ? '#eee19c' : '#e695e6' }}>Feature {sortColumn === 'feature' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>                
                            <div onClick={() => handleSort('correlation_score')} style={{color: selectedColumn === 'correlation_score' ? '#eee19c' : '#e695e6' }}>Correlation Score {sortColumn === 'correlation_score' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>
                        </div>
                    }
                    
                    {(details.length > 0 && dataDriftScoreByFeature) ?
                        (<LazyListLoader
                            items={details}
                            rowHeight={149.6}>
                            {({ item, index }) => (
                                <div key={index}>
                                    <RegPerformanceDetailsCard 
                                        detailsRow={item} 
                                        lazyLoad={false} 
                                        metric={metric}
                                        timestamps={timestamps} 
                                        performanceScore={performanceScoreOverTime} 
                                        dataDriftScore={dataDriftScoreByFeature[item.feature]} 
                                        />
                                </div>
                            )}
                    </LazyListLoader>): (<LoadingMessage />)}
                </>
            }
        </>
    );
}