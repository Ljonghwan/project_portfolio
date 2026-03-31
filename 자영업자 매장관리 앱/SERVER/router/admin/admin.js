const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { Op } = require('sequelize');

const models = require('../../models');
const { encryptePassword, checkAdmin, checkAuth, AuthLevel } = require('../../service/auth.js');
const { sendTempPasswordMail } = require('../../service/mailform.js')
const { send, sendError, scd, randomNumberCreate, randomString} = require('../../service/utils.js');

const dayjs = require('dayjs');

router.use(checkAdmin)

/**
 * @openapi
 * /admin/admin/list:
 *   post:
 *     summary: 관리자 리스트
 *     tags: [Admin]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns all admin
 */
router.post('/list', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { user, idx, nowDt, ip } = req.body;

    if (!checkAuth(AuthLevel.READ, user?.auth?.service_2)) {
        sendError(req, res, "auth_fail");
        return;
    }

    let datas = await models.ADMIN_TB.scope(['auth']).findAll({
        order: [['idx', "DESC"]]
    });

    rt.result = datas;

    send(req, res, rt);
});

/**
 * @openapi
 * /admin/admin/insert:
 *   post:
 *     summary: 관리자 등록
 *     tags: [Admin]
 *     requestBody: {
 *       "required": true,
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "name": { "type": "string", "example":"홍길동", "description": "이름" },
 *                "email": { "type": "string", "example":"mail@gmail.com","description": "이메일" },
 *                "pass": { "type": "string", "description": "비밀번호" },
 *                "pass2": { "type": "string", "description": "비밀번호확인" },
 *                "active": { "type": "string", "example":"Y", "description": "활성상태" },
 *                "auth_idx": { "type": "number", "example":2, "description": "권한 고유번호" },
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
 *         description: Return admin email
 */
router.post('/insert', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let {
        name,
        email,
        pass,
        pass2,
        active,
        auth_idx,
        user,
        nowDt, ip
    } = req.body;

    if (!checkAuth(AuthLevel.WRITE, user?.auth?.service_2)) {
        sendError(req, res, "auth_fail");
        return;
    }

    if (!name) return sendError(req, res, "admin_name");
    if (!email) return sendError(req, res, "admin_email");
    if (!pass) return sendError(req, res, "admin_pass");
    if (!pass2 || pass !== pass2) return sendError(req, res, "admin_pass2");
    if (!auth_idx) return sendError(req, res, "admin_auth");

    const dupleData = await models.ADMIN_TB.findOne({
        where: { email: email }
    })

    if (dupleData) {
        sendError(req, res, "admin_duple_email");
        return;
    }

    await models.ADMIN_TB.create({
        name: name,
        email: email,
        password: encryptePassword(pass),
        auth_idx: auth_idx,
        status: active === "Y" ? 1 : 2,
        authAt: new Date()
    });

    rt.result = {
        email: email
    }

    send(req, res, rt);
});

/**
 * @openapi
 * /admin/admin/update:
 *   post:
 *     summary: 관리자 수정
 *     tags: [Admin]
 *     requestBody: {
 *       "required": true,
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "string", "example":9, "description": "고유번호" },
 *                "name": { "type": "string", "example":"홍길동", "description": "이름" },
 *                "email": { "type": "string", "example":"mail@gmail.com","description": "이메일" },
 *                "pass": { "type": "string", "description": "비밀번호" },
 *                "pass2": { "type": "string", "description": "비밀번호확인" },
 *                "active": { "type": "string", "example":"Y", "description": "활성상태" },
 *                "auth_idx": { "type": "number", "example":2, "description": "권한 고유번호" },
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

    let {
        idx,
        name,
        email,
        pass,
        pass2,
        active,
        auth_idx,
        user,
        nowDt, ip
    } = req.body;

    if (!checkAuth(AuthLevel.MODIFY, user?.auth?.service_2)) {
        sendError(req, res, "auth_fail");
        return;
    }

    if (!idx) return sendError(req, res, "code_1000");
    if (!name) return sendError(req, res, "admin_name");
    if (!email) return sendError(req, res, "admin_email");

    const dupleData = await models.ADMIN_TB.findOne({
        where: {
            email: email,
            idx: { [Op.not]: idx }
        }
    })

    if (dupleData) {
        console.log(dupleData)
        sendError(req, res, "admin_duple_email");
        return;
    }

    let updateData = {
        name: name,
        email: email,
        status: active === "Y" ? 1 : 2,
    }

    if (pass) {
        if (!pass2 || pass !== pass2) return sendError(req, res, "admin_pass2");

        updateData.password = encryptePassword(pass);
    }

    if (auth_idx) {
        updateData.auth_idx = auth_idx;
        updateData.authAt = new Date()
    }

    await models.ADMIN_TB.update(updateData, {
        where: { idx: idx }
    });

    send(req, res, rt);
});

/**
 * @openapi
 * /admin/admin/resetPass:
 *   post:
 *     summary: 관리자 비밀번호 초기화
 *     tags: [Admin]
 *     requestBody: {
 *       "required": true,
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "string", "example":9, "description": "고유번호" },
 *              },
 *              "required": ["idx"]
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
router.post('/resetPass', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx, user, nowDt, ip } = req.body;

    if (!checkAuth(AuthLevel.MODIFY, user?.auth?.service_2)) {
        sendError(req, res, "auth_fail");
        return;
    }

    if (!idx) {
        return sendError(req, res, "code_1000");
    }

    let randPass = randomString(12);
    console.log("randPass:", randPass);

    await models.ADMIN_TB.update({
        password: encryptePassword(randPass)
    }, {
        where: { idx: idx }
    });

    const findAdmin = await models.ADMIN_TB.findOne({
        where: { idx: idx }
    })

    if(findAdmin){
        sendTempPasswordMail(findAdmin.email, randPass);
    }

    send(req, res, rt);
});

// 관리자 삭제 (삭제 권한) XXX
router.post('/delete', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { nowDt, ip } = req.body;

    send(req, res, rt);
});

/**
 * @openapi
 * /admin/admin/authList:
 *   post:
 *     summary: 등록을 위한 권한 리스트 조회
 *     tags: [Admin]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns all auth
 */
router.post('/authList', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { user, nowDt, ip } = req.body;

    if (!checkAuth(AuthLevel.READ, user?.auth?.service_2)) {
        sendError(req, res, "auth_fail");
        return;
    }

    let datas = await models.AUTH_TB.findAll({
        order: [['idx', 'DESC']]
    });

    rt.result = datas;

    send(req, res, rt);
});
module.exports = router;
