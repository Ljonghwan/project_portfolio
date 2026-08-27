const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const _ = require('lodash');

const { Op } = require("sequelize");
const dayjs = require('dayjs');

const models = require('../../models');
const { isLogin, checkUser, checkStore, logs } = require('../../service/auth.js');
const { send, sendError, saveImages, encodeBase64, decodeBase64 } = require('../../service/utils.js');
const codes = require('../../service/errorCode.js');
const { extractReceiptData, extractReceiptDataOpenAI } = require('../../service/ocr.js');

router.use(checkUser);
router.use(checkStore);

/**
 * @openapi
 * /v1/work01/list:
 *   post:
 *     summary: 매입비 리스트
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "startDate": { "type": "string", "example": "2025-01-01","description": "검색 시작날짜" },
 *                "endDate": { "type": "string", "example": "2025-02-02","description": "검색 종료날짜" },
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
router.post('/list', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { startDate, endDate, store, user, nowDt, ip } = req.body;

    console.log('cate = 1, nextToken', store?.idx, startDate, endDate);

    let result = await models.PURCHASE_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findAll(
        {
            where: {
                date: {
                    [Op.between]: [parseInt(startDate?.replace(/-/g, '')), parseInt(endDate?.replace(/-/g, ''))]
                }
            }
        }
    )

    rt.result = result;

    send(req, res, rt);
    
});



/**
 * @openapi
 * /v1/work01/get:
 *   post:
 *     summary: 매입비 상세
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1,"description": "매입비 고유번호" },
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
router.post('/get', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx = 0, store, user, nowDt, ip } = req.body;

    let row = await models.PURCHASE_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findOne(
        {
            where: {
                idx: idx
            }
        }
    )

    if (!row) {
        sendError(req, res, "code_1000");
        return;
    }

    rt.result = row;

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/work01/update:
 *   post:
 *     summary: 매입비 등록/수정
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number | null", "example":1, "description": "매입비 고유번호" },
 *                "type": { "type": "number", "example": 1, "description": "매입비 등록 타입" },
 *                "date": { "type": "string", "example": "2025-01-01", "description": "매입비 등록 날짜" },
 *                "company": { "type": "string", example: "거래처", "description": "거래처명" }, 
 *                "comment": { "type": "string", example: "메모내용", "description": "메모" },
 *                "list": { "type": "array", items: { type: object }, example: [{ title: "품목명", quantity: 10, amount: 1000 }], description: 품목 리스트 },
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

    let { idx, type, date, company, comment, list, store, user, nowDt, ip } = req.body;

    // 필수 파라미터 검증
    if (!type || !date || !company || list?.length < 1) {
        sendError(req, res, "params");
        return;
    }

    if (list?.filter((x, i) => !x?.title || !x?.quantity || !x?.amount)?.length > 0) {
        sendError(req, res, "work01_list_error");
        return;
    }


    try {
        let ob = {
            // user_idx: user?.idx,
            store_idx: store?.idx,
            user_idx: user?.idx,
            date: parseInt((date + "")?.replace(/-/g, '')),
            type: type,
            company: company,
            comment: comment,
            list: list,
            total: list?.reduce((acc, x) => acc + (x?.quantity * x?.amount), 0) || 0,
            tax: Math.round((list?.reduce((acc, x) => acc + (x?.quantity * x?.amount), 0) || 0) * 0.1)
        };

        if (idx) {
            const row = await models.PURCHASE_TB.findOne({
                where: {
                    idx: idx,
                    user_idx: user?.idx
                }
            });

            if (!row) throw new Error("auth_fail");

            await row.update(ob)
        } else {
            let createData = await models.PURCHASE_TB.create(ob)
            idx = createData?.idx;
        }

        await models.ITEM_TB.destroy({
            where: { purchase_idx: idx }
        });

        let updateList = await Promise.all(
            list?.map((x, i) => (
                {
                    user_idx: user?.idx,
                    store_idx: store?.idx,
                    purchase_idx: idx,
                    company: company,
                    title: x?.title,
                    amount: x?.amount,
                    date: parseInt((date + "")?.replace(/-/g, ''))
                }
            ))
        );

        await models.ITEM_TB.bulkCreate(updateList);


    } catch ({ message }) {
        console.log('error', message);
        sendError(req, res, message || "req_invalid");
        return;
    }


    rt.result = idx;

    send(req, res, rt);

    
    /** 원가 변동 알림 갱신 */
    await models.ITEM_CHANGE_TB.scope([ { method: ['my', store?.idx || 0] } ]).destroy({
        where: { company: company }
    });

    let items = await models.ITEM_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findAll({
        raw: true,
        where: { company: company }
    });

    let updateList = await Promise.all(
        items?.map((x, i) => {
            let prev = items?.find((y, ii) => 
                y?.title === x?.title && 
                y?.company === x?.company && 
                y?.purchase_idx !== x?.purchase_idx &&
                y?.date <= x?.date && 
                ii > i
            ) ;

            if(!prev) return null;
            if(prev?.amount === x?.amount) return null;

            return _.omit({ ...x, prev_amount: prev?.amount }, ['idx', 'createdAt', 'updatedAt']);
        }).filter(x => x !== null)
    );

    await models.ITEM_CHANGE_TB.bulkCreate(updateList);
});





