const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const models = require('../../models');
const { encryptePassword, checkAdmin, checkAuth, AuthLevel } = require('../../service/auth.js');
const { send, sendError, scd, saveImages } = require('../../service/utils.js');

const dayjs = require('dayjs');

router.use(checkAdmin)

/**
 * @openapi
 * /admin/content/board:
 *   post:
 *     summary: 커뮤니티 리스트
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
 *                "idx": { "type": "number", "example": 1, "description": "커뮤니티 고유번호(값 있으면 상세정보)" },
 *              }
 *            }
 *          }
 *        }
 *     }
 *     responses:
 *       200:
 *         description: Returns all term
 */
router.post('/board', async (req, res) => {
    let rt = {
        ok: true,
        msg: '',
        result: {}
    }
    let { idx, user, nowDt, ip } = req.body;

    if (!checkAuth(AuthLevel.READ, user?.auth?.contents_1)) {
        sendError(req, res, "auth_fail");
        return;
    }

    if (!idx) {
        let result = await models.BOARD_TB.scope([
            'active',
            'desc',
            'list',
            'count',
            'user'
        ]).findAll();

        rt.result = result?.map(x => {
            const json = x.toJSON();
            json.comment = json.commentStrip;
            return json;
        });

    } else {
        let row = await models.BOARD_TB.scope(['active', 'count', 'user']).findOne(
            {
                where: {
                    idx: idx
                }
            }
        ).catch(e => { })

        if (!row) {
            sendError(req, res, "code_1000");
            return;
        }

        let replys = await models.REPLY_TB.scope(['desc', 'user']).findAll(
            {
                where: {
                    board_idx: idx
                }
            }
        )

        let votes = await models.BOARD_VOTE_TB.scope(['count']).findAll(
            {
                where: {
                    target_idx: idx
                }
            }
        )

        let reports = await models.REPORT_TB.scope(['desc', 'user']).findAll(
            {
                where: {
                    type: 1,
                    target_idx: idx
                }
            }
        )

        rt.result = {
            item: row,
            replys: replys,
            votes: votes,
            reports: reports
        }
    }


    send(req, res, rt);
});


/**
 * @openapi
 * /admin/content/boardDelete:
 *   post:
 *     summary: 커뮤니티 삭제
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
 *                "idx": { "type": "number", "description": "커뮤니티 고유번호" },
 *              },
 *              "required": ["idx"]
 *            }
 *          }
 *        }
 *     }
 *     responses:
 *       200:
 *         description: Returns true
 */
router.post('/boardDelete', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx, user, nowDt, ip } = req.body;

    if (!checkAuth(AuthLevel.DELETE, user?.auth?.contents_1)) {
        sendError(req, res, "auth_fail");
        return;
    }

    // 필수 파라미터 검증
    if (!idx) {
        sendError(req, res, "params");
        return;
    }

    const row = await models.BOARD_TB.findOne({
        where: {
            idx: idx,
        }
    }).catch(e => { });

    if (!row) {
        sendError(req, res, "code_1000");
        return;
    }

    await row.update({
        deleteAt: nowDt
    })

    send(req, res, rt);
});




/**
 * @openapi
 * /admin/content/boardStatus:
 *   post:
 *     summary: 커뮤니티 노출&비노출 처리
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
 *                "idx": { "type": "number", "description": "커뮤니티 고유번호" },
 *              },
 *              "required": ["idx"]
 *            }
 *          }
 *        }
 *     }
 *     responses:
 *       200:
 *         description: Returns true
 */
router.post('/boardStatus', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx, user, nowDt, ip } = req.body;

    if (!checkAuth(AuthLevel.MODIFY, user?.auth?.contents_1)) {
        sendError(req, res, "auth_fail");
        return;
    }

    // 필수 파라미터 검증
    if (!idx) {
        sendError(req, res, "params");
        return;
    }

    const row = await models.BOARD_TB.findOne({
        where: {
            idx: idx,
        }
    }).catch(e => { });

    if (!row) {
        sendError(req, res, "code_1000");
        return;
    }

    await row.update({
        status: row?.status === 1 ? 2 : 1
    })

    send(req, res, rt);
});



