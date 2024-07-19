import React from 'react';
import '../../gdk/css/geico-design-kit.css';
import '../cards/cards.css';
import { useState, useEffect } from 'react';
import Tooltip from '../../components/Tooltip.js';
import FeatureHistogramPlot from '../widgets/FeatureHistogramPlot';

export default function CollabFilterPerformanceSummaryCard({ summary, baselinePath }) {
    // get model performance
    const cur_performance = JSON.parse(summary?.cur_performance);
    const ref_performance = JSON.parse(summary?.ref_performance);
    // get model metrics 
    const metrics = Object.keys(cur_performance);
    // get recommendations
    const recommendations = Object.keys(cur_performance[metrics[0]]);

    // get hist dict for histogram visualization of target column
    let histForTarget;
    if (summary && "hist_json_target" in summary) {
        let jsonForHist = JSON.parse(summary.hist_json_target);
        jsonForHist.sort((a, b) => (a.x - b.x));
        histForTarget = {};
        histForTarget.current = jsonForHist.map(item => item.current);
        histForTarget.reference = jsonForHist.map(item => item.reference);
        histForTarget.items = jsonForHist.map(item => item.x);
    }

    // get hist dict for histogram visualization of prediction column
    let histForPrediction;
    if (summary && "hist_json_prediction" in summary) {
        let jsonForHist = JSON.parse(summary.hist_json_prediction);
        jsonForHist.sort((a, b) => (a.x - b.x));
        histForPrediction = {};
        histForPrediction.current = jsonForHist.map(item => item.current);
        histForPrediction.reference = jsonForHist.map(item => item.reference);
        histForPrediction.items = jsonForHist.map(item => item.x);
    }

    // get hist dict for histogram visualization of recommendation column
    let histForRecommendations;
    if (summary && "hist_json_recommendations" in summary) {
        let jsonForHist = JSON.parse(summary.hist_json_recommendations);
        jsonForHist.sort((a, b) => (a.x - b.x));
        histForRecommendations = {};
        histForRecommendations.current = jsonForHist.map(item => item.current);
        histForRecommendations.reference = jsonForHist.map(item => item.reference);
        histForRecommendations.items = jsonForHist.map(item => item.x);
    }

    return (
        <>
            <div className='summary_row'>
                <div style={{marginTop: "10px"}}>
                    <h4 style={{ marginBottom: "3px"}}>
                        Model Performance for Current Dataset form {summary?.start_date} to {summary?.end_date}
                        <Tooltip text="Aggregated model performance summary, include mean_average_precision, etc"/>
                    </h4>
                    <p style={{ fontSize: "14px", lineHeight: 1.2, marginBottom: "12px" }}>
                        {baselinePath && <span>Reference Path: {baselinePath}</span>}
                    </p>
                    <p>
                        Target column is <b>"{summary?.target_column}"</b>. 
                        Prediction column is <b>"{summary?.prediction_column}"</b>.
                        Recommendation column is <b>"{summary?.recommendations_column}"</b>.
                    </p>
                </div>
            </div>

            <div className='summary_row'>
                <div style={{marginTop: "10px"}}>
                    <h4>Model Performance of Collaborative Filtering</h4>
                    <p>
                        Metrics type is <b>"{summary?.metrics_type}"</b>
                        <Tooltip text="score-binary is predictions are score and targets are binary relevancy (like vs dislike, click vs nonclick); 
                                       score-score is predictions are score and targets are score;
                                       rank-binary is predictions are ranks and targets are binary relevancy;
                                      "/>
                    </p>
                    <div style={{display: "flex"}}>
                        {metrics.map((metric, k) => (
                            <div className='summary_tab' style={{flex: 1}} key={k}>
                                <h5 style={{marginTop: "10px"}}><b>{metric.toUpperCase()}</b></h5>
                                <div className="data-table">
                                    <table className="table" style={{width: '100%'}}>
                                        <thead>
                                            <tr>
                                                <th></th>
                                                <th>Reference</th>
                                                <th>Current</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recommendations.map((d, i) => (
                                                <tr>
                                                    <td>{d}</td>
                                                    <td>{parseFloat(ref_performance[metric][d]).toFixed(6)}</td>
                                                    <td>{parseFloat(cur_performance[metric][d]).toFixed(6)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className='summary_row'>
                {histForTarget && 
                    <div className="summary_tab">
                        <div style={{marginTop: "10px"}}>
                            <h4>Targets Class Representation</h4>
                        </div>

                        <div style={{height: "250px"}}>
                            <FeatureHistogramPlot 
                                items={histForTarget?.items} 
                                current={histForTarget?.current} 
                                reference={histForTarget?.reference} 
                                plotHeight="230" 
                                xTitle='Classes' 
                                yTitle='Frequency'
                                start_date={summary?.start_date}
                                end_date={summary?.end_date || "N/A"}
                            />
                        </div>
                    </div>
                }

                {histForPrediction &&
                    <div style={{ flex: 1 }} className="summary_tab">
                        <div style={{marginTop: "10px"}}>
                            <h4>Predictions Class Representation</h4>
                        </div>

                        <div style={{height: "250px"}}>
                            <FeatureHistogramPlot 
                                items={histForPrediction?.items} 
                                current={histForPrediction?.current} 
                                reference={histForPrediction?.reference} 
                                plotHeight="230" 
                                xTitle='Classes' 
                                yTitle='Frequency'
                                start_date={summary?.start_date}
                                end_date={summary?.end_date || "N/A"}
                            />
                        </div>
                    </div>
                }

                {histForRecommendations &&
                    <div style={{ flex: 1 }} className="summary_tab">
                        <div style={{marginTop: "10px"}}>
                            <h4>Recommendations Class Representation</h4>
                        </div>

                        <div style={{height: "250px"}}>
                            <FeatureHistogramPlot 
                                items={histForRecommendations?.items} 
                                current={histForRecommendations?.current} 
                                reference={histForRecommendations?.reference} 
                                plotHeight="230" 
                                xTitle='Classes' 
                                yTitle='Frequency'
                                start_date={summary?.start_date}
                                end_date={summary?.end_date || "N/A"}
                            />
                        </div>
                    </div>
                }  
            </div>
        </>
    );
}