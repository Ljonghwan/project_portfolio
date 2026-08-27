const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();
const cron = require('node-cron');
const path = require("path");
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { Sequelize, Op } = require("sequelize");


const env = process.env.NODE_ENV || 'development';
const config = require('./config/database');

const models = require('./models');
const consts = require('./service/consts.js');

const { encrypt, decrypt, encodeId, decodeId } = require('./service/crypto.js');
const { send, sendError, scd, randomNumberCreate } = require('./service/utils.js');
const { getTodaySalesService, getMonthSalesService, sendMessage } = require('./service/hyphen.js');
const { sendPush } = require('./service/fcm.js');
const { sendTempPasswordMail } = require('./service/mailform');

require('dotenv').config();

// 웹페이지 설정
app.set( 'view engine', 'ejs' );
app.set( 'views', process.env.PWD + '/views' );

app.use( '/web', require('./router/web') )
app.use( '/mok', require('./router/mok') )



dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Seoul');

const apiLimiter = rateLimit({
    windowMs: 1000 * 60, // 1분 간격
    max: 10000, // windowMs동안 최대 호출 횟수
    handler(req, res) { // 제한 초과 시 콜백 함수 
        sendError(req, res);
    },
});


app.use(cors({ origin: true }));
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

app.use(express.static('public/uploads'));

app.use(apiLimiter);
app.use(express.json({ limit: '1gb' }));

app.use((req, res, next) => {


    let nowDt = dayjs().tz().format('YYYY-MM-DD HH:mm:ss');
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }

    req.body = {
        ...req.body,
        nowDt: nowDt,
        ip: ip?.split(", ")?.[0]
    }

    next();
})


app.get('/', async (req, res) => {
    res.status(200).send('OK');
});
app.get('/healthz', (req, res) => {
    res.status(200).send('OK');
});
app.get('/sync', async (req, res) => {
    res.status(200).send('OK');
});


if(process.env.NODE_ENV !== 'production') {
    /** 스웨거 */
    const { swaggerUi, specs } = require("./swagger/swagger")
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs))
}

/** 크론 API(Lambda) */
app.use("/cron", require("./cron"));

app.use(scd);

/** 관리자 API */
app.use("/admin/login", require("./router/admin/login"));
app.use("/admin/dashboard", require("./router/admin/dashboard"));
app.use("/admin/account", require("./router/admin/account"));
app.use("/admin/store", require("./router/admin/store"));
app.use("/admin/policy", require("./router/admin/policy"));
app.use("/admin/admin", require("./router/admin/admin"));
app.use("/admin/auth", require("./router/admin/auth"));
app.use("/admin/news", require("./router/admin/news"));
app.use("/admin/notice", require("./router/admin/notice"));
app.use("/admin/content", require("./router/admin/content"));
app.use("/admin/popup", require("./router/admin/popup"));
app.use("/admin/feedback", require("./router/admin/feedback"));
app.use("/admin/faq", require("./router/admin/faq"));
app.use("/admin/event", require("./router/admin/event"));

/** 사용자 API */
app.use("/v1/auth", require("./router/v1/auth")); 
app.use("/v1/store", require("./router/v1/store")); 
app.use("/v1/storeService", require("./router/v1/storeService"));
app.use("/v1/alarm", require("./router/v1/alarm")); 
app.use("/v1/my", require("./router/v1/my")); 

app.use("/v1/main", require("./router/v1/main"));
app.use("/v1/sales", require("./router/v1/sales"));
app.use("/v1/expense", require("./router/v1/expense"));
app.use("/v1/accountBook", require("./router/v1/accountBook"));
app.use("/v1/personnel", require("./router/v1/personnel"));

app.use("/v1/work01", require("./router/v1/work01")); // 매입비
app.use("/v1/work02", require("./router/v1/work02")); // 원가계산기

app.use("/v1/work03", require("./router/v1/work03")); // 일용노무대장 관리
app.use("/v1/work04", require("./router/v1/work04")); // 직원관리
app.use("/v1/work05", require("./router/v1/work05")); // 고객관리
app.use("/v1/work06", require("./router/v1/work06")); // 이벤트 관리

