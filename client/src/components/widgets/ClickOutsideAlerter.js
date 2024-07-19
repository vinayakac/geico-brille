import React, { useRef, useEffect } from 'react';
/**
* Hook that alerts clicks outside of the passed ref
*/
function useClickOutsideAlerter(ref, onClick) {
    useEffect(() => {
        /**
            * Alert if clicked on outside of element
                 */
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                // alert('You clicked outside of me!');
                onClick(event);
            }
        }
        function handleEscape(event) {
            if (event.key == 'Escape') onClick(event);
        }
        // Bind the event listener
        document.addEventListener('keydown', handleEscape);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [ref]);
}
/**
 * Component that alerts if you click outside of it
 */
function ClickOutsideAlerter(props) {
    const wrapperRef = useRef(null);
    useClickOutsideAlerter(wrapperRef, props.onClick);
    return <div ref={wrapperRef}>{props.children}</div>;
}
export default ClickOutsideAlerter;