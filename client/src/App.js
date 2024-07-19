import { Route, Routes } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import './gdk/css/geico-design-kit.css';
import { FaBookOpen } from 'react-icons/fa';
import About from './pages/About';
import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/Login';
import Start from './pages/Start';
import { ToastComponent } from './components/ToastNotification';
import Details from './pages/details/Details';
import ModelOnboarding from './pages/onboarding/ModelOnboarding';
import Test from './pages/Test';
import ProtectedRoute from './utils/auth/ProtectedRoute';
import { useUser } from './utils/auth/useUser';
import DataDriftPanel from './components/panels/DataDriftPanel';
import NotificationIcon from './components/alerts/NotificationIcon';
import Features from './pages/features/Features';
import PipelineOverview from './pages/pipelines/PipelineOverview';

function App() {
    const user = useUser();
    const glossaryLink = 'https://geico365.sharepoint.com/sites/AIMLSolutions/SitePages/Glossary.aspx';

    // Utility function to handle link navigation and prevent default actions in the top navigation
    const handleLinkClick = (e, href) => {
        e.preventDefault();
        window.open(href, '_blank', 'noopener, noreferrer');
    };

    return (
        <>

            <div className="App main-wrapper" style={{ "height": "100vh" }}>
                <header id="primary-header" role="banner" style={{ "height": "5rem", position: "fixed" }}>
                    <div style={{ "height": "5rem", alignItems: "center", display: "flex" }}>
                        <div className="header-logo">
                            <a className="icon-geico" aria-label="GEICO Home" href="/"></a>
                        </div>
                        <div role="separator" className="header-separator"></div>
                        <span className="glyph">
                            <svg width="36" height="36" viewBox="0 0 512 512">
                                <g>
                                    <path d="M141.578 298.957c0-45.65 26.778-84.941 65.465-103.301-123.003 22.303-203.417 112.681-203.417 112.681 76.718 63.365 149.197 91.197 214.016 98.334-44.298-15.79-76.063-57.989-76.063-107.714z" />
                                    <path d="M508.375 299.223c-74.158-66.12-144.875-95.867-208.702-104.079 41.543 17.162 70.748 57.989 70.748 105.728 0 48.313-30.003 89.508-72.315 106.332 127.693-18.483 210.268-107.981 210.268-107.981z" />
                                    <path d="M314.358 240.118c0.236 1.372 0.44 2.744 0.44 4.157 0 14.981-12.144 27.095-27.115 27.095-14.94 0-27.095-12.114-27.095-27.095 0-11.182 6.789-20.746 16.425-24.914-6.717-1.72-13.762-2.744-21.043-2.744-46.663 0-84.5 37.847-84.5 84.531 0 46.663 37.837 84.531 84.5 84.531 46.725 0 84.541-37.868 84.541-84.531 0.010-24.023-10.066-45.639-26.153-61.031z" />
                                    <path d="M354.241 188.303l26.682-54.505 27.602 13.512-26.682 54.505-27.602-13.512z" />
                                    <path d="M127.658 200.833l-23.756-51.3 27.876-12.909 23.756 51.3-27.876 12.909z" />
                                    <path d="M231.391 177.43l0.85-72.635 30.717 0.359-0.85 72.635-30.717-0.359z" />
                                </g>
                            </svg>
                        </span>
                        <div className="App-secondary-header">Brille</div>
                    </div>
                    <div className="header-links">
                        <ul>
                            {/* Glossary link with tooltip */}
                            <li>
                                <a href={glossaryLink} target="_blank" rel="noopener noreferrer" onClick={(e) => handleLinkClick(e, glossaryLink)}>
                                    <FaBookOpen title="Glossary" />
                                    <span className="tooltip-text">Click on glossary for terminology guide</span>
                                </a>
                            </li>

                            <li><NotificationIcon /></li>

                            <li><a data-side-panel-trigger="account" href="/"><span aria-label="account" className="icon-profile"></span><span className="header-link header-hover-link">Account</span></a></li>
                            <li>
                                <a data-side-panel-trigger="menu" className="hamburger-menu" style={{ "cursor": "pointer" }}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span className="header-link">Menu</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </header>
                {/* This is the app navigation. It includes the Profile and Menu blades. */}
                <Navigation></Navigation>

                <ToastComponent />

                {/* Route components for the SPA */}
                <Routes>
                    <Route path='/' element={<ProtectedRoute ><Dashboard /></ProtectedRoute>}></Route>
                    <Route path='/about' element={<About />}></Route>
                    <Route path='/login' element={<Login />}></Route>
                    <Route path='/test' element={<Test />}></Route>
                    <Route path='/details/:model' element={<Details />}></Route>
                    <Route path='/details/:model/drift' element={<DataDriftPanel />}></Route>
                    <Route path='/onboarding' element={<ModelOnboarding />}></Route>
                    <Route path='/features' element={<Features />}></Route>
                    <Route path='/telematics' element={<PipelineOverview />}></Route>
                </Routes>

                {/* The application footer */}
                <footer id="primary-footer">
                    <div className="footer-links">
                        <ul className="footer-list">
                            <li><a href="yourUrl">Privacy</a></li>
                            <li><a href="https://www.geico.com/privacy/" target="_blank">Personal Data Request &amp; Notice</a></li>
                            <li><a href="yourUrl">Legal &amp; Security</a></li>
                            <li><a href="https://forms.office.com/Pages/ResponsePage.aspx?id=wNiJcwc2XEamn31EJlApEuZapu4Y3sNBuHtEEa_pRy5UREVNWEVYREYyQ1ZKUjZET1UwRjRGVE9YMi4u&sharetoken=mNt7GhIORvK300GLSCbW" target="_blank">Feedback</a></li>
                        </ul>
                    </div>
                </footer>
            </div>
            <script type='text/javascript' src='./custom.js'></script>
        </>
    );
}

function getYear() {
    return new Date().getFullYear();
}

export default App;
