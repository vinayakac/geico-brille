import { useUser } from "./useUser.js";
import LoginPage from "../../pages/Login.js";
import { useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";


export default function ProtectedRoute({children}) {
    const [loaded, setLoaded] = useState(false);
    
    // console.log(`user in requireauth is ${user}`)
    const location = useLocation();
    const user = useUser();

    useEffect(() => {
        setLoaded(true);
    })

    if(!user && loaded) {
        console.log('user is none')
        return <Navigate to="/login" state={{from: location}} />
        // return <LoginPage/>
    }

    return children;


}