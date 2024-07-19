import React, {memo, useState, useEffect} from 'react';
import LineChart from '../widgets/LineChart';
import FilledLineChart from '../widgets/FilledLineChart';
import '../cards/cards.css'

/** 
 * This component, Model Performance chart, gets called from multiple pages: model's summary page, model's monitoring overview
 * and from the model perfromance page. To improve loading time of the chart, this component was wrapped with memo
 * to prevent re-rendering if props did not change.
 */
function ModelPerformanceTrendCard({ model, modelType, onClickHandle }) {

    const [timestamps, setTimestamps] = useState([]);
    const [values, setValues] = useState([]);

    const handleClick = (x, y) => {
        onClickHandle(x);
    };

    const fetchRequests = async () => {
        try {
            const file = `${model}/model_performance_summary/results.csv`;
            const response = await fetch(`/api/download_csv?file=${file}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            const data = await response.json();
            // filter out the rows that "deprecated" column value is True
            const actualData = data.filter(d => (
                !d.hasOwnProperty('deprecated') || d.deprecated == null || d.deprecated == 'False'
            ));
            actualData.sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
            setTimestamps(actualData.map(d => d.end_date));

            // compute metrics values depends on model type
            let values = {};
            if (modelType == "classification") {
                // get metrics list
                const keys = Object.keys(actualData[0]);
                let metrics = [];
                keys.forEach((item) => {
                    if (item.startsWith("current_")) {
                        metrics.push(item.replace("current_", ""));
                    }
                })
                // get metrics value
                metrics.forEach((metric) => {
                    values[metric] = {};
                    values[metric]["value"] = actualData.map(d => parseFloat(JSON.parse(d["current_" + metric]).value))
                    values[metric]["upper"] = actualData.map(d => parseFloat(JSON.parse(d["current_" + metric]).upper))
                    values[metric]["lower"] = actualData.map(d => parseFloat(JSON.parse(d["current_" + metric]).lower))
                })
            }
            else if (modelType == "regression") {
                // get metrics list
                const keys = Object.keys(actualData[0]);
                let metrics = [];
                keys.forEach((item) => {
                    if (item.startsWith("current_") && item.split("_").length == 2) {
                        metrics.push(item.replace("current_", ""));
                    }
                })
                // get metrics value
                metrics.forEach((metric) => {
                    values[metric] = {};
                    values[metric]["value"] = actualData.map(d => parseFloat(d["current_" + metric]))
                    values[metric]["upper"] = actualData.map(d => parseFloat(d["current_" + metric]))
                    values[metric]["lower"] = actualData.map(d => parseFloat(d["current_" + metric]))
                })
            }
            else if (modelType == "recommendation") {
                // get metrics list
                const cur_performance = JSON.parse(actualData[0].cur_performance);
                const metrics = Object.keys(cur_performance);
                // get metrics value
                metrics.forEach((metric) => {
                    values[metric] = {};
                    values[metric]["value"] = actualData.map(d => JSON.parse(d.cur_performance)[metric]["overall"])
                    values[metric]["upper"] = actualData.map(d => JSON.parse(d.cur_performance)[metric]["overall"])
                    values[metric]["lower"] = actualData.map(d => JSON.parse(d.cur_performance)[metric]["overall"])
                })
            }
            setValues(values);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    return (
        <FilledLineChart
            x={timestamps}
            y={values}
            title="Model performance over time"
            x_label="Timestamp"
            y_label="Metrics"
            handleClick={handleClick}
            margin={{ t: 30, b: 8, pad: 4 }}
            plotHeight={200} />
    );
};

export default React.memo(ModelPerformanceTrendCard);