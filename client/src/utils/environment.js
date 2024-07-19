import { ServerError } from '@azure/msal-browser';

/**
 * This asynchronous function is to be used to obtain the current environment context from the server. 
 * This is used to avoid having to utilize environment variables in the react client. 
 * 
 * Invoke with "await".
 * 
 * @returns {JSON} An object containing the current environment ("current") and the url's for all environment ("urls")
 */
export default async function getEnvoronmentContext() {
    const response = await fetch('/api/environments/urls/get', {
        method: "POST"
    });
    if(response.status !== 500) {
        return await response.json();
    }
    else {
        throw ServerError("Failed to obtain environment context from the server.")
    }
    
}