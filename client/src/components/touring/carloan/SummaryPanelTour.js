import Tour from 'reactour';
import { useState, useEffect } from 'react';

export const SummaryPanelTour = ({ nextPageFn, onCloseFn }) => {
    const [isTourOpen, setIsTourOpen] = useState(true);
    const [step, setStep] = useState(0);
    const getCurrentStep = (step) => {
        if (step == tourSteps.length - 1) {
            nextPageFn("prediction-drift")
        }
        setStep(step);
    };
    const onRequestClose = () => {
        setIsTourOpen(false);
        onCloseFn();
    }
    const tourSteps = [
        {
            selector: '#model_name',
            content: `
                Welcome to model monitoring tour!
                Let's take you through this example.'
            `,
        },
        {
            selector: '.side-navigation-panel-select-option-selected',
            content: `
                Summary page shows you trends for your model over time
                and some model highlights.
            `,
        },
        {
            selector: '#prediction_drift_summary',
            content: `
                Prediction drift graph over time shows
                whether the distribution of model predictions shifted with time.
                Some fluctuation is normal, remember to look for a visible trend.
                Take a look at this graph - values close to 0 mean that it has!
            `,
        },
        {
            selector: '#drift_trend_summary',
            content: `
                Drift trend graph shows which features have shifted
                distributions. Try clicking on legend to show and hide them
                on the graph.
                Seems like the "car_value" feature drifted the most!
            `,
        },
        {
            content: ''
            // Navigation step
        }
    ];

    return (
        <Tour className="brille-tour" steps={tourSteps} goToSteps={step} startAt={step} isOpen={isTourOpen}
            onRequestClose={onRequestClose} currentStep={step}
            getCurrentStep={getCurrentStep} showNavigation={false} showNumber={false} /> 
        
    )
}