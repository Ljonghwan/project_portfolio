const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { Op } = require('sequelize');

const models = require('../../models');
const { encryptePassword, checkAdmin, checkAuth, AuthLevel } = require('../../service/auth.js');
const { send, sendError, scd, randomNumberCreate } = require('../../service/utils.js');

const dayjs = require('dayjs');

router.use(checkAdmin)

/**
 * @openapi
 * /admin/auth/list:
 *   post:
 *     summary: 관리자 권한 리스트
 *     tags: [Admin]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns all users
 */
router.post('/list', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { user, nowDt, ip } = req.body;

    if (!checkAuth(AuthLevel.READ, user?.auth?.service_3)) {
        sendError(req, res, "auth_fail");
        return;
    }

    let datas = await models.AUTH_TB.scope(['userlist']).findAll({
        order: [['idx', 'DESC']]
    });

    rt.result = datas;

    send(req, res, rt);
});

/**
 * @openapi
 * /admin/auth/insert:
 *   post:
 *     summary: 관리자 권한 추가
 *     tags: [Admin]
 *     requestBody: {
 *       "required": true,
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "name": { "type": "string", "description": "권한명" },
 *                "desc": { "type": "string", "description": "권한설명" },
 *                "users": { "type": "number", "description": "회원관리 권한" },
 *                "matching": { "type": "number", "description": "매장관리 권한" },
 *                "contents_1": { "type": "number", "description": "커뮤니티관리 권한" },
 *                "contents_2": { "type": "number", "description": "일지관리 권한" },
 *                "contents_3": { "type": "number", "description": "신고관리 권한" },
 *                "news": { "type": "number", "description": "소식관리 권한" },
 *                "event": { "type": "number", "description": "이벤트템플릿 권한" },
 *                "cs_1": { "type": "number", "description": "고객피드백 권한" },
 *                "cs_2": { "type": "number", "description": "공지 권한" },
 *                "cs_3": { "type": "number", "description": "자주묻는질문 권한" },
 *                "cs_4": { "type": "number", "description": "약관 권한" },
 *                "service_1": { "type": "number", "description": "팝업 권한" },
 *                "service_2": { "type": "number", "description": "계정 권한" },
 *                "service_3": { "type": "number", "description": "권한관리 권한" },
 *              },
 *              "required": ["name", "desc"]
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
 *         description: Returns true
 */
router.post('/insert', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let {
        name,
        desc,
        users,
        matching,
        contents_1,
        contents_2,
        contents_3,
        news,
        event,
        cs_1,
        cs_2,
        cs_3,
        cs_4,
        service_1,
        service_2,
        service_3,
        user,
        nowDt, ip
    } = req.body;

    if (!checkAuth(AuthLevel.WRITE, user?.auth?.service_3)) {
        sendError(req, res, "auth_fail");
        return;
    }

    if (!name) {
        sendError(req, res, "auth_name");
        return;
    }
    if (!desc) {
        sendError(req, res, "auth_desc");
        return;
    }

    const dupleName = await models.AUTH_TB.findOne({
        where: { name: name }
    })

    if (dupleName) {
        sendError(req, res, "auth_duple_name");
        return;
    }

    await models.AUTH_TB.create({
        name: name,
        desc: desc,
        users: users || 0,
        matching: matching || 0,
        contents_1: contents_1 || 0,
        contents_2: contents_2 || 0,
        contents_3: contents_3 || 0,
        news: news || 0,
        event: event || 0,
        cs_1: cs_1 || 0,
        cs_2: cs_2 || 0,
        cs_3: cs_3 || 0,
        cs_4: cs_4 || 0,
        service_1: service_1 || 0,
        service_2: service_2 || 0,
        service_3: service_3 || 0,
    })

    send(req, res, rt);
});

/**
 * @openapi
 * /admin/auth/update:
 *   post:
 *     summary: 관리자 권한 수정
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
 *                "idx": { "type": "number", "description": "권한고유번호" },
 *                "name": { "type": "string", "description": "권한명" },
 *                "desc": { "type": "string", "description": "권한설명" },
 *                "users": { "type": "number", "description": "회원관리 권한" },
 *                "matching": { "type": "number", "description": "매장관리 권한" },
 *                "contents_1": { "type": "number", "description": "커뮤니티관리 권한" },
 *                "contents_2": { "type": "number", "description": "일지관리 권한" },
 *                "contents_3": { "type": "number", "description": "신고관리 권한" },
 *                "news": { "type": "number", "description": "소식관리 권한" },
 *                "event": { "type": "number", "description": "이벤트템플릿 권한" },
 *                "cs_1": { "type": "number", "description": "고객피드백 권한" },
 *                "cs_2": { "type": "number", "description": "공지 권한" },
 *                "cs_3": { "type": "number", "description": "자주묻는질문 권한" },
 *                "cs_4": { "type": "number", "description": "약관 권한" },
 *                "service_1": { "type": "number", "description": "팝업 권한" },
 *                "service_2": { "type": "number", "description": "계정 권한" },
 *                "service_3": { "type": "number", "description": "권한관리 권한" },
 *              },
 *            }
 *          }
 *        }
 *     }
 *     responses:
 *       200:
 *         description: Returns true
 */
router.post('/update', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let {
        idx,
        name,
        desc,
        users,
        matching,
        contents_1,
        contents_2,
        contents_3,
        news,
        event,
        cs_1,
        cs_2,
        cs_3,
        cs_4,
        service_1,
        service_2,
        service_3,
        user,
        nowDt, ip
    } = req.body;

    if (!checkAuth(AuthLevel.MODIFY, user?.auth?.service_3)) {
        sendError(req, res, "auth_fail");
        return;
    }

    if (!idx) {
        sendError(req, res, "code_1000");
        return;
    }

    if (!name) {
        sendError(req, res, "auth_name");
        return;
    }
    if (!desc) {
        sendError(req, res, "auth_desc");
        return;
    }

    const dupleName = await models.AUTH_TB.findOne({
        where: { name: name, idx: { [Op.not]: idx } }
    })

    if (dupleName) {
        sendError(req, res, "auth_duple_name");
        return;
    }

    await models.AUTH_TB.update(
        {
            name: name,
            desc: desc,
            users: users || 0,
            matching: matching || 0,
            contents_1: contents_1 || 0,
            contents_2: contents_2 || 0,
            contents_3: contents_3 || 0,
            news: news || 0,
            event: event || 0,
            cs_1: cs_1 || 0,
            cs_2: cs_2 || 0,
            cs_3: cs_3 || 0,
            cs_4: cs_4 || 0,
            service_1: service_1 || 0,
            service_2: service_2 || 0,
            service_3: service_3 || 0,
        },
        {
            where: { idx: idx }
        },
    )

    send(req, res, rt);
});

/**
 * @openapi
 * /admin/auth/delete:
 *   post:
 *     summary: 관리자 권한 삭제
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
 *                "idx": { "type": "number", "description": "권한고유번호" },
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
router.post('/delete', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx, user, nowDt, ip } = req.body;

    if (!checkAuth(AuthLevel.DELETE, user?.auth?.service_3)) {
        sendError(req, res, "auth_fail");
        return;
    }

    let findData = await models.AUTH_TB.scope(['userlist']).findOne({
        where: { idx: idx }
    });

    if (!findData) {
        sendError(req, res, "code_1000");
        return;
    }
    console.log(findData?.userlist?.map(v => v.idx));

    if (findData?.userlist?.length > 0) {
        sendError(req, res, "auth_join");
        return;
    }

    await models.AUTH_TB.destroy({
        where: { idx: findData.idx }
    });


    send(req, res, rt);
});

module.exports = router;
