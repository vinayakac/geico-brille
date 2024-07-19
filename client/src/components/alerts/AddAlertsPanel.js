import React, { useState, useEffect } from "react";
import Tooltip from '../../components/Tooltip.js';
import "./Alerts.css";

/**
 * This react component provides a user interface
 * for adding new alerts.
 * @param {string} model - Model name the alert belongs to
 * @param {string} user  - User logged in
 * @param {string} model - Model name the alert belongs to
 * @param {string} closeDrawer - Controls add drawer
 * @param {Function} refreshAlertsData - Function to refresh the data after add action
 * @returns {JSX.Element} - A JSX element representing the component's rendered output
 */
export default function AddAlertsPanel({ refreshAlertsData, model, user, closeDrawer }) {
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [modelConfig, setModelConfig] = useState();
    const [locationFolder, setLocationFolder] = useState([]);
    const [alertType, setAlertType] = useState([]);
    const [jobResultFolder, setJobResultFolder] = useState();
    const [fullFeatureList, setFullFeatureList] = useState([]);
    const [alertSignal, setAlertSignal] = useState([]);
    const [alertDetails, setAlertDetails] = useState({
        jobType: "",
        alertName: "",
        description: "",
        monitorLocation: "",
        monitorTable: "",
        alertSignal: "",
        alertCondition: "",
        alertThreshold: "",
        alertAction: "",
        alertEmails: [],
    });
    const [alertSignalOptions, setAlertSignalOptions] = useState([]);
    const [metricsList, setMetricsList] = useState([]);

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
            const modelConfig = data.deployed_models.find(m => m.model_name == model);

            modelConfig.jobsMap = modelConfig.jobs.reduce((acc, obj) => {
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

    const getLocationFolder = (alertType) => {
        if (!modelConfig) return;

        const monitoring_features = modelConfig.monitoring_features_enabled;
        const zonePart = modelConfig.zone ? `/${modelConfig.zone}` : '';
        const filteredPaths = [];

        for (let feature of monitoring_features) {
            if (feature === alertType) {
                const featurePath = `dbfs:/mnt/MonitoringPOC/${model}${zonePart}/${addMetrics(formatMonitoringFeaturesName(feature))}`;
                filteredPaths.push(featurePath);
            }
        }
        setLocationFolder(filteredPaths);
        const filteredPathString = filteredPaths.join(',');
        setAlertDetails(prevAlertDetails => {
            return { ...prevAlertDetails, "monitorLocation": filteredPathString };
        });
    };

    const getAlertType = () => {
        if (!modelConfig) return;
        const monitoring_features = modelConfig.monitoring_features_enabled
            .filter(item => { return item == 'data_drift' || item == 'prediction_drift' || item == 'target_drift' || item == 'model_performance' });
        monitoring_features.sort();
        setAlertType(monitoring_features);
    };

    const getAlertSignalOptions = (monitoringTable) => {
        setAlertSignalOptions([])
        if (alertDetails.jobType == "data_drift") {
            if (monitoringTable == 'summary.parquet') {
                setAlertSignalOptions(['is_drift_detected']);
            } else {
                setAlertSignalOptions(['drift_detected']);
            }
        }
        else if (alertDetails.jobType == "prediction_drift" || alertDetails.jobType == "target_drift") {
            setAlertSignalOptions(['is_drift_detected']);
        }
        else if (alertDetails.jobType == "model_performance") {
            setAlertSignalOptions(metricsList);
        }
    };

    const formatMonitoringFeaturesName = (monitoringFeature) => {
        if (monitoringFeature == "data_drift" || monitoringFeature == "data_quality") {
            return "drift";
        } else {
            return monitoringFeature;
        }

    };

    const addMetrics = (monitoringFeature) => {
        if (!monitoringFeature.includes("_metrics")) {
            return `${monitoringFeature}_metrics`;
        } else {
            return monitoringFeature;
        }
    };
    
    const addAlert = async (newAlert) => {
        try {
            newAlert.modelName = model;
            newAlert.adminEmail = user.username.toLowerCase();
            newAlert.alertEnabled = true;
            newAlert.createdDateTime = new Date().toISOString();
            newAlert.lastUpdatedDateTime = new Date().toISOString();
            newAlert.createdBy = user.username.toLowerCase();;

            const response = await fetch('/api/alert/config/add', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                },
                body: JSON.stringify(newAlert),
            });

            if (!response.ok) {
                setError(`HTTP error! ${response.status}`);
                throw new Error('Failed to add the alert.');
            } else {
                refreshAlertsData("Alert Added");
            }
        } catch (error) {
            console.error(error);
            setError(error.message);
        }
    };

    const validateFields = (name, value) => {
        const alertName = formatAlertName(name);
        let isEmpty;
        if (name === "alertEmails") {
            isEmpty = value.length === 0 || value.every(email => !email || email.trim() === "");
        } else {
            isEmpty = (typeof value === 'string') ? value.trim().length === 0 : true;
        }
        setFieldErrors(prevErrors => {
            return {
                ...prevErrors,
                [name]: isEmpty ? `${alertName} is required` : ""
            };
        });
    };

    const handleAdd = () => {
        let allFieldsValid = true;

        for (const field in alertDetails) {
            validateFields(field, alertDetails[field]);
            if (alertDetails[field].length == 0) {
                allFieldsValid = false;
            }
        }
        if (Object.values(fieldErrors).every(err => err === '') && allFieldsValid) {
            addAlert(alertDetails);
        }
    };

    const handleFieldChange = (name, value) => {
        setAlertDetails({ ...alertDetails, [name]: value });
        validateFields(name, value);
        // monitor_location is generated by jobType
        if (name == "jobType") {
            getLocationFolder(value);
        }
        // alert signal  is generated by monitorTable
        if (name == 'monitorTable') {
            getAlertSignalOptions(value);
        }
    };

    function formatAlertName(alertName) {
        if (alertName == "data_drift") {
            alertName = "feature_drift"
        }

        return alertName
            .replace(/_/g, ' ')
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const fetchLatestJob = async () => {
        const zone = modelConfig.zone ? modelConfig.zone : '';
        const type = alertDetails.jobType ? formatMonitoringFeaturesName(alertDetails.jobType) : formatMonitoringFeaturesName(modelConfig?.monitoring_features_enabled[0]);
        const jobId = alertDetails.jobType ? modelConfig.jobsMap[alertDetails.jobType] : modelConfig.jobsMap.data_drift;
        try {
            const response = await fetch(`/api/get_job_run?model=${model}&type=${type}&jobId=${jobId}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            if (response.status === 200) {
                const data = await response.json();
                const jobResultFolder = `${model}/${zone}/${addMetrics(type)}/${data.run_id}`;
                setJobResultFolder(jobResultFolder);
            } else {
                setError("Execution error: " + response.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

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
                if (response.status === 200) {
                    const data = await response.json();
                    const featureList = data.map((blob) => {
                        const splitBlob = blob.split("/");
                        return splitBlob.slice(-3).join("/").slice(0, -1);
                    });
                    setFullFeatureList(featureList);
                } else {
                    setError("Execution error fetch job by date: " + response.message);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Get features from details data
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
                    // Create a list of feature names
                    const fullFeatureList = data.map(item => item.feature);
                    setFullFeatureList(fullFeatureList);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSummary = async () => {
        setMetricsList([]);
        try {
            if (jobResultFolder) {
                const summaryFolder = `${jobResultFolder}/summary.parquet/`;
                const response = await fetch(`/api/download_table?folder=${summaryFolder}`);
                if (response.status == 200) {
                    const data = await response.json();
                    const summary = data[0];
                    const columns = Object.keys(summary);
                    let metricsData = [];
                    columns.forEach((item) => {
                        if (item.startsWith("current_") && item.split("_").length == 2) {
                            metricsData.push(item);
                        }
                    })
                    setMetricsList(metricsData);
                } else {
                    setError("Execution error at fetchSummary: " + response.message);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchModelConfig();
    }, []);

    useEffect(() => {
        if (modelConfig) {
            getAlertType();
        }
    }, [modelConfig]);

    useEffect(() => {
        if (alertDetails && modelConfig) {
            fetchLatestJob();
        }
    }, [alertDetails, modelConfig]);

    useEffect(() => {
        if (jobResultFolder) {
            fetchFeatureList();
            fetchFullDetails();
            fetchSummary();
        }
    }, [jobResultFolder]);
    
    return (
        <div>
            {error && <p>Error: {error}</p>}
            {
                <>
                    <form>
                        <div className="edit-panel">
                            <div className="form-field">
                                <div className="select-box">
                                    <label> Alert Type: </label>
                                    <select
                                        id="jobType"
                                        name="jobType"
                                        onChange={(e) => handleFieldChange('jobType', e.target.value)}
                                        value={alertDetails.jobType}
                                    >
                                        <option value=""> -- select -- </option>
                                        {alertType.map((alert, index) => (
                                            <option key={index} value={alert}>
                                                {formatAlertName(alert)}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="error-message">{fieldErrors.jobType}</span>
                                </div>
                            </div>
                            <div className="form-field">
                                <label> Alert Name: </label>
                                <input
                                    type="text"
                                    value={alertDetails.alertName}
                                    onChange={(e) =>
                                        handleFieldChange("alertName", e.target.value)
                                    }
                                    placeholder="Overall dataset drift"
                                />
                                <span className="error-message">{fieldErrors.alertName}</span>
                            </div>
                            <div className="form-field">
                                <label> Description: </label>
                                <input
                                    type="text"
                                    value={alertDetails.description}
                                    onChange={(e) =>
                                        handleFieldChange("description", e.target.value)
                                    }
                                    placeholder="This alert monitors the overall feature drift for a dataset"
                                />
                                <span className="error-message">{fieldErrors.description}</span>
                            </div>

                            <div className="form-field">
                                <label> Monitor Location: </label>
                                <Tooltip text="Generated based on Alert Type selection" />
                                <input
                                    type="text"
                                    id="monitorLocation"
                                    name="monitorLocation"
                                    readOnly={true}
                                    value={locationFolder || ''}
                                />
                                <span className="error-message">{fieldErrors.monitorLocation}</span>
                            </div>
                            <div className="form-field">
                                <div className="select-box">
                                    <label>Monitor Table:</label>
                                    <Tooltip text="Location for the specific feature column that alert is being created for. For summary select summary" />
                                    {
                                        alertDetails.jobType == "data_drift" ? (
                                            <select
                                                id="monitorTable"
                                                name="monitorTable"
                                                onChange={(e) => handleFieldChange('monitorTable', e.target.value)}
                                                value={alertDetails.monitorTable}
                                            >
                                                <option value=""> -- select -- </option>
                                                <option value="summary.parquet"> summary.parquet </option>
                                                {fullFeatureList.map((feature, index) => (
                                                    <option key={index} value={feature}>
                                                        {feature}
                                                    </option>
                                                ))}
                                            </select>
                                        ) :(
                                            <select
                                                id="monitorTable"
                                                name="monitorTable"
                                                onChange={(e) => handleFieldChange('monitorTable', e.target.value)}
                                                value={alertDetails.monitorTable}
                                            >
                                                <option value=""> -- select -- </option>
                                                <option value="summary.parquet"> summary.parquet </option>
                                            </select>
                                        )
                                    }
                                    <span className="error-message">{fieldErrors.monitorTable}</span>
                                </div>
                            </div>
                            <div className="form-field">
                                <div className="select-box">
                                    <label>Alert Signal:</label>
                                    <select
                                        id="alertSignal"
                                        name="alertSignal"
                                        value={alertDetails.alertSignal}
                                        onChange={(e) => handleFieldChange('alertSignal', e.target.value)}
                                    >
                                        <option value=""> -- select -- </option>
                                        {alertSignalOptions.map((item, index) => (
                                            <option key={index} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="error-message">{fieldErrors.alertSignal}</span>
                                </div> 
                            </div>
                            <div className="form-field">
                                <div className="select-box">
                                    <label>Alert Condition:</label>
                                    <select id="alertCondition" name="alertCondition"
                                        onChange={(e) => handleFieldChange("alertCondition", e.target.value)}
                                        value={alertDetails.alertCondition}>
                                        <option value=""> -- select -- </option>
                                        <option>==</option>
                                        <option>!=</option>
                                        <option value=">=">{">="}</option>
                                        <option value="<=">{"<="}</option>
                                    </select>
                                    <span className="error-message">{fieldErrors.alertCondition}</span>
                                </div> 
                            </div>
                            <div className="form-field">
                                <label>Alert Threshold:</label>
                                {
                                    alertDetails.jobType == "model_performance" ? (
                                        <input
                                            type="text"
                                            value={alertDetails.alertThreshold}
                                            onChange={(e) => handleFieldChange("alertThreshold", e.target.value)}
                                            placeholder="Enter numerical value for threshold"
                                        />
                                    ) : (
                                        <div className="select-box">
                                            <select id="alertThreshold" name="alertThreshold"
                                                onChange={(e) => handleFieldChange("alertThreshold", e.target.value)}
                                                value={alertDetails.alertThreshold}>
                                                <option value=""> -- select -- </option>
                                                <option>true</option>
                                                <option>false</option>
                                            </select>
                                        </div> 
                                    )
                                }
                                <span className="error-message">{fieldErrors.alertThreshold}</span>
                            </div>
                            <div className="form-field">
                                <div className="select-box">
                                    <label>Alert Action:</label>
                                    <Tooltip text="Alert delivery method. Can be email or Webapp" />
                                    <select id="alert_action" name="alert_action"
                                        onChange={(e) => handleFieldChange("alertAction", e.target.value)}
                                        value={alertDetails.alertAction}>
                                        <option value=""> -- select -- </option>
                                        <option>email</option>
                                    </select>
                                    <span className="error-message">{fieldErrors.alertAction}</span>
                                </div> 
                            </div>

                            <div className="form-field">
                                <label>Alert Emails:</label>
                                <Tooltip text="Can be a single email or comma separated emails" />
                                <textarea className="textarea-countdown" aria-label="Text Area With Countdown. Maximum 1000 characters"
                                    value={alertDetails.alertEmails}
                                    onChange={(e) =>
                                        handleFieldChange("alertEmails", e.target.value.split(",").map(email => email.trim()))
                                    }
                                    placeholder="example@geico.com,example1@geico.com"
                                />

                                <span className="error-message">{fieldErrors.alertEmails}</span>
                            </div>
                            <div className="btn-panel">
                                <button type="button" className="btn btn--destructive" onClick={closeDrawer}>
                                    <span>Cancel</span>
                                </button>
                                <button type="button" className="btn btn--primary" onClick={handleAdd}>
                                    <span>Add</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </>
            }
        </div >
    );
}
