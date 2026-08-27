
// 이미지/파일 URL 프리픽스 (로컬: http://localhost:3000, 라이브: CloudFront)
export const STORAGE_URL = import.meta.env.VITE_S3_URL;

const exportData = {

  s3Url: import.meta.env.VITE_S3_URL,
  
  apiDelay: 200,
  pagerows: 100,

  toastOption: {
    isLoading: false, 
    autoClose: 2000,
    closeOnClick: true,
    pauseOnHover: false
  },
  toastErrorOption: {
    isLoading: false, 
    autoClose: 2000,
    closeOnClick: true,
    pauseOnHover: false,
    position: 'bottom-center'
  },
  imgAlt: 'DRIVE',

  lnbShow : [],
  lnvHide : [],

  boardCateConsts: [
    {idx: '', title: "처리상태"},
    {idx: 1, title: "접수"},
    {idx: 2, title: "처리완료"},
  ],
  viewStatusConsts: [
    {idx: '', title: "노출상태"},
    {idx: 1, title: "노출"},
    {idx: 2, title: "미노출"},
  ],
  mockupConsts: [
    {idx: 1, title: "디바이스"},
    {idx: 2, title: "노트북"},
  ],



  userCateConsts: [
    {idx: '', title: "전체"},
    {idx: 1, title: "남성"},
    {idx: 2, title: "여성"},
  ],
  userAllCateConsts: [
    {idx: '', title: "전체"},
    {idx: 1, title: "남성"},
    {idx: 2, title: "여성"},
    {idx: 10, title: "탑비주얼"},
    {idx: 20, title: "내전담"},
  ],

  termTypeConsts: [
    {idx: 1, title: "개인정보 처리방침"},
  ],

  loaderVariants: {
    open: { opacity: 1, display: 'flex'},
    closed: { opacity: 0, transitionEnd: { display: 'none' }},
  },
  loaderBlurVariants: {
    open: { opacity: 1,  },
    closed: { opacity: 0,  },
  },
  boxVariants: {
    open: { opacity: 1, y: 0, filter: "blur(0px)", display: 'flex', transition: { type: "spring", duration: 0.7 } },
    closed: { opacity: 0, y: -20, filter: "blur(5px)", display: 'none', transition: { ease: "easeIn", duration: 0.22 }},
  },
  textVariants: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
  },

}

export default exportData;