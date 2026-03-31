const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const models = require('../../models');

const { send, sendError, scd } = require('../../service/utils.js');
const { isLogin, checkUser } = require('../../service/auth.js');

router.use(isLogin)
/**
 * @openapi
 * /v1/alarm/badgeCount:
 *   post:
 *     summary: 알람 뱃지 수 조회
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
        result: []
    }

    let { user, nowDt, ip } = req.body;

    if (!user) {
        send(req, res, rt);
        return;
    }

    const list = await models.USER_ALARM_TB.scope(['desc', { method: ['my', user?.idx || 0] } ]).findAll();


    rt.result = list;

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/alarm/read:
 *   post:
 *     summary: 알람 읽음처리
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
 *                "idx": { "type": "number", "example":1,"description": "알람 고유번호" },
 *              },
 *            }
 *          }
 *        }
 *     }
 *     responses:
 *       200:
 *         description: Return true
 */
router.post('/read', checkUser, async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: false
    }

    let { idx, user, nowDt, ip } = req.body;

    if (!idx) {
        sendError(req, res, "params");
        return;
    }

    let ob = {};

    if(idx !== 'all') {
        ob = {
            idx: idx
        }
    } 

    const row = await models.USER_ALARM_TB.scope([{ method: ['my', user?.idx || 0] } ]).update({
        status: 2
    }, {
        where: ob
    });
    

    rt.result = true;

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/alarm/badgeCount:
 *   post:
 *     summary: 알람 뱃지 수 조회
 *     tags: [Front]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Return true
 */
router.post('/badgeCount', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: 0
    }

    let { user, nowDt, ip } = req.body;

    if (!user) {
        send(req, res, rt);
        return;
    }

    const unreadCounts = await models.USER_ALARM_TB.count({
        where: {
            user_idx: user?.idx || 0,
            status: 1
        }
    });

    console.log('unreadCounts', user?.nickname, unreadCounts);

    rt.result = unreadCounts;

    send(req, res, rt);
});




module.exports = router;