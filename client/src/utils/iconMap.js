function IconMap(state) {
    const  icons = {
        "SUCCESS": "icon-confirmation",
        "CANCELED": "icon-non-critical-warning",
        "SKIPPED": "icon-chevron-double-right",
        "FAILED" : "icon-close",
        "RUNNING" : "icon-play"
    }

    return icons[state];

}

function IconColorMap(state) {
    const colors = {
        "SUCCESS": "state-icon-succeeded",
        "CANCELED": "state-icon-canceled",
        "SKIPPED": "state-icon-skipped",
        "FAILED" : "state-icon-failed",
        "RUNNING" : "state-icon-running"
    }
    return colors[state];
}

export { IconColorMap, IconMap };