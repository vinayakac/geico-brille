import React, { useEffect, useState } from 'react';
import Tooltip from '../../components/Tooltip.js';
import LoadingMessage from '../errors/LoadingMessage';
import ErrorMessage from '../errors/SectionLoadingError';
import '../../gdk/css/geico-design-kit.css';
import '../cards/cards.css';

export default function DataDriftSummaryCard({ jobResultFolder, baselinePath }) {
    const [summary, setSummary] = useState();
    const [message, setMessage] = useState("");

    const fetchSummary = async () => {
        try {
            if (jobResultFolder) {
                const summaryFolder = `${jobResultFolder}/summary.parquet/`;
                const response = await fetch(`/api/download_table?folder=${summaryFolder}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                        }
                    });
                if (response.status == 200) {
                    const data = await response.json();
                    setSummary(data[0]);
                } else {
                    setMessage("Execution error at fetchJobByDate: " + response.message);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        fetchSummary();
    }, [jobResultFolder]);

    return (
        <>
            {message ? <ErrorMessage error={message} /> : null}

            {summary ? (
                <div className='summary_row'>

                    <div style={{ marginTop: "10px" }}>
                        <h4 style={{ marginBottom: "3px" }}>
                            Feature Drift Report for Current Dataset from <span id="drift-date-range">{summary?.start_date} to {summary?.end_date}</span>
                            <Tooltip text="Aggregated feature drift summary, including the share of drifted columns" />
                        </h4>
                        <p style={{ fontSize: "14px", lineHeight: 1.2, marginBottom: "8px" }}>
                            {baselinePath && <span>Reference Path: {baselinePath}</span>}
                        </p>
                    </div>

                    <div id="univariate_drift">
                        <div style={{ textAlign: "left", marginLeft: "10px", display: 'flex' }}>
                            <h5>Univariate Drift: <b>{summary?.is_drift_detected == "True" ? "DETECTED" : "NOT detected"}</b> </h5>
                            <Tooltip text="If the percentage of Drifted Columns out of the Total Number of Columns is greater 
                            than the Threshold, then Univariate Drift is DETECTED. Otherwise, it's UNDETECTED."/>
                        </div>

                        <div style={{ display: "flex", flexDirection: "row" }}>
                            <div id="total-drifted-columns" className='summary_tab' style={{ flex: 1 }}>
                                <h5>{summary?.num_of_drifted_cols}</h5>
                                <h5>Drifted Columns</h5>
                            </div>
                            <div className='summary_tab' style={{ flex: 1 }}>
                                <h5>{(parseFloat(summary?.share_of_drifted_cols * 100).toFixed(2))}%</h5>
                                <h5>Share of Drifted Columns</h5>
                            </div>
                            <div className='summary_tab' style={{ flex: 1 }}>
                                <h5>{parseInt(summary?.num_of_invalid_cols)} / {parseInt(summary?.num_validated_cols)}</h5>
                                <h5>Validation Issues</h5>
                            </div>
                            <div className='summary_tab' style={{ flex: 1 }}>
                                <h5>{summary?.num_of_cols}</h5>
                                <h5>Total Number of Columns</h5>
                            </div>
                            <div className='summary_tab' style={{ flex: 1 }}>
                                <h5>{(summary?.threshold * 100)}%</h5>
                                <h5>Threshold</h5>
                            </div>
                        </div>
                    </div>
                    {summary?.cur_multivariate_drift_results &&
                        <div id="multivariate_drift">
                            <div style={{ textAlign: "left", marginLeft: "10px" }}>
                                <h5>Multivariate Drift: <b>{JSON.parse(summary?.cur_multivariate_drift_results)["is_detected"] == "True" ? "DETECTED" : "NOT detected"}</b> </h5>
                            </div>

                            <div style={{ display: "flex", flexDirection: "row" }}>
                                <div className='summary_tab' style={{ flex: 1 }}>
                                    <h5>{parseFloat(JSON.parse(summary?.cur_multivariate_drift_results)["reconstruction_error"]).toFixed(6)}</h5>
                                    <h5>Reconstruction Error of Current Dataset</h5>
                                </div>
                                <div className='summary_tab' style={{ flex: 1 }}>
                                    <h5>{parseFloat(JSON.parse(summary?.ref_multivariate_drift_results)["reconstruction_error"]).toFixed(6)}</h5>
                                    <h5>Reconstruction Error of Reference Dataset</h5>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            ) : (<LoadingMessage />)}
        </>
    );
}