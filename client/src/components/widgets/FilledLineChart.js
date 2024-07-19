import React from 'react';
import Plotly from 'plotly.js-dist';
import { dark_template, seaborn_template } from '../../utils/plotlyTemplates.js';
import Cookies from 'js-cookie';
import { useState, useEffect, useRef } from 'react';

export default function FilledLineChart(props) {
    const gdkTheme = Cookies.get('gdkTheme');
    const [bound, setBound] = useState(false);
    let template;
    if (gdkTheme == 'dark') {
        template = dark_template;
    } else {
        template = seaborn_template;
    }

    var data = [];
    const keys = Object.keys(props.y);
    var x1 = props.x;
    var x2 = JSON.parse(JSON.stringify(x1));
    var xTime = x1.concat(x2.reverse());
    keys.forEach((item) => {
        var upper = props.y[item].upper;
        var lower = props.y[item].lower;

        var trace1 = {
            x: props.x,
            y: props.y[item].value,
            mode: "lines",
            type: 'scatter',
            name: item,
        };
        var trace2 = {
            x: xTime,
            y: upper.concat(lower.reverse()),
            fill: "tozerox",
            fillcolor: "rgba(0,176,246,0.2)",
            line: { color: "transparent" },
            type: 'scatter',
            name: item,
            showlegend: false,
        };

        data.push(trace1);
        data.push(trace2);
    })

    const layout = {
        autosize: true,
        title: {
            text: props.title,
            font: {
                size: 12
            }
        },
        xaxis: {
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
        template: template
    };
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