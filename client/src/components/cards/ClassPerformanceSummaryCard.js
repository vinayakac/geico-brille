import React from 'react';
import '../../gdk/css/geico-design-kit.css';
import '../cards/cards.css';
import Tooltip from '../../components/Tooltip.js';
import FeatureHistogramPlot from '../widgets/FeatureHistogramPlot';
import HeatMapChart from '../widgets/HeatMapChart';
import SlicePerformanceInsights from './SlicePerformanceInsights';
import AUCChart from '../widgets/AUCChart.js';

export default function ClassPerformanceSummaryCard({ summary, baselinePath, showHist=true }) {
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
    let colors = {};
    metrics.forEach((d) => {
        if (!isNaN(parseFloat(JSON.parse(summary["current_" + d])))) {
            current[d] = parseFloat(JSON.parse(summary["current_" + d])).toFixed(2);
            reference[d] = parseFloat(JSON.parse(summary["reference_" + d])).toFixed(2);
        }
        else {
            current[d] = parseFloat(JSON.parse(summary["current_" + d]).value).toFixed(2);
            reference[d] = parseFloat(JSON.parse(summary["reference_" + d]).value).toFixed(2);
        }

        // Set color based on comparison of current and reference values
        if (parseFloat(current[d]) < parseFloat(reference[d])) {
            colors[d] = 'red';
        } else if (parseFloat(current[d]) > parseFloat(reference[d])) {
            colors[d] = 'green';
        } else {
            colors[d] = 'white';
        }
    })

    // get hist dict for histogram visualization (Class Representation)
    // result from PerformanceEstimationReport doesn't have json_for_hist
    let hist;
    if ("json_for_hist" in summary) {
        const jsonForHist = JSON.parse(summary.json_for_hist);
        jsonForHist.sort((a, b) => (a.x - b.x));
        hist = {};
        hist.current = jsonForHist.map(item => item.current);
        hist.reference = jsonForHist.map(item => item.reference);
        hist.items = jsonForHist.map(item => item.x);
    }

    // get dict for confusion matrix
    // result from PerformanceEstimationReport doesn't have current_confusion_matrix
    let current_confusion_matrix;
    let reference_confusion_matrix;
    if ("current_confusion_matrix" in summary) {
        current_confusion_matrix = JSON.parse(summary.current_confusion_matrix);
        reference_confusion_matrix = JSON.parse(summary.reference_confusion_matrix);

    }

    // get dict for quality metrics by class
    // result from PerformanceEstimationReport doesn't have current_quality_by_class
    let current_quality_by_class;
    let reference_quality_by_class;
    if ("current_quality_by_class" in summary) {
        current_quality_by_class = JSON.parse(summary.current_quality_by_class);
        reference_quality_by_class = JSON.parse(summary.reference_quality_by_class);
    }

    // get impact slices 
    // result from PerformanceEstimationReport doesn't have impact_slices
    let performance_impact_slice;
    if ("impact_slices" in summary) {
        performance_impact_slice =JSON.parse(summary.impact_slices);
    }

    // get precision recall curve and roc curve
    let reference_auc_roc;
    let current_auc_roc;
    let reference_auc_pr;
    let current_auc_pr;
    if ("reference_auc-roc" in summary) {
        reference_auc_roc = JSON.parse(summary["reference_auc-roc"])
        current_auc_roc = JSON.parse(summary["current_auc-roc"])
        reference_auc_pr = JSON.parse(summary["reference_auc-pr"])
        current_auc_pr = JSON.parse(summary["current_auc-pr"])
    }

    return (
        <>
            <div className='summary_row'>
                <div style={{marginTop: "10px"}}>
                    <h4 style={{ marginBottom: "3px"}}>
                        Model Performance for Current Dataset from {summary?.start_date} to {summary?.end_date}
                        <Tooltip text="Aggregated model performance summary"/>
                    </h4>
                    <p style={{ fontSize: "14px", lineHeight: 1.2, marginBottom: "12px" }}>
                        {baselinePath && <span>Reference Path: {baselinePath}</span>}
                    </p>
                    <h4>Classification Model Performance</h4>
                    {
                        "prediction_probability_column" in summary ? (
                            <div>
                                <p>
                                    Target column is null in this period.
                                </p>
                                <p>
                                    Target column is <b>"{summary?.target_column}"</b>. 
                                    Prediction column is <b>"{summary?.prediction_column}"</b>.
                                    Prediction probability column is <b>"{summary?.prediction_probability_column}"</b>
                                </p>
                            </div>
                        ) : (
                            <p>
                                Target column is <b>"{summary?.target_column}"</b>. 
                                Prediction column is <b>"{summary?.prediction_column}"</b>.
                                Score column is <b>"{summary?.score_column ? summary?.score_column : "rawscore"}"</b>
                            </p>
                        )
                    }
                </div>

                <div style={{textAlign: "left", marginLeft: "10px"}}>
                    <h5>Current: Model Performance Metrics</h5>
                </div>

                <div style={{display: "flex"}}>
                    {metrics.map((d, index) => (
                        <div className='summary_tab' style={{flex: 1}} key={index}>
                            <h5 style={{ color: colors[d] }}>{current[d]}</h5>
                            <h5>{d.toUpperCase()}</h5>
                        </div>
                    ))}
                </div>

                <div style={{textAlign: "left", marginLeft: "10px", marginTop: "20px"}}>
                    <h5>Reference: Model Performance Metrics</h5>
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

            {
                (hist && showHist) ? (
                    <div className='summary_row'>
                        <div style={{ display: "flex" }}>
                            <div style={{ flex: 1 }} className="summary_tab">
                                <div style={{marginTop: "10px"}}>
                                    <h4>Class Representation</h4>
                                </div>

                                <div style={{height: "250px"}}>
                                    <FeatureHistogramPlot 
                                        items={hist?.items} 
                                        current={hist?.current} 
                                        reference={hist?.reference} 
                                        plotHeight="230" 
                                        xTitle='Classes' 
                                        yTitle='Frequency'
                                        start_date={summary?.start_date}
                                        end_date={summary?.end_date || "N/A"}
                                    />
                                </div>
                            </div>

                            <div style={{ flex: 1 }} className="summary_tab">
                                <SlicePerformanceInsights 
                                    data={performance_impact_slice}
                                    text={"Showing the %of performance (accuracy) impact (increasing or decreasing) of the feature value/bin on the overall model performance by excluding the feature value/bin, given a perfromance scoring function like accuracy"} />
                            </div>
                        </div>
                    </div>
                ) : (null)
            }

            {
                reference_auc_pr && <div className='summary_row'>
                            <div style={{marginTop: "10px"}}>
                                <h4>Precision Recall Curve</h4>
                            </div>

                            <div style={{display: "flex", flexDirection: "row"}}>
                                <div style={{height: "250px", width: "50%"}}>
                                    <AUCChart
                                        x={reference_auc_pr["recall"]}
                                        y={reference_auc_pr["precision"]}
                                        z={reference_auc_pr["thresholds"]}
                                        title={"Reference: AUC (" + reference_auc_pr["auc"].toFixed(4) + " )"}
                                        x_label="Recall"
                                        y_label="Precision"
                                        margin={{ t: 30, b: 8, pad: 4 }}
                                        plotHeight={200}
                                        showlegend={false} />
                                </div>
                                <div style={{height: "250px", width: "50%"}}>
                                    <AUCChart
                                        x={current_auc_pr["recall"]}
                                        y={current_auc_pr["precision"]}
                                        z={current_auc_pr["thresholds"]}
                                        title={"Current: AUC (" + current_auc_pr["auc"].toFixed(4) + " )"}
                                        x_label="Recall"
                                        y_label="Precision"
                                        margin={{ t: 30, b: 8, pad: 4 }}
                                        plotHeight={200}
                                        showlegend={false} />
                                </div>
                            </div>
                        </div>   
            }

            {
                reference_auc_roc && <div className='summary_row'>
                            <div style={{marginTop: "10px"}}>
                                <h4>ROC Curve</h4>
                            </div>

                            <div style={{display: "flex", flexDirection: "row"}}>
                                <div style={{height: "250px", width: "50%"}}>
                                    <AUCChart
                                        x={reference_auc_roc["fpr"]}
                                        y={reference_auc_roc["tpr"]}
                                        z={reference_auc_roc["thresholds"]}
                                        title={"Reference: AUC (" + reference_auc_roc["auc"].toFixed(4) + " )"}
                                        x_label="fpr"
                                        y_label="tpr"
                                        margin={{ t: 30, b: 8, pad: 4 }}
                                        plotHeight={200}
                                        showlegend={false} />
                                </div>
                                <div style={{height: "250px", width: "50%"}}>
                                    <AUCChart
                                        x={current_auc_roc["fpr"]}
                                        y={current_auc_roc["tpr"]}
                                        z={current_auc_roc["thresholds"]}
                                        title={"Current: AUC (" + current_auc_roc["auc"].toFixed(4) + " )"}
                                        x_label="fpr"
                                        y_label="tpr"
                                        margin={{ t: 30, b: 8, pad: 4 }}
                                        plotHeight={200}
                                        showlegend={false} />
                                </div>
                            </div>
                        </div> 
            }

            {
                current_confusion_matrix ? (
                    <div className='summary_row'>
                        <div style={{marginTop: "10px"}}>
                            <h4>Confusion Matrix</h4>
                        </div>

                        <div style={{display: "flex", flexDirection: "row"}}>
                            <div style={{height: "250px", width: "50%"}}>
                                <HeatMapChart xLabels={current_confusion_matrix?.labels} yLabels={current_confusion_matrix?.labels} values={current_confusion_matrix?.values} plotHeight="230" title={"Current"} xAxis={"prediction"} yAxis={"actual"} />
                            </div>
                            <div style={{height: "250px", width: "50%"}}>
                                <HeatMapChart xLabels={reference_confusion_matrix?.labels} yLabels={reference_confusion_matrix?.labels} values={reference_confusion_matrix?.values} plotHeight="230" title={"Reference"} xAxis={"prediction"} yAxis={"actual"} />
                            </div>
                        </div>
                    </div>
                ) : (null)
            }

            {
                current_quality_by_class? (
                    <div className='summary_row'>
                        <div style={{marginTop: "10px"}}>
                            <h4>Quality Metrics by Class</h4>
                        </div>

                        <div style={{display: "flex", flexDirection: "row"}}>
                            <div style={{height: "250px", width: "50%"}}>
                                <HeatMapChart xLabels={current_quality_by_class?.xLabels} yLabels={current_quality_by_class?.yLabels} values={current_quality_by_class?.values} plotHeight="230" title={"Current"} />
                            </div>
                            <div style={{height: "250px", width: "50%"}}>
                                <HeatMapChart xLabels={reference_quality_by_class?.xLabels} yLabels={reference_quality_by_class?.yLabels} values={reference_quality_by_class?.values} plotHeight="230" title={"Reference"} />
                            </div>
                        </div>
                    </div>
                ) : (null)
            }
            
        </>
    );
}