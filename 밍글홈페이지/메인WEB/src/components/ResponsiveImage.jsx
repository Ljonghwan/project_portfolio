import React, { useEffect, useState } from 'react';

import consts from "@/libs/consts";

export default function Component({ 
    ref,
    image, 
    style, 
    className 
}) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth <= 1024); // 원하는 기준 너비로 조절
        };

        checkIsMobile(); // 초기 확인
        window.addEventListener('resize', checkIsMobile); // 리사이즈 이벤트 바인딩
        return () => window.removeEventListener('resize', checkIsMobile); // 정리
    }, []);

    return (
        <img
            ref={ref}
            src={consts.s3Url + (isMobile ? image?.m : image?.pc)}
            style={style}
            className={className}
        />
    );
}
