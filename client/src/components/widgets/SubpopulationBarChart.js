import React from 'react';

import Plot from 'react-plotly.js';
import { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { dark_template, seaborn_template } from '../../utils/plotlyTemplates.js';



const SubpopulationBarChart = (props) => {

    // Sample data

    const data = [

        {

            x: props.xVal,

            y: props.yVal,

            type: 'bar',
            title: props.title
        }

    ];

    const xLabel = props.xLabel;
    const yLabel = props.yLabel;
    const gdkTheme = Cookies.get('gdkTheme');
    let template;
    if (gdkTheme == 'dark') {
        template = dark_template;
    } else {
        template = seaborn_template;
    }



    return (

        <div>
            <Plot data={data} layout={{
                autosize: true,
                xaxis: {

                    title: xLabel,
                    automargin: true, // Adjust the margins automatically
                }, yaxis: { title: yLabel, },
                template: template
            }}
                style={{ width: '99%' }} />




        </div>

    );

};



export default SubpopulationBarChart;