import { useEffect, useState, useRef } from 'react';
import { ThreeDots } from 'react-loader-spinner';

/**
 * A component that handles rendering of long list of items with complicated templates for each row.
 * For such lists, executing render on the whole list can slow down or even crash the browser.
 * Here each list row is substituted with a placeholder until it becomes "visible" to the user
 * Then the rendering event is triggered.
 *  
 * @param {Array} items - The list of items. For each item the provided row template will be rendered.
 * @param {rowHeight} - The height of each row in the list in pixels
 * @param {children} - Nested template for each row (do not pass this by hand, see examples).
 * @returns {JSX.Element} A react component
 */
export default function LazyListLoader({ items, rowHeight, children }) {
    return (
        <> 
            {items.map((item, index) => (
                <Row key={index} rowHeight={rowHeight} content={children({ item: item, index: index })} />
            ))}
            
        </>
    );
}

function Row({ rowHeight, content }) {
    const [visible, setVisible] = useState(false);
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [style, setStyle] = useState({ paddingBottom: rowHeight + 'px' });

    useEffect(() => {
        const timeOutId = setTimeout(() => {
            // After timeout passed, execute the actual action
            // Change visibility state
            setVisible(isIntersecting);
            if (isIntersecting) {
                // Component is in view, remove the style and add the content to DOM
                setStyle({ paddingBottom: 0 });
            } else {
                // Component is hidden, remove content and replace the space with padding
                setStyle({ paddingBottom: rowHeight + 'px' });
            }
        }, 500);
        return () => clearTimeout(timeOutId);
    }, [isIntersecting]);

    const ref = useRef(null);
    const handleIntersection = (entries, observer) => {
        entries.forEach(entry => {
            // Set the intersecting state and start the timer for content update
            setIsIntersecting(entry.isIntersecting);
        });
    };

    useEffect(() => {
        const observer = new IntersectionObserver(handleIntersection, { threshold: 0 });
        if (ref.current) {
            observer.observe(ref.current);
        }
    }, []);

    return (
        <div ref={ref} style={style}>
            {visible &&
                (content)
            }
        </div>
    );

}