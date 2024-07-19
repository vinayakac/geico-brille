import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import '../../gdk/css/geico-design-kit.css';
import './Details.css';
import ErrorBoundary from "../../components/errors/ErrorBoundary";
import AlertPanel from "../../components/panels/AlertPanel";
import DataDriftPanel from "../../components/panels/DataDriftPanel";
import CustomReportPanel from "../../components/panels/CustomReportPanel";
import ModelPerformancePanel from "../../components/panels/ModelPerformancePanel";
import ModelSchemaPanel from "../../components/panels/ModelSchemaPanel";
import TargetDriftPanel from "../../components/panels/TargetDriftPanel";
import SubPopulationPanel from '../../components/panels/SubPopulationPanel';
import FeatureImportancePanel from '../../components/panels/FeatureImportancePanel';
import { Sidebar } from '../../components/sidebar/Sidebar';
import { MonitoringLandingPanel } from '../../components/panels/MonitoringLandingPanel';
import { SummaryPanel } from '../../components/panels/SummaryPanel';
import { DataPanel } from '../../components/panels/DataPanel';
import { TrainingPanel } from '../../components/panels/TrainingPanel';
import { TestsPanel } from '../../components/panels/TestsPanel';
import { DeploymentPanel } from '../../components/panels/DeploymentPanel';
import WeeklyReportPanel from '../../components/panels/WeeklyReportPanel';

