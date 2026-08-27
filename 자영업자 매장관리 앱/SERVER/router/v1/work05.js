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
 * /v1/work05/list:
 *   post:
 *     summary: 고객 리스트
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
    

    let result = await models.CUSTOMER_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findAll()

    rt.result = result;

    send(req, res, rt);

});



/**
 * @openapi
 * /v1/work05/get:
 *   post:
 *     summary: 고객 상세
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1,"description": "고객 고유번호" },
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


    let row = await models.CUSTOMER_TB.scope([
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
 * /v1/work05/update:
 *   post:
 *     summary: 고객 등록/수정
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number | null", "example":1, "description": "고객 고유번호" },
 *                "name": { "type": "string", "example": "이름", "description": "이름" },
 *                "hp": { "type": "string", "example": "01012345678", "description": "휴대폰 번호" },
 *                "gender": { "type": "number", "example": 1, "description": "성별" },
 *                "age": { "type": "number", "example": 1, "description": "연령대" },
 *                "visit": { "type": "number", "example": 1, "description": "방문경로" },
 *                "memo": { "type": "string", "example": "메모", "description": "메모" },
 *                "vip": { "type": "boolean", "example": true, "description": "VIP 여부" },
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

    let { idx, name, hp, gender, age, visit, memo, vip, store, user, nowDt, ip } = req.body;

    if(!name || !hp || !gender || !age || !visit) {
        sendError(req, res, "params");
        return;
    }


    try {
        let ob = {
            store_idx: store?.idx,
            user_idx: user?.idx,
            name: name,
            hp: hp,
            gender: gender,
            age: age,
            visit: visit,
            memo: memo,
            vip: vip,
        };

        if (idx) {

            const count = await models.CUSTOMER_TB.count({
                where: {
                    store_idx: store?.idx,
                    hp: hp,
                    idx: { [Op.ne]: idx }
                }
            });

            if (count > 0) throw new Error("work05_duple_hp");

            const row = await models.CUSTOMER_TB.findOne({
                where: {
                    idx: idx,
                    user_idx: user?.idx
                }
            });

            if (!row) throw new Error("auth_fail");

            await row.update(ob)
        } else {

            const count = await models.CUSTOMER_TB.count({
                where: {
                    store_idx: store?.idx,
                    hp: hp,
                }
            });

            if (count > 0) throw new Error("work05_duple_hp");

            let createData = await models.CUSTOMER_TB.create(ob)
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
 * /v1/work05/delete:
 *   post:
 *     summary: 고객 삭제
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "고객 고유번호" },
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
        let row = await models.CUSTOMER_TB.findOne({
            where: {
                idx: idx,
                user_idx: user?.idx
            }
        });

        if (!row) throw new Error("auth_fail");

        await row.update({
            deleteAt: nowDt
        })
        
    } catch ({ message }) {
        sendError(req, res, message || "default");
        return;
    }

    rt.result = true;

    send(req, res, rt);
});




module.exports = router;
