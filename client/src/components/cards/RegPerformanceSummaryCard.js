import React from 'react';
import '../../gdk/css/geico-design-kit.css';
import '../cards/cards.css';
import { useState, useEffect } from 'react';
import Tooltip from '../Tooltip.js';
import FeatureHistogramPlot from '../widgets/FeatureHistogramPlot.js';
import HeatMapChart from '../widgets/HeatMapChart.js';

export default function RegPerformanceSummaryCard({ summary, baselinePath }) {

    // get model metrics Object of current and reference
    const keys = Object.keys(summary);
    let metrics = [];
    keys.forEach((item) => {
        if (item.startsWith("current_") && item.split("_").length == 2) {
            metrics.push(item.replace("current_", ""));
        }
    })

    let reference = {};
    let current = {};
    metrics.forEach((d) => {
        if (!isNaN(parseFloat(JSON.parse(summary["current_" + d])))) {
            current[d] = parseFloat(JSON.parse(summary["current_" + d])).toFixed(2);
            reference[d] = parseFloat(JSON.parse(summary["reference_" + d])).toFixed(2);
        }
        else {
            current[d] = parseFloat(JSON.parse(summary["current_" + d]).value).toFixed(2);
            reference[d] = parseFloat(JSON.parse(summary["reference_" + d]).value).toFixed(2);
        }
    })

    return (
        <>
            <div className='summary_row'>
                <div style={{marginTop: "10px"}}>
                    <h4 style={{ marginBottom: "3px"}}>
                        Model Performance for Current Dataset from {summary?.start_date} to {summary?.end_date}
                        <Tooltip text="Aggregated model performance summary, include accuracy, precision, recall and f1 socres"/>
                    </h4>
                    <p style={{ fontSize: "14px", lineHeight: 1.2, marginBottom: "12px" }}>
                        {baselinePath && <span>Reference Path: {baselinePath}</span>}
                    </p>
                    <h4>Regression Model Performance</h4>
                    <div>
                        <p>
                            Target column is <b>"{summary?.target_column}"</b>. 
                            Prediction column is <b>"{summary?.prediction_column}"</b>.
                        </p>
                        {"prediction_probability_column" in summary && 
                            <p>
                                Prediction probability column is <b>"{summary?.prediction_probability_column}"</b>
                            </p>
                        }
                    </div>
                </div>

                <div style={{textAlign: "left", marginLeft: "10px"}}>
                    <h5>Current: Model Quality Metrics</h5>
                </div>

                <div style={{display: "flex"}}>
                    {metrics.map((d, index) => (
                        <div className='summary_tab' style={{flex: 1}} key={index}>
                            <h5>{current[d]}</h5>
                            <h5>{d.toUpperCase()}</h5>
                        </div>
                    ))}
                </div>

                <div style={{textAlign: "left", marginLeft: "10px", marginTop: "20px"}}>
                    <h5>Reference: Model Quality Metrics</h5>
                </div>

                <div style={{display: "flex"}}>
                    {metrics.map((d, index) => (
                        <div className='summary_tab' style={{flex: 1}} key={index}>
                            <h5>{reference[d]}</h5>
                            <h5>{d.toUpperCase()}</h5>
                        </div>
                    ))}
                </div>
            </div>
            
        </>
    );
}