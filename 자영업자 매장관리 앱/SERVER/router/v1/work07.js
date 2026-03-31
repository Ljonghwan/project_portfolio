const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const _ = require('lodash');

const { Op } = require("sequelize");
const dayjs = require('dayjs');

const models = require('../../models');
const codes = require('../../service/errorCode.js');

const { isLogin, checkUser, checkStore, logs, encryptePassword } = require('../../service/auth.js');
const { send, sendError, saveImages, encodeBase64, decodeBase64, getItemCostGroupInfo } = require('../../service/utils.js');
const { encrypt, decrypt } = require('../../service/crypto.js');

router.use(checkUser);
router.use(checkStore);

/**
 * @openapi
 * /v1/work07/list:
 *   post:
 *     summary: 근무 형태 리스트
 *     tags: [Front]
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

    let { store, user, nowDt, ip } = req.body;


    let result = await models.STAFF_WORK_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findAll();


    rt.result = result;

    send(req, res, rt);

});



/**
 * @openapi
 * /v1/work07/get:
 *   post:
 *     summary: 근무 형태 상세
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1,"description": "직원 고유번호" },
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


    let row = await models.STAFF_WORK_TB.scope([
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
 * /v1/work07/update:
 *   post:
 *     summary: 근무 형태 등록/수정
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number | null", "example":1, "description": "직원 고유번호" },
 *                "work_type": { "type": "string", "example": "주방 보조", "description": "근무 형태" },
 *                "work_day": { "type": "array", items: { type: string }, example: ["월", "화", "수", "목", "금"], "description": "근무 요일" },
 *                "work_stime": { "type": "string", "example": "09:00", "description": "근무 시작시간" },
 *                "work_etime": { "type": "string", "example": "18:00", "description": "근무 종료시간" },
 *                "pay": { "type": "number", "example": 10000, "description": "시급" },
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

    let { idx, work_type, work_day, work_stime, work_etime, pay, store, user, nowDt, ip } = req.body;

    if(!work_type || work_day?.length < 1 || !work_stime || !work_etime || !pay) {
        sendError(req, res, "params");
        return;
    }


    try {
        let ob = {
            store_idx: store?.idx,
            user_idx: user?.idx,
            work_type: work_type,
            work_day: work_day,
            work_stime: work_stime,
            work_etime: work_etime,
            pay: pay,
        };

        if (idx) {
            const row = await models.STAFF_WORK_TB.findOne({
                where: {
                    idx: idx,
                    user_idx: user?.idx
                }
            });

            if (!row) throw new Error("auth_fail");

            await row.update(ob)
        } else {

            let createData = await models.STAFF_WORK_TB.create(ob)
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
 * /v1/work07/delete:
 *   post:
 *     summary: 근무 형태 삭제
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "근무 형태 고유번호" },
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
        let row = await models.STAFF_WORK_TB.findOne({
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
