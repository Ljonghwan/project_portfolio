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
 * /admin/event/list:
 *   post:
 *     summary: 이벤트 템플릿 리스트
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

    if (!checkAuth(AuthLevel.READ, user?.auth?.event)) {
        sendError(req, res, "auth_fail");
        return;
    }

    const datas = await models.EVENT_TEMPLATE_TB.scope(['active', 'desc']).findAll()

    rt.result = datas;

    send(req, res, rt);

});



/**
 * @openapi
 * /admin/event/update:
 *   post:
 *     summary: 이벤트 템플릿 수정
 *     tags: [Admin]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 * 
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
 *                      status: 1,
 *                      title: "제목", 
 *                      image: { $ref: "#/components/schema/file" },
 *                      layout: 1, 
 *                      title_style: { fontSize: "x-large", textAlign: "center" }, 
 *                      sub_title_style: { fontSize: "small", color: "#212121" }, 
 *                      button: "버튼명",
 *                      button_style: { backgroundColor: "#000000" }
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
        comment,
        user,
        nowDt, ip
    } = req.body;

    if (!checkAuth(AuthLevel.MODIFY, user?.auth?.event)) {
        sendError(req, res, "auth_fail");
        return;
    }

    // 필수 파라미터 검증
    if (!item?.title || !item?.image || !item?.button) {
        sendError(req, res, "params");
        return;
    }


    let idx = item?.idx || null;
    let ob = {
        status: item?.status,
        title: item?.title,
        layout: item?.layout,
        title_style: item?.title_style,
        sub_title_style: item?.sub_title_style,
        button: item?.button,
        button_style: item?.button_style,
    };

    try {
        if (idx) {
            const row = await models.EVENT_TEMPLATE_TB.findOne({
                where: {
                    idx: idx,
                }
            }).catch(e => {});

            if (!row) throw new Error("code_1000");

            await row.update(ob)
        } else {
            let createData = await models.EVENT_TEMPLATE_TB.create( ob );
            idx = createData?.idx;
        }

    } catch ({ message }) {
        console.log('error', message);
        sendError(req, res, message || "req_invalid");
        return;
    }


    const row = await models.EVENT_TEMPLATE_TB.findOne({
        where: {
            idx: idx
        }
    });


    const paths = await saveImages({
        ori: [row?.image],
        files: [item?.image],
        folder: `event/${idx}`
    });

    await row.update({
        image: paths?.[0] || null
    });

    rt.result = row?.idx;

    send(req, res, rt);
});


module.exports = router;
