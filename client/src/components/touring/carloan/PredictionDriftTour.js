import Tour from 'reactour';
import { useState, useEffect } from 'react';

export const PredictionDriftTour = ({ nextPageFn, onCloseFn }) => {
    const [isTourOpen, setIsTourOpen] = useState(true);
    const [step, setStep] = useState(0);
    const getCurrentStep = (step) => {
        if (step == tourSteps.length - 1) {
            nextPageFn("drift")
        }
        setStep(step);
    };

    const onRequestClose = () => {
        setIsTourOpen(false);
        onCloseFn();
    }
    const tourSteps = [
        {
            selector: '.side-navigation-panel-select-option-selected',
            content: `
                Prediction Drift tab shows you more details about
                your model predictions.
            `,
        },
        {
            selector: '#target-drift-summary',
            content: `
                Summary card gives you the rundown of the latest evaluation
                of the performance drift metrics.
            `,
        },
        {
            selector: '#report-date-range',
            content: `
                Latest report was on logs from this date range.
            `,
        },
        {
            selector: '#report-result',
            content: `
                This is reports conclusion.
            `,
        },
        {
            selector: '#report-stattest',
            content: `
                Here is the information about statistical test that was used to evaluate
                prediction drift.
            `,
        },
        {
            selector: '#report-stattest-score',
            content: `
                And here is the result of that statistical test.
            `,
        },
        {
            selector: '#class-representation',
            content: `
                This is a visual representation of the distribution shift.
                As you can see, compared to the reference dataset, analyzed log period
                shows that model outputs lower confidence in the prediction.
            `,
        },
        {
            selector: '#repaid_loan_on_prev_car-details',
            content: `
                Here you can find the breakdown of the predictions by feature value.
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