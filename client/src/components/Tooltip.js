import { useEffect, useState } from 'react';

export default function Tooltip(props) {
    const [tooltipId, setTooltipId] = useState(Math.floor(Math.random() * 10000));

    useEffect(() => {
        new GDK.Tooltip({
            content: document.getElementById(`span-tooltip-${tooltipId}`)
        });
    }, []);

    return (
        <span className="tooltip-container">
            <a href="#" id={"span-tooltip-" + tooltipId} className="tooltip-trigger" data-tooltip-view={"tooltip-" + tooltipId}>
                <span className="icon-question-mark"></span>
            </a>
            <span id={"tooltip-" + tooltipId} className="tooltip">
                <span tabIndex="0">{props.text} {props.children}</span>
                <button className="icon-close-20" aria-label="Close tooltip"></button>
            </span>
        </span>
    );
}