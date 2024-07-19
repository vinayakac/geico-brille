import { useEffect, useState } from 'react';
import '../../gdk/css/geico-design-kit.css';
import DataDriftDetailsCard from "../cards/DataDriftDetailsCard.js";
import DataDriftSummaryCard from "../cards/DataDriftSummaryCard.js";
import DriftTrendCard from '../cards/DriftTrendCard.js';
import FeatureFilter from "../FeatureFilter.js";
import LazyListLoader from "../LazyListLoader.js";
import ErrorMessage from '../errors/SectionLoadingError.js';
import { DataDriftTour } from '../touring/carloan/DataDriftTour.js';
import Tooltip from '../Tooltip.js';
import LoadingMessage from '../errors/LoadingMessage';

export default function DataDriftPanel({ model, zone, jobId, type, baselinePath, touringOn = false, updateViewFn, onTourClose, metricsType ="drift_metrics", showTrend=true}) {
    const [message, setMessage] = useState("");
    const [reportEndDate, setReportEndDate] = useState();
    const [jobResultFolder, setJobResultFolder] = useState();
    const [featureFilter, setFeatureFilter] = useState("");
    const [fullDetails, setFullDetails] = useState([]);
    const [details, setDetails] = useState([]);
    // parameters for sorting details data
    const [sortColumn, setSortColumn] = useState('feature');
    const [sortDirection, setSortDirection] = useState('asc');
    const [selectedColumn, setSelectedColumn] = useState('feature');


    const constructJobResultFolder = (model, zone, metricsType, jobRunId) => {
        let jobResultsFolder;
        if (zone) {
            jobResultsFolder = `${model}/${zone}/${metricsType}/${jobRunId}`;
        } else {
            jobResultsFolder = `${model}/${metricsType}/${jobRunId}`;
        }
        return jobResultsFolder;
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
            const data = await response.json();    
            if (response.ok && data.run_id) {
                // Construct the job result folder - should match it on the server side
                // TODO: get this path from config
                const jobResultFolder = constructJobResultFolder(model, zone, metricsType, parseInt(data.run_id));
                setJobResultFolder(jobResultFolder);
            } else {
                console.error(response);
                console.error(data);
                setMessage("Execution error at fetchLatestJob: " + response.message);
            }
        } catch (error) {
            console.error(error);
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
                const jobResultFolder = constructJobResultFolder(model, zone, metricsType, parseInt(data.run_id));
                setJobResultFolder(jobResultFolder);

            } else {
                setMessage("Execution error at fetchJobByDate: " + response.message);
            }
        } catch (error) {
            console.error(error);
        }
    }

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

    const fetchFeatureDetails = async (fullFeatureList) => {
        try {
            let allData = [];
            const promises = fullFeatureList.map(item => fetch(`/api/download_table?folder=${item}`,
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
            if (jobResultFolder) {
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
                } else {
                    setMessage("Execution error at fetchFeatureDetails: " + response.message);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    const fetchDetails = async () => {
        try {
            const fullFeatureList = await fetchFeatureList();
            if (fullFeatureList && fullFeatureList.length > 0) {
                fetchFeatureDetails(fullFeatureList);
            } else {
                fetchFullDetails();
            }
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
    
            if (column === 'anomal_data') {
                aValue = JSON.parse(a[column])?.anomaly_count;
                bValue = JSON.parse(b[column])?.anomaly_count;
            } else if (column === 'validation_success') {
                const order = { true: 1, '': 2,  false: 3 };
                aValue = order[a[column]];
                bValue = order[b[column]];
            } else {
                aValue = isNaN(+a[column]) ? a[column] : +a[column];
                bValue = isNaN(+b[column]) ? b[column] : +b[column];
            }
    
            return (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) * (direction === 'asc' ? 1 : -1);
        });
    
        setDetails(sortedDetails);
    };

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
    }, [reportEndDate])

    useEffect(() => {
        fetchLatestJob();
    }, []);

    useEffect(() => {
        if (jobResultFolder) {
            fetchDetails();
        }
    }, [jobResultFolder]);

    return (
        <>
            {touringOn &&
                <DataDriftTour nextPageFn={updateViewFn} onCloseFn={onTourClose} />
            }
            {showTrend &&
            <DriftTrendCard model={model} type={type} onClickHandle={setReportEndDate} chartTitle={"Drifted columns over time"} chartXLabel={"Timestamp"} chartYLabel={"Drifted columns"} />
            }
            {message ? <ErrorMessage error={message} /> : null}

            {jobResultFolder &&
                <DataDriftSummaryCard jobResultFolder={jobResultFolder} baselinePath={baselinePath} />}

            <div className='summary_row'>
                <div style={{ marginTop: "10px" }}>
                    <h4>Feature Drift Details
                        <Tooltip text="Feature drift details, including data quality results and histogram of feature distribution in the drilldown" />
                    </h4>
                </div>
            </div>

            {fullDetails.length > 0 &&
                <FeatureFilter onChange={setFeatureFilter} filterName="Filter Feature Drift Details" />
            }
            
            {details && details.length > 0 &&
            <div className='data_drift_details_row' style={{ display: 'flex', fontSize: '1.4em', fontWeight: 'bold', paddingLeft:'20px',  width: "90%", justifyContent: 'space-evenly' }}>
                <div onClick={() => handleSort('feature')} style={{ width: '10%', color: selectedColumn === 'feature' ? '#eee19c' : '#e695e6' }}>Feature {sortColumn === 'feature' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>        
                <div onClick={() => handleSort('type')} style={{ width: '10%', color: selectedColumn === 'type' ? '#eee19c' : '#e695e6' }}>Type {sortColumn === 'type' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>
                <div onClick={() => handleSort('drift_detected')} style={{ width: '10%', color: selectedColumn === 'drift_detected' ? '#eee19c' : '#e695e6' }}>Data Drift {sortColumn === 'drift_detected' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>
                <div onClick={() => handleSort('threshold')} style={{ width: '10%', color: selectedColumn === 'threshold' ? '#eee19c' : '#e695e6' }}>Threshold {sortColumn === 'threshold' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>
                <div onClick={() => handleSort('validation_success')} style={{ width: '10%', color: selectedColumn === 'validation_success' ? '#eee19c' : '#e695e6' }}>Validation {sortColumn === 'validation_success' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>
                <div onClick={() => handleSort('stattest_name')} style={{ width: '10%', color: selectedColumn === 'stattest_name' ? '#eee19c' : '#e695e6' }}>Stat Test {sortColumn === 'stattest_name' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>
                <div onClick={() => handleSort('drift_score')} style={{ width: '10%', color: selectedColumn === 'drift_score' ? '#eee19c' : '#e695e6', marginRight: '-20px' }}>Drift Score {sortColumn === 'drift_score' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>
                <div onClick={() => handleSort('anomal_data')} style={{ width: '15%', color: selectedColumn === 'anomal_data' ? '#eee19c' : '#e695e6' }}>Anomaly Check {sortColumn === 'anomal_data' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</div>
            </div>
            }

            {details.length > 0 ?
            (<LazyListLoader
                items = {details}
                rowHeight={110}>
                {({ item, index }) => (
                    <div key={index}>
                        <DataDriftDetailsCard detailsRow={item} />
                    </div>
                )}
            </LazyListLoader>): (<LoadingMessage />)}
        </>
    );
}