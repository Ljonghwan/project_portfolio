const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const models = require('../../models');
const { encryptePassword, checkAdmin, checkAuth, AuthLevel } = require('../../service/auth.js');
const { send, sendError, scd, saveImages } = require('../../service/utils.js');
const { sendPush } = require('../../service/fcm.js');

const dayjs = require('dayjs');

router.use(checkAdmin)

/**
 * @openapi
 * /admin/feedback/list:
 *   post:
 *     summary: 고객피드백 리스트
 *     tags: [Admin]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns all term
 */
router.post('/list', async (req, res) => {
    let rt = {
        ok: true,
        msg: '',
        result: {}
    }
    let { idx, user, nowDt, ip } = req.body;

    if (!checkAuth(AuthLevel.READ, user?.auth?.cs_1)) {
        sendError(req, res, "auth_fail");
        return;
    }

    let result = await models.FEEDBACK_TB.scope([
        'active',
        'desc',
        'user',
        'admin',
    ]).findAll();

    rt.result = result;

    send(req, res, rt);
});


/**
 * @openapi
 * /admin/feedback/update:
 *   post:
 *     summary: 고객피드백 답변달기
 *     tags: [Admin]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     requestBody: {
 *       "required": true,
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "item": { 
 *                  "type": "object", 
 *                  "example": {
 *                      idx: 1,
 *                      answer: "답변내용" 
 *                  }, 
 *                  "description": "데이터 인스턴스" 
 *                },
 *              }
 *            }
 *          }
 *        }
 *     }
 
 *     responses:
 *       200:
 *         description: Returns Success
 */
router.post('/update', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let {
        item,
        user,
        nowDt, ip
    } = req.body;

    if (!checkAuth(AuthLevel.MODIFY, user?.auth?.cs_1)) {
        sendError(req, res, "auth_fail");
        return;
    }

    // 필수 파라미터 검증
    if (
        !item?.idx ||
        !item?.answer
    ) {
        sendError(req, res, "params");
        return;
    }


    let idx = item?.idx || null;

    try {
        const row = await models.FEEDBACK_TB.findOne({
            where: {
                idx: idx,
            }
        }).catch(e => {});

        if (!row) throw new Error("code_1000");

        await row.update({
            answer: item?.answer,
            status: 2,
            admin_idx: user?.idx,
            answerAt: nowDt
        });

        sendPush([{
            user_idx: row?.user_idx,
            title: `문의하신 내용에 답변이 등록되었습니다.`,
            body: `답변을 확인해보세요!`,
            data: {
                route: 'myFeedback'
            }
        }]);

    } catch ({ message }) {
        sendError(req, res, message || "req_invalid");
        return;
    }


    rt.result = true;

    send(req, res, rt);

    
});


module.exports = router;
