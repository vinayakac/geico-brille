import React, { useEffect } from 'react';
import { useUser } from '../utils/auth/useUser.js';
import axios from "axios";
import '../gdk/css/geico-design-kit.css';

export default function About() {
const user = useUser();
useEffect(() => {
    // Redirect to the new link when the component mounts
    window.location.href = " https://geico365.sharepoint.com/sites/AIMLSolutions/SitePages/ML-Platform-Team-Wiki.aspx";
}, []);
return (

    <>
        <div className="page-header--wrapper" style={{ "marginTop": "3em" }}>
            <div className="container ">
                <div className="row">
                    <div className="col-sm-12">
                        <div className="page-header page-header-bottom-border">
                            <div className="page-header-left">
                                <h2>About Brille</h2>
                                <h4>ML Model Observability and Governance</h4>
                            </div>
                            <div className="page-header-right">
                                <span className="geico-icon icon-show pull-right icon--secondary-teal"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <main role={"main"} id="wrapper" className='bg-color--cloudy'>
            <div className='container page-container' style={{ "marginTop": "0rem", "width": "100%", "padding": "0rem" }}>
            <div>
                <h1>Brille <span style={{"fontStyle": "italic"}}>(brĭl)</span></h1>
                <p>
                    The brille (also called the ocular scale, eye cap or spectacle) is the layer of transparent, 
                    immovable disc-shaped skin or scale covering the eyes of some animals for protection, especially in animals without eyelids. The brille has evolved from a fusion of the upper and lower eyelids. Brille means "spectacles" or "glasses" in German, Norwegian, and Danish, as well as "shine" in French and Spanish.{'\xa0'.repeat(2)}
                    <a target={"_blank"} href="https://en.wikipedia.org/wiki/Brille">More on Wikipedia</a>
                </p>
                <h1>Why Brille?</h1>
                <p>
                    Just as the brille of a Gecko keeps it's vision clear, it's attention focused, and protects its sight from obstruction or damage, our model monitoring solution will enable focused, effective, responsible, and fair machine learning applications.
                </p>
                
            </div>
            <div>
                <h1>What do we monitor?</h1>
            </div>
            <section id="data_drift_info">
                <div className="section-header" >
                    <span className="geico-icon icon-info icon--secondary-teal" ></span>
                    <h3>Feature Drift</h3>
                </div>
                <div>
                        <p>The monitoring system employs a combination of statistical tests, distribution comparison methods,
                            and machine learning algorithms to detect feature drift. Some of the techniques used include:
                            Statistical tests, such as the Kolmogorov-Smirnov test, compare the distributions of input features
                            at different time intervals.
                            Distribution comparison methods, such as the Earth Mover's Distance or the Wasserstein distance,
                            to quantify the difference between the distributions of input features.
                            Machine learning algorithms, such as unsupervised clustering or autoencoders, identify patterns in the input
                            data and flag significant deviations from the expected patterns.
</p>
                </div>
            </section>
            <span className="stroke-separator"></span>
            <section id="data_quality_info">
                <div className="section-header">
                    <span className="geico-icon icon-info icon--secondary-teal" ></span>
                    <h3>Data Quality</h3>
                </div>
                <div>
                        <p>
                            Ensuring the quality of input data is crucial for the performance and reliability of machine
                            learning models in production environments. Data quality issues, such as missing values,
                            outliers, or inconsistent data formats, can negatively impact model performance and lead
                            to inaccurate or unreliable predictions. The ML model monitoring system includes a data
                            quality monitoring component that performs validation checks, monitors data quality metrics,
                            and generates alerts when issues are detected.
                        </p>
                        <p>
                            The monitoring system performs various data validation checks on input data to ensure it
                            meets predefined quality criteria. Some of these checks include:
                            <ul className="list list--unordered">
                                <li>Missing values: Identify and report instances where data is missing or not available
                                    for required input features.</li>
                                <li>Data type consistency: Ensure that the data type for each input feature is consistent
                                    with the expected data type (e.g., numerical, categorical, or text).</li>
                                <li>Data format consistency: Validate that the data format, such as date or time formats,
                                    is consistent across input features.</li>
                                <li>Value range constraints: Verify that the values for each input feature are within the
                                    expected range or set of valid values.</li>
                            </ul>
                        </p>
                        <p>
                            In addition to validation checks, the monitoring system tracks various data quality metrics to
                            provide a comprehensive view of the input data's quality. Some of these metrics include:
                            <ul className="list list--unordered">
                                <li>Completeness: The percentage of available data for each input feature or record.</li>
                                <li>Uniqueness: The proportion of unique values or records in the input data.</li>
                                <li>Consistency: The degree to which data values follow a consistent pattern or format across
                                    input features.</li>
                                <li>Outliers: The number or percentage of data points that deviate significantly from the
                                    expected distribution or range of values.</li>
                            </ul>
                        </p>
                    </div>
                </section>
                <span className="stroke-separator"></span>
                <section id="model_drift_info">
                    <div className="section-header">
                        <span className="geico-icon icon-info icon--secondary-teal" ></span>
                        <h3>Model Drift</h3>
                    </div>
                    <div>
                        <p>
                            Model drift occurs when the performance of a machine learning model degrades over time,
                            usually due to changes in the underlying data or relationships between input features and
                            the target variable. Detecting and addressing model drift is essential to maintain the accuracy
                            and reliability of machine learning models in production environments. The ML model monitoring
                            system includes a model drift detection component that monitors model performance metrics,
                            compares predictions with actual outcomes, and generates alerts when significant drift is identified.
                        </p>
                    </div>
                </section>
            </div>
        </main>
        <script type="text/javascript" src="/static/js/geico-design-kit.bundle.js"></script>
        <script type="text/javascript" src="/static/js/custom.js"></script>
    </>
)
}

