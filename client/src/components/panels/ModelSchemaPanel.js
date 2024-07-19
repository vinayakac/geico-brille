import { JsonEditor as Editor } from 'jsoneditor-react18';
import React, { useEffect, useState } from 'react';
import { FiGrid, FiSave } from 'react-icons/fi';
import '../../utils/styles.css';
import '../cards/cards.css';
import { toast } from '../ToastNotification';
import Tooltip from '../../components/Tooltip.js';
import { SubPopulationDialog } from '../modelconfig/SubPopulationDialog';
import { SubPopulationsTable } from '../modelconfig/SubPopulationsTable';


export default function ModelSchemaPanel({ fullConfig, initialModelConfig, fullReportConfig, initialReportConfig }) {
    const [features, setFeatures] = useState();
    const SUPPORTED_DATASET_FORMATS = ["csv", "parquet", "delta", "json", "avro", "orc", "text"];
    const baseURL = 'https://adb-898193753977945.5.azuredatabricks.net/jobs/';
    const [expectations, setExpectations] = useState();
    const [modelConfig, setModelConfig] = useState(initialModelConfig);
    const [jobsInfo, setJobsInfo] = useState(initialModelConfig.jobs);
    const [jobs, setJobs] = useState({});
    const [subPopulationsRef, setSubPopulationsRef] = useState({})
    const [subPopulationsCur, setSubPopulationsCur] = useState({})
    const [requestFeatures, setRequestFeatures] = useState();
    const configSubPopulationsRef = modelConfig["subpopulations_reference"] || {};
    const configSubPopulationsCur = modelConfig["subpopulations_current"] || {};
    const [useRefSubPopulations, setUseRefSubPopulations] = useState(false);

    const fetchModelFeatures = async () => {
        try {
            if (initialModelConfig?.feature_names_json_path) {
                const response = await fetch(`/api/download_blob?file=${initialModelConfig.feature_names_json_path}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                        }
                    });
                const data = await response.json();
                const parsedata = JSON.parse(data);
                setFeatures(parsedata);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchDataValidationConfig = async () => {
        try {
            if (initialModelConfig?.feature_expectations_json_path) {
                const response = await fetch(`/api/download_blob?file=${initialModelConfig.feature_expectations_json_path}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                        }
                    });
                const data = await response.json();
                const parsedata = JSON.parse(data);
                setExpectations(parsedata);
            }
        } catch (error) {
            console.error(error);
        }
    }

    // TODO: only allow config to be updated if user has proper role
    const saveConfig = async (event) => {
        event.preventDefault();
        const response = await fetch(`/api/update_blob?file=${initialModelConfig.feature_names_json_path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('brille-token')}`
            },
            body: JSON.stringify(features)
        });
        if (response.ok) {
            toast('File updated successfully.')
        } else {
            toast('Error updating file.')
        }
    }

    const saveExpectations = async (event) => {
        event.preventDefault();
        const response = await fetch(`/api/update_blob?file=${initialModelConfig.feature_expectations_json_path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('brille-token')}`
            },
            body: JSON.stringify(expectations)
        });
        if (response.ok) {
            toast('File updated successfully.')
        } else {
            toast('Error updating file.')
        }
    }

    const saveModelConfig = async (e) => {
        e.preventDefault();
        const modelIndex = fullConfig["deployed_models"].findIndex(model => model.model_name == modelConfig.model_name);
        fullConfig["deployed_models"].splice(modelIndex, 1, modelConfig);

        // Update the model configuration
        const response = await fetch(`/api/update_blob?file=/config/model_configs.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('brille-token')}`
            },
            body: JSON.stringify(fullConfig)
        });
        // Update the params of existing jobs
        updateJobParams();

        // Add other jobs if needed
        updateJobs();

        if (response.ok) {
            toast('File updated successfully.')
        } else {
            toast('Error updating file.')
        }
    }
    //base parameters for job creation
    const [baseConfig, setBaseConfig] = useState({
        has_baseline: "true",
        baseline_path: '',
        baseline_format: 'csv',
        logs_path: '',
        logs_format: 'csv',
        prediction_column: '',
        has_predictions_ds: 'true',
        predictions_path: '',
        predictions_format: 'csv',
        requests_path: '',
        requests_format: 'csv',
        cycle_in_days: "30",
        score_column: ''

    });
    const updateJobs = async () => {
        const performanceJob = jobsInfo.find((job) => job.type == `${modelConfig.model_type}_performance`);

        //Updating the parameters based on model config data to create the missing jobs
        baseConfig.baseline_format = modelConfig.baseline_format;
        baseConfig.baseline_path = modelConfig.baseline_path;
        baseConfig.logs_path = modelConfig.logs_path;
        baseConfig.logs_format = modelConfig.logs_format;
        baseConfig.prediction_column = modelConfig.logs_format;
        baseConfig.predictions_format = modelConfig.predictions_format;
        baseConfig.requests_format = modelConfig.requests_format;
        baseConfig.requests_path = modelConfig.requests_path;
        baseConfig.cycle_in_days = modelConfig.cycle_in_days;
        baseConfig.score_column = modelConfig.score_column;

        if (modelConfig.target_column && !performanceJob) {
            // Create performance job

            let response = await createJob(`${modelConfig.model_type}_performance`, baseConfig);
            if (response != null) {
                const newItem = {
                    "type": `${modelConfig.model_type}_performance`,
                    "job_name": `${modelConfig.model_name}_${modelConfig.model_type}_performance`,
                    "job_id": response
                };

                modelConfig.jobs.push(newItem);
                modelConfig.monitoring_features_enabled.push(`$modelConfig.model_type}_performance`);
                modelConfig.jobsMap[`${modelConfig.model_type}_performance`] = response;

            }
        }
        const targetDriftJob = jobsInfo.find((job) => job.type == `target_drift`);
        if (modelConfig.target_column && !targetDriftJob) {
            // Create target drift job
            let response = await createJob(`target_drift`, baseConfig);
            if (response != null) {
                const newItem = {
                    "type": `target_drift`,
                    "job_name": `${modelConfig.model_name}_target_drift`,
                    "job_id": response
                };

                modelConfig.jobs.push(newItem);
                modelConfig.monitoring_features_enabled.push(`target_drift`);
                modelConfig.jobsMap[`target_drift`] = response;

            }
        }
    }

    const createJob = async (jobType, parameters) => {
        const response = await fetch(`/api/create_job?model=${modelConfig.model_name}&type=${jobType}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('brille-token')}`
            },
            body: JSON.stringify(parameters)
        });
        const data = await response.json();
        if (response.ok && data.job_id) {
            toast(`Successfully created a job ${jobType}. Job id: ${JSON.stringify(data.job_id)}`);
            return data.job_id;
        } else {
            toast(`Error creating job ${jobType} for the model: ${JSON.stringify(data)}`);
            return null;
        }
    }

    const updateJobParams = async () => {
        for (const job of jobs) {
            const named_parameters = job.settings.tasks[0].python_wheel_task.named_parameters;
            for (let model_config_param in modelConfig) {
                if (model_config_param in named_parameters) {
                    named_parameters[model_config_param] = modelConfig[model_config_param];
                }
            }

            const response = await fetch(`/api/update_job?jobId=${job.job_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                },
                body: JSON.stringify(job.settings)
            });
        }
    }

    // Handles updates to fields from the root-level and nested-level of modelConfig
    const updateConfigField = (e, section) => {
        const { name, value } = e.target;

        // TODO: validate the values
        setModelConfig(prevState => {
            if (section) {
                return {
                    ...prevState,
                    [section]: {
                        ...prevState[section],
                        [name]: value
                    }
                };
            } else {
                return {
                    ...prevState,
                    [name]: value
                };
            }
        });
    };

    const addSubPopulationRef = (feature, valueBins) => {
        setSubPopulationsRef(prev => ({
            ...prev,
            [feature]: valueBins
        }));
    }

    const addSubPopulationCur = (feature, valueBins) => {
        setSubPopulationsCur(prev => ({
            ...prev,
            [feature]: valueBins
        }));
    }

    const saveSubpopulationModelConfig = async (e) => {
        // Update the model configuration subpopulation parameter
        e.preventDefault();
        const modelIndex = fullConfig["deployed_models"].findIndex(model => model.model_name == modelConfig.model_name);
        const subRefObj = {};
        const subCurObj = {};
        // Keep only values that are true and the features that have at least one true value
        Object.keys(subPopulationsRef).map(feat => {
            const trueValues = Object.keys(subPopulationsRef[feat]).filter(val => subPopulationsRef[feat][val] === true);
            if (trueValues.length > 0) {
                subRefObj[feat] = trueValues;
            }
        });
        Object.keys(subPopulationsCur).map(feat => {
            const trueValues = Object.keys(subPopulationsCur[feat]).filter(val => subPopulationsCur[feat][val] === true);
            if (trueValues.length > 0) {
                subCurObj[feat] = trueValues;
            }
        });
        modelConfig["subpopulations_reference"] = subRefObj;
        modelConfig["subpopulations_current"] = subCurObj;

        fullConfig["deployed_models"].splice(modelIndex, 1, modelConfig);

        const response = await fetch(`/api/update_blob?file=/config/model_configs.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('brille-token')}`
            },
            body: JSON.stringify(fullConfig)
        });

        if (response.ok) {
            toast('File updated successfully.')
        } else {
            toast('Error updating file.')
        }
    }

    useEffect(() => {
        fetchModelFeatures();
        fetchDataValidationConfig();
        const fetchJobDefinitions = async () => {
            const updatedJobs = [];
            for (const job of jobsInfo) {
                const response = await fetch(`/api/get_job_run?jobId=${job.job_id}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                        }
                    });
                const data = await response.json();
                updatedJobs.push(data);
            }
            setJobs(updatedJobs);
        }

        const fetchJobStatus = async () => {
            const updatedJobs = [];
            for (const job of jobsInfo) {
                const response = await fetch(`/api/get_job_status?jobId=${job.job_id}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                        }
                    });
                const data = await response.json();
                try {
                    const updatedJob = {
                        ...job,
                        isSuccess: data.runs[0].state.result_state == "SUCCESS",
                        state: data.runs[0].state.result_state,
                        state_message: data.runs[0].state.state_message,
                        run_page_url: data.runs[0].run_page_url
                    }
                    updatedJobs.push(updatedJob);
                } catch (e) {
                    console.error("Error fetching a job:", e);
                    const updatedJob = {
                        ...job,
                        isSuccess: false,
                        state: "UNKNOWN",
                        state_message: "No runs found",
                        run_page_url: ""
                    }
                    updatedJobs.push(updatedJob);
                }
            }
            setJobsInfo(updatedJobs);
        }
        fetchJobStatus();
        fetchJobDefinitions();

    }, []);

    useEffect(() => {
        // Get request features from Feature Configuration file
        if (features && features["request_columns"]) {
            setRequestFeatures(features["request_columns"]);
        }
    }, [features]);

    useEffect(() => {
        // Modify subpopulation value format from array to object
        if (configSubPopulationsRef) {
            const subList = Object.keys(configSubPopulationsRef).reduce((a, v) => {
                a[v] = configSubPopulationsRef[v].reduce((innerA, item) => {
                    innerA[item] = true;
                    return innerA
                }, {});
                return a;
            }, {});
            setSubPopulationsRef(subList);
        }
        if (configSubPopulationsCur) {
            const subList = Object.keys(configSubPopulationsCur).reduce((a, v) => {
                a[v] = configSubPopulationsCur[v].reduce((innerA, item) => {
                    innerA[item] = true;
                    return innerA
                }, {});
                return a;
            }, {});
            setSubPopulationsCur(subList);
        }
    }, []);

    useEffect(() => {
        if (subPopulationsCur !== subPopulationsRef) {
            setUseRefSubPopulations(false);
        }
    }, [subPopulationsCur]);

    const props = {
        style: { height: "calc(100vh - 264px)" }
    };



    return (
        <>
            {/* Header section*/}
            <div id="model-config-form" className="model_input_data_display_row">
                <div className="form-field" style={{ paddingLeft: "20px" }}>
                    <label htmlFor="model_name" className="text">Model Name</label>
                    <input id="model_name" name="model_name" readOnly
                        value={modelConfig.model_name}
                        style={{ width: "100%", boxSizing: "border-box" }}
                        type="text" />
                </div>
                <div className="form-field">
                    <label htmlFor="display_name" className="text">Human-readable Model Name</label>
                    <input id="display_name" name="display_name" type="text"
                        style={{ width: "100%", boxSizing: "border-box" }}
                        readOnly
                        value={modelConfig.display_name} />
                </div>
                <div className="form-field" style={{ paddingRight: "20px" }}>
                    <label htmlFor="model_type" className="text">Model Type</label>
                    <input id="model_type" name="model_type" type="text"
                        style={{ width: "100%", boxSizing: "border-box" }}
                        readOnly
                        value={modelConfig.model_type} />
                </div>
            </div>

            {/* Summary section*/}
            <div className="summary_title">

                <div className="model_input_data_display_row" >
                    <div style={{ width: "100%", }} >

                        <div className="form-field" style={{ paddingLeft: "20px", paddingRight: "20px", width: "100%" }}>

                            <div className="summary_title">
                                <h4>Summary</h4>
                            </div>

                            <div className="form-field" >
                                <label htmlFor="use_case" className="text">Use Case</label>
                                <input id="use_case"
                                    name="use_case"
                                    onChange={(e) => updateConfigField(e, 'summary')}
                                    value={modelConfig.summary?.use_case}
                                    type="text" size="20"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="description" className="text">Description</label>
                                <textarea id="description"
                                    name="description"
                                    onChange={(e) => updateConfigField(e, 'summary')}
                                    value={modelConfig.summary?.description}
                                    style={{
                                        width: "100%",
                                        boxSizing: "border-box",
                                        height: "auto",
                                        minHeight: "calc(1em * 4)", // at least 2 lines are visible
                                        overflow: "auto",           // enables scrolling 
                                        resize: "vertical"          // allows vertical resizing
                                    }}
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="domain" className="text">Domain</label>
                                <input id="domain"
                                    name="domain"
                                    type="text"
                                    onChange={(e) => updateConfigField(e, 'summary')}
                                    value={modelConfig.summary?.domain} />
                            </div>

                            <div className="form-field">
                                <label htmlFor="version" className="text">Version</label>
                                <input id="version"
                                    name="version"
                                    type="number"
                                    onChange={(e) => updateConfigField(e, 'summary')}
                                    value={modelConfig.summary?.version} />
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: "4px" }}>
                        <a href="#" aria-label="Save summary" onClick={saveModelConfig}
                            title="Save summary" className="geico-icon geico-icon--actionable"><FiSave></FiSave></a>
                    </div>
                </div>

                {/* Training section*/}
                <div id="model-training-config-form" className="model_input_data_display_row" >
                    <div style={{ width: "100%" }} >

                        <div className="summary_title">
                            <h4>Training</h4>
                        </div>

                        <div style={{ border: 'none', padding: 0, margin: "20px", flexDirection: "column" }}>
                            <div className="form-field" >
                                <label htmlFor="code_repository" className="text">Code Repository</label>
                                <input id="code_repository"
                                    name="code_repository"
                                    onChange={(e) => updateConfigField(e, 'training')}
                                    value={modelConfig.training?.code_repository || "N/A"}
                                    style={{ width: "100%", boxSizing: "border-box" }}
                                    type="text" />
                            </div>

                            <div className="form-field">
                                <label htmlFor="training_dataset" className="text">Training Dataset</label>
                                <input id="training_dataset"
                                    name="training_dataset"
                                    onChange={(e) => updateConfigField(e, 'training')}
                                    type="text"
                                    value={modelConfig.training?.training_dataset || "N/A"} />
                            </div>

                            <div className="form-field">
                                <label htmlFor="test_dataset" className="text">Test Dataset</label>
                                <input id="test_dataset"
                                    name="test_dataset"
                                    onChange={(e) => updateConfigField(e, 'training')}
                                    type="text" style={{ width: "100%", boxSizing: "border-box" }}
                                    value={modelConfig.training?.test_dataset || "N/A"} />
                            </div>

                            <div className="form-field">
                                <label htmlFor="validation_dataset" className="text">Validation Dataset</label>
                                <input id="validation_dataset"
                                    name="validation_dataset"
                                    onChange={(e) => updateConfigField(e, 'training')}
                                    type="text" style={{ width: "100%", boxSizing: "border-box" }}
                                    value={modelConfig.training?.validation_dataset || "N/A"} />
                            </div>

                            <div className="form-field">
                                <label htmlFor="inference_dataset" className="text">Inference Dataset</label>
                                <input id="inference_dataset"
                                    name="inference_dataset"
                                    onChange={(e) => updateConfigField(e, 'training')}
                                    type="text" style={{ width: "100%", boxSizing: "border-box" }}
                                    value={modelConfig.training?.inference_dataset || "N/A"} />
                            </div>

                            <div className="form-field">
                                <label htmlFor="target_variable" className="text">Target Variable</label>
                                <input id="target_variable"
                                    name="target_variable"
                                    onChange={(e) => updateConfigField(e, 'training')}
                                    type="text" style={{ width: "100%", boxSizing: "border-box" }}
                                    value={modelConfig.training?.target_variable || "N/A"} />
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: "4px" }}>
                        <a href="#" aria-label="Save training data" onClick={saveModelConfig}
                            title="Save training data" className="geico-icon geico-icon--actionable"><FiSave></FiSave></a>
                    </div>
                </div>

                {/* Deployment section*/}
                <div id="model-deployment-config-form" className="model_input_data_display_row" >
                    <div style={{ width: "100%" }} >

                        <div className="summary_title">
                            <h4>Deployment</h4>
                        </div>
                        <div style={{ border: 'none', padding: 0, margin: "20px", flexDirection: "column" }}>

                            <div className="form-field" >
                                <label htmlFor="deployment_type" className="text">Deployment Type</label>
                                <input id="deployment_type" name="deployment_type"
                                    onChange={(e) => updateConfigField(e, 'deployment')}
                                    value={modelConfig.deployment?.deployment_type || "N/A"}
                                    style={{ width: "100%", boxSizing: "border-box" }}
                                    type="text" />
                            </div>
                            <div className="form-field" >
                                <label htmlFor="inference_endpoint" className="text">Inference Endpoint</label>
                                <input id="inference_endpoint" name="inference_endpoint" type="text"
                                    onChange={(e) => updateConfigField(e, 'deployment')}
                                    style={{ width: "100%", boxSizing: "border-box" }}
                                    value={modelConfig.deployment?.inference_endpoint || "N/A"} />
                            </div>
                            <div className="form-field" >
                                <label htmlFor="training_endpoint" className="text">Training Endpoint</label>
                                <input id="training_endpoint" name="training_endpoint" type="text"
                                    onChange={(e) => updateConfigField(e, 'deployment')}
                                    style={{ width: "100%", boxSizing: "border-box" }}
                                    value={modelConfig.deployment?.training_endpoint || "N/A"} />
                            </div>
                            <div className="form-field" >
                                <label htmlFor="batch_scoring_pipeline" className="text">Batch Scoring Pipeline</label>
                                <input id="batch_scoring_pipeline" name="batch_scoring_pipeline" type="text"
                                    onChange={(e) => updateConfigField(e, 'deployment')}
                                    style={{ width: "100%", boxSizing: "border-box" }}
                                    value={modelConfig.deployment?.batch_scoring_pipeline || "N/A"} />
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: "4px" }}>
                        <a href="#" aria-label="Save deployment data" onClick={saveModelConfig}
                            title="Save deployment data" className="geico-icon geico-icon--actionable"><FiSave></FiSave></a>
                    </div>
                </div>
            </div>

            {/* Baseline section*/}
            <div className='model_input_data_display_row'>
                <div style={{ width: "100%" }} >
                    <div className="form-field" style={{ paddingLeft: "20px", paddingRight: "20px", width: "100%" }}>
                        <label htmlFor="baseline_path" className="text">Baseline Path
                            <Tooltip text="Path has to be accessible from Databricks. Start the path with dbfs:" />
                        </label>
                        <input id="baseline_path" name="baseline_path"
                            type="text" style={{ width: "100%", boxSizing: "border-box" }}
                            value={modelConfig.baseline_path || "N/A"}
                            onChange={updateConfigField} />
                        <div className="form-field">
                            <label htmlFor="baseline_format" className="text">Baseline Format</label>
                            <div className="select-box">
                                <select id="baseline_format" name="baseline_format"
                                    value={modelConfig.baseline_format}
                                    onChange={updateConfigField}>
                                    {SUPPORTED_DATASET_FORMATS.map((format) => (
                                        <option value={format}>{format.toLocaleUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="form-field" style={{ paddingLeft: "20px", paddingRight: "20px", width: "100%" }}>
                        <label htmlFor="logs_path" className="text">Model Logs Path
                            <Tooltip>
                                Blob symbol * is supported. For logs that are broken down by day, specify folder structure
                                with &#123;YEAR&#125;, &#123;MONTH&#125;, &#123;DAY&#125; placeholders.
                            </Tooltip>
                        </label>
                        <input id="logs_path"
                            name="logs_path"
                            value={modelConfig.logs_path}
                            onChange={updateConfigField}
                            type="text" style={{ width: "100%", boxSizing: "border-box" }}
                            placeholder="Example: dbfs:/mnt/TLCInferencing/total-loss-calc-auto/mdc_eastus2/general/{YEAR}/{MONTH}/{DAY}/*.csv"
                        />
                        <div className="form-field">
                            <label htmlFor="logs_format" className="text">Logs Format</label>
                            <div className="select-box">
                                <select id="logs_format" name="logs_format"
                                    onChange={updateConfigField}
                                    value={modelConfig.logs_format}>
                                    {SUPPORTED_DATASET_FORMATS.map((format) => (
                                        <option value={format}>{format.toLocaleUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <label htmlFor="cycle_in_days" className="text">Aggregation Window</label>
                        <input id="cycle_in_days"
                            name="cycle_in_days"
                            value={modelConfig?.cycle_in_days || "N/A"}
                            onChange={updateConfigField}
                            type="number" style={{ width: "100%", boxSizing: "border-box" }}
                        />
                        <label htmlFor="predictions_path" className="text">Model Predictions Path</label>
                        <input id="predictions_path"
                            name="predictions_path"
                            value={modelConfig.predictions_path || "N/A"}
                            onChange={updateConfigField}
                            type="text" style={{ width: "100%", boxSizing: "border-box" }}
                        />
                        <div className="form-field">
                            <label htmlFor="predictions_format" className="text">Predictions Format</label>
                            <div className="select-box">
                                <select id="predictions_format" name="predictions_format"
                                    onChange={updateConfigField}
                                    value={modelConfig.predictions_format}>
                                    {SUPPORTED_DATASET_FORMATS.map((format) => (
                                        <option value={format}>{format.toLocaleUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-field">
                            <label htmlFor="prediction_column" className="text">
                                Name of column in logs for model prediction/output
                            </label>
                            <input id="prediction_column"
                                name="prediction_column"
                                onChange={updateConfigField}
                                value={modelConfig.prediction_column || "N/A"}
                                type="text" size="20" />
                        </div>
                    </div>
                </div>
                <div style={{ padding: "4px" }}>
                    <a href="#" aria-label="Save paths" onClick={saveModelConfig}
                        title="Save data paths" className="geico-icon geico-icon--actionable"><FiSave></FiSave></a>
                </div>
            </div>

            {/* Feature Configuration section */}
            <div className='model_input_data_display_row' style={{ paddingBottom: "20px" }}>
                <div style={{ flex: 1, padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                            <h4>
                                Feature Configuration
                            </h4>
                        </div>
                        <div>
                            <a href="#" aria-label="Save config" onClick={saveConfig}
                                title="Save config" className="geico-icon geico-icon--actionable"><FiSave></FiSave></a>
                        </div>
                    </div>
                    {features &&
                        <Editor value={features} onChange={setFeatures} mode="code" htmlElementProps={props} />
                    }
                </div>
                <div style={{ flex: 1, padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                            <h4>
                                Data Validation Config
                            </h4>
                        </div>
                        <div>
                            <a href="#" aria-label="Save expectations" onClick={saveExpectations}
                                title="Save expectations" className="geico-icon geico-icon--actionable"><FiSave></FiSave></a>
                        </div>
                    </div>
                    {expectations &&
                        <Editor value={expectations} onChange={setExpectations} mode="code" htmlElementProps={props} />
                    }
                </div>
            </div>

            {/* Ground Truth section*/}
            <div className='model_input_data_display_row'>
                <div style={{ width: "100%" }} >
                    <div className="form-field" style={{ paddingLeft: "20px", paddingRight: "20px", width: "100%" }}>
                        <label htmlFor="targets_path" className="text">Ground Truth Dataset Path (optional)</label>
                        <input id="targets_path" name="targets_path"
                            value={modelConfig.targets_path}
                            onChange={updateConfigField}
                            style={{ width: "100%", boxSizing: "border-box" }}
                            type="text" />

                        <div className="form-field">
                            <label htmlFor="targets_format" className="text">Ground Truth Dataset Format</label>
                            <div className="select-box">
                                <select id="targets_format" name="targets_format"
                                    onChange={updateConfigField}
                                    value={modelConfig.targets_format}>
                                    {SUPPORTED_DATASET_FORMATS.map((format) => (
                                        <option value={format}>{format.toLocaleUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <label htmlFor="requests_path" className="text">Request Data Path (optional)</label>
                        <input id="requests_path" name="requests_path"
                            value={modelConfig.requests_path}
                            onChange={updateConfigField}
                            style={{ width: "100%", boxSizing: "border-box" }}
                            type="text" />
                        <div className="form-field">
                            <label htmlFor="requests_format" className="text">Requests Dataset Format</label>
                            <div className="select-box">
                                <select id="requests_format" name="requests_format"
                                    onChange={updateConfigField}
                                    value={modelConfig.requests_format}>
                                    {SUPPORTED_DATASET_FORMATS.map((format) => (
                                        <option value={format}>{format.toLocaleUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-field">
                            <label htmlFor="requests_logs_join" className="text">Column to join requests with logs (optional)</label>
                            <input id="requests_logs_join" name="requests_logs_join" data-validate="no"
                                onChange={updateConfigField} value={modelConfig.requests_logs_join}
                                type="text" size="30" />
                        </div>
                    </div>
                    <div className="form-field" style={{ paddingLeft: "20px", paddingRight: "20px", width: "100%" }}>
                        <label htmlFor="target_column" className="text">Ground Truth Labels Column Name (optional)</label>
                        <input id="target_column" name="target_column" data-validate="no"
                            onChange={updateConfigField} value={modelConfig.target_column}
                            type="text" />
                    </div>
                    <div className="form-field" style={{ paddingLeft: "20px", paddingRight: "20px", width: "100%" }}>
                        <label htmlFor="target_id_column" className="text">Prediction ID Column Name in Ground Truth Dataset (optional)</label>
                        <input id="target_id_column" name="target_id_column" data-validate="no"
                            onChange={updateConfigField} value={modelConfig.target_id_column}
                            type="text" />
                    </div>
                    <div className="form-field" style={{ paddingLeft: "20px", paddingRight: "20px", width: "100%" }}>
                        <label htmlFor="targets_id_column" className="text">Prediction ID Column Name in Prediction Dataset (optional)</label>
                        <input id="prediction_id_column" name="prediction_id_column"
                            onChange={updateConfigField} value={modelConfig.prediction_id_column}
                            type="text" />
                    </div>
                </div>
                <div style={{ padding: "4px" }}>
                    <a href="#" aria-label="Save targets config" onClick={saveModelConfig}
                        title="Save targets config" className="geico-icon geico-icon--actionable"><FiSave></FiSave></a>
                </div>
            </div>

            {/* Subpopulation section */}
            <div className='model_input_data_display_row'>
                <div style={{ padding: "20px" }} >
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <h4>Subpopulation Analysis</h4>
                        <Tooltip text="Example of how data gets filtered based on selected features and values:
                        Filter((lossseason == 'fall' or lossseason == 'spring') and (vehiclecount == 2 or (4 <= vehiclecount <= 6)))"/>
                    </div>
                    <SubPopulationDialog modelConfig={modelConfig} onDone={addSubPopulationRef}
                        requestFeats={''} subType='Reference' />
                    <SubPopulationsTable initSubPopulations={subPopulationsRef} onUpdate={setSubPopulationsRef} />

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '-10px', marginBottom: '10px' }}>
                        <h4> Set the current subpopulation as the reference subpopulation?</h4>
                        <input type="checkbox" style={{ transform: 'scale(2)' }} checked={useRefSubPopulations} onChange={() => setUseRefSubPopulations(!useRefSubPopulations)} />
                        <Tooltip text="By checking the box the current subpopulation be set as the reference subpopulation." />
                    </div>

                    <SubPopulationDialog modelConfig={modelConfig} onDone={addSubPopulationCur}
                        requestFeats={requestFeatures} subType='Current' />
                    <SubPopulationsTable initSubPopulations={useRefSubPopulations ? subPopulationsRef : subPopulationsCur} onUpdate={setSubPopulationsCur} />
                </div>
                <div style={{ padding: "4px" }}>
                    <a href="#" aria-label="Save paths" onClick={saveSubpopulationModelConfig}
                        title="Save Subpopulations Data" className="geico-icon geico-icon--actionable"><FiSave></FiSave></a>
                </div>
            </div>

            {/* Active Jobs section*/}
            <table className="model_input_data_display_row">
                <div style={{ tableLayout: "auto", width: "100%", padding: "15px" }}>
                    <caption style={{ fontSize: '1.2em', fontWeight: 'bold' }}>Active Jobs</caption>
                    <thead><h5></h5>
                        <tr>
                            <th>Job Name</th>
                            <th>Job Details</th>
                            <th>Latest Run Details</th>
                            <th>Job Status</th>
                            <th style={{ width: "25%" }}>Error Message (for unsuccessful runs) </th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobsInfo?.map((job) => (
                            <tr key={job.jobId}>
                                <td>{job?.job_name}</td>
                                <td><a href={`${baseURL}${job.job_id}`} target="_blank" rel="noopener noreferrer">View Job Details</a></td>
                                <td>{job.run_page_url && (
                                    <a href={job.run_page_url} target="_blank" rel="noopener noreferrer">Check the run's details</a>)}
                                </td>
                                <td style={{ color: job.isSuccess ? "green" : "red" }}>{job?.state}</td>
                                <td>{job?.state_message}</td>
                            </tr>
                        ))}
                    </tbody>
                </div>
            </table>
        </>
    )
}    
