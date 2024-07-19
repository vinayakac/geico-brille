import React from 'react';
import '../../gdk/css/geico-design-kit.css';
import '../cards/cards.css';
import { useState, useEffect } from 'react';
import SlicePerformanceInsights from './SlicePerformanceInsights';
import Tooltip from '../../components/Tooltip.js';
import FeatureHistogramPlot from '../widgets/FeatureHistogramPlot';

export default function TargetDriftSummaryCard({ summary, title, modelType, baselinePath, selectedItem }) {
    const textForSummary = `Aggregated ${title.toLowerCase()} summary`;
    const headerForSlice = `${title} Insights Sub-Population`;
    let colName;
    let textForSlice;
    if (title == "Concept Drift") {
        colName = "Target";
        textForSlice = "Showing the % of performance impact (concept drift score) of the feature value/bin on the target by excluding the feature value/bin";
    }
    else {
        colName = "Prediction";
        textForSlice = "Showing the % of performance impact (prediction drift score) of the feature value/bin on the prediction by excluding the feature value/bin";
    }

    // get summaryData for viz
    let summaryData;
    if (modelType == "recommendation") {
        if (summary.constructor == Object) {
            // if there is only one recommendation, then summary is a dict
            summaryData = summary;
        }
        else {
            // if there is more than one recommendation, then summary is a list of dict and filtered by selected recommendation
            let filteredRecommendationData = summary.filter(d => d.recommendation == selectedItem);
            summaryData = filteredRecommendationData[0];
        }
    }
    else {
        // for other models beside recommendation model, summary is a dict
        summaryData = summary;
    }
    
    let drift_impact_slice;
    if (summaryData && summaryData.slice_impact) {
        drift_impact_slice = JSON.parse(summaryData.slice_impact);
    }

    // get hist dict for histogram visualization (Class Representation)
    const jsonForHist = JSON.parse(summaryData?.json_for_hist);
    jsonForHist.sort((a, b) => (a.x - b.x));
    const hist = {};
    hist.current = jsonForHist.map(item => item.current);
    hist.reference = jsonForHist.map(item => item.reference);
    hist.items = jsonForHist.map(item => item.x);

    return (
        <>
            <div className='summary_row' id="target-drift-summary">
                <div style={{marginTop: "10px"}}>
                    <h4 style={{ marginBottom: "3px"}}> 
                        {title} Report for Current Dataset from <span id="report-date-range">{summaryData?.start_date} to {summaryData?.end_date}</span>
                        <Tooltip text={textForSummary}/>
                    </h4>
                    <p style={{ fontSize: "14px", lineHeight: 1.2, marginBottom: "8px" }}>
                        {baselinePath && <span>Reference Path: {baselinePath}</span>}
                    </p>

                    {
                        (summaryData && "is_target_null" in summaryData && summaryData.is_target_null == "True") ? (
                            <p>
                                Target column is null in this period.
                            </p>
                        ) : (
                            <p>
                                {colName} column is <b id="report-column-name">"{summaryData?.column_name}"</b>.
                                &nbsp;{title} is <b id="report-result">{summaryData?.is_drift_detected == "True" ? "DETECTED" : "NOT detected"}</b>.
                                Drift detection method: <span id="report-stattest">{summaryData?.stattest_name}</span>. 
                                Drift score: <span id="report-stattest-score">{parseFloat(summaryData?.drift_score).toFixed(5)}</span>. 
                                Threshold is {summaryData?.stattest_threshold}.
                            </p>
                        )
                        
                    }

                    {modelType == "recommendation" && 
                        <div style={{textAlign: "left", marginLeft: "10px"}}>
                            <h4>
                                Recommendations only in current dataset: 
                                <Tooltip text="The recommendations only in current or reference dataset are drifted"/>
                            </h4>
                            <p>
                                {summaryData?.comparison_only_recommendations}
                            </p>
                            <h4>
                                Recommendations only in reference dataset: 
                            </h4>
                            <p>
                                {summaryData?.baseline_only_recommendations}
                            </p>
                        </div>
                    }
                </div>
            </div>
            
            <div className='summary_row'>
                <div style={{ display: "flex" }}>
                    <div style={{ flex: 1 }} className="summary_tab" id="class-representation">
                        <div style={{marginTop: "10px"}}>
                            <h4>Class Representation</h4>
                        </div>

                        <div style={{ height: "320px" }}>
                            <FeatureHistogramPlot 
                                items={hist?.items} 
                                current={hist?.current} 
                                reference={hist?.reference} 
                                plotHeight="320" 
                                xTitle='Classes' 
                                yTitle='Frequency' 
                                start_date={summaryData?.start_date}
                                end_date={summaryData?.end_date || "N/A"}
                            />
                        </div>
                    </div>
                    <div style={{ flex: 1 }} className="summary_tab">
                        {drift_impact_slice && <SlicePerformanceInsights data={drift_impact_slice} header={headerForSlice} text={textForSlice} />}
                    </div>
                </div>
            </div>
        </>
    );
}