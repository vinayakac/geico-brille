import { useEffect, useState } from 'react';
import '../gdk/css/geico-design-kit.css';
import axios from 'axios';
import { useUser } from '../utils/auth/useUser';
import getEnvoronmentContext from '../utils/environment';
import { PublicClientApplication } from '@azure/msal-browser';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import LatestAlertsPanel from './alerts/LatestAlertsPanel';

export default function Navigation() {
    const [oauthUrl, setOauthUrl] = useState('');
    const navigate = useNavigate();
    const loaded = true;
    const [envUrls, setEnvUrls] = useState({});
    const [currentEnv, setCurrentEnv] = useState();

    const user = useUser();

    const [statevalue, setStateValue] = useState("data is loading");

    const getUrl = async () => {
        const response = await axios.post('/user/auth/geturl');
        // console.log(response.data);
        setOauthUrl(response.data.url);
    }

    const getEnvironmentUrls = async () => {
        const context = await getEnvoronmentContext();
        setEnvUrls(context.urls);
        setCurrentEnv(context.current);
    }

    useEffect(() => {
        getUrl();
        getEnvironmentUrls();
    }, [])

    useEffect(() => {
        var navigation = new GDK.Navigation({
            content: "#primary-navigation"
        });
        const darkModeSwitch = new GDK.DarkModeSwitch({
            content: "#dark-mode-switch",
            onColorModeChange: function (darkModeSwitchedCheckedState) {
                if (darkModeSwitchedCheckedState) {
                    console.log("Dark mode switch checked");
                } else {
                    console.log("Dark mode switch unchecked");
                }
                window.location.reload();
            }
        });
    }, [])

    const handleLogin = async () => {
        window.location.href = oauthUrl;
    }

    const handleLogout = () => {
        localStorage.removeItem('brille-token');
        navigate('/');
        window.location.reload(false);
    }


    return (
        <nav id="primary-navigation" role="navigation">
            <div className="nav-background"></div>

            {/* The Menu panel */}
            <div className="panel-wrapper" data-side-panel="menu">
                <div className="nav-menu">
                    <ul className="nav-primary-tier nav-items nav-dark-mode-switch-wrapper">
                        <li><a href="/" >Dashboard</a></li>
                        <li><a href="/onboarding">Model Onboarding</a></li>
                        <li><a href="https://geico365.sharepoint.com/sites/AIMLSolutions/SitePages/ML-Monitoring.aspx?csf=1&web=1&e=5fJyg4&cid=24da28f5-743a-40d2-98cb-fba3a57286a9" target="_blank">About</a></li>
                        <li className="nav-dark-mode-switch">
                            <div id="dark-mode-switch" className="button-switch-container">
                                <div className="button-switch-label-wrapper">
                                    <label htmlFor="your-dark-mode-switch-id-button-switch-checkbox" className="text">Toggle Dark Mode</label>
                                </div>
                                <input id="your-dark-mode-switch-id-button-switch-checkbox" name="your-dark-mode-switch-id-button-switch-checkbox" type="checkbox" />
                                <div className="button-switch"></div>
                            </div>
                        </li>
                    </ul>

                    <div className="nav-secondary-tier">
                        {/* The Nav Back Component for the Menu Secondary Tier */}
                        <div className="nav-back"><a href="/">Back</a></div>

                        {/* The "Navigation" Nav Secondary Panel */}
                        <div className="nav-secondary-panel" data-nav-items="navigation">
                            <div className="nav-header">Pages</div>
                            <ul className="accordion">
                                <li>
                                    <div tabIndex="0" className="accordion-headline" aria-expanded="false" role="button">
                                    </div>
                                    <div className="accordion-content-container" aria-hidden="true">
                                        <div className="accordion-content">
                                            <ul className="list">
                                                <li><a href="/" >A Link</a></li>
                                                <li><a href="/" >Another LInk</a></li>
                                            </ul>
                                        </div>
                                    </div>
                                </li>

                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* the Account Panel */}
            <div className="panel-wrapper" data-side-panel="account">
                <div className="nav-panel-content">
                    <div className="panel-header">
                        <div className="header">{user ? "Your Account" : "Please Sign In"}</div>
                        <button className="btn-close icon-close" type="button" aria-label="Close navigation"></button>
                    </div>
                </div>

                <ul className="nav-primary-tier nav-items">

                    <li className="nav-additional-links">
                        <div className="nav-bottom-links">
                            {
                                user ?
                                    <ul className="list-icon">
                                        <li className="icon-security one-line"><span><strong>Securely signed in with Active Directory</strong></span></li>
                                        <li className="icon-profile one-line"><span><strong>Signed in as:</strong>{user ? '\xa0'.repeat(2) + user.name : ""}</span></li>
                                        <li className="icon-email one-line"><span><strong>Email:  </strong>{user && user.username ? '\xa0'.repeat(2) + user.username.toLowerCase() : ""}</span></li>
                                        <li className="icon-professional-liability one-line"><span><strong>Role:  </strong>{user && user.highestRole ? '\xa0'.repeat(2) + user.highestRole.toUpperCase() : ""}</span></li>
                                    </ul>
                                    :
                                    <></>
                            }
                            <div className="form-field" style={{ "paddingTop": "1rem" }}>
                                {
                                    user ?
                                        <a type="button" onClick={() => handleLogout()} className="btn btn--destructive btn--full-mobile"><span>Sign Out</span></a>
                                        :
                                        <a type="button" onClick={() => handleLogin()} className="btn btn--primary btn--full-mobile"><span>Sign In with Microsoft</span></a>
                                }
                            </div>

                        </div>
                    </li>
                </ul>
            </div>

            <div className="panel-wrapper" data-side-panel="notifications">
                <div className="nav-panel-content">
                    <div className="panel-header" style={{ position: 'relative', paddingRight: '50px', overflowY: 'auto', maxHeight: '800px' }}>
                        <LatestAlertsPanel />
                        <button className="btn-close icon-close" type="button" style={{ marginBottom: "10px" }} />
                    </div>
                </div>
            </div>

            <script type="text/javascript" src="/static/js/geico-design-kit.bundle.js"></script>
            <script type="text/javascript" src="/static/js/custom.js"></script>

        </nav >
    )
}