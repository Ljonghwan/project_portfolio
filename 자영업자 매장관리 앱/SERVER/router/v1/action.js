const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const dayjs = require('dayjs');

const models = require('../../models');
const { checkUser } = require('../../service/auth.js');
const { send, sendError, saveImages } = require('../../service/utils.js');

router.use(checkUser);

/**
 * @openapi
 * /v1/action/like:
 *   post:
 *     summary: 좋아요 토글
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "대상 고유번호" },
 *                "type": { "type": "number", "example":1, "description": "대상 타입" }
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
router.post('/like', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {
            status: false,
            count: 0
        }
    }

    let { idx, type, user, nowDt, ip } = req.body;

    // 필수 파라미터 검증
    if (!idx || !type) {
        sendError(req, res, "params");
        return;
    }

    try {
        let ob = {
            user_idx: user?.idx,
            type: type,
            target_idx: idx
        }
        const row = await models.LIKE_TB.findOne({
            where: ob
        });

        if (row) {
            await row.destroy();
            rt.result.status = false;
        } else {
            await models.LIKE_TB.create(ob);
            rt.result.status = true;
        }

    } catch (error) {
        console.log('error', error);
        sendError(req, res, "default");
        return;
    }


    // 카운트 집계까지는 보류
    // const count = await models.LIKE_TB.count({
    //     where: {
    //         type: type,
    //         target_idx: idx
    //     }
    // });

    // rt.result.count = count;

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/action/bookmark:
 *   post:
 *     summary: 스크랩 토글
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "대상 고유번호" },
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
router.post('/bookmark', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {
            status: false,
            count: 0
        }
    }

    let { idx, user, nowDt, ip } = req.body;

    // 필수 파라미터 검증
    if (!idx) {
        sendError(req, res, "params");
        return;
    }

    try {
        let ob = {
            user_idx: user?.idx,
            target_idx: idx
        }
        const row = await models.BOOKMARK_TB.findOne({
            where: ob
        });

        if (row) {
            await row.destroy();
            rt.result.status = false;
        } else {
            await models.BOOKMARK_TB.create(ob);
            rt.result.status = true;
        }

    } catch (error) {
        console.log('error', error);
        sendError(req, res, "default");
        return;
    }


    // 카운트 집계까지는 보류
    // const count = await models.BOOKMARK_TB.count({
    //     where: {
    //         target_idx: idx
    //     }
    // });

    // rt.result.count = count;

    send(req, res, rt);
});





/**
 * @openapi
 * /v1/action/block:
 *   post:
 *     summary: 글 차단
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "대상 고유번호" },
 *                "type": { "type": "number", "example":1, "description": "대상 타입" }
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
router.post('/block', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: true
    }

    let { idx, type, user, nowDt, ip } = req.body;

    // 필수 파라미터 검증
    if (!idx || !type) {
        sendError(req, res, "params");
        return;
    }

    try {
        let ob = {
            user_idx: user?.idx,
            type: type,
            target_idx: idx
        }
        await models.BLOCK_TB.findOrCreate({
            where: ob,
            defaults: ob
        });

    } catch (error) {
        console.log('error', error);
        sendError(req, res, "default");
        return;
    }

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/action/report:
 *   post:
 *     summary: 글 신고
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "대상 고유번호" },
 *                "type": { "type": "number", "example":1, "description": "대상 타입" },
 *                "comment": { "type": "string", "description": "신고 내용" },
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
router.post('/report', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: true
    }

    let { idx, type, comment, user, nowDt, ip } = req.body;

    // 필수 파라미터 검증
    if (!idx || !type || !comment) {
        sendError(req, res, "params");
        return;
    }

    try {
        let ob = {
            type: type,
            target_idx: idx,
            user_idx: user?.idx,
        }
        const row = await models.REPORT_TB.findOne({
            where: ob
        });

        if(row) throw new Error("already_report");
        
        
        await models.REPORT_TB.create({
            ...ob,
            comment: comment
        });

    } catch ({ message }) {
        sendError(req, res, message || "default");
        return;
    }

    send(req, res, rt);
});






/**
 * @openapi
 * /v1/action/vote:
 *   post:
 *     summary: 투표 토글
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "투표 고유번호" }
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
router.post('/vote', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {
            status: false,
            count: 0
        }
    }

    let { idx, board_idx, user, nowDt, ip } = req.body;

    // 필수 파라미터 검증
    if (!idx || !board_idx) {
        sendError(req, res, "params");
        return;
    }

    try {
        const row = await models.BOARD_VOTE_JOIN_TB.findOne({
            where: {
                user_idx: user?.idx,
                board_idx: board_idx,
            }
        });

        if(!row) {
            let created = await models.BOARD_VOTE_JOIN_TB.create({
                user_idx: user?.idx,
                board_idx: board_idx,
                target_idx: idx
            });
            rt.result.status = idx;
        } else if(row?.target_idx === idx) {
            await row.destroy();
            rt.result.status = false;
        } else {
            await row.update({
                target_idx: idx
            });
            rt.result.status = idx;
        }

    } catch (error) {
        console.log('error', error);
        sendError(req, res, "default");
        return;
    }

    let votes = await models.BOARD_VOTE_TB.scope(['count']).findAll(
        {
            raw: true,
            where: {
                target_idx: board_idx
            }
        }
    )

    rt.result.votes = votes;

    send(req, res, rt);
});


module.exports = router;
