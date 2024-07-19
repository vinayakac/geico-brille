import React from 'react';
import Plotly from 'plotly.js-dist';
import { dark_template, seaborn_template } from '../../utils/plotlyTemplates.js';
import Cookies from 'js-cookie';
import { useState, useEffect, useRef } from 'react';

export default function AUCChart(props) {
    const gdkTheme = Cookies.get('gdkTheme');
    const [bound, setBound] = useState(false);
    let template;
    if (gdkTheme == 'dark') {
        template = dark_template;
    } else {
        template = seaborn_template;
    }
    if (props.showlegend == undefined) {
        props.showlegend = true;
    }

    let thresholds = []
    props.z.forEach((d) => {
        thresholds.push("threshold: " + d.toFixed(4));
    })

    var data = [];
    var trace = {
        x: props.x,
        y: props.y,
        text: thresholds,
        hoverinfo: "text",
        type: 'scatter',
    };
    data.push(trace);

    const layout = {
        autosize: true,
        title: {
            text: props.title,
            font: {
                size: 12
            }
        },
        xaxis: {
            range: [0, 1.25],
            tickfont: {
                size: 10
            },
            title: {
                text: props.x_label,
                font: {
                    size: 10
                }
            }
        },
        yaxis: {
            range: [0, 1.25],
            tickfont: {
                size: 10
            },
            title: {
                text: props.y_label,
                font: {
                    size: 10
                }
            }
        },
        margin: props.margin,
        height: props.plotHeight,
        template: template,
        showlegend: props.showlegend,
    };
    if (props.backgroundColor) {
        layout.paper_bgcolor = props.backgroundColor;
        layout.plot_bgcolor = props.backgroundColor;
    }
    const plotRef = useRef(null);

    const handleGraphClick = (event) => {
        const point = event.points[0];
        if (props.handleClick) {
            props.handleClick(point.x, point.y);
        }
    }

    useEffect(() => {
        if (plotRef.current) {
            Plotly.react(plotRef.current, data, layout);
            if (!bound && props.handleClick) {
                plotRef.current.on('plotly_click', handleGraphClick);
                setBound(true);
            }
        }
    })

    return (
        <div ref={plotRef} style={{ width: '100%' }} />
    );
}