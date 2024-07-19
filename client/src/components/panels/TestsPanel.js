export const TestsPanel = ({ modelConfig }) => {
    const tests = [{ name: "Quality Tests", checks: [{ name: "Check the score.py exists", status: "success" }, { name: "Fairness tests", status: "fail" }] }, {
        name: "Integration Tests", checks:
            [{ name: "Single request result", status: "success" }, { name: "Environment compatibility test", status: "fail" }, { name: "Expected latency check", status: "success" }]
    }]

    return <>
        <h4 style={{ paddingTop: "10px" }}> {modelConfig?.display_name}</h4>
        {tests.map(({ name, checks }) => <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ flex: 3, padding: "0 10px 0 20px" }}>
                <h4 style={{ paddingTop: "10px", color: "green" }}>{name}</h4>
                <ul style={{ width: "50%" }}>
                    {checks.map(({ name, status }) => <li style={{ display: "flex", justifyContent: "space-between" }}>
                        <h5 >{name}</h5>

                        {status === "success" ? <span className="icon-check-mark" style={{ verticalAlign: "text-bottom", color: "#66BB6A", paddingRight: "8px" }} /> : null}

                        {status === "fail" ? <span className="icon-alert" style={{ verticalAlign: "text-bottom", color: "red", paddingRight: "8px" }} /> : null}

                    </li>)}

                </ul>
            </div>
        </div>)}



    </>
}