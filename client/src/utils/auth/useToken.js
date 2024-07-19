import { useState } from "react";
import jwt_decode from 'jwt-decode';

export const useToken = () => {
    const [token, setTokenInternal] = useState(() => {
        var dateNow = new Date();
        var currentToken = localStorage.getItem('brille-token');
        // console.log(`current token is ${currentToken}`)
        if(!currentToken){
            return currentToken;
        }
        var decodedToken = jwt_decode(currentToken);
        
        if(decodedToken.exp < parseInt(dateNow.getTime().toString().slice(0, -3))){
            
            localStorage.removeItem('brille-token');
            window.location.reload(false);
        }
        else {
            console.log(`useToken found a token and is returning it.`)
            return currentToken;
        }
    });

    const setToken = newToken => {
        localStorage.setItem('brille-token', newToken);
        setTokenInternal(newToken);
    }

    return [token, setToken]
}