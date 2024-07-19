import React, { useState, useEffect } from "react";
import Tooltip from '../../components/Tooltip.js';
import "./Alerts.css";

/**
 * This react component provides a user interface 
 * for updating new alerts. 
 * @param {Function} refreshAlertsData - Function to refresh the data after update action 
 * @param {string} alertId - Alert Name that needs to be updated
 * @param {string} model - Model name the alert belongs to
 * @param {string} closeDrawer - Function to close drawer
 * @returns {JSX.Element} - A JSX element representing the component's rendered output
 */
export default function UpdateAlertsPanel({ alertId, refreshAlertsData, model, closeDrawer }) {
  const [alertDetails, setAlertDetails] = useState(null);
  const [modelConfig, setModelConfig] = useState();
  const [locationFolder, setLocationFolder] = useState([]);
  const [alertType, setAlertType] = useState([]);
  const [alertSignal, setAlertSignal] = useState([]);
  const [jobResultFolder, setJobResultFolder] = useState();
  const [fullFeatureList, setFullFeatureList] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("Loading...");
  const [fieldErrors, setFieldErrors] = useState({});
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

  const getLocationFolder = () => {
    const monitoring_features = modelConfig.monitoring_features_enabled;
    const zonePart = modelConfig.zone ? `/${modelConfig.zone}` : '';
    const filteredPaths = [];

    for (let feature of monitoring_features) {
      if (feature === alertDetails.jobType) {
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
    setAlertSignalOptions([]);
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

  const fetchAlertById = async () => {
    try {
      if (alertId) {
        const url = `/api/alerts/config/id?alertId=${alertId}&partitionKey=${model}`;
        const response = await fetch(url,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('brille-token')}`
            }
          });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAlertDetails(data);
      } else {
        setError('Alert ID is missing');
      }
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  const editAlert = async () => {
    try {

      if (alertDetails) {
        const updatedAlertDetails = { ...alertDetails };

        updatedAlertDetails.lastUpdatedDateTime = new Date().toISOString();
        updatedAlertDetails.createdDateTime = alertDetails.createdDateTime;
        updatedAlertDetails.createdBy = alertDetails.createdBy;
        const url = `/api/alerts/config/update?id=${alertId}&partitionKey=${model}`;

        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
          },
          body: JSON.stringify(updatedAlertDetails),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        refreshAlertsData("Alert updated");
      } else {
        setError('Alert details are missing');
      }
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  const validateFields = (name, value) => {
    const formattedName = formatAlertName(name);
    if (name === "alertEmails") {
      if (value.length === 0 || value.every(email => !email || email.trim() === "")) {
        setFieldErrors(prevErrors => ({ ...prevErrors, [name]: `${formattedName} is required` }));
      } else {
        setFieldErrors(prevErrors => ({ ...prevErrors, [name]: "" }));
      }
    } else {
      if (value === undefined || value === null || value === "-- select --" ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0)) {
        setFieldErrors(prevErrors => ({ ...prevErrors, [name]: `${formattedName} is required` }));
      } else {
        setFieldErrors(prevErrors => ({ ...prevErrors, [name]: "" }));
      }
    }
  };

  const handleUpdate = () => {
    let allFieldsValid = true;

    for (const field in alertDetails) {
      validateFields(field, alertDetails[field]);
      if (alertDetails[field].length === 0 || (Array.isArray(alertDetails[field]) && alertDetails[field].length === 0)) {
        allFieldsValid = false;
      }
    }

    if (Object.values(fieldErrors).every(err => err === "") && allFieldsValid) {
      editAlert();
    }
  };

  const handleFieldChange = (name, value) => {
    if (name === "alertEmails") {
      value = value.split(",");
    }
    setAlertDetails({ ...alertDetails, [name]: value });
    validateFields(name, value);
    // monitorLocation is generated by job_type
    if (name == "jobType") {
      getLocationFolder(value);
    }
    // alert signal  is generated by monitor_table
    if (name == 'monitorTable') {
      getAlertSignalOptions(value);
    }
  };

  function formatAlertName(alertName) {
    return alertName
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  const fetchLatestJob = async () => {
    const zone = modelConfig.zone ? modelConfig.zone : '';
    const type = alertDetails.jobType ? formatMonitoringFeaturesName(alertDetails.jobType) : formatMonitoringFeaturesName(modelConfig?.monitoring_features_enabled[0]);
    const jobId = alertDetails.jobType ? modelConfig.jobsMap[alertDetails.jobType] : modelConfig.jobsMap.data_drift;
    try {
      const response = await fetch(
        `/api/get_job_run?model=${model}&type=${type}&jobId=${jobId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
          }
        }
      );
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

  useEffect(() => {
    fetchModelConfig();
  }, []);

  useEffect(() => {
    fetchAlertById();
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
      {!alertDetails && <p>{message}</p>}
      {alertDetails && (
        <>
          <form>
            <div className="edit-panel">
              <div className="form-field">
                <div className="select-box">
                  <label> Alert Type: </label>
                  <select id="job_type" name="job_type"
                    value={alertDetails.jobType} onChange={(e) => handleFieldChange("jobType", e.target.value)}>
                    <option value=""> -- select -- </option>
                    {[...alertType].map((alert, index) =>
                      <option key={index} value={alert}>{formatAlertName(alert)}</option>
                    )}
                  </select>
                </div>
              </div>
              <span className="error-message">{fieldErrors.jobType}</span>

              <div className="form-field">
                <label> Alert Name: </label>
                <input type="text" value={alertDetails.alertName || ''} onChange={(e) => handleFieldChange("alertName", e.target.value)} />
              </div>
              {fieldErrors.alertName && <span className="error-message">{fieldErrors.alertName}</span>}

              <div className="form-field">
                <label> Description: </label>
                <input type="text" value={alertDetails.description || ''} onChange={(e) => handleFieldChange("description", e.target.value)} />
              </div>
              {fieldErrors.description && <span className="error-message">{fieldErrors.description}</span>}

              <div className="form-field">
                <label> Monitor Location: </label>
                <input
                  type="text"
                  id="monitor_location"
                  name="monitor_location"
                  readOnly={true}
                  value={alertDetails.monitorLocation}
                  onChange={(e) => handleFieldChange("monitorLocation", e.target.value)}
                />
              </div>
              {fieldErrors.monitorLocation && <span className="error-message">{fieldErrors.monitorLocation}</span>}

              <div className="form-field">
                <div className="select-box">
                  <label> Monitor Table: </label>
                  <Tooltip text="Location for the specific feature column that alert is being created for. For summary select summary" />
                  {
                    alertDetails.jobType == "data_drift" ? (
                      <select
                        id="monitor-table"
                        name="monitor-table" value={alertDetails.monitorTable}
                        onChange={(e) => handleFieldChange("monitorTable", e.target.value)} >
                        <option value=""> -- select -- </option>
                        <option value="summary.parquet"> summary.parquet </option>
                        {fullFeatureList.map((feature, index) => (
                          <option key={index} value={feature}>
                            {feature}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        id="monitor-table"
                        name="monitor-table" value={alertDetails.monitorTable}
                        onChange={(e) => handleFieldChange("monitorTable", e.target.value)} >
                        <option value=""> -- select -- </option>
                        <option value="summary.parquet"> summary.parquet </option>
                      </select>
                    )
                  }
                </div> 
              </div>
              {fieldErrors.monitorTable && <span className="error-message">{fieldErrors.monitorTable}</span>}

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
                </div>
              </div>
              {fieldErrors.alertSignal && <span className="error-message">{fieldErrors.alertSignal}</span>}

              <div className="form-field">
                <div className="select-box">
                  <label>Alert Condition:</label>
                  <select id="alert_condition" name="alert_condition"
                    value={alertDetails.alertCondition} onChange={(e) => handleFieldChange("alertCondition", e.target.value)}>
                    <option value=""> -- select -- </option>
                    <option>==</option>
                    <option>!=</option>
                    <option value=">=">{">="}</option>
                    <option value="<=">{"<="}</option>
                  </select>
                </div> 
              </div>
              {fieldErrors.alertCondition && <span className="error-message">{fieldErrors.alertCondition}</span>}

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
              </div>
              {fieldErrors.alertThreshold && <span className="error-message">{fieldErrors.alertThreshold}</span>}

              <div className="form-field">
                <div className="select-box">
                  <label>Alert Action:</label>
                  <Tooltip text="Alert delivery method. Can be email or Webapp" />
                  <select id="alert_action" name="alert_action"
                    value={alertDetails.alertAction} onChange={(e) => handleFieldChange("alertAction", e.target.value)}>
                    <option value=""> -- select -- </option>
                    <option>email</option>
                    <option>web</option>
                  </select>
                </div> 
              </div>
              {fieldErrors.alertAction && <span className="error-message">{fieldErrors.alertAction}</span>}

              <div className="form-field">
                <label> Alert Enabled: </label>
                <Tooltip text="Enable = true Disable = fasle" />
                <input type="text" value={alertDetails.alertEnabled || ''} onChange={(e) => handleFieldChange("alertEnabled", e.target.value)} />
              </div>
              {fieldErrors.alertEnabled && <span className="error-message">{fieldErrors.alertEnabled}</span>}

              <div className="form-field">
                <label> Alert Owner: </label>
                <Tooltip text="Owner of Alert can edit/delete alert/disable" />
                <input type="text" value={alertDetails.adminEmail || ''} onChange={(e) => handleFieldChange("adminEmail", e.target.value)} />
              </div>
              {fieldErrors.adminEmail && <span className="error-message">{fieldErrors.adminEmail}</span>}

              <div className="form-field">
                <label>Alert Email:</label>
                <Tooltip text="Can be a single email or comma separated emails" />
                <textarea className="textarea-countdown" aria-label="Text Area With Countdown. Maximum 1000 characters"
                  value={alertDetails.alertEmails?.join(",") || ''} onChange={(e) => handleFieldChange("alertEmails", e.target.value)} />
              </div>
              {fieldErrors.alertEmails && <span className="error-message">{fieldErrors.alertEmails}</span>}

              <div className="btn-panel">
                <button type="button" className="btn btn--destructive" onClick={closeDrawer}>
                  <span>Cancel</span>
                </button>
                <button type="button" className="btn btn--primary" onClick={handleUpdate}>
                  <span>Update</span>
                </button>
              </div>
            </div> 
          </form>
        </>
      )}
    </div>
  );
}