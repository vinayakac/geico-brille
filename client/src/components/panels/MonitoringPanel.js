import ModelPerformanceTrendCard from "../cards/ModelPerformanceTrendCard";
import { SummaryCard } from "../cards/SummaryCard";
import { useState, useEffect } from 'react';
import { ModelPerformanceSmallCard } from "../cards/ModelPerformanceSmallCard";
import DriftTrendCard from "../cards/DriftTrendCard";
import { SummaryPanelTour } from "../touring/carloan/SummaryPanelTour";


/** 
 * This component is not used anywhere (as of 06/05/2024), and navigation to it is disabled. 
 * This is an old Monitoring Landing page.
 * The new component is called MonitoringLandingPanel.  Re-design for it was requested by RAD.
 */
export const MonitoringPanel = ({ model, modelConfig, updateViewFn, touringOn, onTourClose }) => {
    const modelPerformanceJobId = modelConfig?.jobsMap?.model_performance;
    const predictionDriftEnabled = modelConfig?.monitoring_features_enabled?.includes("prediction_drift");
    const conceptDriftEnabled = modelConfig?.monitoring_features_enabled?.includes("target_drift");
    const zone = modelConfig?.zone;
    const modelType = modelConfig?.model_type;
    const [jobResultFolder, setJobResultFolder] = useState();
    const [message, setMessage] = useState("");
    const [summary, setSummary] = useState();
    const fetchLatestJob = async (jobType, jobId) => {

        try {
            const response = await fetch(`/api/get_job_run?model=${model}&type=${jobType}&jobId=${jobId}`);

            if (response.status == 200) {
                const data = await response.json();
                const jobResultFolder = `${model}/${zone}/${jobType}_metrics/${data.run_id}`;
                setJobResultFolder(jobResultFolder);
            } else {
            }
        } catch (error) {
            console.error(error);

        }
    }

    const fetchSummary = async () => {
        try {
            if (jobResultFolder) {
                const summaryFolder = `${jobResultFolder}/summary.parquet/`;
                const response = await fetch(`/api/download_table?folder=${summaryFolder}`,
                    // {
                    //     method: 'GET',
                    //     headers: {
                    //         Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    //     }
                    // }
                );
                if (response.status == 200) {
                    const data = await response.json();
                    setSummary(data[0]);
                } else {
                    setMessage("Execution error at fetchSummary: " + response.message);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        if (modelPerformanceJobId) {
            fetchLatestJob("model_performance", modelPerformanceJobId);
        }
    }, []);

    useEffect(() => {
        if (jobResultFolder) {
            fetchSummary();
        }
    }, [jobResultFolder]);

    const gotoPerformanceReport = () => {
        // TODO: make clicking on graph navigate to the report for that date
    }


    const gotoDriftReport = () => {
        // TODO: make clicking on graph navigate to the report for that date
    }

    const gotoPredictionDriftReport = () => {
        // TODO
    }

    const gotoConceptDriftReport = () => {
        // TODO
    }

    return (
        <>
            {touringOn && <SummaryPanelTour nextPageFn={updateViewFn} onCloseFn={onTourClose} />}
            <h4 style={{ paddingTop: "10px" }}>Model Monitoring Summary </h4>
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ flex: 3, padding: "0 10px 0 20px" }}>
                    <div id="prediction_drift_summary">
                        {predictionDriftEnabled && <SummaryCard title=" " fullView="prediction-drift" linkText="Go to prediction drift report >" updateViewFn={updateViewFn}>
                            <DriftTrendCard model={model} type="prediction_drift" onClickHandle={gotoPredictionDriftReport}
                                chartTitle={"Prediction drift Jensen-Shannon Distance over time"} chartXLabel={"Timestamp"} chartYLabel={"Jensen-Shannon Distance"} />
                        </SummaryCard>}
                    </div>
                    <div id="model_performance_summary">
                        {modelPerformanceJobId &&
                            <SummaryCard title=" " fullView="performance" linkText="Go to performance report >" updateViewFn={updateViewFn}>
                                <ModelPerformanceTrendCard model={model} modelType={modelType} onClickHandle={gotoPerformanceReport} />
                            </SummaryCard>
                        }
                    </div>
                    <div id="drift_trend_summary">
                        <SummaryCard title=" " fullView="drift" linkText="Go to drift report >" updateViewFn={updateViewFn}>
                            <DriftTrendCard model={model} type="drift" onClickHandle={gotoDriftReport}
                                showNumColumns={false} />
                        </SummaryCard>
                    </div>
                    <div id="concept_drift_summary">
                        {conceptDriftEnabled && <SummaryCard title=" " fullView="target-drift" linkText="Go to concept drift report >" updateViewFn={updateViewFn}>
                            <DriftTrendCard model={model} type="target_drift" onClickHandle={gotoConceptDriftReport}
                                chartTitle={"Concept drift Jensen-Shannon Distance over time"} chartXLabel={"Timestamp"} chartYLabel={"Jensen-Shannon Distance"} />
                        </SummaryCard>}
                    </div>
                </div>
                <div style={{ flex: 1, padding: "0 20px 0 10px" }}>

                    <SummaryCard title={`Performance`}>
                        {summary && <ModelPerformanceSmallCard summary={summary} />}
                    </SummaryCard>

                    <SummaryCard title="Reference Dataset">
                        <div>
                            {modelConfig?.baseline_path}
                        </div>
                    </SummaryCard>
                    <SummaryCard title="Feature Logs">
                        <div>
                            {modelConfig?.logs_path}
                        </div>
                    </SummaryCard>
                    <SummaryCard title="Aggregation Window">
                        <div>
                            {modelConfig?.cycle_in_days} days
                        </div>
                    </SummaryCard>
                    <SummaryCard title="Alerts">
                        <div>
                            Not Set
                        </div>
                    </SummaryCard>
                </div>
            </div >
        </>
    );
};