export default function Details() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const { model } = useParams();
    const [modelConfig, setModelConfig] = useState();
    const [fullConfig, setFullConfig] = useState();
    const [view, setView] = useState("summary");
    const [touringOn, setTouringOn] = useState(model == 'synthetic_car_loan');
    const [reportConfig, setReportConfig] = useState();
    const [fullReportConfig, setFullReportConfig] = useState();

    const fetchModelConfig = async () => {
        try {
            const response = await fetch('/api/models',
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            const data = await response.json();
            setFullConfig(data);
            const modelConfig = data.deployed_models.find(m => m.model_name == model);
            // Transform an array of objects into a map jobType -> jobId
            modelConfig.jobsMap = modelConfig.jobs.reduce((acc, obj) => {
                // Type of data drift job can be "data_drift" or "drift"
                if (obj.type == 'data_drift') {
                    acc['drift'] = obj.job_id;
                }
                acc[obj.type] = obj.job_id;
                return acc;
            }, {});
            setModelConfig(modelConfig);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchReportConfig = async () => {
        try {
            const response = await fetch(`/api/report_config`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            if (response.ok) {
                const data = await response.json();
                setFullReportConfig(data);
                // get report config data
                const reportConfig = data.find(d => d.model_name == model);
                setReportConfig(reportConfig);
            }
            else {
                console.error(response);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const updateView = (newView) => {
        setView(newView);
    };

    useEffect(() => {
        fetchModelConfig();
        fetchReportConfig();
        const view = queryParams.get("view") || "monitoring";
        setView(view);
    }, []);

    return (
        <>
            <aside className="side-nav">
                <Sidebar
                    model={model}
                    enabled_features={modelConfig?.monitoring_features_enabled}
                    active_view={view}
                    updateView={updateView} />
            </aside>
            <main role={"main"} id="wrapper" className='bg-color--cloudy'
                style={{ paddingTop: "3.2em", marginLeft: "240px", marginTop: "8px" }}>
                <div id="monitoring-tabs">
                    {view == "monitoring" &&
                        <ErrorBoundary>
                            <MonitoringLandingPanel
                                fullConfig={fullConfig}
                                model={model}
                                modelConfig={modelConfig}
                                jobId={modelConfig?.jobsMap?.model_performance}
                                updateViewFn={updateView}
                                />
                        </ErrorBoundary>
                    }
                    {view == "summary" && modelConfig &&
                        <SummaryPanel
                            model={model}
                            modelConfig={modelConfig}
                            updateViewFn={updateView}
                        />
                    }
                    {view == "training" && modelConfig &&
                        <TrainingPanel
                            model={model}

                            modelConfig={modelConfig}
                        />
                    }
                    {view == "data" && modelConfig &&
                        <DataPanel
                            modelConfig={modelConfig}
                        />
                    }
                    {view == "tests" && modelConfig &&
                        <TestsPanel
                            modelConfig={modelConfig}
                        />
                    }
                    {view == "deployment" && modelConfig &&
                        <DeploymentPanel
                            model={model}
                            modelConfig={modelConfig}
                            updateViewFn={updateView}
                        />
                    }
                    
                    {view == "drift" && modelConfig &&
                        <div id="data-drift-panel">
                            <ErrorBoundary>
                                <DataDriftPanel
                                    model={model}
                                    zone={modelConfig?.zone}
                                    jobId={modelConfig?.jobsMap?.drift}
                                    type={"drift"}
                                    baselinePath={modelConfig?.baseline_path}
                                    touringOn={touringOn}
                                    updateViewFn={updateView}
                                    onTourClose={() => setTouringOn(false)}
                                />
                            </ErrorBoundary>
                        </div>
                    }
                    {view == "target-drift" && modelConfig &&
                        <div id="target-drift-panel">
                            <ErrorBoundary>
                                <TargetDriftPanel
                                    model={model}
                                    zone={modelConfig?.zone}
                                    jobId={modelConfig?.jobsMap?.target_drift}
                                    type={"target_drift"}
                                    baselinePath={modelConfig?.baseline_path}
                                    updateViewFn={updateView}
                                    onTourClose={() => setTouringOn(false)}
                                />
                            </ErrorBoundary>
                        </div>
                    }
                    {view == "prediction-drift" && modelConfig &&
                        <div id="prediction-drift-panel">
                            <ErrorBoundary>
                                <TargetDriftPanel
                                    model={model}
                                    modelType={modelConfig?.model_type}
                                    zone={modelConfig?.zone}
                                    jobId={modelConfig?.jobsMap?.prediction_drift}
                                    type={"prediction_drift"}
                                    touringOn={touringOn}
                                    updateViewFn={updateView}
                                    onTourClose={() => setTouringOn(false)}
                                    baselinePath={modelConfig?.baseline_path}
                                />
                            </ErrorBoundary>
                        </div>
                    }
                    {view == "performance" && modelConfig &&
                        <div id="model-performance-panel">
                            <ErrorBoundary>
                                <ModelPerformancePanel
                                    model={model}
                                    modelType={modelConfig?.model_type}
                                    zone={modelConfig?.zone}
                                    jobId={modelConfig?.jobsMap?.model_performance}
                                    type={"model_performance"}
                                    baselinePath={modelConfig?.baseline_path}
                                />
                            </ErrorBoundary>
                        </div>
                    }
                    {view == "subpopulation" && modelConfig &&
                        <div id="subpopulation-panel">
                            <ErrorBoundary>
                                <SubPopulationPanel
                                        model={model}
                                        modelType={modelConfig?.model_type}
                                        zone={modelConfig?.zone}
                                        modelConfig={modelConfig}
                                        baselinePath={modelConfig?.baseline_path}
                                />
                            </ErrorBoundary>
                        </div>
                    }
                    {view == "config" && modelConfig &&
                        <div id="model-schema-panel">
                            <ModelSchemaPanel
                                fullConfig={fullConfig}
                                initialModelConfig={modelConfig}
                                fullReportConfig={fullReportConfig}
                                initialReportConfig={reportConfig} />
                        </div>
                    }
                    {view == "feature-importance" && modelConfig &&
                        <div id="feature-importance-panel">
                            <ErrorBoundary>
                                <FeatureImportancePanel
                                    model={model}
                                    jobId={modelConfig?.jobsMap?.feature_importance}
                                    zone={modelConfig?.zone}
                                />
                            </ErrorBoundary>
                        </div>
                    }
                    {view == "custom-reports" && modelConfig &&
                        <div id="custom-reports-panel">
                            <ErrorBoundary>
                                <CustomReportPanel
                                    model={model}
                                    customJobId={fullConfig?.jobs[0].job_id}
                                    modelConfig={modelConfig}
                                />
                            </ErrorBoundary>
                        </div>
                    }
                    {view == "alerts" &&
                        <div id="alerts">
                            <AlertPanel 
                                model={model}
                            />
                        </div>
                    }
                    {view == "weekly-reports" &&
                        <div id="weekly-reports-panel">
                            <WeeklyReportPanel
                                model={model}
                                fullReportConfig={fullReportConfig}
                                initialReportConfig={reportConfig}
                            />
                        </div>
                    }
                </div>
            </main>
            <script type="text/javascript" src="/static/js/geico-design-kit.bundle.js"></script>
            <script type="text/javascript" src="/static/js/custom.js"></script>
        </>
    );
}