import React from 'react';
import Plotly from 'plotly.js-dist';
import { dark_template, seaborn_template } from '../../utils/plotlyTemplates.js';
import Cookies from 'js-cookie';
import { useState, useEffect, useRef } from 'react';

export default function LineChart(props) {
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

    var data = [];
    const keys = Object.keys(props.y);
    keys.forEach((item) => {
        let visibility = true;
        if (props.selected) {
            visibility = "legendonly";
            if (props.selected.includes(item)) {
                visibility = true;
            }
        }

        var trace = {
            x: props.x,
            y: props.y[item],
            type: 'scatter',
            name: item,
            visible: visibility
        };

        data.push(trace);
    })

    // add vertical line points to shapes
    var shapes = [];
    if (props.xBounds) {
        props.xBounds.forEach((item) => {
            var shape = {
                type: 'line',
                x0: item,
                y0: 0,
                x1: item,
                y1: 1,
                xref: 'x',
                yref: 'paper',
                line: {
                    color: 'grey',
                    width: 4,
                    dash: 'dot'
                }
            }
            shapes.push(shape);
        })
    }

    // add annotations
    var annotations = [];
    if (props.annotations) {
        for (let item in props.annotations) {
            var annotation = {
                x: props.annotations[item],
                y: 1,
                xref: 'x',
                yref: 'paper',
                text: item,
                showarrow: false,
            }
            annotations.push(annotation);
        }
    }

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
        shapes: shapes,
        annotations: annotations,
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