import React from 'react';
import Plotly from 'plotly.js-dist';
import { dark_template, seaborn_template } from '../../utils/plotlyTemplates.js';
import Cookies from 'js-cookie';
import { useEffect, useRef } from 'react';

export default function HeatMapChart({ xLabels, yLabels, values, plotHeight, title, xAxis, yAxis }) {
    const gdkTheme = Cookies.get('gdkTheme');
    let template;
    if (gdkTheme == 'dark') {
        template = dark_template;
    } else {
        template = seaborn_template;
    }

    const data =
        [
            {
                z: values,
                x: xLabels,
                y: yLabels,
                type: 'heatmap',
                hoverinfo: 'skip',
                texttemplate: '%{z}',   // display values directly on the chart
            },
        ];
    const layout = {
        autosize: true,
        margin: {
            l: 40,
            r: 20,
            b: 20,
            t: 20,
            pad: 0
        },
        title: {
            text: title,
            font: { size: 12 },
            x: 0.5,
        },
        xaxis: {
            tickfont: {
                size: 10
            },
            title: {
                text: xAxis,
                font: { size: 10 },
            },
        },
        yaxis: {
            tickfont: {
                size: 10
            },
            title: {
                text: yAxis,
                font: { size: 10 },
            },
        },
        height: plotHeight,
        template: template
    };
    const plotRef = useRef(null);

    useEffect(() => {
        if (plotRef.current) {
            Plotly.react(plotRef.current, data, layout);
        }
    })

    return (
        <div ref={plotRef} style={{ width: '99%' }} />
    );
}