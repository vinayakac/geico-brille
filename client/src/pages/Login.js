import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToken } from "../utils/auth/useToken";
import axios from "axios";
import '../gdk/css/geico-design-kit.css';
import { useUser } from "../utils/auth/useUser";

export default function Login() {
    const navigate = useNavigate();
    const [oauthUrl, setOauthUrl] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const result = searchParams.get('result');
    const [token, setToken] = useToken();
    const oauthtoken = searchParams.get('token');
    const user = useUser();

    useEffect(() => {
        if (oauthtoken) {
            console.log('found the token')
            setToken(oauthtoken);
            navigate('/');
            window.location.reload(false);
        }
    }, [oauthtoken, setToken, navigate])

    const getUrl = async () => {
        const response = await axios.post('/user/auth/geturl');
        // console.log(response.data);
        setOauthUrl(response.data.url);
    }

    useEffect(() => {
        getUrl();
    }, [])

    useEffect(() => {
        // initiate the login status alert if the sign-in result failed
        if (result=="failed") {
            var alert = GDK.Alert({
                content: "#login-status-alert"
              });
        }
    })

    const handleLogin = async () => {
        window.location.href = oauthUrl;
    }

    const handleNavigate = (destination) => {
        navigate(destination);
    }

    useEffect(() => {
        if(user) {
            const navigationalBoxLogin = new GDK.NavigationalBox({
                content: "#nav-Box-Login",
                urlSetting: "/",
                targetSetting: "_self"
            });
        }
        
    }, [oauthUrl])

    return (
        <>
            <div className="page-header--wrapper" style={{ "marginTop": "3em" }}>
                <div className="container ">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="page-header page-header-bottom-border">
                                <div className="page-header-left">
                                    <h2>Login</h2>
                                    {
                                        !user 
                                        ? 
                                        <h4>Sign in using Active Directory to get started.</h4>
                                        :
                                        <h4>You're already signed in.</h4>

                                    }
                                    
                                </div>
                                <div className="page-header-right">
                                    <span className="geico-icon icon-loader-g pull-right icon--secondary-teal"></span>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <main role={"main"} id="wrapper" className='bg-color--cloudy'>
                <div className='container page-container' style={{ "marginTop": "0rem", "width": "100%", "padding": "2rem" }}>
                    {
                        !user ? 
                        <>
                            {
                                // Display the login status alert if the sign-in attempt was not successful
                                result == "failed" ? 
                                <div className="alert" id="login-status-alert">
                                    <div className="alert--medium-importance">
                                        <span className="icon-alert"></span>
                                        <ul className="alert-list">
                                            <li className="alert-content">
                                                <button aria-label="Close alert" className="icon-close"></button>
                                                <div className="h4">Your sign-in request failed</div>
                                                <p>Please check your access, and try again. If the issue persists, contact the administrators for assistance.</p>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                : 
                                <></>
                            }
                            <div className="row cards-container promotional-cards promotional-cards--three-column">
                                <div className="card">
                                    <div className="card-top">
                                        <div><span className="geico-icon icon-billing-details"></span></div>
                                        <div className="intro-text">Impact</div>
                                        <h4>Evaluate and Compare Models</h4>
                                        <p className="content-text">Run manual or scheduled evaluation jobs, to observe performance over time or across sub-populations.</p>
                                    </div>
                                    <div className="card-bottom">
                                        <button type="button" className="btn btn--secondary" onClick={() => handleNavigate('/about#model_drift_info')}>
                                            <span>Learn More</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="card">
                                    <div className="card-top">
                                        <div><span className="geico-icon icon-confirmation"></span></div>
                                        <div className="intro-text">Quality</div>
                                        <h4>Monitor Data Quality and Drift</h4>
                                        <p className="content-text">Use feature drift evaluation and data quality monitoring to ensure high-quality decisions are being made on complete data.</p>
                                    </div>
                                    <div className="card-bottom">
                                        <button type="button" className="btn btn--secondary" onClick={() => handleNavigate('/about#data_quality_info')}>
                                            <span>Learn More</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="card">
                                    <div className="card-top">
                                        <div><span className="geico-icon icon-coverage"></span></div>
                                        <div className="intro-text">Responsibility</div>
                                        <h4>Fairly Implement Machine Learning</h4>
                                        <p className="content-text">Ensure your models are free from bias, and that they are operating legally and ethically.</p>
                                    </div>
                                    <div className="card-bottom">
                                         <button type="button" className="btn btn--secondary" onClick={() => handleNavigate('/about')}>
                                            <span>Learn More</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => handleLogin()} type="button" className="btn btn--primary btn--full-mobile btn--pull-right"><span>Sign In with Microsoft</span></button>
                            <button href="/" type="button" className="btn btn--secondary btn--full-mobile btn--pull-right"><span>Request Access</span></button>
                            <button onClick={() => handleNavigate('/about')} type="button" className="btn btn--destructive btn--full-mobile btn--pull-right"><span>About This App</span></button>
                        </>
                        :
                        <>
                            <div className="navigational-box-wrapper">
                                <div className="navigational-box" id="nav-Box-Login" tabIndex="0" role="link">
                                    <div className="navigational-box-content-wrapper">
                                        <div className="navigational-box-content-wrapper-left">
                                            <div className="navigational-box-content">
                                                <p>Go to the Homepage</p>
                                            </div>
                                        </div>
                                    </div>

                                    <a href="/data" target="_blank"><span className="geico-icon icon-arrow-right geico-icon--actionable geico-icon--small"></span></a>
                                </div>
                            </div>
                            <div className="cards-container promotional-cards promotional-cards--three-column"> 
                                <div className="card">
                                    <div><img src="/images/brain.jpg" alt="sample image" className="center-cropped"/></div>
                                    <div className="card-top">
                                        <div className="intro-text">Impact</div>
                                        <h4>Evaluate Model Performance</h4>
                                        <p className="content-text">Generate accuracy and precision reports, and observe custom metrics.</p>
                                    </div>
                                    <div className="card-bottom">
                                        <button type="button" className="btn btn--secondary" onClick={() => handleNavigate('/about#model_drift_info')}>
                                            <span>Evaluate</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="card">
                                    <div><img src="/images/mining-the-web.jpg" alt="sample image" className="center-cropped"/></div>
                                    <div className="card-top">
                                        <div className="intro-text">Quality</div>
                                        <h4>Ensure Data Quality</h4>
                                        <p className="content-text">Get data quality reports, and set up recurring quality evaluation jobs.</p>
                                    </div>
                                    <div className="card-bottom">
                                        <button type="button" className="btn btn--secondary" onClick={() => handleNavigate('/about#data_quality_info')}>
                                            <span>Learn More</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="card">
                                    <div><img src="/images/medical-scale.jpg" alt="sample image" className="center-cropped"/></div>
                                    <div className="card-top">
                                        <div className="intro-text">Responsibility</div>
                                        <h4>Monitor for Bias</h4>
                                        <p className="content-text">Generate accuracy and precision reports, and observe custom metrics.</p>
                                    </div>
                                    <div className="card-bottom">
                                        <button type="button" className="btn btn--secondary" onClick={() => handleNavigate('/about')}>
                                            <span>Learn More</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    }
                    
                    

                    
                    
                </div>
            </main>

            <script type="text/javascript" src="/static/js/geico-design-kit.bundle.js"></script>
            <script type="text/javascript" src="/static/js/custom.js"></script>
        </>
    )
}