app.use("/v1/work07", require("./router/v1/work07")); // 근무형태 관리
app.use("/v1/work08", require("./router/v1/work08")); // 계약서 관리

app.use("/v1/work09", require("./router/v1/work09")); // 제품 원가 관리

app.use("/v1/work10", require("./router/v1/work10")); // 햔금 거래 관리

app.use("/v1/board", require("./router/v1/board"));
app.use("/v1/reply", require("./router/v1/reply"));
app.use("/v1/action", require("./router/v1/action"));
app.use("/v1/news", require("./router/v1/news"));
app.use("/v1/notice", require("./router/v1/notice"));


/* 설정값 */
app.post('/config', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { os, version, releaseType, nowDt, ip } = req.body;

   
    /** 버전 체크 기능 */
    // let appInfo = await models.APP_VERSION_TB.findOne( {
    //     where: {
    //         type: os || null,
    //     }
    // } );

    // if ( releaseType === "production" && appInfo?.version !== version ) {
    //     res.status(500).send({ code: 9001, message: '안정적인 서비스 사용을 위해\n최신 버전으로 업데이트해주세요.', url: appInfo.url });
    //     res.end();
    //     return;
    // }


    let result = await models.POPUP_TB.scope([
        'active',
        'desc',
    ]).findAll({
        raw: true
    });


    rt.result = {
        config: {
            ...consts
        },
        popups: result
    };

    send(req, res, rt);

});

/* 팝업 */
app.post('/popup', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let result = await models.POPUP_TB.scope([
        'active',
        'desc',
    ]).findAll({
        raw: true
    });

    rt.result = result;

    send(req, res, rt);

});

/* 약관 */
app.post('/term', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { type = 1, nowDt, ip } = req.body;

    const rows = await models.TERM_TB.findOne({
        raw: true,
        where: {
            type: type
        }
    });

    if (!rows) {
        sendError(req, res, 'code_1000');
        return;
    }

    rt.result = { title: rows?.title, content: rows?.comment };

    send(req, res, rt);
});


/* 쿠폰 */
app.post('/coupon', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: null
    }

    let { t, template_idx = 0, type = 1, nowDt, ip } = req.body;

    if (!t && !template_idx) {
        send(req, res, rt);
        return;
    }

    if (t) {
        let idx = decodeId(t);
        if (!idx) {
            send(req, res, rt);
            return;
        }

        const event = await models.EVENT_SEND_TB.scope(['active', 'desc']).findOne({
            where: {
                idx: idx
            }
        });

        if (!event) {
            send(req, res, rt);
            return;
        }

        const eventData = await models.EVENT_TB.scope(['active', 'desc']).findOne({
            where: {
                idx: event?.event_idx
            }
        });

        if (!eventData) {
            send(req, res, rt);
            return;
        }

        const template = await models.EVENT_TEMPLATE_TB.scope(['active', 'desc', 'status', 'viewer']).findOne({
            where: {
                idx: eventData?.template_idx
            }
        });

        if (!template) {
            send(req, res, rt);
            return;
        }

        rt.result = {
            template: template,
            event: {
                idx: event?.idx,
                used: event?.used,
                title: eventData?.title,
                comment: eventData?.comment,
                sdate: eventData?.sdate,
                edate: eventData?.edate,
                type: eventData?.type,
                discount: eventData?.discount,
                min_amount: eventData?.min_amount
            }
        }

    } else {

        const template = await models.EVENT_TEMPLATE_TB.scope(['active', 'desc', 'status', 'viewer']).findOne({
            where: {
                idx: template_idx
            }
        });

        if (!template) {
            send(req, res, rt);
            return;
        }

        rt.result = {
            template: template,
        }
    }


    send(req, res, rt);
});


app.post('/couponUsed', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx = 0, nowDt, ip } = req.body;

    const event = await models.EVENT_SEND_TB.scope(['active', 'desc']).findOne({
        where: {
            idx: idx
        }
    });

    if (!event) {
        sendError(req, res, 'code_1000');
        return;
    }

    await event.update({ used: true, usedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') });

    rt.result = true;

    send(req, res, rt);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server Up and running at ${PORT}`));