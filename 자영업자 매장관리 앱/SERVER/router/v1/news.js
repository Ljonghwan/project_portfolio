const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { Op } = require("sequelize");
const dayjs = require('dayjs');

const models = require('../../models');
const { isLogin, checkUser, checkStore } = require('../../service/auth.js');
const { send, sendError, saveImages, encodeBase64, decodeBase64 } = require('../../service/utils.js');

/**
 * @openapi
 * /v1/news/list:
 *   post:
 *     summary: 소식 리스트
 *     tags: [Front]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Return true
 */
router.post('/list', isLogin, async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: []
    }

    let { user, nowDt, ip } = req.body;

    let result = await models.NEWS_TB.scope([
        'active',
        'status',
        'desc',
        'list'
    ]).findAll()

    rt.result = result;

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/news/get:
 *   post:
 *     summary: 소식 상세
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1,"description": "소식 고유번호" },
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
router.post('/get', isLogin, async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx = 0, user, nowDt, ip } = req.body;

    let row = await models.NEWS_TB.scope(['active', 'status']).findOne(
        {
            where: {
                idx: idx
            }
        }
    )

    if (!row) {
        sendError(req, res, "code_1000");
        return;
    }

    rt.result = row;

    send(req, res, rt);

    await row.increment('view');
});




/**
 * @openapi
 * /v1/news/itemChange:
 *   post:
 *     summary: 원가 변동 알림 리스트
 *     tags: [Front] 
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Return true
 */
router.post('/itemChange', isLogin, checkStore, async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: []
    }

    let { user, store, nowDt, ip } = req.body;

    let result = await models.ITEM_CHANGE_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findAll()

    rt.result = result;

    send(req, res, rt);
});




module.exports = router;
