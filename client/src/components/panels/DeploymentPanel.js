import { SummaryCard } from "../cards/SummaryCard";
import ModelUsage from "../ModelUsage";

export const DeploymentPanel = ({ model, modelConfig }) => {
    return (
        <>
            <h4 style={{ padding: "10px 0 0 10px", color: "turquoise" }}>{modelConfig?.display_name}</h4>
            <div style={{ padding: "0 20px 0 10px" }}>

                <div id="Deployment_summary">
                    <SummaryCard title="Deployment Summary">
                        <table>
                            <tr>
                                <th style={{width:"22%"}}>Endpoint:</th>
                                <td>{modelConfig?.model_name}</td>
                            </tr>
                            <tr>
                                <th>Deployment Type:</th>
                                <td>{modelConfig?.deployment?.deployment_type}</td>
                            </tr>
                            <tr>
                                <th>Inference Endpoint:</th>
                                <td>{modelConfig?.deployment?.inference_endpoint}</td>
                            </tr>
                            <tr>
                                <th>Training Endpoint:</th>
                                <td>{modelConfig?.deployment?.training_endpoint}</td>
                            </tr>
                            <tr>
                                <th>Batch Scoring Pipeline:</th>
                                <td>{modelConfig?.deployment?.batch_scoring_pipeline}</td>
                            </tr>
                        </table>
                    </SummaryCard>
                </div>
                <div style={{ padding: "0 20px 0 10px" }}>
                    <ModelUsage model={model} />
                </div>
            </div >
        </>
    );
};