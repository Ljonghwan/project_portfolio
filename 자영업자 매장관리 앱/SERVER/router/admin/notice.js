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
 * /admin/notice/list:
 *   post:
 *     summary: 공지사항 리스트
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

    if (!checkAuth(AuthLevel.READ, user?.auth?.cs_2)) {
        sendError(req, res, "auth_fail");
        return;
    }

    const datas = await models.NOTICE_TB.scope(['active', 'desc', 'user' ]).findAll()

    rt.result = datas;

    send(req, res, rt);
});


/**
 * @openapi
 * /admin/notice/update:
 *   post:
 *     summary: 공지사항 수정
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
 *                "item": { "type": "object", "example": {idx: 1, title: "제목", comment: "내용", status: 1, image: { $ref: "#/components/schema/file" }}, "description": "데이터 인스턴스" },
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
        comment,
        user,
        nowDt, ip
    } = req.body;

    if (!checkAuth(AuthLevel.MODIFY, user?.auth?.cs_2)) {
        sendError(req, res, "auth_fail");
        return;
    }

    // 필수 파라미터 검증
    if (!item?.title || !item?.comment || !item?.cate) {
        sendError(req, res, "params");
        return;
    }


    let idx = item?.idx || null;
    let ob = {
        title: item?.title,
        comment: item?.comment,
        cate: item?.cate,
        status: item?.status || 1
    };

    try {
        if (idx) {
            const row = await models.NOTICE_TB.findOne({
                where: {
                    idx: idx,
                }
            }).catch(e => {});

            if (!row) throw new Error("code_1000");

            await row.update(ob)
        } else {
            let createData = await models.NOTICE_TB.create({
                ...ob,
                admin_idx: user?.idx
            })
            idx = createData?.idx;
        }

    } catch ({ message }) {
        console.log('error', message);
        sendError(req, res, message || "req_invalid");
        return;
    }

    rt.result = true;

    send(req, res, rt);
});




/**
 * @openapi
 * /admin/notice/delete:
 *   post:
 *     summary: 공지사항 삭제
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
 *                "idx": { "type": "number", "description": "공지사항 고유번호" },
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

    if (!checkAuth(AuthLevel.DELETE, user?.auth?.news)) {
        sendError(req, res, "auth_fail");
        return;
    }

    const row = await models.NOTICE_TB.findOne({
        where: {
            idx: idx || 0
        }
    });

    if(!row) {
        sendError(req, res, "code_1000");
        return;
    }

    await row.update({
        deleteAt: nowDt
    })

    send(req, res, rt);
});

module.exports = router;
