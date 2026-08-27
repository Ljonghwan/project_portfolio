const { loadEnv } = require('./config/env');
const { initFirebase } = require('./config/firebase');

const bootstrap = async () => {
    await loadEnv();
    await initFirebase();
    require('./index');  // 환경변수 로드 후 index.js 실행
};

bootstrap().catch(err => {
    console.error('❌ 시작 실패:', err);
    process.exit(1);
});