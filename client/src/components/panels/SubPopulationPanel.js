import { useEffect, useState } from 'react';
import DataDriftPanel from "./DataDriftPanel.js";
import ClassPerformanceSummaryCard from '../cards/ClassPerformanceSummaryCard';
import TargetDriftSummaryCard from "../cards/TargetDriftSummaryCard";
import '../cards/cards.css';
import LoadingMessage from '../errors/LoadingMessage';


export default function SubPopulationPanel({ model, modelType, zone, modelConfig, baselinePath}) {
    const [jobResultFolderData, setJobResultFolderData] = useState();
    const [jobResultFolderPerformance, setJobResultFolderPerformance] = useState();
    const [jobResultFolderTarget, setJobResultFolderTarget] = useState();
    const [jobResultFolderPrediction, setJobResultFolderPrediction] = useState();
    const [summaryPerformance, setSummaryPerformance] = useState();
    const [summaryTarget, setSummaryTarget] = useState();
    const [summaryPrediction, setSummaryPrediction] = useState();
    const [summaryData, setSummaryData] = useState();
    const [subPerf, setSubPerf] = useState({});
    const [subTarget, setSubTarget] = useState({});
    const [subData, setSubData] = useState({});
    const [subPred, setSubPred] = useState({});
    const [message, setMessage] = useState("");

    // Fetch latest job run report path for the given type
    const fetchLatestJob = async (type, jobId, metricsType, setJobResultFolder) => {
        try {
            const response = await fetch(`/api/get_job_run?model=${model}&type=${type}&jobId=${jobId}&end_date=`);
            const data = await response.json();
            if (response.ok && data.run_id) {
                // Construct the job result folder - should match it on the server side
                // TODO: get this path from config
                const jobResultFolder = `${model}/${zone}/${metricsType}/${parseInt(data.run_id)}`;
                setJobResultFolder(jobResultFolder);
            } else {
                console.error(response);
                setMessage("Execution error at fetchLatestJob: " + response.message);
            }
        } catch (error) {
            console.error(error);
        }
    }

    // Fetch summary report from job result folder and call subpopulations
    const fetchSummaryAndSubpopulations = async (jobResultFolder, setSummary, setSub) => {
        if (jobResultFolder) {
            const summaryFolder = `${jobResultFolder}/summary.parquet/`;
            const response = await fetch(`/api/download_table?folder=${summaryFolder}`);
            if (response.status == 200) {
                const data = await response.json();
                const summary = data[0];
                setSummary(summary);
                fetchSubpopulations(summary, setSub);
            } else {
                setMessage("Execution error at fetchSummary: " + response.message);
            }
        }
    }
    
    // Get current and reference subpopulations from summary report
    const fetchSubpopulations = (summary, setSub) => {
        let subpopulations = {};
        if (summary) {
            if ('subpopulations_reference' in summary) {
                const refSubpopulations = JSON.parse(summary['subpopulations_reference']);
                subpopulations.reference = Object.keys(refSubpopulations).map(key => ({
                    [key]: refSubpopulations[key]
                }));
            }
            
            if ('subpopulations_current' in summary) {
                const curSubpopulations = JSON.parse(summary['subpopulations_current']);
                subpopulations.current = Object.keys(curSubpopulations).map(key => ({
                    [key]: curSubpopulations[key]
                }));
            }
        }
        setSub(subpopulations);
    }
    
    // Set summary and subpopulations for model performance
    useEffect(() => {
        if (jobResultFolderPerformance) {
            fetchSummaryAndSubpopulations(jobResultFolderPerformance, 
                setSummaryPerformance, setSubPerf);
        }
    }, [jobResultFolderPerformance]);

    // Set summary and subpopulations for prediction drift
    useEffect(() => {
        if (jobResultFolderPrediction) {
            fetchSummaryAndSubpopulations(jobResultFolderPrediction, 
                setSummaryPrediction, setSubPred);
        }
    }, [jobResultFolderPrediction]);

    // Set summary and subpopulations for concept drift
    useEffect(() => {
        if (jobResultFolderTarget) {
            fetchSummaryAndSubpopulations(jobResultFolderTarget, 
                setSummaryTarget, setSubTarget);
        }
    }, [jobResultFolderTarget]);

    // Set summary and subpopulations for data drift 
    useEffect(() => {
        if (jobResultFolderData) {
            fetchSummaryAndSubpopulations(jobResultFolderData, 
                setSummaryData, setSubData);
        }
    }, [jobResultFolderData]);
    
    // Fetch latest subpopulation jobs report path
    useEffect(() => {
        fetchLatestJob("model_performance", modelConfig?.jobsMap?.model_performance, 
                        "subpopulation_model_performance_metrics", setJobResultFolderPerformance);
        fetchLatestJob("data_drift", modelConfig?.jobsMap?.data_drift, 
                        "subpopulation_drift_metrics", setJobResultFolderData);
        fetchLatestJob("target_drift", modelConfig?.jobsMap?.target_drift, 
                        "subpopulation_target_drift_metrics", setJobResultFolderTarget);
        fetchLatestJob("prediction_drift", modelConfig?.jobsMap?.prediction_drift, 
                        "subpopulation_prediction_drift_metrics", setJobResultFolderPrediction);
    }, []);

    return (
        <>
            {subPerf && Object.keys(subPerf).length !== 0 && (
                <div className="subpopulation-row">
                    <h3>Model Performance</h3>
                    <div className='summary_row'>
                        <div style={{ fontSize: '18px', textAlign: 'left', marginLeft: '20px', padding: '10px', marginBottom: '-20px' }}>
                            <strong>"reference_subpopulations": </strong>[{subPerf.reference.map(item => JSON.stringify(item, null, 2)).join(", ")}]
                        </div>
                        <div style={{ fontSize: '18px', textAlign: 'left', marginLeft: '20px', padding: '10px'}}>
                            <strong>"current_subpopulations": </strong>[{subPerf.current.map(item => JSON.stringify(item, null, 2)).join(", ")}]
                        </div>

                        {modelType == "classification" && 
                            <>
                            {summaryPerformance ? (
                                <ClassPerformanceSummaryCard summary={summaryPerformance} baselinePath={baselinePath} showHist={false}/>
                                ) : (<LoadingMessage />)}
                            </>
                        }
                    </div>
                </div>
            )}

            {subPred && Object.keys(subPred).length !== 0 && (
                <div className="subpopulation-row">
                    <h3>Prediction Drift</h3>
                    <div className='summary_row'>
                        <div style={{ fontSize: '18px', textAlign: 'left', marginLeft: '20px', padding: '10px', marginBottom: '-20px' }}>
                            <strong>"reference_subpopulations": </strong>[{subPred.reference.map(item => JSON.stringify(item, null, 2)).join(", ")}]
                        </div>
                        <div style={{ fontSize: '18px', textAlign: 'left', marginLeft: '20px', padding: '10px' }}>
                            <strong>"current_subpopulations": </strong>[{subPred.current.map(item => JSON.stringify(item, null, 2)).join(", ")}]
                        </div>
                        {summaryPrediction ? (<TargetDriftSummaryCard summary={summaryPrediction} title="Prediction Drift" modelType={modelType} baselinePath={baselinePath} />)
                        : (<LoadingMessage />)}
                    </div>
                </div>
            )}

            {subTarget && Object.keys(subTarget).length !== 0 && (
                <div className="subpopulation-row">
                    <h3>Concept Drift</h3>
                    <div className='summary_row'>
                       <div style={{ fontSize: '18px', textAlign: 'left', marginLeft: '20px', padding: '10px', marginBottom: '-20px' }}>
                            <strong>"reference_subpopulations": </strong>[{subTarget.reference.map(item => JSON.stringify(item, null, 2)).join(", ")}]
                        </div>
                        <div style={{ fontSize: '18px', textAlign: 'left', marginLeft: '20px', padding: '10px' }}>
                            <strong>"current_subpopulations": </strong>[{subTarget.current.map(item => JSON.stringify(item, null, 2)).join(", ")}]
                        </div>
                        {summaryTarget ? (<TargetDriftSummaryCard summary={summaryTarget} title="Concept Drift" modelType={modelType} baselinePath={baselinePath} />)
                        : (<LoadingMessage />)}
                    </div>
                </div>
            )}

            {subData && Object.keys(subData).length !== 0 && (
                <div className="subpopulation-row">
                    <h3>Feature Drift</h3>
                    <div className='summary_row'>
                       <div style={{ fontSize: '18px', textAlign: 'left', marginLeft: '20px', padding: '10px', marginBottom: '-20px' }}>
                            <strong>"reference_subpopulations": </strong>[{subData.reference.map(item => JSON.stringify(item, null, 2)).join(", ")}]
                        </div>
                        <div style={{ fontSize: '18px', textAlign: 'left', marginLeft: '20px', padding: '10px' }}>
                            <strong>"current_subpopulations": </strong>[{subData.current.map(item => JSON.stringify(item, null, 2)).join(", ")}]
                        </div>

                        <DataDriftPanel
                            model={model}
                            zone={zone}
                            jobId={modelConfig?.jobsMap?.data_drift}
                            type={"data_drift"}
                            metricsType={"subpopulation_drift_metrics"}
                            baselinePath={baselinePath}
                            showTrend={false}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
