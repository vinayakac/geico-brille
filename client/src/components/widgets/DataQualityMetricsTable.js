import React from 'react';

export default function DataQualityMetricsTable({ data, ftrType }) {
    
    return (
        <>
            <table className="table">
                <thead>
                    <tr>
                        <th>Data Quality Metrics</th>
                        <th>Reference</th>
                        <th>Current</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Missing Percentage</td>
                        <td>{data?.reference_missing_percentage}</td>
                        <td>{data?.current_missing_percentage}</td>
                    </tr>
                    <tr>
                        <td>Most Common Item</td>
                        <td>{data?.reference_most_common}</td>
                        <td>{data?.current_most_common}</td>
                    </tr>
                    <tr>
                        <td>Most Common Item Percentage</td>
                        <td>{data?.reference_most_common_percentage}</td>
                        <td>{data?.current_most_common_percentage}</td>
                    </tr>
                    {/*Display cardinality metrics only for 'cat[egorical]' type features */}
                    <tr>
                        {ftrType=='cat' && (
                        <>
                        <td>Cardinality</td>
                        <td>{data?.reference_cardinality}</td>
                        <td>{data?.current_cardinality}</td>
                        </>
                        )}
                    </tr>
                    {/*Display min/max/mean/std metrics only for 'num[erical]' type features */}
                    <tr>
                        {ftrType=='num' && (
                        <>
                        <td>Min Value</td>
                        <td>{data?.reference_min}</td>
                        <td>{data?.current_min}</td>
                        </>
                        )}
                    </tr>
                    <tr>
                        {ftrType=='num' && (
                        <>
                        <td>Max Value</td>
                        <td>{data?.reference_max}</td>
                        <td>{data?.current_max}</td>
                        </>
                        )}
                    </tr>
                    <tr>
                        {ftrType=='num' && (
                        <>
                        <td>Mean Value</td>
                        <td>{data?.reference_mean}</td>
                        <td>{data?.current_mean}</td>
                        </>
                        )}
                    </tr>
                    <tr>
                        {ftrType=='num' && (
                        <>
                        <td>Standard Deviation</td>
                        <td>{data?.reference_std}</td>
                        <td>{data?.current_std}</td>
                        </>
                        )}
                    </tr>
                </tbody>
            </table>
        </>
    );
}