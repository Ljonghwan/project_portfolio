const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const bcrypt = require("bcrypt");

const dayjs = require('dayjs');

const models = require('../../models');
const { checkUser, encryptePassword } = require('../../service/auth.js');
const { send, sendError, scd, saveImages } = require('../../service/utils.js');

router.use(checkUser)


/**
 * @openapi
 * /v1/my/feedback:
 *   post:
 *     summary: 피드백 리스트
 *     tags: [Front]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Return true
 */
router.post('/feedback', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { user, nowDt, ip } = req.body;

    let result = await models.FEEDBACK_TB.scope([
        'active',
        'user',
        'admin',
    ]).findAll({
        order: [
            ['idx', 'DESC']
        ]
    });

    rt.result = result;

    send(req, res, rt);
});


/**
 * @openapi
 * /v1/my/feedbackUpdate:
 *   post:
 *     summary: 피드백 등록
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "cate": { "type": "number", "example": 1, "description": "문의 유형" },
 *                "title": { "type": "string", "description": "제목" },
 *                "comment": { "type": "string", "description": "내용" },
 *                image: { type: array, items: { type: string }, example: ["base:..."], description: 첨부 이미지 }
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
router.post('/feedbackUpdate', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { cate, title, comment, image, user, nowDt, ip } = req.body;

    // 필수 파라미터 검증
    if (!cate || !title || !comment) {
        sendError(req, res, "params");
        return;
    }

    let ob = {
        // user_idx: user?.idx,
        user_idx: user?.idx,
        cate: cate,
        title: title,
        comment: comment
    };

    try {
        let createData = await models.FEEDBACK_TB.create(ob)
        idx = createData?.idx;

    } catch (error) {
        sendError(req, res, "req_invalid");
        return;
    }


    const row = await models.FEEDBACK_TB.findOne({
        where: {
            idx: idx
        }
    });


    const paths = await saveImages({
        files: image,
        folder: `feedback/${idx}`
    });

    await row.update({
        image: paths
    });

    rt.result = row?.idx;

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/my/faq:
 *   post:
 *     summary: FAQ 리스트
 *     tags: [Front]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Return true
 */
router.post('/faq', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { user, nowDt, ip } = req.body;

    let result = await models.FAQ_TB.scope([
        'active',
        'status',
        'desc',
    ]).findAll();

    rt.result = result;

    send(req, res, rt);
});




/**
 * @openapi
 * /v1/my/marketing:
 *   post:
 *     summary: 마케팅 정보 수신 변경
 *     tags: [Front]
*     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "type": { "type": "number", "example": 1, "description": "타입 1=메일 2=SMS" },
 *                "status": { "type": "boolean", "example": true, "description": "변경상태" }
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
router.post('/marketing', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { type, status, user, nowDt, ip } = req.body;

    // 필수 파라미터 검증
    if (!type) {
        sendError(req, res, "params");
        return;
    }

    let ob = type === 1 ? { marketing1: status } : { marketing2: status };

    try {
        await user.update(ob);
    } catch (error) {
        sendError(req, res, "req_invalid");
        return;
    }


    rt.result = status;

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/my/device:
 *   post:
 *     summary: 메인 기기 변경
 *     tags: [Front]
*     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "type": { "type": "number", "example": 1, "description": "타입 1=메일 2=SMS" },
 *                "status": { "type": "boolean", "example": true, "description": "변경상태" }
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
router.post('/device', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { deviceToken, user, nowDt, ip } = req.body;

    // 필수 파라미터 검증
    if (!deviceToken) {
        sendError(req, res, "params");
        return;
    }

    try {
        await user.update({ deviceToken: deviceToken });
    } catch (error) {
        sendError(req, res, "req_invalid");
        return;
    }


    rt.result = true;

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/my/updateInfo:
 *   post:
 *     summary: 회원 정보 변경
 *     tags: [Front]
*     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "type": { "type": "string", "example": "profile | nickname | password | hp", "description": "변경 타입 종류" },
 *                "profile": { "type": "object", "example": { $ref: "#/components/schema/file" }, "description": "이미지" },
 *                "nickname": { "type": "string", "example": "닉네임", "description": "닉네임" },
 *                "password": { "type": "string", "example": "password", "description": "비밀번호" },
 *                "name": { "type": "string", "example": "홍길동", "description": "이름" } ,
 *                "hp": { "type": "string", "example": "010-0000-0000", "description": "휴대폰번호" }
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
router.post('/updateInfo', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: true
    }

    let { type, profile, password, nickname, name, hp, badge, user, nowDt, ip } = req.body;

    // 필수 파라미터 검증
    if (!type) {
        sendError(req, res, "params");
        return;
    }

    try {
        if (type === 'profile') {

            const paths = await saveImages({
                ori: [user?.profile],
                files: [profile],
                folder: `user/${user?.idx}`
            });

            await user.update({
                profile: paths?.[0] || null
            });

        } else if (type === 'nickname') {

            if (!nickname) throw new Error("params");
            if (dayjs().isBefore(dayjs(user?.nickAt).add(30, 'day'))) throw new Error("before_not_nick");

            let count = await models.USER_TB.count({
                where: {
                    nickname: nickname,
                }
            });

            if (count > 0) throw new Error("use_nick");

            await user.update({
                nickname: nickname,
                nickAt: nowDt
            });
        } else if (type === 'password') {

            if (!password) throw new Error("params");
            if(bcrypt.compareSync(password, user?.password)) throw new Error("password_same");

            await user.update({
                password: encryptePassword(password)
            });
        } else if (type === 'hp') {

            if (!name || !hp) throw new Error("params");

            if(name !== user?.name) throw new Error("name_same");

            let count = await models.USER_TB.count({
                where: {
                    hp: hp,
                }
            });

            if (count > 0) throw new Error("use_hp");


            await user.update({
                name: name,
                hp: hp
            });
        } else if (type === 'badge') {

            if (!badge) throw new Error("params");

            let count = await models.USER_BADGE_TB.scope(['active', 'desc', { method: ['my', user?.idx]} ]).count({
                where: {
                    badge_idx: badge
                }
            });

            if (count < 1) throw new Error("req_invalid");

            await user.update({
                badge: badge
            });
        }


    } catch ({ message }) {

        sendError(req, res, message || "req_invalid");
        return;
    }



    send(req, res, rt);
});




/**
 * @openapi
 * /v1/my/badgeList:
 *   post:
 *     summary: 획득 뱃지 리스트
 *     tags: [Front]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Return true
 */
router.post('/badgeList', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { user, nowDt, ip } = req.body;

    let result = await models.USER_BADGE_TB.scope(['active', 'desc', { method: ['my', user?.idx]} ]).findAll({
        raw: true
    });

    const sortedData = (result || []).sort((a, b) => {
        if (a.badge_idx === user?.badge) return -1;
        if (b.badge_idx === user?.badge) return 1;
        return 0;
    })?.map(x => {
        return {
            ...x,
            isMain: x.badge_idx === user?.badge
        }
    });

    rt.result = sortedData;

    send(req, res, rt);
});


module.exports = router;
