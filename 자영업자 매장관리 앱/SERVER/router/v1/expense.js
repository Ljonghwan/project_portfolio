const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const _ = require('lodash');

const { Op } = require("sequelize");
const dayjs = require('dayjs');

const models = require('../../models');
const codes = require('../../service/errorCode.js');

const { isLogin, checkUser, checkStore, logs } = require('../../service/auth.js');
const { send, sendError, saveImages, encodeBase64, decodeBase64 } = require('../../service/utils.js');
const { getExpenseList } = require('../../service/getData.js');

const consts = require('../../service/consts.js');

router.use(checkUser);
router.use(checkStore);

/**
 * @openapi
 * /v1/expense/list:
 *   post:
 *     summary: 매장 지출 리스트
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "startDate": { "type": "string", "example": "2025-01-01","description": "검색 시작날짜" },
 *                "endDate": { "type": "string", "example": "2025-02-02","description": "검색 종료날짜" },
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
router.post('/list', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { startDate, endDate, store, user, nowDt, ip } = req.body;

    let result = await getExpenseList({ startDate, endDate, store });

    rt.result = {
        list: result,
        total: result?.reduce((acc, item) => acc + item?.amount * 1, 0) || 0,
        totalFix: result?.filter((x, i) => [1].includes(consts.expenseType.find((y, i) => y?.idx == x?.type)?.category) )?.reduce((acc, item) => acc + item?.amount * 1, 0) || 0,
    }

    send(req, res, rt);

});



/**
 * @openapi
 * /v1/expense/get:
 *   post:
 *     summary: 매장 지출 상세
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1,"description": "매장 지출 고유번호" },
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
router.post('/get', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx = 0, store, user, nowDt, ip } = req.body;


    let row = await models.STORE_EXPENSE_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findOne({
        where: { idx: idx }
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
 * /v1/expense/update:
 *   post:
 *     summary: 매장 지출 등록/수정
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number | null", "example":1, "description": "매장 지출 고유번호" },
 *                "title": { "type": "string", "example": "메뉴명", "description": "메뉴명" },
 *                "category": { "type": "string", "example": "메인메뉴", "description": "카테고리" },
 *                "amount": { "type": "number", "example": 10000, "description": "판매가격" },
 *                "list": { "type": "array", items: { type: object }, example: [{ idx: 1, target_idx: 1, type: '일반', input: 100 }], description: 원재료 리스트(메뉴 재료 리스트 고유번호, 원재료(제품) 고유번호, 구분(일반, 복합), 투입량) },
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

    let { idx,
        title,
        type,
        amount,
        date,
        loop,
        loop_end_date,
        memo,
        store,
        user,
        nowDt,
        ip
    } = req.body;

    if (!title || !type || !amount || !date) {
        sendError(req, res, "params");
        return;
    }

    try {
        let ob = {
            store_idx: store?.idx,
            user_idx: user?.idx,
            title: title,
            type: type,
            amount: amount,
            date: parseInt((date + "")?.replace(/-/g, '')),
            loop: loop,
            loop_end_date: !loop ? null : loop_end_date ? parseInt((loop_end_date + "")?.replace(/-/g, '')) : null,
            memo: memo,
        };

        if (idx) {
            const row = await models.STORE_EXPENSE_TB.findOne({
                where: {
                    idx: idx,
                    user_idx: user?.idx
                }
            });

            if (!row) throw new Error("auth_fail");

            await row.update(ob)
        } else {
            let createData = await models.STORE_EXPENSE_TB.create(ob)
            idx = createData?.idx;
        }

    } catch ({ message }) {
        console.log('error', message);
        sendError(req, res, message || "req_invalid");
        return;
    }

    rt.result = idx;

    send(req, res, rt);

});



/**
 * @openapi
 * /v1/expense/delete:
 *   post:
 *     summary: 매장 지출 삭제
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "매장 지출 고유번호" },
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

    let { idx = 0, store, user, nowDt, ip } = req.body;

    try {
        let row = await models.STORE_EXPENSE_TB.findOne({
            where: {
                idx: idx,
                user_idx: user?.idx
            }
        });

        if (!row) throw new Error("auth_fail");

        await row.destroy();

    } catch ({ message }) {
        sendError(req, res, message || "default");
        return;
    }

    rt.result = true;

    send(req, res, rt);
});



module.exports = router;
