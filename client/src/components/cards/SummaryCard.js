import { useSearchParams } from 'react-router-dom';

export const SummaryCard = ({ title, children, fullView, linkText, updateViewFn }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const showFullView = () => {
        setSearchParams({ "view": fullView });
        updateViewFn(fullView);
    }
    return (
        <>
            <div className="summary_card">

                <div className="summary_title">
                    {title &&
                        <h4>{title}</h4>}
                    {fullView &&
                        <a onClick={showFullView} href="#">{linkText}</a>
                    }
                </div>


                <div>
                    {children}
                </div>
            </div>
        </>
    );
};