import { useState, useEffect } from 'react';
import '../../gdk/css/geico-design-kit.css';
import Tooltip from '../../components/Tooltip.js';

function SliceRow({ slice, val }) {
    if (val > 0) {
        return (
            <tr>
                <td>{slice}</td>
                <td style={{ color: "green", fontWeight: 700 }}>&uarr; {val.toFixed(2)}%</td>
            </tr>
        );
    } else {
        return (
            <tr>
                <td>{slice}</td>
                <td style={{ color: "#d16969", fontWeight: 700 }}>&darr; {Math.abs(val).toFixed(2)}%</td>
            </tr>
        );
    }
}

export default function SlicePerformanceInsights({data, header, text}) {
  
    

    useEffect(() => {
    }, []);

    return (
        <>
            {header? (
                <div style={{ marginTop: "10px" }}>
                    <h4>
                        {header} 
                        <Tooltip text={text} />
                    </h4>
                </div>
                
            )
            : (
                <div style={{ marginTop: "10px" }}>
                    <h4>
                        Performance Insights by feature 
                        <Tooltip text={text} />
                    </h4>
                </div>
                
            )}

            <div className="data-table" style={{ maxHeight: "365px" }}>
                <div style={{ display: "flex" }}>
                    <div style={{ flex: 1 }}>
                        <table className="table" style={{ width: "100%", border: "none" }}>
                            <thead>
                                <tr>
                                    <th>Worst Values/Bins</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data["worst_performers"].map((slice, idx) => (
                                    <SliceRow key={idx} slice={slice[0]} val={slice[1]} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ flex: 1 }}>
                        <table className="table" style={{ width: "100%", border: "none" }}>
                            <thead>
                                <tr>
                                    <th>Best Values/Bins</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data["top_performers"].map((slice, idx) => (
                                    <SliceRow key={idx} slice={slice[0]} val={slice[1]} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
     );
}