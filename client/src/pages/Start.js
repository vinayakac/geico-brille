import { useEffect, useState } from "react";
import axios from "axios";
import '../gdk/css/geico-design-kit.css';
import { useUser } from "../utils/auth/useUser";
import ModelTable from '../components/ModelTable';

export default function Start() {

    const user = useUser();
    
    useEffect(() => {
        const navigationalBox = new GDK.NavigationalBox({
            content: "#navBoxData",
            urlSetting: "/",
            targetSetting: "_self"
        });
        // since the alert only shows when user is loaded, don't instantiate until user is truthy. It is also required to include 'user' in the dependency array to ensure this happens.
        if (user) {
            var alert = GDK.Alert({
                content: "#myalert"
              });
        }
    }, [user])

    return (
        <>
            <div className="page-header--wrapper" style={{ "marginTop": "3em" }}>
                <div className="container ">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="page-header page-header-bottom-border">
                                <div className="page-header-left">
                                    <h2>Home Page</h2>
                                    <h4>This is the home page for the model monitoring app.</h4>
                                    <p>Let's build something dope!</p>
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
                <div className='container page-container' style={{ "marginTop": "0rem", "width": "100%", "padding": "0rem" }}>
                    {
                        user ? 
                        <>
                            <div className="alert" id="myalert">
                                <div className="alert--low-importance">
                                    <span className="icon-info"></span>
                                    <ul className="alert-list">
                                        <li className="alert-content">
                                            <button aria-label="Close alert" className="icon-close"></button>
                                            <div className="h4">You are logged in with Azure AD.</div>
                                            <p><strong>Email:  </strong>{user && user.username ? '\xa0'.repeat(2) + user.username.toLowerCase() : ""}</p>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </>
                        :
                        <></>
                    }
                    <div className="section-header">
                        <span className="geico-icon icon-navigation-arrow icon--secondary-teal" ></span>
                        <h3>Pick Back Up</h3>
                    </div>
                    <div style={{"paddingBottom": "2rem"}}>
                        <div className="navigational-box-wrapper">
                            <div className="navigational-box" id="navBoxData" tabIndex="0" role="link">
                                <div className="navigational-box-content-wrapper">
                                    <div className="navigational-box-content-wrapper-left">
                                        <div className="navigational-box-content">
                                            <p>A link to another page or action</p>
                                        </div>
                                    </div>
                                </div>
                                <a href="/" target="_self"><span className="geico-icon icon-arrow-right geico-icon--actionable geico-icon--small"></span></a>
                            </div>
                        </div>
                    </div>
                    <span className="stroke-separator"></span>
                    <div className="section-header">
                        <span className="geico-icon icon-clock icon--secondary-teal" ></span>
                        <h3>Another Section</h3>
                    </div>
                    <div>
                        <p>How about some content?</p>
                    </div>
                    
                    <span className="stroke-separator"></span>
                    <div className="section-header">
                        <span className="geico-icon icon-faq icon--secondary-teal" ></span>
                        <h3>Get Help</h3>
                    </div>
                    <div>
                        <p>Links to the wiki? A bot?</p>
                    </div>
                </div>
            </main>

            <script type="text/javascript" src="/static/js/geico-design-kit.bundle.js"></script>
            <script type="text/javascript" src="/static/js/custom.js"></script>
        </>
    )
}