/**
 * @openapi
 * /v1/work01/delete:
 *   post:
 *     summary: 매입비 삭제
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "매입비 고유번호" },
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
router.post('/delete', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx, store, user, nowDt, ip } = req.body;

    try {

        const row = await models.PURCHASE_TB.findOne({
            where: {
                idx: idx,
                user_idx: user?.idx
            }
        });

        if (!row) throw new Error("auth_fail");

        await row.update({
            deleteAt: nowDt
        })
        await models.ITEM_TB.destroy({
            where: { purchase_idx: row?.idx }
        });

    } catch ({ message }) {
        sendError(req, res, message || "default");
        return;
    }

    rt.result = true;

    send(req, res, rt);
});





/**
 * @openapi
 * /v1/work01/items:
 *   post:
 *     summary: 품목 리스트
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "company": { "type": "string", "example": "거래처","description": "검색 거래처명" },
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
router.post('/items', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: []
    }

    let { company, store, user, nowDt, ip } = req.body;

    let where = {};

    if (company) {
        where.company = company;
    }
    let result = await models.ITEM_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findAll({
        raw: true,
        where: where
    });


    const latestData = _(result)
        .groupBy(item => `${item.company}_${item.title}`)
        .map(group => _.maxBy(group, item => [item?.date, item?.purchase_idx].join('_')))
        .value();

    rt.result = latestData;

    send(req, res, rt);

});




/**
 * @openapi
 * /v1/work01/ocr:
 *   post:
 *     summary: 매입 등록 OCR 처리
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "image": { "type": "object", "example": { $ref: "#/components/schema/file" },"description": "촬영 이미지" },
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
router.post('/ocr', async (req, res) => {


    let rt = {
        ok: true,
        msg: '',
        result: []
    }

    let { image, store, user, nowDt, ip } = req.body;

    // 필수 파라미터 검증
    if (!image || !image?.base) {
        sendError(req, res, "params");
        return;
    }

    try {

        const result = await extractReceiptDataOpenAI(image);

        if(result?.품목들?.length < 1) {
            throw new Error("ocr_error1");
        }

        rt.result = {
            date: result?.거래일자 ? dayjs(result?.거래일자).tz().format('YYYY-MM-DD') : dayjs().tz().format('YYYY-MM-DD'),
            company: result?.상호명,
            list: result?.품목들?.map(item => ({
                title: item?.품명,
                quantity: item?.수량,
                amount: item?.단가,
            }))
        }

        logs({ 
            type: 'OCR',
            title: 'OCR 처리에 성공했습니다.',
            user_idx: user?.idx,
            store_idx: store?.idx
        })

    } catch ({ message }) {
        console.log('error', message);

        logs({ 
            type: 'OCR',
            title: 'OCR 처리에 실패했습니다.',
            comment: codes?.[message]?.message || codes.default?.message,
            status: 2,
            user_idx: user?.idx,
            store_idx: store?.idx
        })

        sendError(req, res, message || "default");
        return;
    }

    send(req, res, rt);
});



module.exports = router;
