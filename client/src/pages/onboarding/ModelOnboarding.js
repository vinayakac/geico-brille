import Ajv from 'ajv';
import { JsonEditor as Editor } from 'jsoneditor-react18';
import { useEffect, useState } from 'react';
import { toast } from '../../components/ToastNotification.js';
import Tooltip from '../../components/Tooltip.js';
import '../../gdk/css/geico-design-kit.css';
import './ModelOnboarding.css';
import { TailSpin } from 'react-loader-spinner';
import DateRangeSelector from '../../components/panelbar/DateRangeSelector.js';
import { useNavigate } from 'react-router-dom';
import { SummaryCard } from '../../components/cards/SummaryCard.js';

// JSON validator
const ajv = new Ajv({ allErrors: true, verbose: true });

// Schema of the feature config json, used for validation
const featureSchema = {
    type: "object",
    properties: {
        num_feat: {
            description: "List of numeric features",
            type: "array"
        },
        cat_feat_string: {
            type: "array"
        },
        cat_feat_num: {
            type: "array"
        },
        one_hot_encoded_cat_feat: {
            type: "array"
        },
        flatten_json_columns: {
            type: "array"
        }
    },
    required: ["num_feat"],
    additionalProperties: false,
};

export default function ModelOnboarding() {
    const SUPPORTED_DATASET_FORMATS = ["csv", "parquet", "delta", "json", "avro", "orc", "text"];
    const navigate = useNavigate();

    // Component that shows the step that users is on.
    const [progressIndicator, setProgressIndicator] = useState();

    // Validator for the current step
    //const [validator, setValidator] = useState();

    // Number of step in the onboarding process
    const [activeStep, setActiveStep] = useState(1);

    // Model summary - required
    const [modelSummary, setModelSummary] = useState({
        model_name: '',
        display_name: '',
        zone: 'all',
        model_type: 'classification',
        created_by: '',
        summary: {
            use_case: '',
            description: '',
            domain: '',
            version: '',
        },
        training: {
            code_reposity: '',
            training_dataset: '',
            test_dataset: '',
            validation_dataset: '',
            inference_dataset: '',
            target_variable: '',
        },
        deployment: {
            deployment_type: '',
            inference_endpoint: '',
            training_endpoint: '',
            batch_scoring_pipeline: '',
        }
    });

    // JSON with lists of features for each category - required
    const [featureConfig, setFeatureConfig] = useState({
        num_feat: [],
        cat_feat_string: [],
        cat_feat_num: [],
        one_hot_encoded_cat_feat: [],
        flatten_json_columns: []
    });

    const [expectations, setExpectations] = useState({
        "expectation_suite_name": "default",
        "expectations": []
    });

    // Configuration for logs and baseline ingestion - required
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

    // Configuration for ground truth ingestion - optional
    const [targetsConfig, setTargetsConfig] = useState({
        targets_path: '',
        targets_format: 'csv',
        target_column: '',
        targets_id_column: '',
        prediction_id_column: '',
        recommendations_column: ''
    });

    // Global config for all models
    const [modelsConfig, setModelsConfig] = useState({});

    // Configuration for logs and baseline ingestion - required
    const [baseReportConfig, setBaseReportConfig] = useState({
        report_enabled: "True",
        alert_action: "email",
        report_recipients: ["yuchen2@geico.com"],
        top_n: "5",
        compared_to_baseline: "True",
        cycle_in_days: "7",
        comparison_period_length: "7",
        reference_period_delta: "30",
    });
    const [email, setEmail] = useState('');

    // Global report config for all models
    const [reportsConfig, setReportsConfig] = useState([]);

    const [statusUpdates, setStatusUpdates] = useState([]);

    const steps = [
        {
            label: "Model Information",
            steps: 1,
            active: 1
        },
        {
            label: "Features",
            steps: 1
        },
        {
            label: "Data Ingestion",
            steps: 2
        },
        {
            label: "Weekly Report",
            steps: 1
        },
        {
            label: "Review",
            steps: 1
        }
    ];

    // Initialized GDK components
    useEffect(() => {
        const progressIndicator = new GDK.ProgressIndicator({
            content: "#progressIndicator",
            data: steps
        });
        setProgressIndicator(progressIndicator);
    }, []);

    // Get global models and reports configuration file --
    // to be updated once model is onboarded
    useEffect(() => {
        fetchModelsConfig();
        fetchReportsConfig();
    }, []);

    const setPrevLogStartDate = (startDate) => {
        baseConfig.prv_log_start_date = startDate;
    }

    const setPrevLogEndDate = (endDate) => {
        baseConfig.prv_log_end_date = endDate;
    }

    // Update state of objects with input from form
    const handleFormInput = (setterMethod) => {
        return (e) => {
            const { name, value } = e.target;
            setterMethod(prevState => ({
                ...prevState,
                [name]: value
            }));
        }
    };
    const handleSummaryFormInput = (setterMethod) => {
        return (e) => {
            const { name, value } = e.target;
            setterMethod(prevState => ({
                ...prevState,
                summary: { ...prevState['summary'], [name]: value }

            }));
        }
    };
    const handleTrainingFormInput = (setterMethod) => {
        return (e) => {
            const { name, value } = e.target;
            setterMethod(prevState => ({
                ...prevState,
                training: { ...prevState['training'], [name]: value }

            }));
        }
    };
    const handleDeploymentFormInput = (setterMethod) => {
        return (e) => {
            const { name, value } = e.target;
            setterMethod(prevState => ({
                ...prevState,
                deployment: { ...prevState['deployment'], [name]: value }

            }));
        }
    };

    // Initiates progress to the next step of onboarding
    const moveForward = () => {
        const gdkValidateForm = new GDK.ValidateForm({
            content: "#model-onboarding-form"
        });
        let validator = gdkValidateForm._validators[0];
        validator._validateForm();
        if (validator.errors.length == 0) {
            setActiveStep(prev => prev + 1);
            progressIndicator.moveForward();
        }
    };

    const moveBackward = () => {
        setActiveStep(prev => prev - 1);
        progressIndicator.moveBackward();
    };

    // Saves the features entered by user into a file in a dedicated folder.
    const createFeatureConfig = async () => {
        const response = await fetch(`/api/update_blob?file=${modelSummary.model_name}/config/features.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('brille-token')}`
            },
            body: JSON.stringify(featureConfig)
        });
        const validationConfigResponse = await fetch(`/api/update_blob?file=${modelSummary.model_name}/config/expectations.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('brille-token')}`
            },
            body: JSON.stringify(expectations)
        });
        if (response.ok) {
            setStatusUpdates(prev =>
                [...prev, { status: 'success', text: 'Created model feature configuration.' }]);
            return true;
        } else {
            const error = await response.json();
            setStatusUpdates(prev =>
                [...prev, { status: 'fail', text: 'Failed to create a model feature config: ' + JSON.stringify(error) }]);
            return false;
        }
    };

    const fetchModelsConfig = async () => {
        try {
            if (featureConfig) {
                const response = await fetch(`/api/download_blob?file=config/model_configs.json`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                        }
                    });
                const data = await response.json();
                setModelsConfig(JSON.parse(data));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const updateModelsConfig = async (modelSummary, featureSchemaPath, validationConfigPath, jobs) => {
        const onboardingModelConfig = {
            created_by: modelSummary.created_by,
            // created_at: new Date().toISOString(),
            display_name: modelSummary.display_name,
            zone: modelSummary.zone,
            model_name: modelSummary.model_name,
            model_type: modelSummary.model_type,
            monitoring_enabled: true,
            monitoring_features_enabled: jobs.map(job => job.type),
            feature_names_json_path: featureSchemaPath,
            feature_expectations_json_path: validationConfigPath,
            baseline_path: baseConfig.baseline_path,
            baseline_format: baseConfig.baseline_format,
            logs_path: baseConfig.logs_path,
            logs_format: baseConfig.logs_format,
            predictions_path: baseConfig.predictions_path,
            predictions_format: baseConfig.predictions_format,
            requests_path: baseConfig.requests_path,
            requests_format: baseConfig.requests_format,
            requests_logs_join: baseConfig.requests_logs_join,
            targets_path: targetsConfig?.targets_path,
            targets_format: targetsConfig?.targets_format,
            prediction_column: baseConfig.prediction_column,
            target_column: targetsConfig.target_column,
            target_id_column: targetsConfig.targets_id_column,
            prediction_id_column: targetsConfig.prediction_id_column,
            recommendations_column: targetsConfig.recommendations_column,
            cycle_in_days: baseConfig.cycle_in_days,
            jobs: jobs,
            summary: modelSummary.summary,
            training: modelSummary.training,
            deployment: modelSummary.deployment,

        };
        const deployedModels = modelsConfig['deployed_models']
        modelsConfig['deployed_models'] = [...deployedModels, onboardingModelConfig];
        const response = await fetch(`/api/update_blob?file=config/model_configs.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('brille-token')}`
            },
            body: JSON.stringify(modelsConfig, null, 2)
        });
        if (response.ok) {
            setStatusUpdates(prev =>
                [...prev, { status: 'success', text: 'Model is added to monitoring system. Onboarding finalized.' }]);
            return true;
        } else {
            const error = await response.json();
            setStatusUpdates(prev =>
                [...prev, { status: 'fail', text: 'Failed to add model to monitoring config: ' + JSON.stringify(error) }]);
            return false;
        }
    }

    // Creates a Databricks job
    const createJob = async (type, parameters) => {
        const response = await fetch(`/api/create_job?model=${modelSummary.model_name}&type=${type}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('brille-token')}`
            },
            body: JSON.stringify(parameters)
        });
        const data = await response.json();
        if (response.ok && data.job_id) {
            setStatusUpdates(prev =>
                [...prev, { status: 'success', text: `Successfully created a job ${type}. Job id: ${JSON.stringify(data.job_id)}` }]);
            return data.job_id;
        } else {
            setStatusUpdates(prev =>
                [...prev, { status: 'fail', text: `Error creating job ${type} for the model: ${JSON.stringify(data)}` }]);
            return null;
        }
    }

    const runJob = async (type, jobId) => {
        const currentDate = new Date();
        const endDateStr = currentDate.toISOString().slice(0, 10);
        currentDate.setMonth(currentDate.getMonth() - 1);
        const startDateStr = currentDate.toISOString().slice(0, 10);
        setStatusUpdates(prev =>
            [...prev, { id: jobId, status: 'pending', text: `Running job: ${type} (hang tight, this can take a couple of minutes)` }]);
        const response = await fetch(`/api/run_job?model=${modelSummary.model_name}&type=${type}&jobId=${jobId}&start_date=${startDateStr}&end_date=${endDateStr}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                }
            });

        // Remove the pending status update
        setStatusUpdates(prev => prev.filter(item => item.id != jobId));

        const data = await response.json();
        if (response.ok && data.job_id) {
            setStatusUpdates(prev =>
                [...prev, { status: 'success', text: `Job run is successful: ${type}` }]);
            return data;
        } else {
            setStatusUpdates(prev =>
                [...prev, { status: 'fail', text: `Error running job ${type} for the model: ${JSON.stringify(data)}` }]);
            return null;
        }
    }

    const fetchReportsConfig = async () => {
        try {
            const response = await fetch(`/api/download_blob?file=config/report_configs.json`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            const data = await response.json();
            setReportsConfig(JSON.parse(data));
        } catch (error) {
            console.error(error);
        }
    };

    const updateReportsConfig = async (modelSummary, featureSchemaPath, baseReportConfig, jobs) => {
        const onboardingReportConfig = {
            model_name: modelSummary.model_name,
            report_enabled: baseReportConfig.report_enabled,
            alert_action: baseReportConfig.alert_action,
            report_recipients: baseReportConfig.report_recipients,
            enabled_job_types: jobs.map(job => job.type),
            top_n: baseReportConfig.top_n,
            compared_to_baseline: baseReportConfig.compared_to_baseline,
            baseline_path: baseConfig.baseline_path,
            summary_data_path: `/dbfs/mnt/MonitoringPOC/${modelSummary.model_name}`,
            summary_data_file: "results.csv",
            cycle_in_days: baseReportConfig.cycle_in_days,
            comparison_period_length: baseReportConfig.comparison_period_length,
            reference_period_delta: baseReportConfig.reference_period_delta,
            model_type: modelSummary.model_type,
            logs_path: baseConfig.logs_path,
            logs_format: baseConfig.logs_format,
            feature_names_json_path: featureSchemaPath,
            predictions_path: baseConfig.predictions_path,
            predictions_format: baseConfig.predictions_format,
            prediction_column: baseConfig.prediction_column,
            targets_path: targetsConfig?.targets_path,
            targets_format: targetsConfig?.targets_format,
            target_column: targetsConfig?.target_column,
            target_id_column: targetsConfig?.targets_id_column,
            prediction_id_column: targetsConfig?.prediction_id_column,
            summary: modelSummary.summary,
            training: modelSummary.training,
            deployment: modelSummary.deployment,
        };
        const updatedReportsConfig = [...reportsConfig, onboardingReportConfig];
        const response = await fetch(`/api/update_blob?file=config/report_configs.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('brille-token')}`
            },
            body: JSON.stringify(updatedReportsConfig, null, 2)
        });
        console.log("Updated report config:", JSON.stringify(updatedReportsConfig, null, 2));
        if (response.ok) {
            setStatusUpdates(prev =>
                [...prev, { status: 'success', text: 'Weekly report config of onboarding model is added to monitoring system.' }]);
            return true;
        } else {
            const error = await response.json();
            setStatusUpdates(prev =>
                [...prev, { status: 'fail', text: 'Failed to add model to weekly report config: ' + JSON.stringify(error) }]);
            return false;
        }
    }

    const changeEmail = (e) => {
        setEmail(e.target.value);
    }

    const addEmail = () => {
        setBaseReportConfig(prevState => ({
            ...prevState,
            ["report_recipients"]: [...prevState?.report_recipients, email]
        }));
        setEmail('');
    }

    const deleteEmail = (e) => {
        setBaseReportConfig(prevState => ({
            ...prevState,
            ["report_recipients"]: prevState?.report_recipients.filter(d => d != e)
        }));
    }

    // Creates all jobs and config files on submit
    const submit = async () => {
        const featureConfigCreated = await createFeatureConfig();

        if (!featureConfigCreated) {
            return;
        }
        const jobs = [];
        const featureConfigPath = `${modelSummary.model_name}/config/features.json`;
        const validationConfigPath = `${modelSummary.model_name}/config/expectations.json`;

        let jobsBaseConfig = {
            ...baseConfig,
            zone: modelSummary.zone,
            feature_names_json_path: featureConfigPath,
            feature_expectations_json_path: validationConfigPath
        }

        // Create a data drift job for the given model in Databricks
        const dataDriftJobId = await createJob("drift", jobsBaseConfig);
        // Run the job to make sure it runs correctly
        const dataDriftRunResult = await runJob("drift", dataDriftJobId);
        if (dataDriftJobId) {
            jobs.push({ type: "drift", job_name: `${modelSummary.model_name}_data_drift_job`, job_id: dataDriftJobId });
        }

        if (targetsConfig.target_column) {
            if (modelSummary.model_type == 'classification') {
                const modelPerfJobId = await createJob("model_performance", { ...jobsBaseConfig, ...targetsConfig });
                const modelPerfRunResult = await runJob("model_performance", modelPerfJobId);
                if (modelPerfJobId) {
                    jobs.push({
                        type: "model_performance",
                        job_name: `${modelSummary.model_name}_model_performance_job`,
                        job_id: modelPerfJobId
                    });
                }
            } else if (modelSummary.model_type == 'regression') {
                const modelPerfJobId = await createJob("model_performance", { ...jobsBaseConfig, ...targetsConfig });
                const modelPerfRunResult = await runJob("model_performance", modelPerfJobId);
                if (modelPerfJobId) {
                    jobs.push({
                        type: "model_performance",
                        job_name: `${modelSummary.model_name}_model_performance_job`,
                        job_id: modelPerfJobId
                    });
                }

            }

            const targetJobId = await createJob("target_drift", { ...jobsBaseConfig, ...targetsConfig });
            const targetRunResult = await runJob("target_drift", targetJobId);
            if (targetJobId) {
                jobs.push({
                    type: "target_drift",
                    job_name: `${modelSummary.model_name}_target_drift_job`,
                    job_id: targetJobId
                });
            }
        }

        if (baseConfig.prediction_column) {
            const predictionDriftJobId = await createJob("prediction_drift", jobsBaseConfig);
            const predictionDriftJobResult = await runJob("prediction_drift", predictionDriftJobId);
            if (predictionDriftJobId) {
                jobs.push({
                    type: "prediction_drift",
                    job_name: `${modelSummary.model_name}_prediction_drift_job`,
                    job_id: predictionDriftJobId
                });
            }
        }

        updateReportsConfig(
            modelSummary,
            featureConfigPath,
            baseReportConfig,
            jobs
        )

        updateModelsConfig(modelSummary,
            `${modelSummary.model_name}/config/features.json`,
            `${modelSummary.model_name}/config/expectations.json`,
            jobs
        );

        navigate(`/details/${modelSummary.model_name}`, { replace: true });
    };

    const props = {
        style: { height: "calc(100vh - 320px)" }
    };

    return (
        <>
            <div className="page-header--wrapper" style={{ "marginTop": "3em" }}>

            </div>
            <main id="wrapper" className='bg-color--cloudy' style={{ paddingTop: 0 }}>
                <div className="progress-indicator-wrapper">
                    <div className="container">
                        <div className="row">
                            <div className="col-sm-12">
                                <div id="progressIndicator"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="model-onboarding-form" className="form onboarding-form">
                    {activeStep == 1 &&
                        <>
                            <SummaryCard title="">
                                <div className="form-field">
                                    <label htmlFor="model_name" className="text">Model Name
                                        <Tooltip text="Set model name to match Azure ML" />
                                    </label>
                                    <input id="model_name" name="model_name" onChange={handleFormInput(setModelSummary)}
                                        value={modelSummary.model_name}
                                        type="text" size="30" placeholder="Example: total-loss-calc-auto" data-validate="required" />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="display_name" className="text">Human-readable Model Name</label>
                                    <input id="display_name" name="display_name" type="text" size="50" data-validate="required"
                                        value={modelSummary.display_name}
                                        onChange={handleFormInput(setModelSummary)}
                                        placeholder="Example: Total Loss Calculator for automobiles" />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="model_type" className="text">Model Type</label>
                                    <div className="select-box">
                                        <select id="model_type" name="model_type" onChange={handleFormInput(setModelSummary)}
                                            value={modelSummary.model_type}
                                            data-validate="required">
                                            <option value="classification">Classification</option>
                                            <option value="regression">Regression</option>
                                            <option value="recommendation">Recommendation</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-field">
                                    <label htmlFor="created_by" className="text">Model Owner</label>
                                    <input id="created_by" name="created_by" type="text" size="50" data-validate="required"
                                        value={modelSummary.created_by}
                                        onChange={handleFormInput(setModelSummary)}
                                        placeholder="Example: RAD" />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="zone" className="text">Zone
                                        <Tooltip text="Zone name in logs path. For example, zone for TLC model is 'mdc_eastus2' and logs path is 'dbfs:/mnt/TLCInferencing/total-loss-calc-auto/mdc_eastus2/general/2022/11/25/FeatureBaseValue.csv'. If model doesn't have zone, use all" />
                                    </label>
                                    <input id="zone" name="zone" onChange={handleFormInput(setModelSummary)}
                                        value={modelSummary.zone}
                                        type="text" size="20" placeholder="Example: all"
                                        data-validate="required" />
                                </div>
                            </SummaryCard>
                            <SummaryCard title=" Summary " >
                                <div className="form-field">
                                    <label htmlFor="use_case" className="text">Use Case

                                    </label>
                                    <input id="use_case" name="use_case" onChange={handleSummaryFormInput(setModelSummary)}
                                        value={modelSummary.summary.use_case}
                                        type="text" size="30" data-validate="no" />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="description" className="text">Description

                                    </label>
                                    <input id="description" name="description" onChange={handleSummaryFormInput(setModelSummary)}
                                        value={modelSummary.summary.description}
                                        type="text" size="30"  data-validate="no" />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="domain" className="text">Domain

                                    </label>
                                    <input id="domain" name="domain" onChange={handleSummaryFormInput(setModelSummary)}
                                        value={modelSummary.summary.domain}
                                        type="text" size="30"  data-validate="no" />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="version" className="text">Version

                                    </label>
                                    <input id="version" name="version" onChange={handleSummaryFormInput(setModelSummary)}
                                        value={modelSummary.summary.version}
                                        type="number" step="1"  data-validate="no" />
                                </div>
                            </SummaryCard>
                            <SummaryCard title=" Training " >
                                <div className="form-field">
                                    <label htmlFor="code_reposity" className="text">Code Reposity

                                    </label>
                                    <input id="code_reposity" name="code_reposity" onChange={handleTrainingFormInput(setModelSummary)}
                                        value={modelSummary.training.code_reposity}
                                        type="text" size="30"  data-validate="no" />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="training_dataset" className="text">Training Dataset:

                                    </label>
                                    <input id="training_dataset" name="training_dataset" onChange={handleTrainingFormInput(setModelSummary)}
                                        value={modelSummary.training.training_dataset}
                                        type="text" size="30"  data-validate="no" />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="test_dataset" className="text">Test Dataset

                                    </label>
                                    <input id="test_dataset" name="test_dataset" onChange={handleTrainingFormInput(setModelSummary)}
                                        value={modelSummary.training.test_dataset}
                                        type="text" size="30"  data-validate="no" />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="validation_dataset" className="text">Validation Dataset

                                    </label>
                                    <input id="validation_dataset" name="validation_dataset" onChange={handleTrainingFormInput(setModelSummary)}
                                        value={modelSummary.training.validation_dataset}
                                        type="text" size="30"  data-validate="no" />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="inference_dataset" className="text">Inference Dataset

                                    </label>
                                    <input id="inference_dataset" name="inference_dataset" onChange={handleTrainingFormInput(setModelSummary)}
                                        value={modelSummary.training.inference_dataset}
                                        type="text" size="30"  data-validate="no" />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="target_variable" className="text">Target Variable

                                    </label>
                                    <input id="target_variable" name="target_variable" onChange={handleTrainingFormInput(setModelSummary)}
                                        value={modelSummary.training.target_variable}
                                        type="text" size="30"  data-validate="no" />
                                </div>
                            </SummaryCard>
                            <SummaryCard title=" Deployment " >
                                <div className="form-field">
                                    <label htmlFor="deployment_type" className="text">Deployment Type

                                    </label>
                                    <input id="deployment_type" name="deployment_type" onChange={handleDeploymentFormInput(setModelSummary)}
                                        value={modelSummary.deployment.deployment_type}
                                        type="text" size="30"  data-validate="no" />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="inference_endpoint" className="text">Inference Endpoint

                                    </label>
                                    <input id="inference_endpoint" name="inference_endpoint" onChange={handleDeploymentFormInput(setModelSummary)}
                                        value={modelSummary.deployment.inference_endpoint}
                                        type="text" size="30"  data-validate="no" />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="training_endpoint" className="text">Training Endpoint

                                    </label>
                                    <input id="training_endpoint" name="training_endpoint" onChange={handleDeploymentFormInput(setModelSummary)}
                                        value={modelSummary.deployment.training_endpoint}
                                        type="text" size="30"  data-validate="no" />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="batch_scoring_pipeline" className="text">Batch Scoring Pipeline

                                    </label>
                                    <input id="batch_scoring_pipeline" name="batch_scoring_pipeline" onChange={handleDeploymentFormInput(setModelSummary)}
                                        value={modelSummary.deployment.batch_scoring_pipeline}
                                        type="text" size="30"  data-validate="no" />
                                </div>
                            </SummaryCard>
                        </>
                    }
                    {activeStep == 2 &&
                        <div>
                            <div>
                                <label htmlFor="num_feat" className="text">Feature Configuration
                                    <Tooltip text="Enter names of your features in the JSON below. If features are logged after being one-hot encoded, specify them in the one_hot_encoded_cat_feat." />
                                </label>
                                <Editor value={featureConfig}
                                    onChange={setFeatureConfig}
                                    ajv={ajv}
                                    schema={featureSchema}
                                    mode="code"
                                    htmlElementProps={props} />
                            </div>
                        </div>
                    }
                    {activeStep == 3 &&
                        <div>
                            <div className="form-field">
                                <label htmlFor="logs_path" className="text">Model Logs Path
                                    <Tooltip>
                                        Blob symbol * is supported. For logs that are broken down by day, specify folder structure
                                        with &#123;YEAR&#125;, &#123;MONTH&#125;, &#123;DAY&#125; placeholders.
                                    </Tooltip>
                                </label>
                                <input id="logs_path"
                                    name="logs_path"
                                    onChange={handleFormInput(setBaseConfig)}
                                    value={baseConfig.logs_path}
                                    type="text" size="100"
                                    placeholder="Example: dbfs:/mnt/TLCInferencing/total-loss-calc-auto/mdc_eastus2/general/{YEAR}/{MONTH}/{DAY}/*.csv"
                                    data-validate="required" />
                            </div>
                            <div className="form-field">
                                <label htmlFor="logs_format" className="text">Logs Format</label>
                                <div className="select-box">
                                    <select id="logs_format" name="logs_format"
                                        onChange={handleFormInput(setBaseConfig)}
                                        value={baseConfig.logs_format}
                                        data-validate="required">
                                        {SUPPORTED_DATASET_FORMATS.map((format) => (
                                            <option value={format}>{format.toLocaleUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                                <label htmlFor="cycle_in_days" className="text">Aggregation Window for Logs</label>
                                <input id="cycle_in_days"
                                    name="cycle_in_days"
                                    value={baseConfig?.cycle_in_days}
                                    onChange={handleFormInput(setBaseConfig)}
                                    type="text"
                                    size="100"
                                />
                            </div>

                            <div className="form-field checkbox-group" role="radiogroup">
                                <div className="checkbox-wrapper col-1">
                                    <div>
                                        <input id="has_baseline" type="checkbox"
                                            className="checkbox"
                                            name="has_baseline"
                                            checked={baseConfig.has_baseline == 'true'}
                                            onChange={handleFormInput(setBaseConfig)}
                                            style={{ display: "none" }}
                                            value={baseConfig.has_baseline != 'true'} />
                                        <label htmlFor="has_baseline" className="checkbox">Has Baseline</label>
                                    </div>
                                </div>
                            </div>
                            {(baseConfig.has_baseline == "true") &&
                                <>
                                    <div className="form-field">
                                        <label htmlFor="baseline_path" className="text">Baseline Path
                                            <Tooltip text="Path has to be accessible from Databricks. Start the path with dbfs:" />
                                        </label>
                                        <input id="baseline_path" name="baseline_path"
                                            onChange={handleFormInput(setBaseConfig)} value={baseConfig.baseline_path}
                                            type="text" size="100" placeholder="Example: dbfs:/mnt/MonitoringPOC/baseline_data_v2.csv"
                                            data-validate="required" />
                                    </div>
                                    <div className="form-field">
                                        <label htmlFor="baseline_format" className="text">Baseline Format</label>
                                        <div className="select-box">
                                            <select id="baseline_format" name="baseline_format"
                                                onChange={handleFormInput(setBaseConfig)}
                                                data-validate="required"
                                                value={baseConfig.baseline_format}>
                                                {SUPPORTED_DATASET_FORMATS.map((format) => (
                                                    <option value={format}>{format.toLocaleUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            }
                            {(baseConfig.has_baseline == "false") &&
                                <>
                                    <div className="form-field">
                                        <label className="text" htmlFor="workaround">Earlier Logs Period for Comparison</label>
                                        <input id="workaround" name="workaround" defaultValue="this_is_workaround"
                                            data-validate="required" style={{ display: "none" }} />
                                        <DateRangeSelector
                                            onStartUpdate={setPrevLogStartDate}
                                            onEndUpdate={setPrevLogEndDate}
                                        />
                                    </div>
                                </>
                            }

                            <div className="form-field checkbox-group" role="radiogroup">
                                <div className="checkbox-wrapper col-1">
                                    <div>
                                        <input id="has_predictions_ds" type="checkbox"
                                            className="checkbox"
                                            name="has_predictions_ds"
                                            checked={baseConfig.has_predictions_ds == 'true'}
                                            onChange={handleFormInput(setBaseConfig)}
                                            style={{ display: "none" }}
                                            value={baseConfig.has_predictions_ds != 'true'} />
                                        <label htmlFor="has_predictions_ds" className="checkbox">Separate Predictions</label>
                                    </div>
                                </div>
                            </div>
                            {(baseConfig.has_predictions_ds == "true") &&
                                <>
                                    <div className="form-field">
                                        <label htmlFor="predictions_path" className="text">Predictions Path
                                            <Tooltip text="Path has to be accessible from Databricks. Start the path with dbfs:" />
                                        </label>
                                        <input id="predictions_path" name="predictions_path"
                                            onChange={handleFormInput(setBaseConfig)} value={baseConfig.predictions_path}
                                            type="text" size="100"
                                            placeholder="Example: dbfs:/mnt/TLCInferencing/total-loss-calc-auto/mdc_eastus2/general/{DATE:%Y/%m/%d}/predictions.parquet"
                                            data-validate="required" />
                                    </div>
                                    <div className="form-field">
                                        <label htmlFor="predictions_format" className="text">Predictions Format</label>
                                        <div className="select-box">
                                            <select id="predictions_format" name="predictions_format"
                                                onChange={handleFormInput(setBaseConfig)}
                                                data-validate="required"
                                                value={baseConfig.predictions_format}>
                                                {SUPPORTED_DATASET_FORMATS.map((format) => (
                                                    <option value={format}>{format.toLocaleUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            }
                            <div className="form-field">
                                <label htmlFor="prediction_column" className="text">Name of column for model prediction/output</label>
                                <input id="prediction_column"
                                    name="prediction_column"
                                    onChange={handleFormInput(setBaseConfig)}
                                    value={baseConfig.prediction_column}
                                    type="text" size="20"
                                    placeholder="raw_score"
                                    data-validate="required" />
                            </div>
                            <div className="form-field">
                                <label htmlFor="score_column" className="text">Name of column for score</label>
                                <input id="score_column"
                                    name="score_column"
                                    onChange={handleFormInput(setBaseConfig)}
                                    value={baseConfig.score_column}
                                    type="text" size="20"
                                    placeholder=""
                                    data-validate="required" 
                                />
                            </div>
                        </div>
                    }
                    {activeStep == 4 &&
                        <div>
                            <div className="form-field">
                                <label htmlFor="targets_path" className="text">Ground Truth Dataset Path (optional)</label>
                                <input id="targets_path" name="targets_path"
                                    onChange={handleFormInput(setTargetsConfig)} value={targetsConfig.targets_path}
                                    type="text" size="100" data-validate="no"
                                    placeholder="Example: dbfs:/mnt/MonitoringPOC/total-loss-calc-auto/predictions/tlc_logs_predictions" />
                            </div>
                            <div className="form-field">
                                <label htmlFor="targets_format" className="text">Ground Truth Dataset Format</label>
                                <div className="select-box">
                                    <select id="targets_format" name="targets_format"
                                        onChange={handleFormInput(setTargetsConfig)}
                                        data-validate="no"
                                        value={targetsConfig.targets_format}>
                                        {SUPPORTED_DATASET_FORMATS.map((format) => (
                                            <option value={format}>{format.toLocaleUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-field">
                                <label htmlFor="target_column" className="text">Ground Truth Labels Column Name (optional)</label>
                                <input id="target_column" name="target_column" data-validate="no"
                                    onChange={handleFormInput(setTargetsConfig)} value={targetsConfig.target_column}
                                    type="text" size="30" placeholder="Example: target" />
                            </div>
                            <div className="form-field">
                                <label htmlFor="targets_id_column" className="text">Prediction ID Column Name in Ground Truth Dataset (optional)</label>
                                <input id="targets_id_column" name="targets_id_column" data-validate="no"
                                    onChange={handleFormInput(setTargetsConfig)} value={targetsConfig.targets_id_column}
                                    type="text" size="30" placeholder="Example: $aml_dc_scoring_timestamp" />
                            </div>
                            <div className="form-field">
                                <label htmlFor="targets_id_column" className="text">Prediction ID Column Name in Prediction Dataset (optional)</label>
                                <input id="prediction_id_column" name="prediction_id_column" data-validate="no"
                                    onChange={handleFormInput(setTargetsConfig)} value={targetsConfig.prediction_id_column}
                                    type="text" size="30" placeholder="Example: $aml_dc_scoring_timestamp" />
                            </div>
                            {
                                modelSummary.model_type == "recommendation" &&
                                <>
                                    <div className="form-field">
                                        <label htmlFor="recommendations_column" className="text">Recommendations Column</label>
                                        <input id="recommendations_column" name="recommendations_column" data-validate="no"
                                            onChange={handleFormInput(setTargetsConfig)} value={targetsConfig.recommendations_column}
                                            type="text" size="30" placeholder="Example: policy" />
                                    </div>
                                </>
                            }
                            <div className="form-field">
                                <label htmlFor="requests_path" className="text">Request Dataset Path (optional)</label>
                                <input id="requests_path" name="requests_path"
                                    onChange={handleFormInput(setBaseConfig)} value={baseConfig.requests_path}
                                    type="text" size="100" data-validate="no"
                                    placeholder="Example: dbfs:/mnt/ModelInferencing/inputs.csv" />
                            </div>
                            <div className="form-field">
                                <label htmlFor="requests_format" className="text">Request Truth Dataset Format</label>
                                <div className="select-box">
                                    <select id="requests_format" name="requests_format"
                                        onChange={handleFormInput(setBaseConfig)}
                                        data-validate="no"
                                        value={baseConfig.requests_path}>
                                        {SUPPORTED_DATASET_FORMATS.map((format) => (
                                            <option value={format}>{format.toLocaleUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-field">
                                <label htmlFor="requests_logs_join" className="text">Column to join requests with logs (optional)</label>
                                <input id="requests_logs_join" name="requests_logs_join" data-validate="no"
                                    onChange={handleFormInput(setBaseConfig)} value={baseConfig.requests_logs_join}
                                    type="text" size="30" placeholder="Example: $aml_dc_scoring_timestamp" />
                            </div>
                        </div>
                    }
                    {activeStep == 5 &&
                        <div>
                            <div className="form-field">
                                <label htmlFor="report_enabled" className="text">Is Weekly Report Enabled</label>
                                <div className="select-box">
                                    <select id="report_enabled" name="report_enabled"
                                        value={baseReportConfig.report_enabled}
                                        onChange={handleFormInput(setBaseReportConfig)}
                                        data-validate="required">
                                        <option value={"True"}>True</option>
                                        <option value={"False"}>False</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-field">
                                <label htmlFor="alert_action" className="text">Alert Action</label>
                                <input id="alert_action" name="alert_action" readOnly
                                    value={baseReportConfig.alert_action}
                                    data-validate="required"
                                    style={{ width: "100%", boxSizing: "border-box" }}
                                    type="text" />
                            </div>
                            <div className="form-field">
                                <label htmlFor="top_n" className="text">Top Drifted Features Number</label>
                                <input id="top_n" name="top_n"
                                    value={baseReportConfig.top_n}
                                    onChange={handleFormInput(setBaseReportConfig)}
                                    data-validate="required"
                                    type="text" />
                            </div>
                            <div className="form-field">
                                <label htmlFor="compared_to_baseline" className="text">Compared to Baseline Dataset</label>
                                <div className="select-box">
                                    <select id="compared_to_baseline" name="compared_to_baseline"
                                        value={baseReportConfig.compared_to_baseline}
                                        onChange={handleFormInput(setBaseReportConfig)}
                                        data-validate="required">
                                        <option value={"True"}>True</option>
                                        <option value={"False"}>False</option>
                                    </select>
                                </div>
                            </div>
                            {
                                baseReportConfig?.compared_to_baseline == "True" ? (
                                    <div className="form-field">
                                        <label htmlFor="cycle_in_days" className="text">Aggregation Window</label>
                                        <input id="cycle_in_days" name="cycle_in_days"
                                            value={baseReportConfig.cycle_in_days}
                                            onChange={handleFormInput(setBaseReportConfig)}
                                            data-validate="required"
                                            type="text" />
                                    </div>
                                ) : (
                                    <div className="form-field">
                                        <label htmlFor="comparison_period_length" className="text">Comparison Dataset Period Length</label>
                                        <p style={{ fontSize: "12px" }}>(e.g. 7 is to use the logs of last week from job run date as comparison dataset)</p>
                                        <input id="comparison_period_length" name="comparison_period_length"
                                            value={baseReportConfig.comparison_period_length}
                                            onChange={handleFormInput(setBaseReportConfig)}
                                            data-validate="required"
                                            type="text" />
                                        <label htmlFor="reference_period_delta" className="text">Reference Dataset Period Delta</label>
                                        <p style={{ fontSize: "12px" }}>(e.g. 30 is to use the logs of comparison dataset period length and 30 days from job run date as reference dataset)</p>
                                        <input id="reference_period_delta" name="reference_period_delta"
                                            value={baseReportConfig.reference_period_delta}
                                            onChange={handleFormInput(setBaseReportConfig)}
                                            data-validate="required"
                                            type="text" />
                                    </div>
                                )
                            }
                            <div className="form-field">
                                <label htmlFor="report_recipients" className="text">Report Recipients</label>
                                <div style={{ display: 'flex' }}>
                                    <input id="email" name="email"
                                        value={email}
                                        onChange={changeEmail}
                                        data-validate="no"
                                        type="text" />
                                    <div onClick={addEmail} style={{ textAlign: "left", marginLeft: "20px" }}>
                                        <span style={{ fontWeight: 'bold', marginRight: '2px', lineHeight: "16px", paddingBottom: "6px" }}>
                                            Add
                                        </span>
                                        <span className="geico-icon geico-icon--small geico-icon--actionable icon-expand"></span>
                                    </div>
                                </div>
                                <div className="data-table dense">
                                    <table className="table" style={{ width: "100%" }}>
                                        <tbody>
                                            {baseReportConfig.report_recipients.map((email, index) => (
                                                <tr key={index}>
                                                    <td className="">{email}</td>
                                                    <td className="col--edit-control">
                                                        <div onClick={() => { deleteEmail(email) }}>
                                                            <span className="geico-icon geico-icon--small geico-icon--actionable icon-trash"></span>
                                                        </div>

                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    }
                    {activeStep > 5 &&
                        <div>
                            <h4>Please review model <strong style={{color: '#48D1CC' , fontWeight: 'bold'}}>{modelSummary.model_name}</strong> configurations and click "Submit"</h4>
                            
                                <div className="section-header">
                                    <h4>Model Information</h4>
                                </div>
                                <section className="onboarding-summary" style={{display: "flex"}}>
                                <div className="summaryColumn">
                                    <h5>Model Essentials </h5>
                                <div>Model description: {modelSummary.summary.description}</div>
                                <div>Human-readable name: {modelSummary.display_name}</div>
                                <div>Model type: {modelSummary.model_type}</div>
                                <div>Model Version: {modelSummary.summary.version}</div>
                                <div>Created by: {modelSummary.created_by}</div>
                                <div>Zone: {modelSummary.zone}</div>
                                </div>
                                <div className="summaryColumn">
                                <h5>Deployment Information </h5>
                                <div>Batch-scoring pipeline: {modelSummary.deployment.batch_scoring_pipeline || 'not provided' }</div>
                                <div>Deployment Type: {modelSummary.deployment.deployment_type || 'not provided'}</div>
                                <div>Inference Endpoint: {modelSummary.deployment.inference_endpoint || 'not provided'}</div>
                                <div>Training Endpoint: {modelSummary.deployment.training_endpoint || 'not provided'}</div>
                                </div>
                                <div className="summaryColumn">
                                <h5>Training Information </h5>
                                <div>Code Reposity: {modelSummary.training.code_reposity || 'not provided'}</div>
                                <div>Inference Dataset: {modelSummary.training.inference_dataset || 'not provided'}</div>
                                <div>Test Dataset: {modelSummary.training.test_dataset || 'not provided'}</div>
                                <div>Training Dataset: {modelSummary.training.training_dataset || 'not provided'}</div>
                                <div>Validation Dataset: {modelSummary.training.validation_dataset || 'not provided'}</div>
                                <div>Target Variable: {modelSummary.training.target_variable || 'not provided'}</div>
                                </div>
                            </section>


                            <span className="stroke-separator"></span>
                            <section className="onboarding-summary">
                                <div className="section-header">
                                    <h4>Feature Configuration</h4>
                                </div>
                                <pre>
                                    {JSON.stringify(featureConfig, null, 2)}
                                </pre>
                            </section>
                            <span className="stroke-separator"></span>
                            <section className="onboarding-summary">
                                <div className="section-header">
                                    <h4>Data Ingestion Configuration</h4>
                                </div>
                                <div>Baseline dataset: {baseConfig.baseline_path} ({baseConfig.baseline_format})</div>
                                <div>Logs: {baseConfig.logs_path} ({baseConfig.logs_format})</div>
                                <div>Aggregation window for logs: {baseConfig.cycle_in_days}</div>

                                {baseConfig.predictions_path ? (
                                    <div>Predictions: {baseConfig.predictions_path} ({baseConfig.predictions_format})</div>
                                ) : (
                                    <div>"Prediction In logs"</div>
                                )}

                                {baseConfig.requests_path ? (
                                    <div>Separate requests logs: {baseConfig.requests_path}({baseConfig.requests_format})</div>
                                ) : (
                                    <div>"Requests path not set"</div>
                                )}

                                <div>Targets dataset: {targetsConfig.targets_path || "Not set"} ({targetsConfig.targets_format})</div>
                                <div>Prediction column: {baseConfig.prediction_column || "Not set"}</div>
                                <div>Ground Truth column: {targetsConfig.target_column || "Not set"}</div>
                                {
                                    modelSummary.model_type == "recommendation" &&
                                    <>
                                        <div>Recommendations column: {targetsConfig.recommendations_column || "Not set"}</div>
                                    </>
                                }
                            </section>
                            <span className="stroke-separator"></span>
                            <section className="onboarding-summary">
                                <div className="section-header">
                                    <h4>Weekly Report Configuration</h4>
                                </div>
                                <div>Is Weekly Report Enabled: {baseReportConfig.report_enabled}</div>
                                <div>Alert Action: {baseReportConfig.alert_action}</div>
                                <div>Top Drifted Features Number: {baseReportConfig.top_n}</div>
                                <div>Compared to Basedline Dataset: {baseReportConfig.compared_to_baseline}</div>

                                {baseReportConfig.compared_to_baseline == "True" ? (
                                    <div>Aggregation Window: {baseReportConfig.cycle_in_days}</div>
                                ) : (
                                    <>
                                        <div>Comparison Dataset Period Length: {baseReportConfig.comparison_period_length}</div>
                                        <div>Reference Dataset Period Delta: {baseReportConfig.reference_period_delta}</div>
                                    </>
                                )}

                                <div>Report Recipients: </div>
                                <div className="data-table dense">
                                    <table className="table" style={{ width: "100%" }}>
                                        <tbody>
                                            {baseReportConfig.report_recipients.map((email, index) => (
                                                <tr key={index}>
                                                    <td className="">{email}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                            <span className="stroke-separator"></span>
                            {statusUpdates.map((update, index) => (
                                <div key={index}>
                                    {update.status == "success" &&
                                        <span className="icon-check-mark" style={{ verticalAlign: "text-bottom", color: "#66BB6A", paddingRight: "8px" }} />
                                    }
                                    {update.status == "fail" &&
                                        <span className="icon-alert" style={{ verticalAlign: "text-bottom", color: "red", paddingRight: "8px" }} />
                                    }
                                    {update.status == "pending" &&
                                        <TailSpin height="20" width="20" color="#4fa94d" ariaLabel="tail-spin-loading" radius="1"
                                            wrapperStyle={{ display: "inline", paddingRight: "8px" }} />
                                    }
                                    {update.text}
                                </div>
                            ))}
                        </div>
                    }
                </div>
                {activeStep > 1 &&
                    <a className="btn btn--primary btn--full-mobile btn--pull-left navigation-btn"
                        style={{ float: "left" }}
                        href="#"
                        onClick={moveBackward}>
                        <span>Previous</span>
                    </a>
                }
                {activeStep < 6 &&
                    <a className="btn btn--primary btn--full-mobile btn--pull-right navigation-btn" href="#" onClick={moveForward}>
                        <span>Next</span>
                    </a>
                }
                {activeStep == 6 &&
                    <button className="btn btn--primary btn--full-mobile btn--pull-right navigation-btn" onClick={submit}>
                        <span>Submit</span>
                    </button>
                }
            </main>
        </>
    );
}