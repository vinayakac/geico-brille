import { useEffect, useState } from 'react';
import Tooltip from '../../components/Tooltip.js';
import '../../gdk/css/geico-design-kit.css';
import DriftTrendCard from '../cards/DriftTrendCard';
import TargetDriftDetailsCard from '../cards/TargetDriftDetailsCard';
import TargetDriftSummaryCard from "../cards/TargetDriftSummaryCard";
import LoadingMessage from '../errors/LoadingMessage';
import ErrorMessage from '../errors/SectionLoadingError';
import FeatureFilter from "../FeatureFilter.js";
import LazyListLoader from "../LazyListLoader";
import PearsonCorrelation from '../PearsonCorrelation.js';
import { PredictionDriftTour } from '../touring/carloan/PredictionDriftTour';
import SelectBox from '../widgets/SelectBox.js';

export default function TargetDriftPanel({ model, modelType, zone, jobId, type, baselinePath, updateViewFn, onTourClose, touringOn = false }) {
    const [message, setMessage] = useState("");
    const [reportEndDate, setReportEndDate] = useState();
    const [jobResultFolder, setJobResultFolder] = useState();
    const [fullFeatureList, setFullFeatureList] = useState([]);
    const [featureFilter, setFeatureFilter] = useState("");
    const [summary, setSummary] = useState();
    const [correlationByFeature, setCorrelationByFeature] = useState({});
    const [dataDriftScoreByFeature, setDataDriftScoreByFeature] = useState();
    const [dataDriftByFeature, setDataDriftByFeature] = useState();
    const [targetDriftTrendSummary, setTargetDriftTrendSummary] = useState();
    const [driftScoreOverTime, setDriftScoreOverTime] = useState();
    const [timestamps, setTimestamps] = useState();
    const metrics_path = type.concat("_metrics");
    const [fullDetails, setFullDetails] = useState([]);
    const [details, setDetails] = useState([]);
    // parameters for sorting details data
    const [sortColumn, setSortColumn] = useState('feature');
    const [sortDirection, setSortDirection] = useState('asc');
    const [selectedColumn, setSelectedColumn] = useState('feature');
    // parameters for recommendation model
    const [recommendationsList, setRecommendationsList] = useState([]);
    const [recommendation, setRecommendation] = useState();

    let title;
    let textForDetails;
    let featurePrefix;
    let textForCorrelationScore;

    let formattedTitle;
    if (type == "target_drift") {
        title = "Concept Drift";
        formattedTitle = "Concept drift";
        featurePrefix = "feature_drift of ";
        textForCorrelationScore = "The score shows the correlation between the concept drift and feature drift";
        textForDetails = "Drift divergence by feature, including group count of feature by target labels in the drilldown"
    }
    else {
        title = "Prediction Drift";
        formattedTitle = "Prediction drift";
        featurePrefix = "feature_drift of ";
        textForDetails = "Drift divergence by feature, including group count of feature by prediction labels in the drilldown";
        textForCorrelationScore = "The score shows the correlation between the prediction drift and feature drift";


    }

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
                const jobResultFolder = `${model}/${zone}/${metrics_path}/${parseInt(data.run_id)}`;
                setJobResultFolder(jobResultFolder);
            } else {
                setMessage("Execution error at fetchLatestJob: " + response.message);
            }
        } catch (error) {
            console.log(error)
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
                const jobResultFolder = `${model}/${zone}/${metrics_path}/${parseInt(data.run_id)}`;
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
                const data = await response.json();
                if (modelType == "recommendation") {
                    setSummary(data);
                    return data;
                }
                else {
                    const summary = data[0];
                    setSummary(summary);
                    return summary;
                }
            } else {
                setMessage("Execution error at fetchSummary: " + response.message);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const fetchFeatureList = async (jobResultFolder, summary) => {
        try {
            if (summary) {
                const targetColumnName = summary.column_name;
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
                    // remove target column from features list because it doesn't target drift plot
                    const featureFolders = data.filter(item => !item.endsWith(`/feature=${targetColumnName}/`));
                    setFullFeatureList(featureFolders);
                    return featureFolders;
                } else {
                    setMessage("Execution error at fetchFeatureList: " + response.message);
                }
            }
        } catch (error) {
            console.log(error);
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

    const fetchDriftScore = async () => {
        try {
            const file = `${model}/${type}_summary/results.csv`;
            const response = await fetch(`/api/download_csv?file=${file}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            const data = await response.json();

            if (type == "target_drift") {
                // filter out the rows that "deprecated" column value is True
                const actualData = data.filter(d => (
                    !d.hasOwnProperty('deprecated') || d.deprecated == null || d.deprecated == 'False'
                ));
                return actualData
            }
            else return data;

        } catch (error) {
            console.error(error);
        }
    }

    const getPageData = async (summary) => {
        try {
            if (summary) {
                if (modelType == "recommendation") {
                    // get recommendation list from summary for recommendation model
                    let recommendationsList = [];
                    if (summary.constructor == Object) {
                        // if there is only one recommendation, then summary is a dict
                        recommendationsList.push(summary.recommendation);
                        setRecommendationsList(recommendationsList);
                    }
                    else {
                        // if there is more than one recommendation, then summary is a list of dict
                        recommendationsList = summary.map((d) => (d.recommendation));
                        setRecommendationsList(recommendationsList);
                    }
                    // get 1st recommendation in recommendationsList as default
                    setRecommendation(recommendationsList[0]);
                }
                // get data from data drift trend analysis summary
                const dataDataDriftByFeature = await fetchDataDriftByFeature();
                // use start_date and end_date create timestamps1 array
                const timestamps1 = dataDataDriftByFeature.map((d) => (d.start_date + " " + d.end_date));

                // get data from target drift trend analysis summary
                const dataTargetDriftTrendSummary = await fetchDriftScore();
                // use start_date and end_date create timestamps2 array
                const timestamps2 = dataTargetDriftTrendSummary.map((d) => (d.start_date + " " + d.end_date));

                // create timestamps array, an intersection of timestamps1 and timestamp2
                const timestamps = timestamps2.filter(d => timestamps1.includes(d));

                // filter by timestamps and sort
                const dataDriftByFeature = dataDataDriftByFeature.filter((d) => timestamps.includes(d.start_date + " " + d.end_date));
                dataDriftByFeature.sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
                const targetDriftTrendSummary = dataTargetDriftTrendSummary.filter((d) => timestamps.includes(d.start_date + " " + d.end_date));
                targetDriftTrendSummary.sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
                setTargetDriftTrendSummary(targetDriftTrendSummary);
                setDataDriftByFeature(dataDriftByFeature);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const getDriftScore = () => {
        try {
            if (targetDriftTrendSummary && dataDriftByFeature) {
                // get drift score array (yArr in PearsonCorrelation)
                let filteredData;
                let yArr;
                if (modelType == "recommendation") {
                    // if model type is recommendation, filter drift trend summary data by selected recommendations
                    filteredData = targetDriftTrendSummary.filter(d => d.recommendation == recommendation);
                    yArr = filteredData.map((d) => parseFloat(d.drift_score));
                }
                else {
                    // if other model type, filtered data is trend summary data
                    filteredData = targetDriftTrendSummary
                    yArr = filteredData.map((d) => parseFloat(d.drift_score));
                }
                setDriftScoreOverTime(yArr);
                setTimestamps(filteredData.map(d => d.end_date));

                // calculate data drift socre array for each feature and save to a dict with key of feature
                const correlationByFeature = {};
                const dataDriftScoreByFeature = {};
                if (fullFeatureList.length > 0) {
                    let feature;
                    fullFeatureList.map((item) => {
                        if (item.includes("/feature=")) {
                            feature = item.match(/feature=([^\/]+)/)[1];
                        } else { feature = item; }
                        let xArr = dataDriftByFeature.map(d =>
                            parseFloat(JSON.parse(d.data_drift_by_feature)[feature]));
                        correlationByFeature[feature] = PearsonCorrelation(xArr, yArr);
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

                            // Add feature name and correlation score to the details data
                            data.map(itemData => {
                                itemData.feature = item.match(/feature=([^\/]+)/)[1];
                                return itemData;
                            });
                            setDetails(prevdetails => [...prevdetails, data]);
                            allData.push(data);
                        } else {
                            setMessage("Execution error at fetchFeatureDetails: " + response.message);
                        }
                    }).catch(error => {
                        console.error(error);
                    }));
            await Promise.allSettled(promises);
            const sortedDetails = allData.sort((a, b) => a[0].feature.localeCompare(b[0].feature));
            setFullDetails(sortedDetails);
            setDetails(sortedDetails);

        } catch (error) {
            console.error(error);
        }
    }

    const fetchFullDetails = async (summary) => {
        try {
            if (summary) {
                const response = await fetch(`/api/download_parq?folder=${jobResultFolder}/details.parquet/`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                        }
                    });
                if (response.status === 200) {
                    const data = await response.json();
                    const filteredData = data.filter(item => item.feature !== summary.column_name);
                    // Group objects by the feature
                    const groupedByFeature = filteredData.reduce((groups, item) => {
                        const group = (groups[item.feature] || []);
                        group.push(item);
                        groups[item.feature] = group;
                        return groups;
                    }, {});
                    // Convert the object into an array of arrays
                    const detailsArray = Object.values(groupedByFeature);
                    // Sort the details by feature column
                    const sortedDetails = detailsArray.sort((a, b) => a[0].feature.localeCompare(b[0].feature));
                    setFullDetails(sortedDetails);
                    setDetails(sortedDetails);
                    // Create a list of feature names
                    const fullFeatureList = sortedDetails.map(item => item[0].feature);
                    setFullFeatureList(fullFeatureList);
                } else {
                    setMessage("Execution error at fetchFeatureDetails: " + response.message);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    const fetchDetails = async (featureList, summary) => {
        try {
            if (jobResultFolder) {
                if (featureList && featureList.length > 0) {
                    await fetchFeatureDetails(featureList);
                } else {
                    await fetchFullDetails(summary);
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
            let aValue = a[0][column];
            let bValue = b[0][column];
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

    useEffect(() => {
        const timeOutId = setTimeout(() => {
            if (!featureFilter) {
                setDetails(fullDetails);
            } else {
                const filtered_details = fullDetails.filter(d =>
                    d[0].feature.includes(featureFilter));
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
                const featureList = await fetchFeatureList(jobResultFolder, summary);
                await getPageData(summary);
                fetchDetails(featureList, summary);
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
                detail[0].correlation_score =
                    correlationByFeature[detail[0].feature];
            })
            setDetails(details);
        }
    }, [details, correlationByFeature]);

    return (
        <>
            {touringOn &&
                <PredictionDriftTour nextPageFn={updateViewFn} onCloseFn={onTourClose} />
            }

            <DriftTrendCard model={model} type={type} onClickHandle={setReportEndDate}
                chartTitle={title + " score over time"} chartXLabel={"Timestamp"} chartYLabel={"Drift score"} />

            {recommendationsList.length > 0 &&
                <div style={{ marginLeft: "50px" }}>
                    <h4>Recommendatoins List</h4>
                    <SelectBox onUpdate={setRecommendation} optionsList={recommendationsList} defaultOption={recommendationsList[0]} />
                </div>
            }

            {message ? <ErrorMessage error={message} /> : null}

            {summary ? (<TargetDriftSummaryCard summary={summary} title={title} modelType={modelType} baselinePath={baselinePath} selectedItem={recommendation} />)
                : (<LoadingMessage />)}

            <div className='summary_row'>
                <div style={{ marginTop: "10px" }}>
                    <h4>{title} Details By Feature
                        <Tooltip text={textForDetails} />
                    </h4>
                </div>
            </div>

            {fullDetails.length > 0 &&
                <FeatureFilter onChange={setFeatureFilter} filterName={"Filter " + title + " Details By Feature"} />}

            {details && details.length > 0 &&
                <div style={{ display: 'flex', fontSize: '1.4em', fontWeight: 'bold', paddingLeft: '10px', width: "90%", justifyContent: 'space-evenly' }}>
                    <div onClick={() => handleSort('feature')} style={{ color: selectedColumn === 'feature' ? '#eee19c' : '#e695e6' }}>Feature {sortColumn === 'feature' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>
                    <div onClick={() => handleSort('correlation_score')} style={{ color: selectedColumn === 'correlation_score' ? '#eee19c' : '#e695e6' }}>Correlation Score {sortColumn === 'correlation_score' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>
                </div>}

            {(details.length > 0 && dataDriftScoreByFeature) ?
                (<LazyListLoader
                    items={details}
                    rowHeight={179.6}>
                    {({ item, index }) => (
                        <div key={index}>
                            <TargetDriftDetailsCard
                                detailsRow={item}
                                lazyLoad={false}
                                modelType={modelType}
                                selectedItem={recommendation}
                                type={type}
                                timestamps={timestamps}
                                targetDriftScore={driftScoreOverTime}
                                dataDriftScore={dataDriftScoreByFeature[item[0].feature]}
                                toolTipValue={textForCorrelationScore}
                                featurePrefix={featurePrefix}
                                title={formattedTitle}
                            />
                        </div>
                    )}
                </LazyListLoader>) : (<LoadingMessage />)}
        </>
    );
}
