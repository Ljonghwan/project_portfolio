const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const models = require('../../models');
const { encryptePassword, checkAdmin, checkAuth, AuthLevel } = require('../../service/auth.js');
const { send, sendError, scd, randomNumberCreate } = require('../../service/utils.js');

const dayjs = require('dayjs');
router.use(checkAdmin)

/**
 * @openapi
 * /admin/account/list:
 *   post:
 *     summary: 회원 리스트
 *     tags: [Admin Account]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns all users (password excluded)
 */
router.post('/list', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { user, nowDt, ip } = req.body;

    try {
        // 권한 체크 (READ 권한 필요)
        if (!checkAuth(AuthLevel.READ, user?.auth?.users)) {
            sendError(req, res, "auth_fail");
            return;
        }

        // 유저 리스트 조회 (createdAt 내림차순)
        let userList = await models.USER_TB.scope(['store_count']).findAll({
            order: [['createdAt', 'DESC']],
            attributes: {
                exclude: ['password'] // 보안을 위해 비밀번호 제외,
            }
        });

        rt.result = userList;

        send(req, res, rt);

    } catch (error) {
        console.error('Error in /list:', error);
        sendError(req, res, "default", error.message);
    }
});


/**
 * @openapi
 * /admin/account/detail:
 *   post:
 *     summary: 회원 상세
 *     tags: [Admin Account]
*     requestBody: {
 *       "required": true,
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1, "description": "유저 고유번호" }
 *              }
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
 *         description: Returns all users (password excluded)
 */
router.post('/detail', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx, user, nowDt, ip } = req.body;

    if(!idx) {
        sendError(req, res, "params");
        return;
    }

    try {
        // 권한 체크 (READ 권한 필요)
        if (!checkAuth(AuthLevel.READ, user?.auth?.users)) {
            sendError(req, res, "auth_fail");
            return;
        }

        let store = await models.STORE_TB.scope(['active', 'desc', 'viewer', { method: ['my', idx] }]).findAll();
        let boardCount = await models.BOARD_TB.scope(['active']).count({
            where: {
                user_idx: idx
            }
        });
        let replyCount = await models.REPLY_TB.scope(['active']).count({
            where: {
                user_idx: idx
            }
        });
        let reportCount = await models.REPORT_TB.count({
            where: {
                user_idx: idx
            }
        });


        rt.result = {
            store: store,
            boardCount: boardCount,
            replyCount: replyCount,
            reportCount: reportCount,
        };

        send(req, res, rt);

    } catch (error) {
        console.error('Error in /list:', error);
        sendError(req, res, "default", error.message);
    }
});






/**
 * @openapi
 * /admin/account/updateStatus:
 *   post:
 *     summary: 회원 상태 업데이트
 *     tags: [Admin Account]
 *     requestBody: {
 *       "required": true,
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1, "description": "유저 고유번호" },
 *                "status": { "type": "number", "example": 2, "description": "상태 (1=활성, 2=비활성, 9=탈퇴)" },
 *                "disable_type": { "type": "string", "example": "부적절한 게시글 작성", "description": "정지/탈퇴 사유" },
 *                "disable_desc": { "type": "string", "example": "욕설 및 비방 게시글 반복 작성", "description": "정지/탈퇴 상세 내용" }
 *              },
 *              "required": ["idx", "status"]
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
 *         description: Return updated user idx and status
 */
router.post('/updateStatus', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { user, idx, status, disable_type, disable_desc, nowDt, ip } = req.body;

    try {
        // 권한 체크 (MODIFY 권한 필요)
        if (!checkAuth(AuthLevel.MODIFY, user?.auth?.users)) {
            sendError(req, res, "auth_fail");
            return;
        }

        // 필수 파라미터 검증
        if (!idx) {
            sendError(req, res, "need_param", "idx is required");
            return;
        }

        if (!status) {
            sendError(req, res, "need_param", "status is required");
            return;
        }

        // 유저 존재 여부 확인
        let targetUser = await models.USER_TB.findOne({
            where: { idx }
        });

        if (!targetUser) {
            sendError(req, res, "not_found", "User not found");
            return;
        }

        // 상태 업데이트 데이터 준비
        let updateData = {
            status: status
        };

        // 비활성(status=2)일 경우 정지사유 저장
        if (status == 2) {
            updateData.disable_type = disable_type || '';
            updateData.disable_desc = disable_desc || '';
        }

        // 활성(status=1)으로 변경 시 이전 정지사유 삭제
        if (status == 1) {
            updateData.disable_type = null;
            updateData.disable_desc = null;
        }

        // 유저 상태 업데이트
        await models.USER_TB.update(updateData, {
            where: { idx }
        });

        rt.result = { idx, status };
        rt.msg = 'User status updated successfully';

        send(req, res, rt);

    } catch (error) {
        console.error('Error in /updateStatus:', error);
        sendError(req, res, "default", error.message);
    }
});

module.exports = router;
