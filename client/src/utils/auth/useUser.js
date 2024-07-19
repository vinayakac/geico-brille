import { useState, useEffect } from 'react';
import { useToken } from './useToken.js';
import { Buffer } from 'buffer';

export const useUser = () => {
    const [token, setToken] = useToken();
    const decodeToken = (token) => {
        try {
            if (!token) return null;

            const encodedPayload = token.split('.')[1];
            var buff = Buffer.from(encodedPayload, 'base64');
            const payload = JSON.parse(buff.toString('ascii'));
            return payload;
        } catch (error) {
            console.error("Token decoding error:", error);
            return null;
        }
    };

    const [user, setUser] = useState(() => decodeToken(token));

    useEffect(() => {
        setUser(decodeToken(token));
    }, [token]);

    return user;
}