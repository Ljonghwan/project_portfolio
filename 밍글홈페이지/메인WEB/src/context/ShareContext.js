// ShareContext.js
import { createContext, useState } from 'react';

export const ShareContext = createContext();

export const ShareProvider = ({ children }) => {
    const [share, setShare] = useState({ portpolio: null }); // 초기값 설정

    return (
        <ShareContext.Provider value={{ share, setShare }}>
            {children}
        </ShareContext.Provider>
    );
};