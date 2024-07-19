import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import '../../gdk/css/geico-design-kit.css';
import '../cards/cards.css';
import Accordion from '../Accordion';
import LineChart from '../widgets/LineChart';
import FeatureHistogramPlot from '../widgets/FeatureHistogramPlot';

export default function RegPerformanceDetailsCard({ detailsRow, lazyLoad, metric, timestamps, performanceScore, dataDriftScore }) {
    const [dictForHist, setDictForHist] = useState();

    const feature = detailsRow?.feature;
    const { ref, inView, entry } = useInView({
        threshold: 0,
        triggerOnce: true
    });

    // create data for line chart of data drift score by feature vs target drift score
    const chartData = {};
    chartData[metric] = performanceScore[metric];
    chartData[feature] = dataDriftScore;

    const processDetails = () => {
        try {
            // set dictForHist
            const jsonForHist = JSON.parse(detailsRow?.json_for_hist);
            jsonForHist.sort((a, b) => (a.x - b.x));
            const dictForHist = {};
            dictForHist.current = jsonForHist.map(item => item.current);
            dictForHist.reference = jsonForHist.map(item => item.reference);
            dictForHist.items = jsonForHist.map(item => item.x);
            setDictForHist(dictForHist);
        } catch (error) {
            console.error(error);
        }
    }

    if (lazyLoad && inView) {
        if (!detailsRow) {
            processDetails();
        }
    }
    
    useEffect(() => {
        if (!lazyLoad) {
            processDetails();
        }
    }, [detailsRow]);


    return (
        <>
            <div className="class_performance_details_row" ref={ref}>
                <Accordion innerContents={
                    <>
                        <div style={{ width: "100%" }} >
                            <FeatureHistogramPlot 
                                items={dictForHist?.items} 
                                current={dictForHist?.current}
                                reference={dictForHist?.reference} 
                                plotHeight="100%" />
                        </div>
                    </>
                }
                outerContents={
                    <div style={{ display: "flex" }}>
                        <div style={{ width: "20%" }}>
                            <h5>Feature</h5>
                            <p>{feature}</p>
                            <h5>Correlation Score</h5>
                            <p>{parseFloat(detailsRow?.correlation_score).toFixed(6)}</p>
                        </div>
                        <div style={{ width: "70%" }}>
                            <LineChart 
                                x={timestamps} 
                                y={chartData} 
                                title="Feature drift score by feature vs Performance score" 
                                x_label="timestampe" 
                                y_label="Performance score"
                                margin={{ t: 30, b: 8, pad: 4 }} 
                                plotHeight={200}
                                showlegend={true} />
                        </div>
                    </div>
                }/>
            </div>
        </>
    );
}
