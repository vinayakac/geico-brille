import React from 'react';
import Plotly from 'plotly.js-dist';
import { dark_template, seaborn_template } from '../../utils/plotlyTemplates.js';
import Cookies from 'js-cookie';
import { useState, useEffect, useRef } from 'react';

export default function AreaChart(props) {
    const gdkTheme = Cookies.get('gdkTheme');
    const [bound, setBound] = useState(false);
    let template;
    if (gdkTheme == 'dark') {
        template = dark_template;
    } else {
        template = seaborn_template;
    }
    const data = [
        {
            x: props.x,
            y: props.y,
            type: 'scatter',
            mode: 'lines',
            fill: 'tozeroy'
        },
    ];
    const layout = {
        autosize: true,
        title: {
            text:props.rangeselector ? '' : props.title || "",
            font: {
                size: 12
            },
            xanchor: 'left',
            yanchor: 'top'
        },
        xaxis: {
            tickfont: {
                size: 10
            },
            title: {
                text:props.rangeselector ? '' : props.x_label,
                font: {
                    size: 10
                }
            }, showticklabels: !props.hidexticklabels,
            rangeselector: props.rangeselector ? props.rangeselector : {},
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
    });


    return (
        <div ref={plotRef} style={{ width: '100%' }} /> 
    );
}