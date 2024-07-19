import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import '../../gdk/css/geico-design-kit.css';
import '../cards/cards.css';
import Accordion from '../Accordion';
import ClassConfusionPlot from '../widgets/ClassConfusionPlot';
import AreaChart from "../widgets/AreaChart";
import BarChart from '../widgets/BarChart';
import LineChart from '../widgets/LineChart';
import SubpopulationBarChart from '../widgets/SubpopulationBarChart';
import Tooltip from '../../components/Tooltip.js';

export default function ClassPerformanceDetailsCard({ detailsRow, lazyLoad, targetNames, metric, timestamps, performanceScore, dataDriftScore }) {
    const [tabs, setTabs] = useState([]);
    const [accuracyBySlice, setAccuracyBySlice] = useState();

    const feature = detailsRow?.feature;
    const { ref, inView, entry } = useInView({
        threshold: 0,
        triggerOnce: true
    });

    // create data for line chart of data drift score by feature vs target drift score
    const chartData = {};
    chartData[metric] = performanceScore[metric];
    chartData["feature drift of " + feature] = dataDriftScore;

    // function to get dict for plot
    const getDictForPlot = (jsonForData, feature_column, y_column) => {
        // sort JSON by feature_column and y_column
        jsonForData.sort((a, b) => {
            if (a[feature_column] == b[feature_column]) {
                return a[y_column] < b[y_column] ? -1 : 1
            }
            else {
                return a[feature_column] < b[feature_column] ? -1 : 1
            }
        });
        // get dictForPlot
        let dictForPlot = {};
        dictForPlot["items"] = jsonForData.map(item => item[feature]);
        dictForPlot[y_column] = jsonForData.map(item => item[y_column]);
        dictForPlot["count"] = jsonForData.map(item => item["count"]);
        return dictForPlot;
    };

    const processDetails = () => {
        try {
            // set tabs
            // list of tabs contains all tab
            let tabs = [];
            // index for the tabs
            let i = 0;

            // get targetClass from targetName and dict for quality_by_feature
            const targetClass = Object.keys(targetNames);
            const quality_by_feature = JSON.parse(detailsRow?.quality_by_feature);
            const confusion_column = "confusion";

            // performanceBySlice is an object where keys are slices and values are performance report
            const performanceBySlice = JSON.parse(detailsRow?.performance_by_slice.replace(/NaN/g, null));
            const accuracyBySlice = {
                'slices': Object.keys(performanceBySlice),
                'accuracy': Object.values(performanceBySlice).map(item => item.accuracy)
            };
            setAccuracyBySlice(accuracyBySlice);

            // Tabs for confusion group plot
            targetClass.forEach((label) => {
                let keyRef = "ref_target_" + String(label);
                let keyCur = "cur_target_" + String(label);

                // Reference dataset
                let jsonForRef = JSON.parse(quality_by_feature[keyRef]);
                // get dict for plot
                let dictForRef = getDictForPlot(jsonForRef, feature, confusion_column);

                // Current dataset
                let jsonForCur = JSON.parse(quality_by_feature[keyCur]);
                // get dict for plot
                let dictForCur = getDictForPlot(jsonForCur, feature, confusion_column);

                let tab = {
                    key: feature + String(i),
                    id: feature + String(i),
                    tabTitle: "Class " + String(label),
                    content: <div style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{ width: "50%" }}>
                            <ClassConfusionPlot data={dictForCur} dataset={"Current"} plotHeight="248" />
                        </div>

                        <div style={{ width: "50%" }}>
                            <ClassConfusionPlot data={dictForRef} dataset={"Reference"} plotHeight="248" />
                        </div>
                    </div>
                }
                tabs.push(tab);
                i = i + 1;
            });
            setTabs(tabs);

        } catch (error) {
            console.error(error);
        }
    }

    if (lazyLoad && inView) {
        if (!detailsRow) {
            processDetails();
        }
    }

    useEffect(() => {
        if (!lazyLoad) {
            processDetails();
        }
    }, [detailsRow]);

    const [currentTab, setCurrentTab] = useState(feature + String(0));
    const handleTabClick = (e) => {
        setCurrentTab(e.target.id);
    };
    let xval = accuracyBySlice?.slices || [];
    let yval = accuracyBySlice?.accuracy || [];
    let sortedXLabels = [];
    let sortedYValues = [];
    if (Array.isArray(xval)) {
        const combinedData = xval.map((label, index) => ({ label, value: yval[index] }));
        combinedData.sort((a, b) => b.value - a.value);
        sortedXLabels = combinedData.map(item => item.label);
        sortedYValues = combinedData.map(item => item.value);
    }


    const options = {
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    return (
        <>
            <div className="class_performance_details_row" ref={ref}>
                <Accordion innerContents={
                    <>
                        <div style={{ width: "100%" }} >
                            <h5>Accuracy by sub-population</h5>

                            <SubpopulationBarChart xVal={sortedXLabels} yVal={sortedYValues}
                                xLabel='bin/value' yLabel='accuracy'
                                margin={{ t: 30, b: 8, pad: 4 }}
                                plotHeight={100} />

                        </div>
                        <div className='tabs' id={"class-performance-quality-by-" + feature}>
                            <ul className='tabs-container' role='tablist'>
                                {tabs?.map((tab, index) =>
                                    <li key={tab.key} id={tab.id} className='tab' style={currentTab == tab.id ? { color: "red" } : {}} onClick={(handleTabClick)}>
                                        {tab.tabTitle}
                                    </li>
                                )}
                            </ul>

                            {tabs.map((tab, index) =>
                                <div key={tab.key}>
                                    {currentTab === `${tab.id}` && <div>{tab.content}</div>}
                                </div>
                            )}
                        </div>
                    </>
                }
                    outerContents={
                        <div style={{ display: "flex" }}>
                            <div style={{ width: "20%" }}>
                                <h5>Feature</h5>
                                <p>{feature}</p>
                                <h5>Correlation Score 
                                    <Tooltip text="The score shows the correlation between the model performance and feature drift."/>
                                </h5>
                                <p>{parseFloat(detailsRow?.correlation_score).toFixed(6)}</p>
                            </div>
                            <div style={{ width: "70%" }}>
                                <LineChart
                                    x={timestamps}
                                    y={chartData}
                                    title="Feature drift score by feature vs Performance score"
                                    x_label="timestampe"
                                    y_label="Performance score"
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
