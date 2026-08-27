const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const models = require('../../models');
const { Op } = require("sequelize");
const { send, sendError, scd, randomNumberCreate, numFormat, getWorkingStaffList, calculateDailyWage } = require('../../service/utils.js');
const { isLogin, checkUser, checkStore, logs } = require('../../service/auth.js');
const { getCardSalesStore, getMonthSalesService, getTodaySales } = require('../../service/hyphen.js');
const { getExpenseList } = require('../../service/getData.js');

const dayjs = require('dayjs');

const consts = require('../../service/consts.js');

router.use(checkUser);
router.use(checkStore);

/**
 * @openapi
 * /v1/work06/template:
 *   post:
 *     summary: 이벤트 템플릿 리스트 가져오기
 *     tags: [Front]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns true
 */
router.post('/template', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { store, user, nowDt, ip } = req.body;

    let result = await models.EVENT_TEMPLATE_TB.scope(['active', 'desc', 'status']).findAll();

    rt.result = result;

    send(req, res, rt);
});





/**
 * @openapi
 * /v1/work06/list:
 *   post:
 *     summary: 이벤트 리스트 가져오기
 *     tags: [Front]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns true
 */
router.post('/list', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { store, user, nowDt, ip } = req.body;

    let result = await models.EVENT_TB.scope([
        'active',
        'desc',
        'senders',
        { method: ['my', store?.idx || 0] },
    ]).findAll();

    rt.result = result;

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/work06/get:
 *   post:
 *     summary: 이벤트 상세 가져오기
 *     tags: [Front]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
*     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1,"description": "이벤트 고유번호" },
 *              },
 *            }
 *          }
 *        }
 *     }
 *     responses:
 *       200:
 *         description: Returns true
 */
router.post('/get', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx = 0, store, user, nowDt, ip } = req.body;

    let row = await models.EVENT_TB.scope([
        'active',
        'desc',
        'senders',
        { method: ['my', store?.idx || 0] },
    ]).findOne({
        where: {
            idx: idx
        }
    });

    if (!row) {
        sendError(req, res, "code_1000");
        return;
    }
    
    rt.result = row;

    send(req, res, rt);
});


/**
 * @openapi
 * /v1/work06/update:
 *   post:
 *     summary: 이벤트 등록
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "title": { "type": "string", "example": "이벤트 제목", "description": "이벤트 제목" },
 *                "comment": { "type": "string", "example": "이벤트 설명", "description": "이벤트 설명" },
 *                "template_idx": { "type": "number", "example": 1, "description": "템플릿 고유번호" },
 *                "type": { "type": "number", "example": 1, "description": "할인방식(1=정액 2=정률)" },
 *                "discount": { "type": "number", "example": 10000, "description": "할인금액 or 할인율" },
 *                "min_amount": { "type": "string", "example": "1만원 이상 결제시", "description": "최소 결제금액" },
 *                "sdate": { "type": "string", "example": "2025-01-01", "description": "이벤트 시작일" },
 *                "edate": { "type": "string", "example": "2025-01-01", "description": "이벤트 종료일" },
 *                "customers": { "type": "array", "example": [1, 2, 3], "description": "고객 목록" },
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
 *         description: Return true
 */
router.post('/update', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { title, comment, template_idx, type, discount, min_amount, sdate, edate, customers, store, user, nowDt, ip } = req.body;

    if(!title || !comment || !template_idx || !type || !discount || !sdate || !edate || !customers || customers?.length < 1) {
        sendError(req, res, "params");
        return;
    }


    const transaction = await models.sequelize.transaction();

    try {
        let ob = {
            store_idx: store?.idx,
            user_idx: user?.idx,
            template_idx: template_idx,
            title: title,
            comment: comment,
            sdate: parseInt((sdate + "")?.replace(/-/g, '')),
            edate: parseInt((edate + "")?.replace(/-/g, '')),
            type: type,
            discount: discount,
            min_amount: min_amount
        };

        const template = await models.EVENT_TEMPLATE_TB.scope(['active', 'desc', 'status']).findOne({
            where: {
                idx: template_idx
            }
        });

        if(!template) {
            sendError(req, res, "work06_duple_template");
            return;
        }

        let senders = await models.CUSTOMER_TB.scope([
            'active',
            'desc',
            { method: ['my', store?.idx || 0] },
        ]).findAll({
            where: {
                idx: { [Op.in]: customers }
            }
        });
        
        if(senders?.length !== customers?.length) {
            sendError(req, res, "work06_customers_not_match");
            return;
        }
       

        let createData = await models.EVENT_TB.create(ob, { transaction })
        let idx = createData?.idx;


        for(let sender of senders) {
            await models.EVENT_SEND_TB.create({
                user_idx: user?.idx,
                store_idx: store?.idx,
                event_idx: idx,
                customer_idx: sender?.idx,
                sendReserveAt: dayjs(sdate).format('YYYY-MM-DD 09:00:00')
            }, { transaction })
        }

        // 모든 작업 성공 시 커밋
        await transaction.commit();

    } catch ({ message }) {
        console.log('error', message);
        // 오류 발생 시 롤백
        await transaction.rollback();

        sendError(req, res, message || "req_invalid");
        return;
    }

    rt.result = true;

    send(req, res, rt);

});



/**
 * @openapi
 * /v1/work06/delete:
 *   post:
 *     summary: 이벤트 삭제
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "이벤트 고유번호" },
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
 *         description: Return true
 */
router.post('/delete', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx=0, store, user, nowDt, ip } = req.body;

    try {
        let row = await models.EVENT_TB.findOne({
            where: {
                idx: idx,
                user_idx: user?.idx
            }
        });

        if (!row) throw new Error("auth_fail");

        if(row?.status !== 2) {
            sendError(req, res, "work06_event_not_delete");
            return;
        }
        
        await row.destroy();

    } catch ({ message }) {
        sendError(req, res, message || "default");
        return;
    }

    rt.result = true;

    send(req, res, rt);
});







module.exports = router;
