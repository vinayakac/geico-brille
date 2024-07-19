import { SummaryCard } from "../cards/SummaryCard";
import { ModelPerformanceSmallCard } from "../cards/ModelPerformanceSmallCard";
import { useEffect, useState } from "react";
export const TrainingPanel = ({ model, modelConfig }) => {
    const modelPerformanceJobId = modelConfig?.jobsMap?.model_performance;
    const zone = modelConfig?.zone;
    const [summary, setSummary] = useState();
    const [jobResultFolder, setJobResultFolder] = useState();
    const fetchLatestJob = async (jobType, jobId) => {
        try {
            const response = await fetch(`/api/get_job_run?model=${model}&type=${jobType}&jobId=${jobId}`);

            if (response.status === 200) {
                const data = await response.json();
                const jobResultFolder = `${model}/${zone}/${jobType}_metrics/${data.run_id}`;
                setJobResultFolder(jobResultFolder);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSummary = async () => {
        try {
            if (jobResultFolder) {
                const summaryFolder = `${jobResultFolder}/summary.parquet/`;
                const response = await fetch(`/api/download_table?folder=${summaryFolder}`);

                if (response.status === 200) {
                    const data = await response.json();
                    setSummary(data[0]);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

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
    return (
        <div>
            <div>
                <h4 style={{  padding: "10px 0 0 10px", color: "turquoise"  }}>{modelConfig?.display_name}</h4>
                    <div style={{ flex: 3, padding: "0 20px 0 10px" }}>
                        <div id="Training_source">
                            <SummaryCard title="Training Source">
                            <table>
                                    <tr style={{borderBottom: "10px solid transparent"}}>
                                        <th style={{width:"12%", verticalAlign: "top"}}>Code Repository:</th>
                                        <td>{modelConfig?.training?.code_repository}</td>
                                    </tr>
                                    <tr style={{borderBottom: "10px solid transparent"}}>
                                        <th style={{verticalAlign: "top"}}>Training Dataset:</th>
                                        <td>{modelConfig?.training?.training_dataset}</td>
                                    </tr>
                                    <tr style={{borderBottom: "10px solid transparent"}}>
                                        <th style={{verticalAlign: "top"}}>Test Dataset:</th>
                                        <td>{modelConfig?.training?.test_dataset}</td>
                                    </tr>
                                    <tr style={{borderBottom: "10px solid transparent"}}>
                                        <th style={{verticalAlign: "top"}}>Validation Dataset:</th>
                                        <td>{modelConfig?.training?.validation_dataset}</td>
                                    </tr>
                                    <tr style={{borderBottom: "10px solid transparent"}}>
                                        <th style={{verticalAlign: "top"}}>Inference Dataset:</th>
                                        <td>{modelConfig?.training?.inference_dataset}</td>
                                    </tr>
                                    <tr>
                                        <th>Target Variable:</th>
                                        <td>{modelConfig?.training?.target_variable}</td>
                                    </tr>

                                    </table>
                            </SummaryCard>
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, padding: "0 0 0 10px" }}>
                    <SummaryCard title={'Performance'}>
                        {summary && <ModelPerformanceSmallCard summary={summary} hidecurrent={true} />}
                    </SummaryCard>
                </div>
                <div style={{ flex: 1 }}></div>
            </div>
        </div>
    );
}