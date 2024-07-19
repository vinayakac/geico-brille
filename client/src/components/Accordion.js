import { useState, useEffect } from 'react';
import '../gdk/css/geico-design-kit.css';

/**
 * A component that implements accordion
 * @param innerContents - content inside the accordion
 * @param outerContents - content on the accordion
 * @param features - features
 * @returns {JSX.Element} A react component
 */
export default function Accordion({ innerContents, outerContents, header }) {
    const [selectorId, setSelectorId] = useState(Math.floor(Math.random() * 100000));
    

    useEffect(() => {
        new GDK.Accordion({
            "content" : "#accordion-id"+ selectorId,
            "initiallyOpenedElement" : null, 
            accordionOpenClicked : function(currentNode){
            },
            accordionCloseClicked : function(currentNode){
            }
            
        });
    }, []);

    return (
        <ul id={"accordion-id" + selectorId} className="accordion">
            <li>
                <div tabIndex="0" className="accordion-headline animate-icon-on-rollover" role="button">
                    <div className="h4">{header}</div>
                    <div>{outerContents}</div>
                </div>
                <div className="accordion-content-container">
                    <div className="accordion-content" style={{paddingTop: '20px'}}>
                        {innerContents}
                    </div>
                </div>
            </li>
        </ul>
        
    );
}