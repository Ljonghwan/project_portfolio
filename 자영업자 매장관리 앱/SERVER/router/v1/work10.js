const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const _ = require('lodash');

const { Op } = require("sequelize");
const dayjs = require('dayjs');

const models = require('../../models');
const { isLogin, checkUser, checkStore, logs } = require('../../service/auth.js');
const { send, sendError, saveImages, encodeBase64, decodeBase64, unitPriceCalc, getItemCostGroupInfo } = require('../../service/utils.js');
const codes = require('../../service/errorCode.js');

router.use(checkUser);
router.use(checkStore);

/**
 * @openapi
 * /v1/work10/list:
 *   post:
 *     summary: 현금 거래 리스트
 *     tags: [Front]
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

    let { startDate, endDate, type="", sort=1, store, user, nowDt, ip } = req.body;

    if(!startDate || !endDate) {
        sendError(req, res, 'params');
        return;
    }

    let count = await models.STORE_CASH_TB.scope([
        'active',
        { method: ['my', store?.idx || 0] },
    ]).count();

    if(count < 1) {
        rt.result = 'empty';
        send(req, res, rt);
        return;
    }

    let where = {
        date: {
            [Op.between]: [parseInt(startDate?.replace(/-/g, '')), parseInt(endDate?.replace(/-/g, ''))]
        }
    };

    if(type) {
        where.type = type;
    }

    let result = await models.STORE_CASH_TB.scope([
        'active',
        { method: ['my', store?.idx || 0] },
    ]).findAll({
        where: where,
        order: [
            ['date', sort === 1 ? 'DESC' : 'ASC'],
            ['idx', 'DESC'],
        ]
    });


    rt.result = result;
    send(req, res, rt);

});



/**
 * @openapi
 * /v1/work10/get:
 *   post:
 *     summary: 현금 거래 상세
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1,"description": "현금 거래 고유번호" }
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

    let row = await models.STORE_CASH_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).findOne({
        where: { idx: idx }
    });
  
    if (!row) {
        sendError(req, res, "code_1000");
        return;
    }

    rt.result = row;

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/work10/update:
 *   post:
 *     summary: 현금 거래 등록/수정
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number | null", "example":1, "description": "현금 거래 고유번호" },
 *                "type": { "type": "number", "example": 1, "description": "구분 1=입금, 2=출금" },
 *                "title": { "type": "string", "example": "거래명", "description": "거래명" },
 *                "amount": { "type": "number", "example": 10000, "description": "금액" },
 *                "date": { "type": "string", "example": "2025-01-01", "description": "거래일자" },
 *                "pay_type": { "type": "number", "example": 1, "description": "출처 1=현금, 2=계좌" },
 *                "comment": { "type": "string", "example": "메모", "description": "메모" },
 *                "image": { type: "object", example: { $ref: "#/components/schema/file" }, description: 첨부 이미지 },
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

    let { idx, type, title, amount, date, pay_type, comment, image, store, user, nowDt, ip } = req.body;

    // 필수 파라미터 검증
    if (!type || !title || !amount || !date || !pay_type) {
        sendError(req, res, "params");
        return;
    }


    try {
        let ob = {
            store_idx: store?.idx,
            user_idx: user?.idx,
            type: type,
            title: title,
            amount: amount,
            date: parseInt((date + "")?.replace(/-/g, '')),
            pay_type: pay_type,
            comment: comment,
        };

        if (idx) {
            const row = await models.STORE_CASH_TB.findOne({
                where: {
                    idx: idx,
                    user_idx: user?.idx
                }
            });

            if (!row) throw new Error("auth_fail");

            await row.update(ob)
        } else {
            let createData = await models.STORE_CASH_TB.create(ob)
            idx = createData?.idx;
        }


        const row = await models.STORE_CASH_TB.findOne({
            where: {
                idx: idx
            }
        });
        
        const paths = await saveImages({
            ori: [row?.image],
            files: [image],
            folder: `store_cash/${idx}`
        });
    
        await row.update({
            image: paths?.[0] || null
        });


    } catch ({ message }) {
        sendError(req, res, message || "req_invalid");
        return;
    }


    rt.result = idx;

    send(req, res, rt);

});




/**
 * @openapi
 * /v1/work09/group_update:
 *   post:
 *     summary: 복합 제품 원가 등록/수정
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number | null", "example":1, "description": "복합 제품 원가 고유번호" },
 *                "title": { "type": "string", "example": "복합 제품명", "description": "복합 제품명" },
 *                "unit": { "type": "string", "example": "g", "description": "단위" },
 *                "volume": { "type": "number", "example": 100, "description": "가공후용량" },
 *                "list": { "type": "array", items: { type: object }, example: [{ idx: 1, target_idx: 1, input: 100 }], description: 일반 제품 리스트(복합 제품 리스트 고유번호, 일반 제품 고유번호, 투입량) },
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
router.post('/group_update', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx, title, unit, volume, list, store, user, nowDt, ip } = req.body;

    // 필수 파라미터 검증
    if (!title || !unit || !volume || list?.length < 1) {
        sendError(req, res, "params");
        return;
    }

    if (list?.filter((x, i) => !x?.target_idx || !x?.input)?.length > 0) {
        sendError(req, res, "work09_list_error");
        return;
    }

    let idxs = _.uniq( list?.map((x, i) => x?.target_idx ) );

    let count = await models.ITEM_COST_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).count({
        where: {
            idx: {
                [Op.in]: idxs
            }
        }
    });

    if(count !== idxs?.length) {
        sendError(req, res, "auth_fail");
        return;
    }


    try {
        let ob = {
            store_idx: store?.idx,
            user_idx: user?.idx,
            title: title,
            unit: unit,
            volume: volume,
        };

        if (idx) {
            const row = await models.ITEM_COST_GROUP_TB.findOne({
                where: {
                    idx: idx,
                    user_idx: user?.idx
                }
            });

            if (!row) throw new Error("auth_fail");

            await row.update(ob)
        } else {
            let createData = await models.ITEM_COST_GROUP_TB.create(ob)
            idx = createData?.idx;
        }

        await models.ITEM_COST_GROUP_LIST_TB.destroy({
            where: {
                parent_idx: idx
            }
        });

        let updateList = await Promise.all(
            list?.map((x, i) => (
                {
                    parent_idx: idx,
                    target_idx: x?.target_idx,
                    input: x?.input
                }
            ))
        );

        await models.ITEM_COST_GROUP_LIST_TB.bulkCreate(updateList);


    } catch ({ message }) {
        console.log('error', message);
        sendError(req, res, message || "req_invalid");
        return;
    }

    rt.result = idx;

    send(req, res, rt);

});




/**
 * @openapi
 * /v1/work09/delete:
 *   post:
 *     summary: 제품 원가 관리 삭제
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "제품 원가 관리 고유번호" },
 *                "type": { "type": "string", "example":"일반 | 복합", "description": "제품 원가 관리 타입" },
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

    let { idx, type, store, user, nowDt, ip } = req.body;

    if(!type) {
        sendError(req, res, "params");
        return;
    }

    try {
        let row = null;

        if(type === '일반') {
            row = await models.ITEM_COST_TB.findOne({
                where: {
                    idx: idx,
                    user_idx: user?.idx
                }
            });
        } else if(type === '복합') {
            row = await models.ITEM_COST_GROUP_TB.findOne({
                where: {
                    idx: idx,
                    user_idx: user?.idx
                }
            });
        }

        if (!row) throw new Error("auth_fail");


        if(row?.type === '일반') {
            await models.ITEM_COST_GROUP_LIST_TB.destroy({
                where: {
                    target_idx: row?.idx
                }
            });
        }

        await models.MENU_ITEM_LIST_TB.destroy({
            where: {
                target_idx: row?.idx,
                type: row?.type
            }
        });

        
        await row.destroy();
        
    } catch ({ message }) {
        sendError(req, res, message || "default");
        return;
    }

    rt.result = true;

    send(req, res, rt);
});



module.exports = router;
