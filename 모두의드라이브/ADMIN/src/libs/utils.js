
import { useEffect, useState, useRef, useCallback } from 'react';
import _ from "lodash";
import dayjs from "dayjs";

import images from "@/libs/images";
import consts from "@/libs/consts";

export const regPhone = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/; // 휴대폰번호
export const regEmail = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/; // 이메일
export const regNick = new RegExp(/^[ㄱ-ㅎ가-힣a-zA-Z]{2,5}$/); // 닉네임
export const regName = new RegExp(/^[ㄱ-ㅎ가-힣]{2,5}$/); // 이름
export const regPassword = new RegExp(/^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[@$!%*#?&])[A-Za-z0-9@$!%*#?&]{8,12}$/); // 비밀번호

export const patternNum = /[0-9]/;	// 숫자 
export const patternEng = /[a-zA-Z]/;	// 영문 
export const patternSpc = /[\"\'\[\].,;-=~!@#$%^&*()_+|<>?:{}/~`|•√π÷×¶∆£¢€¥^°=\s]/; // 특수문자
export const patternUrl = /^http[s]?:\/\/([\S]{3,})/i; // URL

export const patternSpcInstar = /[^0-9a-zA-Z._]+/g; // 인스타용 허용글자
export const patternNick = /[^0-9a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣]+/g; // 닉네임용 허용글자
export const patternBrand = /[^0-9a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣.,;-=~!@#$%^&*()_+|<>?:{}/~`\s]+/g; // 브랜드이름, 상호명용 허용글자
export const patternId = /[^0-9a-zA-Z]+/g; // 아이디용 허용글자


export const patternFloat = /^\d*[.]\d*$/; //소수점 한개만
export const patternCoord = /^-?(([-+]?)([\d]{1,3})((\.{1})(\d+))?)/; // 좌표


export const regInstargram = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/; // 이메일

export const patternKor = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/; // 한글체크


export const regFileDoc = /(.*?)\.(jpg|jpeg|png|gif|bmp|svg|pdf|ai|psd|xls|xlsx|ppt|pptx|pem|zip|hwp|txt|doc|docx|mp4)$/; // 문서파일 가능한 확장자
export const regFileImage = /(.*?)\.(jpg|jpeg|png|gif|bmp|svg)$/; // 이미지파일 가능한 확장자
export const regFileVideo = /(.*?)\.(mp4|webm)$/; // 영상파일 가능한 확장자
export const regFilePdf = /(.*?)\.(pdf)$/; // PDF파일 가능한 확장자
export const regFileExcel = /(.*?)\.(xlsx|csv)$/; // 엑셀 파일 가능한 확장자


export const hpHypen = (str) => {
    if (!str || typeof str !== 'string') return str;

    // 숫자만 추출 (하이픈, 공백 등 제거)
    const cleanStr = str.replace(/\D/g, '');

    // 길이에 따라 처리
    const len = cleanStr.length;

    // 휴대폰 번호 (010, 011, 016, 017, 018, 019) 또는 070 인터넷전화
    if (len === 10 && /^(010|011|016|017|018|019|070)/.test(cleanStr)) {
        return cleanStr.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3'); // 010-123-4567
    }
    if (len === 11 && /^(010|011|016|017|018|019|070)/.test(cleanStr)) {
        return cleanStr.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3'); // 010-1234-5678
    }

    // 지역번호 유선전화 (02: 서울, 031: 경기, 051: 부산 등)
    if (len === 9 && /^02/.test(cleanStr)) {
        return cleanStr.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3'); // 02-123-4567
    }
    if (len === 10 && /^(031|032|033|041|042|043|044|051|052|053|054|055|061|062|063|064)/.test(cleanStr)) {
        return cleanStr.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3'); // 031-123-4567
    }
    if (len === 11 && /^(031|032|033|041|042|043|044|051|052|053|054|055|061|062|063|064)/.test(cleanStr)) {
        return cleanStr.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3'); // 031-1234-5678
    }

    // 1588, 1599, 1644, 1670 등 기업전화
    if (len === 8 && /^(1588|1599|1644|1670|1688|1899)/.test(cleanStr)) {
        return cleanStr.replace(/(\d{4})(\d{4})/, '$1-$2'); // 1588-1234
    }

    // 기타 번호: 처리 불가 시 원본 반환
    return str;
};

export const numFormat = (num, cut = 0) => {
    if (num) {
        if (cut) num = Math.floor(num / cut) * cut; // 1000 = 백원단위 절삭
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else {
        return 0;
    }
};

export const animateCSS = ({
    element,
    animation,
    prefix = 'animate__',
    faster,
    hide
}) =>
    // We create a Promise and return it
    new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;
        const node = document.querySelector(element);

        if (faster) {
            node.classList.add(`animate__faster`);
        }
        node.classList.add(`${prefix}animated`, animationName);

        // When the animation ends, we clean the classes and resolve the Promise
        function handleAnimationEnd(event) {
            event.stopPropagation();
            if (hide) {
                node.style.display = 'none';
            }
            node.classList.remove(`${prefix}animated`, animationName);
            resolve('Animation ended');
        }

        node.addEventListener('animationend', handleAnimationEnd, { once: true });
    });


export const getProfile = (url) => {

    if (!url) return images.avatar;

    return consts.s3Url + url;
}

export const randomNumberCreate = ({ start = 1, end = 10 }) => {
    return Math.floor(Math.random() * (end - start + 1)) + start;
}


export const createNick = () => {

    let first = ['가냘픈', '가는', '가엾은', '가파른', '같은', '거센', '거친', '검은', '게으른', '고달픈', '고른', '고마운', '고운', '고픈', '곧은', '괜찮은', '구석진', '굳은', '굵은', '귀여운', '그런', '그른', '그리운', '기다란', '기쁜', '긴', '깊은', '깎아지른', '깨끗한', '나쁜', '나은', '난데없는', '날랜', '날카로운', '낮은', '너그러운', '너른', '널따란', '넓은', '네모난', '노란', '높은', '누런', '눅은', '느닷없는', '느린', '늦은', '다른', '더러운', '더운', '덜된', '동그란', '돼먹잖은', '된', '둥그런', '둥근', '뒤늦은', '드문', '딱한', '때늦은', '뛰어난', '뜨거운', '막다른', '많은', '매운', '먼', '멋진', '메마른', '메스꺼운', '모난', '못난', '못된', '못생긴', '무거운', '무딘', '무른', '무서운', '미끄러운', '미운', '바람직한', '반가운', '밝은', '밤늦은', '보드라운', '보람찬', '부드러운', '부른', '붉은', '비싼', '빠른', '빨간', '뻘건', '뼈저린', '뽀얀', '뿌연', '새로운', '서툰', '섣부른', '설운', '성가신', '센', '수줍은', '쉬운', '스스러운', '슬픈', '시원찮은', '싫은', '싼', '쌀쌀맞은', '쏜살같은', '쓰디쓴', '쓰린', '쓴', '아니꼬운', '아닌', '아름다운', '아쉬운', '아픈', '안된', '안쓰러운', '안타까운', '않은', '알맞은', '약빠른', '약은', '얇은', '얕은', '어두운', '어려운', '어린', '언짢은', '엄청난', '없는', '여문', '열띤', '예쁜', '올바른', '옳은', '외로운', '우스운', '의심스런', '이른', '익은', '있는', '작은', '잘난', '잘빠진', '잘생긴', '재미있는', '적은', '젊은', '점잖은', '조그만', '좁은', '좋은', '주제넘은', '줄기찬', '즐거운', '지나친', '지혜로운', '질긴', '짓궂은', '짙은', '짠', '짧은', '케케묵은', '큰', '탐스러운', '턱없는', '푸른', '한결같은', '흐린', '희망찬', '흰', '힘겨운'];
    let second = ['고양이', '강아지', '거북이', '토끼', '뱀', '사자', '호랑이', '표범', '치타', '하이에나', '기린', '코끼리', '코뿔소', '하마', '악어', '펭귄', '부엉이', '올빼미', '곰', '돼지', '소', '닭', '독수리', '타조', '고릴라', '오랑우탄', '침팬지', '원숭이', '코알라', '캥거루', '고래', '상어', '칠면조', '직박구리', '쥐', '청설모', '메추라기', '앵무새', '삵', '스라소니', '판다', '오소리', '오리', '거위', '백조', '두루미', '고슴도치', '두더지', '아홀로틀', '맹꽁이', '너구리', '개구리', '두꺼비', '카멜레온', '이구아나', '노루', '제비', '까치', '고라니', '수달', '당나귀', '순록', '염소', '공작', '바다표범', '들소', '박쥐', '참새', '물개', '바다사자', '살모사', '구렁이', '얼룩말', '산양', '멧돼지', '카피바라', '도롱뇽', '북극곰', '퓨마', '', '미어캣', '코요테', '라마', '딱따구리', '기러기', '비둘기', '스컹크', '돌고래', '까마귀', '매', '낙타', '여우', '사슴', '늑대', '재규어', '알파카', '양', '다람쥐', '담비'];

    return `${_.sample(first)}${_.sample(second)}`;
}
export const createName = () => {

    let second = ['고양이', '강아지', '거북이', '토끼', '뱀', '사자', '호랑이', '표범', '치타', '하이에나', '기린', '코끼리', '코뿔소', '하마', '악어', '펭귄', '부엉이', '올빼미', '곰', '돼지', '소', '닭', '독수리', '타조', '고릴라', '오랑우탄', '침팬지', '원숭이', '코알라', '캥거루', '고래', '상어', '칠면조', '직박구리', '쥐', '청설모', '메추라기', '앵무새', '삵', '스라소니', '판다', '오소리', '오리', '거위', '백조', '두루미', '고슴도치', '두더지', '아홀로틀', '맹꽁이', '너구리', '개구리', '두꺼비', '카멜레온', '이구아나', '노루', '제비', '까치', '고라니', '수달', '당나귀', '순록', '염소', '공작', '바다표범', '들소', '박쥐', '참새', '물개', '바다사자', '살모사', '구렁이', '얼룩말', '산양', '멧돼지', '카피바라', '도롱뇽', '북극곰', '퓨마', '', '미어캣', '코요테', '라마', '딱따구리', '기러기', '비둘기', '스컹크', '돌고래', '까마귀', '매', '낙타', '여우', '사슴', '늑대', '재규어', '알파카', '양', '다람쥐', '담비'];

    return `${_.sample(second)}`;
}

export const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        }; //value 변경 시점에 clearTimeout을 해줘야함.
    }, [value]);

    return debouncedValue;
};

