const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const _ = require('lodash');

const { Op } = require("sequelize");
const dayjs = require('dayjs');

const models = require('../../models');
const codes = require('../../service/errorCode.js');

const { isLogin, checkUser, checkStore, logs } = require('../../service/auth.js');
const { send, sendError, saveImages, encodeBase64, decodeBase64, getMenuInfo, getItemCostGroupInfo } = require('../../service/utils.js');
const { badge07And10 } = require('../../service/badge.js');


router.use(checkUser);
router.use(checkStore);

/**
 * @openapi
 * /v1/work02/list:
 *   post:
 *     summary: 원가계산기 메뉴 리스트
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

    let { store, user, nowDt, ip } = req.body;

    try {

        let { store, user, nowDt, ip } = req.body;

        let menus = await models.MENU_TB.scope([
            'active', 
            'desc', 
            'list',
            { method: ['my', store?.idx] },
        ]).findAll();

        menus = await Promise.all(
            (menus || []).map(m => getMenuInfo({ menu: m, storeIdx: store?.idx }))
        );

        rt.result = menus?.filter(m => m);

        send(req, res, rt);

    } catch (e) {
        sendError(req, res, "code_1000");
    }
    

});



/**
 * @openapi
 * /v1/work02/get:
 *   post:
 *     summary: 원가계산기 메뉴 상세
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1,"description": "원가계산기 메뉴 고유번호" },
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


    let row = await models.MENU_TB.scope([
        'active',
        'desc',
        'list',
        { method: ['my', store?.idx || 0] },
    ]).findOne({
        where: { idx: idx }
    });

    if (!row) {
        sendError(req, res, "code_1000");
        return;
    }

    row = await getMenuInfo({ menu: row, storeIdx: store?.idx || 0 });
    rt.result = row;

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/work02/update:
 *   post:
 *     summary: 원가계산기 등록/수정
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number | null", "example":1, "description": "원가계산기 고유번호" },
 *                "title": { "type": "string", "example": "메뉴명", "description": "메뉴명" },
 *                "category": { "type": "string", "example": "메인메뉴", "description": "카테고리" },
 *                "amount": { "type": "number", "example": 10000, "description": "판매가격" },
 *                "list": { "type": "array", items: { type: object }, example: [{ idx: 1, target_idx: 1, type: '일반', input: 100 }], description: 원재료 리스트(메뉴 재료 리스트 고유번호, 원재료(제품) 고유번호, 구분(일반, 복합), 투입량) },
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

    let { idx, title, category, amount, list, store, user, nowDt, ip } = req.body;

    if (!title || !category || !amount || list?.length < 1) {
        sendError(req, res, "params");
        return;
    }

    if (list?.filter((x, i) => !x?.target_idx || !x?.type || !x?.input)?.length > 0) {
        sendError(req, res, "work02_list_error");
        return;
    }

    let idxs = _.uniq(list?.filter(x => x?.type === '일반')?.map((x, i) => x?.target_idx));
    let idxs2 = _.uniq(list?.filter(x => x?.type === '복합')?.map((x, i) => x?.target_idx));

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
    let count2 = await models.ITEM_COST_GROUP_TB.scope([
        'active',
        'desc',
        { method: ['my', store?.idx || 0] },
    ]).count({
        where: {
            idx: {
                [Op.in]: idxs2
            }
        }
    });

    if (count !== idxs?.length || count2 !== idxs2?.length) {
        sendError(req, res, "auth_fail");
        return;
    }



    try {
        let ob = {
            store_idx: store?.idx,
            user_idx: user?.idx,
            title: title,
            category: category,
            amount: amount,
        };

        if (idx) {
            const row = await models.MENU_TB.findOne({
                where: {
                    idx: idx,
                    user_idx: user?.idx
                }
            });

            if (!row) throw new Error("auth_fail");

            await row.update(ob)
        } else {
            let createData = await models.MENU_TB.create(ob)
            idx = createData?.idx;
        }

        await models.MENU_ITEM_LIST_TB.destroy({
            where: {
                parent_idx: idx
            }
        });

        let updateList = await Promise.all(
            list?.map((x, i) => (
                {
                    parent_idx: idx,
                    type: x?.type,
                    target_idx: x?.target_idx,
                    input: x?.input
                }
            ))
        );

        await models.MENU_ITEM_LIST_TB.bulkCreate(updateList);


    } catch ({ message }) {
        console.log('error', message);
        sendError(req, res, message || "req_invalid");
        return;
    }

    rt.result = idx;

    send(req, res, rt);

    await badge07And10({ user, store });
});



/**
 * @openapi
 * /v1/work02/delete:
 *   post:
 *     summary: 원가계산기 메뉴 삭제
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "원가계산기 메뉴 고유번호" },
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

    let { idx = 0, store, user, nowDt, ip } = req.body;

    try {
        let row = await models.MENU_TB.findOne({
            where: {
                idx: idx,
                user_idx: user?.idx
            }
        });

        if (!row) throw new Error("auth_fail");

        await row.destroy();

    } catch ({ message }) {
        sendError(req, res, message || "default");
        return;
    }

    rt.result = true;

    send(req, res, rt);
});



module.exports = router;
