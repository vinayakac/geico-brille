import { SummaryCard } from "../cards/SummaryCard";
import ModelPerformanceTrendCard from "../cards/ModelPerformanceTrendCard";

export const SummaryPanel = ({ model, modelConfig, updateViewFn }) => {
    const modelPerformanceJobId = modelConfig?.jobsMap?.model_performance;
    const modelType = modelConfig?.model_type;
    const gotoPerformanceReport = () => {
        // TODO: make clicking on graph navigate to the report for that date
    }

    const artifactsurl = `https://ml.azure.com/model/${modelConfig?.model_name}:${modelConfig?.summary?.version}/details?wsid=/subscriptions/75c06e14-b2e5-408d-b7ae-d3a8be13e898/resourceGroups/gzf-edpmle-pd1-amlinf-rgp-001/providers/Microsoft.MachineLearningServices/workspaces/gzfamlinfpd1wks001&tid=7389d8c0-3607-465c-a69f-7d4426502912#overview`;

    return (
        <>
            <h4 style={{  padding: "10px 0 0 10px", color: "turquoise"  }}>{modelConfig?.display_name}</h4>
                <div style={{ flex: 3, padding: "0 20px 0 10px" }}>

                    <div id="Model_information">
                        <SummaryCard title="Model Information">
                            <table>
                                <tr>
                                    <th style={{width:"12%"}}>Model Type:</th>
                                    <td>{modelType}</td>
                                </tr>
                                <tr>
                                    <th>Model Owner:</th>
                                    <td>{modelConfig?.created_by}</td>
                                </tr>
                                <tr>
                                    <th>Use Case:</th>
                                    <td>{modelConfig?.summary?.use_case}</td>
                                </tr>
                                <tr>
                                    <th>Description:</th>
                                    <td>{modelConfig?.summary?.description}</td>
                                </tr>
                                <tr>
                                    <th>Domain:</th>
                                    <td>{modelConfig?.summary?.domain}</td>
                                </tr>
                                <tr>
                                    <th>Version:</th>
                                    <td>{modelConfig?.summary?.version}</td>
                                </tr>
                            </table>
                        </SummaryCard>
                    </div>
                </div>

            <div style={{ flex: 1, padding: "0 20px 0 10px" }}>
                {modelPerformanceJobId &&
                    <SummaryCard title=" " fullView="performance" linkText="Go to performance report >" updateViewFn={updateViewFn}>
                        <ModelPerformanceTrendCard model={model} modelType={modelType} onClickHandle={gotoPerformanceReport} />
                    </SummaryCard>
                }
            </div>

            <div style={{ flex: 1, padding: "0 20px 0 10px" }}>
                <SummaryCard title={<a href={artifactsurl}>Artifacts</a>}>
                    {/* Content for SummaryCard goes here */}
                </SummaryCard>
            </div>
        </>
    );

};