export const useDebouncedTimeout = () => {
    const timerRef = useRef(null);

    // 타이머 설정 및 갱신 함수
    const setDebouncedTimeout = useCallback((callback, delay) => {
        // 이전 타이머 제거
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // 새 타이머 설정
        timerRef.current = setTimeout(() => {
            callback();
            timerRef.current = null; // 실행 후 초기화
        }, delay);
    }, []);

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    return setDebouncedTimeout;
}

export const clickImg = (imgsrc) => {
    var imageWin = new Image();
    imageWin = window.open("", "", "");
    imageWin.document.write("<html><body style='margin:0'>");
    imageWin.document.write("<img src='" + imgsrc + "' border=0 style='width: 100%; height: 100%; object-fit: contain;'>");
    imageWin.document.write("</body><html>");
};


export const getFullDateFormat = (date, format = 1) => {
    if (!date) return "-";

    const now = dayjs();
    const target = dayjs(date);

    const todayStr = now.format('YYYY-MM-DD');
    const targetStr = target.format('YYYY-MM-DD');

    if (todayStr === targetStr) {
        return target.format('A hh:mm'); // 오늘
    }

    const yesterdayStr = now.subtract(1, 'day').format('YYYY-MM-DD');
    if (targetStr === yesterdayStr) {
        return '1일 전'; // 어제
    }

    const diffDays = now.diff(target, 'day');
    return `${diffDays}일 전`;

}


export const useAutoScroll = () => {
    useEffect(() => {
        const handleDragOver = (e) => {
            const threshold = 100;
            const scrollSpeed = 20;

            const { clientY } = e;
            const windowHeight = window.innerHeight;

            if (clientY < threshold) {
                window.scrollBy(0, -scrollSpeed);
            } else if (clientY > windowHeight - threshold) {
                window.scrollBy(0, scrollSpeed);
            }
        };

        window.addEventListener("dragover", handleDragOver);

        return () => {
            window.removeEventListener("dragover", handleDragOver);
        };
    }, []);
}