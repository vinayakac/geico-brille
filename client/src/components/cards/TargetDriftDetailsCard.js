import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import '../../gdk/css/geico-design-kit.css';
import Accordion from '../Accordion';
import AreaChart from "../widgets/AreaChart";
import BarChart from '../widgets/BarChart';
import LineChart from '../widgets/LineChart';
import '../cards/cards.css';
import SubpopulationBarChart from '../widgets/SubpopulationBarChart';
import Tooltip from '../Tooltip.js';

import TargetDriftPlot from '../widgets/TargetDriftPlot';

export default function TargetDriftDetailsCard({ detailsRow, lazyLoad, modelType, selectedItem, type, timestamps, targetDriftScore, dataDriftScore, toolTipValue, featurePrefix, title }) {
    const [details, setDetails] = useState();
    const [dictForRef, setdictForRef] = useState();
    const [dictForCur, setdictForCur] = useState();
    const [driftBySlice, setDriftBySlice] = useState();

    const feature = detailsRow[0]?.feature;
    const { ref, inView, entry } = useInView({
        threshold: 0,
        triggerOnce: true
    });

    // create data for line chart of data drift score by feature vs target drift score
    const chartData = {};
    chartData[type] = targetDriftScore;
    chartData[featurePrefix + feature] = dataDriftScore;
    const titleText = "Feature drift score by feature vs "+title+" score";


    const processDetails = () => {
        try {
            // set details
            let details;
            if (modelType == "recommendation" && detailsRow.length > 1) {
                // if there is more than one recommendation, then data is a list of dicts and filtered by selected recommendation
                let filteredRecommendationData = detailsRow.filter(d => d.recommendation == selectedItem);
                details = filteredRecommendationData[0];
            } else {
                // for other models beside recommendation model, data is a list with one dict
                details = detailsRow[0];
            }
            setDetails(details);

            const driftBySlice = JSON.parse(details?.target_drift_by_slice.replace(/NaN/g, null));
            const slicesDrifts = {
                'slices': Object.keys(driftBySlice),
                'drifts': Object.values(driftBySlice)
            };
            setDriftBySlice(slicesDrifts);

            // Reference dataset
            // JSON parse
            const jsonForRef = JSON.parse(details?.target_drift_ref_json);
            // parse feature and target_column from JSON
            const keys = Object.keys(jsonForRef[0]);
            const feature = keys[0];
            const target_column = keys[1];
            // sort JSOn by feature and target, this can be removed if the json has already been sorted
            jsonForRef.sort((a, b) => {
                if (a[feature] == b[feature]) {
                    return a[target_column] < b[target_column] ? -1 : 1
                }
                else {
                    return a[feature] < b[feature] ? -1 : 1
                }
            });
            // convert JSON to dict
            const dictForRef = {};
            dictForRef["items"] = [];
            dictForRef["target"] = [];
            dictForRef["count"] = [];
            jsonForRef.forEach((item) => {
                dictForRef["items"].push(item[feature]);
                dictForRef["target"].push(item[target_column]);
                dictForRef["count"].push(item.count);
            })
            setdictForRef(dictForRef);

            // Current dataset
            // sort JSOn by feature and target, this can be removed if the json has already been sorted
            const jsonForCur = JSON.parse(details?.target_drift_cur_json);
            jsonForCur.sort((a, b) => {
                if (a[feature] == b[feature]) {
                    return a[target_column] < b[target_column] ? -1 : 1
                }
                else {
                    return a[feature] < b[feature] ? -1 : 1
                }
            });
            // convert JSON to dict
            const dictForCur = {};
            dictForCur["items"] = [];
            dictForCur["target"] = [];
            dictForCur["count"] = [];
            jsonForCur.forEach((item) => {
                dictForCur["items"].push(item[feature]);
                dictForCur["target"].push(item[target_column]);
                dictForCur["count"].push(item.count);
            })
            setdictForCur(dictForCur);

        } catch (error) {
            console.error(error);
        }
    }

    if (lazyLoad && inView) {
        if (!details) {
            processDetails();
        }
    }

    useEffect(() => {
        if (!lazyLoad) {
            processDetails();
        }
    }, [detailsRow]);
    let xval = driftBySlice?.slices || [];
    let yval = driftBySlice?.drifts || [];
    let sortedXLabels = [];
    let sortedYValues = [];
    if (Array.isArray(xval)) {
        const combinedData = xval.map((label, index) => ({ label, value: yval[index] }));
        combinedData.sort((a, b) => b.value - a.value);
        sortedXLabels = combinedData.map(item => item.label);
        sortedYValues = combinedData.map(item => item.value);
    }

    return (
        <>
            <div className="class_performance_details_row" ref={ref} id={feature + "-details"}>
                <Accordion innerContents={
                    <>
                        <div className='target_drift_details_row' style={{ textAlign: "center" }} >
                            <h5>Drift by sub-population</h5>
                            <div style={{ width: "50%" }}>

                                <SubpopulationBarChart xVal={sortedXLabels} yVal={sortedYValues}
                                    xLabel='bin/value' yLabel='divergence'
                                    plotHeight="90"
                                    showlegend={false} />
                            </div>
                        </div>
                        <div className='target_drift_details_row' style={{ textAlign: "center", height: "200px" }}>
                            <div className='target_drift_details_tab'>
                                <div style={{ width: "50%" }}>
                                    <TargetDriftPlot data={dictForCur} dataset={"Current"} plotHeight="248" />
                                </div>

                                <div style={{ width: "50%" }}>
                                    <TargetDriftPlot data={dictForRef} dataset={"Reference"} plotHeight="248" />
                                </div>

                            </div>
                        </div>
                    </>
                }
                    outerContents={
                        <div style={{ display: "flex" }}>
                            <div style={{ width: "20%" }}>
                                <h5>Feature</h5>
                                <p>{feature}</p>
                                <h5>Correlation Score
                                    <Tooltip text={toolTipValue} />
                                </h5>
                                <p>{parseFloat(detailsRow[0]?.correlation_score).toFixed(6)}</p>
                            </div>
                            <div style={{ width: "70%" }}>
                                <LineChart
                                    x={timestamps}
                                    y={chartData}
                                    title={titleText}
                                    x_label="timestampe"
                                    y_label="Drift Score"
                                    margin={{ t: 30, b: 8, pad: 4 }}
                                    plotHeight={200}
                                    showlegend={true} />
                            </div>
                        </div>
                    } />
            </div>
        </>
    );
}
