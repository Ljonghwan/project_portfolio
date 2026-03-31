const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const dayjs = require('dayjs');

const models = require('../../models');
const { checkUser } = require('../../service/auth.js');
const { send, sendError, saveImages } = require('../../service/utils.js');
const { sendPush } = require('../../service/fcm.js');

router.use(checkUser);

/**
 * @openapi
 * /v1/reply/comment:
 *   post:
 *     summary: 댓글 등록
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "게시글 고유번호" },
 *                "target_idx": { "type": "number | null", "example":1, "description": "대상 댓글 고유번호(대댓글일시)" },
 *                "comment": { "type": "string", "description": "내용" },
 *                "emoji": { "type": "number", "example":1, "description": "이모티콘 고유번호" },
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

    let { idx, parent_idx, comment, emoji, user, nowDt, ip } = req.body;

    // 필수 파라미터 검증
    if (!idx || !comment) {
        sendError(req, res, "params");
        return;
    }

    let ob = {
        user_idx: user?.idx,
        board_idx: idx,
        parent_idx: parent_idx || null,
        comment: comment,
        emoji: emoji || null
    };

    try {
        await models.REPLY_TB.create(ob)

    } catch (error) {
        console.log('error', error);
        sendError(req, res, "req_invalid");
        return;
    }

    rt.result = true;

    send(req, res, rt);


    
    const row = await models.BOARD_TB.scope(['active', 'status']).findOne({
        where: {
            idx: idx
        }
    });

    if(row && row?.user_idx !== user?.idx) {
        sendPush([{
            user_idx: row?.user_idx,
            title: `[${row?.title}] 글에 댓글이 달렸어요!`,
            body: comment,
            data: {
                route: 'boardView',
                idx: idx+""
            }
        }]);
    }

});


/**
 * @openapi
 * /v1/reply/delete:
 *   post:
 *     summary: 댓글 삭제
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "댓글 고유번호" },
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

    let { idx=0, user, nowDt, ip } = req.body;

    try {
        const row = await models.REPLY_TB.findOne({
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
