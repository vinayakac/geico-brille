import Tour from 'reactour';
import { useState, useEffect } from 'react';

export const DataDriftTour = ({ nextPageFn, onCloseFn }) => {
    const [isTourOpen, setIsTourOpen] = useState(true);
    const [step, setStep] = useState(0);

    const onRequestClose = () => {
        setIsTourOpen(false);
        onCloseFn();
    }
    const tourSteps = [
        {
            selector: '.side-navigation-panel-select-option-selected',
            content: `
                Feature Drift tab can help you drill into individual feature drift.
            `,
        },
        {
            selector: '#drifted-num-columns',
            content: `
                Timeline graph shows that amount of drifted column suddenly increased
                in May.
            `
        },
        {
            selector: '#drift-by-feature',
            content: `
                Timeline graph by feature shows which features show trend in drifting.
                Try clicking on feature name.
            `
        },
        {
            selector: '#drift-date-range',
            content: `
                Most recent data is month of August of 2019 was used to create report below.
            `
        },
        {
            selector: '#total-drifted-columns',
            content: `
                Statistical analysis detected drift for 4 out of 7 features in the dataset.
            `
        },
        {
            selector: '#car_value-details',
            content: `
                Each feature is displayed in this list. Try clicking on the card to see the
                feature distribution.
            `
        }
    ];

    return (
        <Tour className="brille-tour" steps={tourSteps} startAt={step} isOpen={isTourOpen}
            onRequestClose={onRequestClose} currentStep={step}
            lastStepNextButton={<button href="#">Done! Let's start monitoring</button>}
            showNavigation={false} showNumber={false} />

    )
}