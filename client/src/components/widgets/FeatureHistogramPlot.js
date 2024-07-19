import React from 'react';
import Plot from 'react-plotly.js';
import { dark_template, seaborn_template } from '../../utils/plotlyTemplates.js';
import Cookies from 'js-cookie';
import { useEffect } from 'react';

export default function FeatureHistogramPlot({ items, current, reference, plotHeight, xTitle, yTitle, start_date, end_date }) {
    const gdkTheme = Cookies.get('gdkTheme');
    let template;
    if (gdkTheme == 'dark') {
        template = dark_template;
    } else {
        template = seaborn_template;
    }
    const data =
        [
            { name: 'reference', type: 'bar', x: items, y: reference },
            { name: 'data from ' + start_date + ' to ' + end_date, type: 'bar', x: items, y: current },
        ];
    const layout = {
        xaxis: {
            tickfont: {
                size: 10
            },
            title: {
                text: xTitle,
                font: {
                    size: 10
                }
            },
        },
        yaxis: {
            tickfont: {
                size: 10
            },
            title: {
                text: yTitle,
                font: {
                    size: 10
                }
            },
        },
        legend: {x: 0.1, y: 1.3},
        autosize: true,
        margin: {
            l: 40,
            r: 20,
            b: 20,
            t: 20,
            pad: 0
        },
        height: plotHeight,
        template: template
    };

    useEffect(() => {
    })

    return (
        <Plot data={data} layout={layout} useResizeHandler={true} style={{ height: '100%', width: '100%'} }/>
    );
}