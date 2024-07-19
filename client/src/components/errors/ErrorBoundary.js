import React from 'react';
import ErrorMessage from '../errors/SectionLoadingError';

/**
* Error boundaries are React components that catch JavaScript errors anywhere in their child component tree,
* log those errors, and display a fallback UI instead of the component tree that crashed. Error boundaries 
* catch errors during rendering, in lifecycle methods, and in constructors of the whole tree below them.
*/

class ErrorBoundary extends React.Component{
    constructor(props){
        super(props);
        this.state = {hasError: false, errorMessage:''};
    }
    // Update state when error encountered 
    static getDerivedStateFromError(error){
        return {hasError: true };
    }
    // update the state with the error information
    componentDidCatch(error , info){
        console.log(error, info);
        this.setState({errorMessage: error.toString()});
    }
    render(){
        if(this.state.hasError){
            return ( <ErrorMessage error = ""/>);
        }
        // if no error render childern untouched
            return this.props.children;
    }
}
export default ErrorBoundary;