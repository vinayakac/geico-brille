
export const ModelPerformanceSmallCard = ({ summary,hidecurrent }) => {
    const keys = Object.keys(summary);
    let metrics = [];
    keys.forEach((item) => {
        if (item.startsWith("current_") && item.split("_").length == 2) {
            metrics.push(item.replace("current_", ""));
        }
    })

    let reference = {};
    let current = {};
    metrics.forEach((d) => {
        if (!isNaN(parseFloat(JSON.parse(summary["current_" + d])))) {
            current[d] = parseFloat(JSON.parse(summary["current_" + d])).toFixed(2);
            reference[d] = parseFloat(JSON.parse(summary["reference_" + d])).toFixed(2);
        }
        else {
            current[d] = parseFloat(JSON.parse(summary["current_" + d]).value).toFixed(2);
            reference[d] = parseFloat(JSON.parse(summary["reference_" + d]).value).toFixed(2);
        }
    })
    return (
        <>
            <table style={{ width: "100%" }}>
                <thead>
                    <tr>
                        <th>

                        </th>
                        <th>
                            Reference
                        </th>
                        {hidecurrent ? null :<th>
                            Current
                        </th>}
                    </tr>
                </thead>
                <tbody>
                    {metrics.map((d, index) => (
                        <tr  key={index}>
                            <td>{d}</td>
                            <td>{reference[d]}</td>
                            {hidecurrent ? null : <td>{current[d]}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
};