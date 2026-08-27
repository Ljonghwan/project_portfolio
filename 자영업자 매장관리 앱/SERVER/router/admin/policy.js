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
 * /admin/policy/list:
 *   post:
 *     summary: 관리자 약관 리스트
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
    let { user, nowDt, ip } = req.body;

    if (!checkAuth(AuthLevel.READ, user?.auth?.cs_4)) {
        sendError(req, res, "auth_fail");
        return;
    }

    const datas = await models.TERM_TB.findAll({
        order: [['updatedAt', 'DESC']]
    })

    rt.result = datas;

    send(req, res, rt);
});


/**
 * @openapi
 * /admin/policy/update:
 *   post:
 *     summary: 관리자 약관 수정
 *     tags: [Admin]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
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
        type,
        comment,
        user,
        nowDt, ip
    } = req.body;

    if (!checkAuth(AuthLevel.MODIFY, user?.auth?.cs_4)) {
        sendError(req, res, "auth_fail");
        return;
    }

    if (!type) {
        sendError(req, res, "policy_type")
        return;
    }

    if (!comment) {
        sendError(req, res, "policy_comment")
        return;
    }

    await models.TERM_TB.update({
        comment: comment
    }, {
        where: { type: type }
    })

    send(req, res, rt);
});


module.exports = router;
