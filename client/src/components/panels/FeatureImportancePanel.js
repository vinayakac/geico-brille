import React, { useEffect, useState } from 'react';
import VerticalBarChart from '../widgets/VerticalBarChart';

/**
 * A component that get the feature importance Shap values from the job.
 * Sort the data based on the mean absolute value of each features in descending order.
 * Display the vertical bar plot of the features.
 * 
 * @param {string} model - The model name
 * @param {string} zone - The zone name
 * @param {string} jobId - The Feature Importance job Id
 * @param {integer} maxNumFeatures - Maximum number of features to display on the plot
 * @returns {JSX.Element} A react component
 */

export default function FeatureImportanceCard({ model, zone, jobId, maxNumFeatures=20}) {
    const [message, setMessage] = useState("");
    const [jobResultFolder, setJobResultFolder] = useState("");
    const [shapValues, setShapValues] = useState([{}]);
    const [sortedFeatureNames, setSortedFeatureNames] = useState([]);
    const [sortedMeanValues, setSortedMeanValues] = useState([])
    
    // Fetch latest Feature Importance job
    const fetchLatestJob = async () => {
        try {
            const response = await fetch(`/api/get_latest_job_run?model=${model}&type=feature_importance&jobId=${jobId}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            if (response.status == 200) {
                const data = await response.json();
                // Construct the job result folder - should match it on the server side
                const jobResultFolder = `${model}/${zone}/feature_importance/${parseInt(data.run_id)}`;
                setJobResultFolder(jobResultFolder);

            } else {
                setMessage("Execution error at fetchLatestJob: " + response.message);
            }
        } catch (error) {
            console.error(error);
            setMessage(error);
        }
    }

    // Fetch feature importance (shap) values
    const fetchShapValues = async () => {
        try {
            const path = `${jobResultFolder}/shap_data.json`;
            const response = await fetch(`/api/download_blob?file=${path}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            if (response.status == 200) {
                const data = await response.json();
                const regex = /{[^{}]*}/g;
                const jsonObjects = data.match(regex).map((obj) => JSON.parse(obj));
                setShapValues(jsonObjects);
            } else {
                setMessage("Execution error at fetchShapValues: " + response.message);
            }

        } catch (error) {
            console.log(error);
            setMessage(error);
        }
    }

    // sort the feature importance data by mean absolute value
    const prepareData = () => {
        try {
            const featureMeanValues = {};
            //Initialize feature sum values to 0
            Object.keys(shapValues[0]).map((feature) => {
                featureMeanValues[feature] = 0;
            });
            //Calculate sum of feature values for each sample 
            shapValues.map((sample) => {
                Object.entries(sample).map(([feature, value]) => {
                    featureMeanValues[feature] += Math.abs(value);
                });
            });
            //Calculate mean absolute value for each feature
            Object.keys(featureMeanValues).map((feature) => {
                featureMeanValues[feature] /= shapValues.length;
            });

            //Sort feature names and mean absolute values in descending order
            const sortedFeatureMeanValues = Object.entries(featureMeanValues).sort((a, b) => b[1] - a[1]);
            const sortedFeatureNames = sortedFeatureMeanValues.map(([feature]) => feature);
            const sortedMeanValues = sortedFeatureMeanValues.map(([_, meanValue]) => meanValue);
            setSortedFeatureNames(sortedFeatureNames);
            setSortedMeanValues(sortedMeanValues);

        } catch (error) {
            console.log(error);
            setMessage(error);
        }
    }

    useEffect(() => {
        if (jobId === undefined) {
            return;
        }
        fetchLatestJob();
    }, []);

    useEffect(() => {
        if (jobResultFolder) {
            fetchShapValues();
        }
    }, [jobResultFolder]);

    useEffect(() => {
        if (shapValues) {
            prepareData();
        }
    }, [shapValues]);
    
    return (
        <>
            {sortedMeanValues.length > 0 && sortedFeatureNames.length > 0 &&
                <div className='summary_row'>
                    <div style={{ marginTop: "10px" }}>
                        <VerticalBarChart Title='Feature Importance Bar Plot - Top 20' xValues={sortedMeanValues} yValues={sortedFeatureNames} maxValuesToShow={maxNumFeatures}
                            xTitle='Mean(|SHAP Value|) (average impact on model output magnitude)' yTitle='Features Name' />
                    </div>
                </div>
            }
        </>
    );
}
