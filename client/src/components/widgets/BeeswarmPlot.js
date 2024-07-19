import React from 'react';
import Plot from 'react-plotly.js';

/**
 * A component that creates beeswarm plot based on features shap values.
 * Display how the top features in a dataset impact the model's output.
 * The x position of the dot is determined by the SHAP value of that feature.
 * Color is used to display the original value of a feature. 
 * @param {list} sortedFeatures - Sorted features based on average of their shap values 
 * @param {object} shapValues - Calculated features Shap values
 * @param {object} featureValues - Dataset features value
 */
export default function BeeswarmPlot({sortedFeatures, shapValues, featureValues }) {
    const traces = sortedFeatures.map((name) => ({
        x: shapValues.map((item) => item[name]), 
        y: shapValues.map(() => name),
        orientation: 'h',
        type: 'scatter',
        mode: 'markers',
        marker: { 
            size: 8, 
            color: featureValues.map((item) => item[name]),
            colorscale: 'Viridis',
            reversescale: true,
            showscale: true,
            colorbar: {
                thickness: 20,
                xpad:10,
                ypad: 0,
                showticklabels: false,
                title: 'Feature Value',
                titlefont: {size: 14},
                titleside: 'right',
            },            
        },
        box: {visible: true },
        meanline: {visible: true },
        side: 'negative',
        width: 0.5,
        points: 'all',
        pointpos: -1.8,
        jitter: 0.7,
    }));

    const layout = {
        xaxis: { 
            tickfont: {
                size: 10
            },
            title: {
                text: 'SHAP value (impact on model output)',
                font: { 
                    size: 10, 
                    color: 'red',
                    weight: 'bold',
                },
            },
            automargin: true, 
            showline: true,
        },
        yaxis: {
            tickfont: {
                size: 10
            },
            title: {
                text: 'Features Name',
                standoff: 5, // set the distance from the y-axis labels 
                font: { 
                    size: 10,
                    color: 'red',
                    weight: 'bold',
                },
            },
            automargin: true,
        },
        hovermode: 'closest',
        showlegend: false,
        margin: {l:20, r:20, t:20, b:20},
        colorbar: {title: 'Feature Impact'},
        width: 1200, // set the width of the plot layout
        height: 1800, // set the width of the plot layout
    };

    const config = {
        displayModeBar: true,
    };
 
    return (
        <Plot data={traces} layout={layout} config={config}/>
    );
}
