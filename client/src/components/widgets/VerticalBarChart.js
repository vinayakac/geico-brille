import React from 'react';
import Plot from 'react-plotly.js';
import Cookies from 'js-cookie';
import { dark_template, seaborn_template } from '../../utils/plotlyTemplates.js';
/**
 * A component that creates vetical bar plot. 
 * @param {list} xValues - The x values
 * @param {list} yValues - The y values
 * @param {number} maxValuesToShow - Maximum number of values to display
 * @param {string} xTitle - x-axis title
 * @param {string} yTitle - y-axis title
 */
export default function VerticalBarChart({Title, xValues, yValues, maxValuesToShow, xTitle, yTitle}) {
  const gdkTheme = Cookies.get('gdkTheme');
  let template;
  if (gdkTheme == 'dark') {
      template = dark_template;
  } else {
      template = seaborn_template;
  }
  const maxValue = xValues[0] + 0.2;
  const data = [{
    x: xValues.slice(0, maxValuesToShow).reverse(),
    y: yValues.slice(0, maxValuesToShow).reverse(),
    type: 'bar',
    orientation: 'h',
    marker:{
      color: 'blue',
      line: {
        color: 'black',
        width: 2,
      },
      width: 15, // adjust bar width
    }
  }];

  const layout = {
      title: {
          text: Title,
          font: {
              size: 16,
              color: 'mediumorchid',
              weight: 'bold',
          },
          x: 0.5,
          xanchor: 'center',
      },
      xaxis: {
        title: {
            text: xTitle,
            standoff: 40, // set the distance from the x-axis labels 
            font: { 
                size: 14, 
                weight: 'bold',
            },
          },
        side: 'left',  
        automargin: true,
        showline: true,
        line: {width: 1, length: 0.03},
        range: [0, maxValue],
        dtick: 0.2 // set tick interval
      },
      yaxis: {
        title: {
            text: yTitle,
            standoff: 40, // set the distance from the y-axis labels 
            font: { 
                size: 14,
                weight: 'bold',
            },
        },
        automargin: true,
        showline: true,
        titlefont: {margin: { t:30}},
        tickfont: { size: 13},
      },
      autosize: true,
      width: 1000, // set the width of the plot layout
      height: 700, // set the height of the plot layout
      bargap: 0.4, // adjust gap between bars
      template: template
  };

  const config = {
    displayModeBar: true,
    responsive: true,
  };

  return (
    <div style={{width: '100%', height: '100%'}}>
      <Plot data={data} layout={layout} config={config}/>
    </div>  
    );
}
