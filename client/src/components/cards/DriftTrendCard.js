import React from 'react';
import { useState, useEffect } from 'react';
import LineChart from '../widgets/LineChart';
import '../cards/cards.css'

/**
 * A component that displays trend analysis result over time.
 * 
 * @param {string} model - The model name
 * @param {string} type - The job type name
 * @param {string} onClickHandle - The click handle name
 * @param {string} chartTitle - The name of chart title
 * @param {string} chartXLabel - The name of chart x axis
 * @param {string} chartXLabel - The name of chart y axis 
 * @returns {JSX.Element} A react component
 */
export default function DriftTrendCard({ model, type, onClickHandle, chartTitle, chartXLabel, chartYLabel, showNumColumns = true }) {

    let valueKey;
    let valueCol;
    if (type == "drift") {
        valueKey = "Drifted columns";
        valueCol = "num_of_drifted_cols";
    }
    else if (type == "target_drift") {
        valueKey = "Drift score";
        valueCol = "drift_score";
    }
    else if (type == "prediction_drift") {
        valueKey = "Drift score";
        valueCol = "drift_score";
    }

    // timestamps array and values array for trend analysis graph
    const [timestampsTrendAnalysis, setTimestampsTrendAnalysis] = useState([]);
    const [valuesTrendAnalysis, setValuesTrendAnalysis] = useState([]);

    // list of fullFeatureList, features and featureFilter from the model
    const [fullFeatureList, setFullFeatureList] = useState([]);
    const [features, setFeatures] = useState([]);

    // data array for the graph of data drift scores by feature over time and is from column of data_drift_by_feature
    const [dataDriftByFeature, setDataDriftByFeature] = useState([]);
    const topDriftedNum = 5;
    const [topDrifted, setTopDrifted] = useState([]);
    // timestamps array and values array for the graph of data drift score by feature over time
    const [timestampsDataDriftByFeature, setTimestampsDataDriftByFeature] = useState([]);
    const [valuesDataDriftByFeature, setValuesDataDriftByFeature] = useState([]);

    const handleClick = (x, y) => {
        onClickHandle(x);
    };

    const fetchRequests = async () => {
        try {
            const file = `${model}/${type}_summary/results.csv`;
            const response = await fetch(`/api/download_csv?file=${file}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                }
            });
            const data = await response.json();
            let actualData = [];
            if (type == "target_drift") {
                // filter out the rows that "deprecated" column value is True
                actualData = data.filter(d => (
                    !d.hasOwnProperty('deprecated') || d.deprecated == null || d.deprecated == 'False'
                ));
            }
            else actualData = data;
            // sort data by end_date and calculate timestamps and values to visualize trend analysis
            actualData.sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
            setTimestampsTrendAnalysis(actualData.map(d => d.end_date));
            setValuesTrendAnalysis(actualData.map(d => parseFloat(d[valueCol])));

            // previous results doesn't have column of data_drift_by_feature, which is a dict contains jensen-shannon distance for each feature
            // filter out the rows with empty string for data_drift_by_feature in data and save to dataDriftByFeature
            if (type == 'drift') {
                const dataDriftByFeature = actualData.filter(d => d.data_drift_by_feature);
                setDataDriftByFeature(dataDriftByFeature);

                // sort dataDriftByFeature by end_date and calculate timestamps array to visualize data drift score by feature over time
                dataDriftByFeature.sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
                setTimestampsDataDriftByFeature(dataDriftByFeature.map(d => d.end_date));
                // Get the last date to get the latest drift scores
                const lastDateData = dataDriftByFeature.splice(-1)[0];

                if (lastDateData) {
                    // Parse json string that maps each feature to corresponding score
                    let scorePerFeatureObj = JSON.parse(lastDateData.data_drift_by_feature);
                    // Convert object to array and sort it by score, take top 5.
                    let result = Object
                        .entries(scorePerFeatureObj)
                        .sort(({ 1: a }, { 1: b }) => b - a)
                        .slice(0, topDriftedNum);
                    const topDrifted = result.map(feature_score => feature_score[0]);
                    setTopDrifted(topDrifted);
                }

                // get feature list and fullFeatureList
                const item = dataDriftByFeature[0];
                const features = Object.keys(JSON.parse(item?.data_drift_by_feature));
                features.sort();
                setFeatures(features);
                setFullFeatureList(features);
            }

        } catch (error) {
            console.error(error);
        }
    };

    const calcValuesDataDriftByFeature = async () => {
        try {
            // calculate values array to visualize data drift score by feature over time
            let valuesDataDriftByFeature = {};
            // loop filtered features list and calcualte an array of jensen-shannon distance for each feature
            features.forEach(f => {
                valuesDataDriftByFeature[f] = dataDriftByFeature.map(d => parseFloat(JSON.parse(d.data_drift_by_feature)[f]));
            })
            setValuesDataDriftByFeature(valuesDataDriftByFeature);

        } catch (error) {
            console.error(error);
        }

    }

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        calcValuesDataDriftByFeature();
    }, [dataDriftByFeature, features]);

    return (
        <>
            {showNumColumns &&
                <div id="drifted-num-columns">
                    <LineChart x={timestampsTrendAnalysis}
                        y={{ [valueKey]: valuesTrendAnalysis }}
                        title={chartTitle}
                        x_label={chartXLabel}
                        y_label={chartYLabel}
                        handleClick={handleClick}
                        margin={{ t: 30, b: 8, pad: 4 }}
                        plotHeight={250}
                        showlegend={true} />
                </div>
            }

            {
                (type == 'drift' && fullFeatureList) ? (
                    <>
                        <div id="drift-by-feature">
                            <LineChart
                                x={timestampsDataDriftByFeature}
                                y={valuesDataDriftByFeature}
                                title="Feature drift score over time"
                                x_label={chartXLabel}
                                y_label="Jensen-Shannon Distance"
                                handleClick={handleClick}
                                margin={{ t: 30, b: 8, pad: 4 }}
                                plotHeight={250}
                                selected={topDrifted}
                                showlegend={true} />
                        </div>
                    </>

                ) : (null)
            }

        </>
    );
}