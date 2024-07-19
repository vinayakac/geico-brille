import React, { useEffect, useState } from 'react';
import '../../utils/styles.css';
import '../cards/cards.css';
import { FiSave } from 'react-icons/fi';
import { toast } from '../ToastNotification';
import Tooltip from '../../components/Tooltip.js';

export default function WeeklyReportPanel({ model, fullReportConfig, initialReportConfig }) {
  const [reportConfig, setReportConfig] = useState(initialReportConfig);
  const [email, setEmail] = useState('');
  const [reportsSummary, setReportsSummary] = useState([]);
  const [options, setOptions] = useState([]);
  const [selectedReport, setSelectedReport] = useState();

  const updateReportConfigField = (e) => {
      const { name, value } = e.target;
      // TODO: validate the values
      setReportConfig(prevState => ({
          ...prevState,
          [name]: value
      }));
  };

  const changeEmail = (e) => {
      setEmail(e.target.value);
  };

  const addEmail = () => {
      setReportConfig(prevState => ({
          ...prevState,
          ["report_recipients"]: [...prevState?.report_recipients, email]
      }));
      setEmail('');
  };

  const deleteEmail = (e) => {
      setReportConfig(prevState => ({
          ...prevState,
          ["report_recipients"]: prevState?.report_recipients.filter(d => d != e)
      }));
  };

  const saveReportConfig = async (e) => {
      e.preventDefault();
      const reportIndex = fullReportConfig.findIndex(model => model.model_name == reportConfig.model_name);
      fullReportConfig.splice(reportIndex, 1, reportConfig);

      // Update the report configuration
      const response = await fetch(`/api/update_blob?file=/config/report_configs.json`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('brille-token')}`
          },
          body: JSON.stringify(fullReportConfig)
      });

      if (response.ok) {
          toast('File updated successfully.')
      } else {
          toast('Error updating file.')
      }
  };

  const fetchReports = async () => {
      try {
          const file = `${model}/weekly_report_summary/results.csv`;
          const response = await fetch(`/api/download_csv?file=${file}`, {
              method: 'GET',
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('brille-token')}`
              }
          });
          const data = await response.json();
          setReportsSummary(data);

          // create options for select box
          const options = data.map((d) => (d.job_run_date + " " + d.baseline));
          setOptions(options);
      } catch (error) {
          console.error(error);
      }
  };

  const updateSelectedReport = (e) => {
      const selectedOption = e.target.value;
      const job_run_date = selectedOption.split(" ")[0];
      const baseline = selectedOption.split(" ")[1];
      const filteredData = reportsSummary.filter((d) => {
          return d.job_run_date == job_run_date && d.baseline == baseline;
      });
      setSelectedReport(JSON.parse(filteredData[0].report_summaries));
  };

  useEffect(() => {
      fetchReports();
  }, []);

  return (
    <>
      <div className='model_input_data_display_row'>
          <div style={{ width: "100%" }} >
              <div className="form-field" style={{ paddingLeft: "20px", paddingRight: "20px", width: "100%" }}>
                  <label htmlFor="report_enabled" className="text">Is Weekly Report Enabled</label>
                  <div className="select-box">
                      <select id="report_enabled" name="report_enabled"
                          onChange={updateReportConfigField}
                          value={reportConfig?.report_enabled}>
                          <option value={"True"}>True</option>
                          <option value={"False"}>False</option>
                      </select>
                  </div>
                  <label htmlFor="alert_action" className="text">Alert Action</label>
                  <input id="alert_action" name="alert_action" readOnly
                      value={reportConfig?.alert_action}
                      style={{ width: "100%", boxSizing: "border-box" }}
                      type="text" />
                  <label htmlFor="top_n" className="text">Top Drifted Features Number</label>
                  <input id="top_n" name="top_n"
                      value={reportConfig?.top_n}
                      onChange={updateReportConfigField}
                      type="text" />
                  <label htmlFor="compared_to_baseline" className="text">Compared to Baseline Dataset</label>
                  <div className="select-box">
                      <select id="compared_to_baseline" name="compared_to_baseline"
                          onChange={updateReportConfigField}
                          value={reportConfig?.compared_to_baseline}>
                          <option value={"True"}>True</option>
                          <option value={"False"}>False</option>
                      </select>
                  </div>
                  {
                      reportConfig?.compared_to_baseline == "True" ? (
                          <div>
                              <label htmlFor="cycle_in_days" className="text">Aggregation Window</label>
                              <input id="cycle_in_days" name="cycle_in_days"
                                  value={reportConfig?.cycle_in_days}
                                  onChange={updateReportConfigField}
                                  type="text" />
                          </div>
                      ) : (
                          <div>
                              <label htmlFor="comparison_period_length" className="text">Comparison Dataset Period Length</label>
                              <p style={{ fontSize: "12px" }}>(e.g. 7 is to use the logs of last week from job run date as comparison dataset)</p>
                              <input id="comparison_period_length" name="comparison_period_length"
                                  value={reportConfig?.comparison_period_length}
                                  onChange={updateReportConfigField}
                                  type="text" />
                              <label htmlFor="reference_period_delta" className="text">Reference Dataset Period Delta</label>
                              <p style={{ fontSize: "12px" }}>(e.g. 30 is to use the logs of comparison dataset period length and 30 days from job run date as reference dataset)</p>
                              <input id="reference_period_delta" name="reference_period_delta"
                                  value={reportConfig?.reference_period_delta}
                                  onChange={updateReportConfigField}
                                  type="text" />
                          </div>
                      )
                  }
                  <label htmlFor="enabled_job_types" className="text">Enabled Job Types</label>
                  <div className="data-table dense">
                      <table className="table" style={{ width: "100%" }}>
                          <tbody>
                              <td className="alerts-no-wrap" >{reportConfig?.enabled_job_types.map(
                                  (job) => (<div>{job}</div>)
                              )}</td>
                          </tbody>
                      </table>
                  </div>
                  <label htmlFor="report_recipients" className="text">Report Recipients</label>
                  <div style={{ display: 'flex' }}>
                      <input id="email" name="email"
                          value={email}
                          onChange={changeEmail}
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
                              {reportConfig?.report_recipients.map((email, index) => (
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
          <div style={{ padding: "4px" }}>
              <a href="#" aria-label="Save report config" onClick={saveReportConfig}
                  title="Save report config" className="geico-icon geico-icon--actionable"><FiSave></FiSave></a>
          </div>
      </div>
      <div className='model_input_data_display_row'>
        <div style={{ flexDirection: "column", width: "100%" }}>
          <div className="form-field" style={{ paddingLeft: "20px", paddingRight: "20px", width: "100%" }}>
              <label className="text">Select a Report</label>
              <div className="select-box">
                  <select 
                      onChange={updateSelectedReport}
                      value={options[0]}>
                      {options.map((item) => (
                          <option value={item}>{item}</option>
                      ))}
                  </select>
              </div>
          </div>
          {selectedReport && 
            <div className="form-field" style={{ paddingLeft: "20px", paddingRight: "20px", width: "100%" }}>
                {
                  Object.entries(selectedReport).map(([job, results]) => {
                      if (job == "Model Performance") {
                        return <div>
                          <h4>{job}</h4>
                          <table className="table" style={{ width: '100%', tableLayout: "fixed" }}>
                              <tr>
                                  <th>

                                  </th>
                                  <th>
                                      Reference
                                  </th>
                                  <th>
                                      Current
                                  </th>
                              </tr>
                              {
                                Object.entries(results["current"]).map(([metric, value]) => (
                                  <tr>
                                      <td>{metric}: </td>
                                      <td>{results["reference"][metric]} </td>
                                      <td>{value}</td>
                                  </tr>
                                ))
                              }
                          </table>
                        </div>
                      }
                      else if (job == "Feature Drift") {
                        return <div>
                          <h4>{job}</h4>
                          <table className="table" style={{ width: '100%', tableLayout: "fixed" }}>
                          {
                            Object.entries(results).map(([metric, value]) => (
                              metric.startsWith("top") ? (
                                <tr>
                                    <td>{metric}: </td>
                                    <td>{JSON.stringify(value)}</td>
                                </tr>
                              ) : (
                                <tr>
                                    <td>{metric}: </td>
                                    <td>{value}</td>
                                </tr>
                              )
                            ))
                          }
                          <tr>
                              <td>drift_detection_method: </td>
                              <td>Jensen-Shannon distance</td>
                          </tr>
                          </table>
                        </div>
                      }
                      else if (job == "Target Drift") {
                        return <div>
                          <h4>{job}</h4>
                          <table className="table" style={{ width: '100%', tableLayout: "fixed" }}>
                          {
                            Object.entries(results).map(([metric, value]) => (
                              <tr>
                                  <td>{metric}: </td>
                                  <td>{value}</td>
                              </tr>
                            ))
                          }
                          </table>
                        </div>
                      }
                  }
                  )
                }
            </div>
          }
        </div>
      </div>
    </>
  );
}
