const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { Op } = require("sequelize");
const dayjs = require('dayjs');

const models = require('../../models');
const { isLogin, checkUser } = require('../../service/auth.js');
const { send, sendError, saveImages, encodeBase64, decodeBase64 } = require('../../service/utils.js');

/**
 * @openapi
 * /v1/notice/list:
 *   post:
 *     summary: 공지사항 리스트
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

    let result = await models.NOTICE_TB.scope([
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
 * /v1/notice/get:
 *   post:
 *     summary: 공지사항 상세
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1,"description": "공지사항 고유번호" },
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

    let row = await models.NOTICE_TB.scope(['active', 'status']).findOne(
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




module.exports = router;
