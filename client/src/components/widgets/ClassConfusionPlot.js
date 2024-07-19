import React from 'react';
import Plot from 'react-plotly.js';
import { dark_template, seaborn_template } from '../../utils/plotlyTemplates.js';
import Cookies from 'js-cookie';

export default function ClassConfusionPlot({ data, dataset, plotHeight }) {
    const gdkTheme = Cookies.get('gdkTheme');
    let template;
    if (gdkTheme == 'dark') {
        template = dark_template;
    } else {
        template = seaborn_template;
    }

    return (
        <Plot
            data={[
                {
                    x: data?.items,
                    y: data?.count,
                    transforms: [{
                        type: "groupby",
                        groups: data?.confusion,
                    }],
                    type: 'bar'
                }
            ]}
            layout={{
                autosize: true,
                title: {
                    text: 'dataset=' + dataset,
                    font: { size: 12 },
                    x: 0.5,
                },
                margin: {
                    l: 40,
                    r: 20,
                    b: 20,
                    t: 20,
                    pad: 0
                },
                height: plotHeight,
                template: template,
                barmode: 'stack'
            }}
            useResizeHandler
            style={{ width:'99%' }}
        />
    );
}