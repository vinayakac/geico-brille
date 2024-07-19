import { useEffect, useState } from 'react';

let gdkToast;

export const ToastComponent = (props) => {
    useEffect(() => {
        gdkToast = new GDK.Toasts({
            content: '#notification-toast',
            toastsFloatTime: 'long',
            onComplete: () => { }
        });
    }, []);

    return (
        <>
            <div id="notification-toast" className="toasts-container">
                <div className="toasts toasts--update">
                    <div>
                        <span className="icon-notifications"></span>
                    </div>
                    <div role="status">
                        <div className="toasts--content"></div>
                    </div>
                    <button className="toasts--close-btn icon-close">
                        <div id="toasts--base-timer"></div>
                    </button>
                </div>
            </div>
        </>
    );
}

export const toast = (message) => {
    const toastContent = document.querySelector(".toasts--content");
    toastContent.textContent = message;
    gdkToast.show();
}