/**
 * @openapi
 * /admin/content/replyDelete:
 *   post:
 *     summary: 댓글 삭제
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
 *                "idx": { "type": "number", "description": "댓글 고유번호" },
 *              },
 *              "required": ["idx"]
 *            }
 *          }
 *        }
 *     }
 *     responses:
 *       200:
 *         description: Returns true
 */
router.post('/replyDelete', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx, user, nowDt, ip } = req.body;

    if (!checkAuth(AuthLevel.DELETE, user?.auth?.contents_1)) {
        sendError(req, res, "auth_fail");
        return;
    }

    // 필수 파라미터 검증
    if (!idx) {
        sendError(req, res, "params");
        return;
    }

    const row = await models.REPLY_TB.findOne({
        where: {
            idx: idx,
        }
    }).catch(e => { });

    if (!row) {
        sendError(req, res, "code_1000");
        return;
    }

    await row.update({
        deleteAt: nowDt,
        deleteComment: '운영자에 의해 삭제된 댓글입니다.'
    })

    send(req, res, rt);
});




/**
 * @openapi
 * /admin/content/report:
 *   post:
 *     summary: 신고 리스트
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
 *                "idx": { "type": "number", "example": 1, "description": "신고 고유번호(값 있으면 상세정보)" },
 *              }
 *            }
 *          }
 *        }
 *     }
 *     responses:
 *       200:
 *         description: Returns all term
 */
router.post('/report', async (req, res) => {
    let rt = {
        ok: true,
        msg: '',
        result: {}
    }
    let { idx, user, nowDt, ip } = req.body;

    if (!checkAuth(AuthLevel.READ, user?.auth?.contents_3)) {
        sendError(req, res, "auth_fail");
        return;
    }

    if (!idx) {
        let result = await models.REPORT_TB.scope([
            'desc',
            'user'
        ]).findAll();

        rt.result = result;
    } else {

        try {
            let row = await models.REPORT_TB.scope(['user']).findOne(
                {
                    where: {
                        idx: idx
                    }
                }
            );

            if (!row) {
                sendError(req, res, "code_1000");
                return;
            }

            let boardIdx = '';

            if (row?.type === 1) boardIdx = row?.target_idx;
            else if (row?.type === 2) {
                let reply = await models.REPLY_TB.findOne(
                    {
                        raw: true,
                        where: {
                            idx: row?.target_idx
                        }
                    }
                );

                boardIdx = reply?.board_idx
            }

            rt.result = {
                item: row,
                boardIdx: boardIdx,
            }

        } catch (error) {
            sendError(req, res, "code_1000");
            return;
        }

    }

    send(req, res, rt);
});


/**
 * @openapi
 * /admin/content/reportStatus:
 *   post:
 *     summary: 신고 접수&완료 처리
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
 *                "idx": { "type": "number", "description": "신고 고유번호" },
 *              },
 *              "required": ["idx"]
 *            }
 *          }
 *        }
 *     }
 *     responses:
 *       200:
 *         description: Returns true
 */
router.post('/reportStatus', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx, user, nowDt, ip } = req.body;

    if (!checkAuth(AuthLevel.MODIFY, user?.auth?.contents_3)) {
        sendError(req, res, "auth_fail");
        return;
    }

    // 필수 파라미터 검증
    if (!idx) {
        sendError(req, res, "params");
        return;
    }

    const row = await models.REPORT_TB.findOne({
        where: {
            idx: idx,
        }
    }).catch(e => { });

    if (!row) {
        sendError(req, res, "code_1000");
        return;
    }

    await row.update({
        status: row?.status === 1 ? 2 : 1
    })

    send(req, res, rt);
});


module.exports = router;
