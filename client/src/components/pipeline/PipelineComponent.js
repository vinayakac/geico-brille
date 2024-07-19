import React, { useEffect, useState } from 'react';
import Tooltip from '../Tooltip.js';
import '../../gdk/css/geico-design-kit.css';
import './pipeline.css';
import { FaCheckCircle, FaExclamationTriangle, FaCog } from 'react-icons/fa';

export default function PipelineComponent({ status, title, icon, positionLeft, positionTop }) {

    let statusIcon = <></>;
    if (icon == "check") {
        statusIcon = <FaCheckCircle />
    } else if (icon == "alert") {
        statusIcon = <FaExclamationTriangle />
    } else if (icon == "cog") {
        statusIcon = <FaCog />
    }

    useEffect(() => {
    }, []);

    return (
        <div className={`pipeline-component ${status}`} style={{ left: positionLeft, top: positionTop }}>
            <div className="content">
                <div className="component-title">{title}</div>
                <div className="component-icon">
                    { statusIcon }
                </div>
            </div>
        </div>
    );
}