import { useMemo,useEffect } from 'react';
import Cookies from 'js-cookie';
import TotalRequestsCard from './cards/TotalRequestsCard';
/**
A component that displays data about the model usage from Insights App.
It's organized in three graphs: requests in the last week, month, year.
@param {string} model - The model name
@returns {JSX.Element} A react component
*/
export default function ModelUsage({ model}) {
  const gdkTheme = Cookies.get('gdkTheme');
  const rangeselector = useMemo(() => ({
    bgcolor:gdkTheme == 'dark' ?'#000':'#fff',
    buttons: [
      {
        count: 1,
        label: '24h',
        step: 'hour',
        stepmode: 'backward',
        
      },
      {
        count: 7,
        label: '7d',
        step: 'day',
        stepmode: 'backward',
        
      },
      {
        count: 30,
        label: '30d',
        step: 'day',
        stepmode: 'backward',
        
      }
    ]
  }), [gdkTheme]);
  return (
    <div className="panel-content" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: "10px" }}>
        <TotalRequestsCard model={model} timespan={"P30D"} granularity={"1d"} rangeselector={rangeselector}  />
      </div>
    </div>
  );
}