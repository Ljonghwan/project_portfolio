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
 * /admin/popup/list:
 *   post:
 *     summary: 팝업 리스트
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
    let { idx, user, nowDt, ip } = req.body;

    if (!checkAuth(AuthLevel.READ, user?.auth?.service_1)) {
        sendError(req, res, "auth_fail");
        return;
    }

    let result = await models.POPUP_TB.scope([
        'active',
        'desc',
    ]).findAll();

    rt.result = result;

    send(req, res, rt);
});


/**
 * @openapi
 * /admin/popup/update:
 *   post:
 *     summary: 팝업 수정
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
 *                "item": { 
 *                  "type": "object", 
 *                  "example": {
 *                      idx: 1,
 *                      title: "제목", 
 *                      type: 1, 
 *                      target: 1, 
 *                      sdate: 'YYYY-MM-DD HH:mm',
 *                      edate: 'YYYY-MM-DD HH:mm',
 *                      image: [{$ref: '#/components/schema/file'}],
 *                      image_type: 1,
 *                      close: 1,
 *                      close_day: 7
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

    if (!checkAuth(AuthLevel.MODIFY, user?.auth?.service_1)) {
        sendError(req, res, "auth_fail");
        return;
    }

    // 필수 파라미터 검증
    if (
        !item?.title ||
        !item?.type ||
        !item?.target ||
        !item?.sdate ||
        !item?.edate ||
        !item?.image_type ||
        !item?.close ||
        item?.image?.length < 1
    ) {
        sendError(req, res, "params");
        return;
    }


    let idx = item?.idx || null;
    let ob = {
        title: item?.title,
        type: item?.type,
        target: item?.target,
        sdate: item?.sdate,
        edate: item?.edate,
        image_type: item?.image_type,
        close: item?.close,
        close_day: item?.close === 2 ? item?.close_day : 0,
    };

    try {
        if (idx) {
            const row = await models.POPUP_TB.findOne({
                where: {
                    idx: idx,
                }
            }).catch(e => {});

            if (!row) throw new Error("code_1000");

            await row.update(ob)
        } else {
            let createData = await models.POPUP_TB.create(ob)
            idx = createData?.idx;
        }

    } catch ({ message }) {
        console.log('error', message);
        sendError(req, res, message || "req_invalid");
        return;
    }


    const row = await models.POPUP_TB.findOne({
        where: {
            idx: idx
        }
    });


    const paths = await saveImages({
        ori: row?.image?.map(x => x?.image),
        files: item?.image?.map(x => x?.image),
        folder: `popup/${idx}`
    });

    console.log('paths', paths);

    await row.update({
        image: paths?.map((x, i) => ({ image: x, link: item?.image?.[i]?.link || "" }))
    });

    rt.result = row?.idx;

    send(req, res, rt);
});


module.exports = router;
