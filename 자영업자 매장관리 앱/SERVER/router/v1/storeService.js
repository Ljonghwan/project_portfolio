const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { isLogin, checkUser, checkStore, logs } = require('../../service/auth.js');
const { send, sendError, scd, randomNumberCreate } = require('../../service/utils.js');
const { getCardSalesStore, getMonthSalesService, getTodaySalesService } = require('../../service/hyphen.js');
const { sendPush } = require('../../service/fcm.js');

const { Op } = require("sequelize");
const dayjs = require('dayjs');

const models = require('../../models');
const codes = require('../../service/errorCode.js');

const { encrypt, decrypt } = require('../../service/crypto.js');


router.use(checkUser);
router.use(checkStore);


/**
 * @openapi
 * /v1/storeService/cardsales:
 *   post:
 *     summary: 매장 여신금융협회 연동하기
 *     tags: [Front]
  *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "id": { "type": "String", "example": "userid", "description": "여신금융협회 아이디" },
 *                "pw": { "type": "String", "example": "password", "description": "여신금융협회 비밀번호" }
 *              },
 *            }
 *          }
 *        }
 *     }
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns true
 */
router.post('/cardsales', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { store_idx, id, pw, uuid, user, nowDt, ip } = req.body;

    if (!store_idx || !id || !pw || !uuid) {
        sendError(req, res, "params");
        return;
    }

    let store = await models.STORE_TB.scope(['active', { method: ['my', user?.idx] }]).findOne(
        {
            where: {
                idx: store_idx || 0
            }
        }
    )

    if(!store) {
        sendError(req, res, "code_1000");
        return;
    }
    if(!store?.open_date) {
        sendError(req, res, "store_open_date_invalid");
        return;
    }

    // 잡 생성
    let job = await models.STORE_SERVICE_JOB.create({
        user_idx: user?.idx,
        store_idx: store?.idx,
        uuid: uuid
    })
   

    setTimeout(async () => {

        // 여신금융협회 계정 확인
        const { ok, msg, result, errorMsg } = await getCardSalesStore({
            store: {
                ...store.get({ plain: true }),
                cardsales_id: id,
                cardsales_pw: encrypt(pw)
            }
        });

        // 잡 조회
        job = await models.STORE_SERVICE_JOB.findOne({
            where: {
                uuid: uuid,
                status: 1
            }
        })

        if(!job) {
            sendError(req, res, "cancel");
            logs({
                type: '서비스연동',
                title: '여신금융협회 연동에 실패했습니다.',
                comment: '사용자 취소 요청',
                status: 2,
                user_idx: user?.idx,
                store_idx: store?.idx
            })
            return;
        }

        await job.update({  status: 2 });

        if (!ok) {
            sendError(req, res, msg);

            logs({
                type: '서비스연동',
                title: '여신금융협회 연동에 실패했습니다.',
                comment: (codes?.[msg]?.message || codes.default?.message) + (errorMsg ? ` : ${errorMsg}` : ''),
                status: 2,
                user_idx: user?.idx,
                store_idx: store?.idx
            })
            return;
        }

        await store.update({
            cardsales_id: id,
            cardsales_pw: encrypt(pw),
            cardsales_grp_id: result?.memGrpId
        });


        send(req, res, rt);

        logs({
            type: '서비스연동',
            title: '여신금융협회 연동 성공',
            user_idx: user?.idx,
            store_idx: store?.idx
        })



        const startDate = dayjs(store?.open_date).tz();
        const endDate = dayjs().tz();

        // 총 월 수 계산
        let totalMonths = endDate.diff(startDate, 'month') + 1;
        if(totalMonths > 24) totalMonths = 24;

        for (let i = 0; i < totalMonths; i++) {
            const fromDate = startDate.add(i, 'month').startOf('month').format('YYYYMMDD');
            const toDate = startDate.add(i, 'month').endOf('month').format('YYYYMMDD');

            console.log(`${fromDate} ~ ${toDate}`, store?.cardsales_pw);

            await getMonthSalesService({ store, user, fromDate: fromDate, toDate: toDate });
        }


        let maxTrDt = await models.STORE_CARD_SALES_TB.max('trDt',{
            where: {
                store_idx: store?.idx,
                type: 1
            }
        })
        console.log(maxTrDt);
        let fromDate2 = maxTrDt ? dayjs(maxTrDt+"").add(1, 'day').format('YYYYMMDD') : dayjs().subtract(1, 'day').format('YYYYMMDD');
        let toDate2 = dayjs().format('YYYYMMDD');

        console.log(fromDate2, toDate2);

        await getTodaySalesService({ store, user, fromDate: fromDate2, toDate: toDate2 });

        await sendPush([{
            user_idx: user?.idx,
            title: `매장 매출 연동 완료!`,
            body: `[${store?.title}] 매장 매출 연동이 완료되었습니다.`
        }]);

    }, 5000)

    

});






/**
 * @openapi
 * /v1/storeService/cancel:
 *   post:
 *     summary: 외부 서비스 연동 취소
 *     tags: [Front]
  *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "uuid": { "type": "String", "example": "uuid", "description": "고유 id" }
 *              },
 *            }
 *          }
 *        }
 *     }
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns true
 */
router.post('/cancel', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { uuid, store, user, nowDt, ip } = req.body;

    console.log(uuid);

    if (!uuid) {
        sendError(req, res, "params");
        return;
    }

    let job = await models.STORE_SERVICE_JOB.update({
        status: 9
    }, {
        where: {
            uuid: uuid,
            status: 1
        }
    })
   
    send(req, res, rt);
    

});




/**
 * @openapi
 * /v1/storeService/cardsalesClear:
 *   post:
 *     summary: 여신금융협회 연동 해제
 *     tags: [Front]
  *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "store_idx": { "type": "Number", "example": "1", "description": "매장 고유번호" }
 *              },
 *            }
 *          }
 *        }
 *     }
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns true
 */
router.post('/cardsalesClear', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { store_idx, user, nowDt, ip } = req.body;


    if (!store_idx) {
        sendError(req, res, "params");
        return;
    }

    let store = await models.STORE_TB.scope(['active', { method: ['my', user?.idx] }]).findOne(
        {
            where: {
                idx: store_idx || 0
            }
        }
    )
    if(!store) {
        sendError(req, res, "code_1000");
        return;
    }


    await store.update({
        cardsales_id: null,
        cardsales_pw: null,
        cardsales_grp_id: null
    });

    logs({
        type: '서비스연동',
        title: '여신금융협회 연동 해제',
        user_idx: user?.idx,
        store_idx: store?.idx
    })

    send(req, res, rt);

});







module.exports = router;
