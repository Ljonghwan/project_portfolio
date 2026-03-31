const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const { isLogin, checkUser, checkStore } = require('../../service/auth.js');
const { send, sendError, scd, randomNumberCreate } = require('../../service/utils.js');
const { validateBusinessNumber } = require('../../service/datagokr.js');
const { Op } = require("sequelize");
const dayjs = require('dayjs');

const models = require('../../models');


router.use(checkUser);

/**
 * @openapi
 * /v1/store/cert:
 *   post:
 *     summary: 매장등록 사업자번호 인증
 *     tags: [Front]
  *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "business_num": { "type": "string", "example": "1234567890", "description": "사업자 번호" }
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
 *         description: Returns true
 */
router.post('/cert', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { uuid, business_num, name, open_date, user, nowDt, ip } = req.body;

    if (business_num?.length !== 10 || !open_date || !uuid) sendError(req, res, "params");

    let count = await models.STORE_TB.count({
        where: {
            user_idx: user?.idx,
            business_num: business_num
        }
    });

    // if(count > 0) {
    //     sendError(req, res, "store_cert_business_num");
    // }


    // 사업자번호 인증
    // 잡 생성
    let job = await models.STORE_SERVICE_JOB.create({
        user_idx: user?.idx,
        store_idx: 0,
        uuid: uuid
    })


    setTimeout(async () => {

        const { ok, msg, result, errorMsg } = await validateBusinessNumber({
            b_no: business_num,
            start_dt: dayjs(open_date).format('YYYYMMDD'),
            p_nm: user?.name
        })

        // 잡 조회
        job = await models.STORE_SERVICE_JOB.findOne({
            where: {
                uuid: uuid,
                status: 1
            }
        })

        if(!job) {
            sendError(req, res, "cancel");
            return;
        }

        await job.update({ status: 2 });

        if (!ok) {
            sendError(req, res, msg);
            return;
        }

        rt.result = true

        send(req, res, rt);

    }, 5000)

});




/**
 * @openapi
 * /v1/store/certCancel:
 *   post:
 *     summary: 매장등록 사업자번호 인증 취소
 *     tags: [Front]
  *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "uuid": { "type": "String", "example": "uuid", "description": "고유 id" }
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
 *         description: Returns true
 */
router.post('/certCancel', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { uuid, user, nowDt, ip } = req.body;

    console.log(uuid);

    if (!uuid) {
        sendError(req, res, "params");
        return;
    }

    let job = await models.STORE_SERVICE_JOB.update({
        status: 9
    }, {
        where: {
            uuid: uuid,
            status: 1
        }
    })

    send(req, res, rt);


});




/**
 * @openapi
 * /v1/store/type:
 *   post:
 *     summary: 매장등록 업태/업종 리스트
 *     tags: [Front]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Returns true
 */
router.post('/type', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { user, nowDt, ip } = req.body;

    try {

        let result = await models.STORE_TYPE_TB.findAll({
            attributes: ['idx', 'depth1', 'depth2', 'depth3'],
        });

        rt.result = result;


    } catch ({ message }) {
        sendError(req, res, message || "default");
        return;
    }


    send(req, res, rt);
});



/**
 * @openapi
 * /v1/store/update:
 *   post:
 *     summary: 매장 등록/수정
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number | null", "example":1, "description": "매장 고유번호" },
 *                "business_num": { "type": "string", "example": "1234567890", "description": "사업자 번호" },
 *                "owner": { "type": "string", "example": "홍길동", "description": "대표자명" },
 *                "open_date": { "type": "string", "example": "2025-01-01", "description": "개업일자" },
 *                "title": { "type": "string", "example": "매장명", "description": "매장명" },
 *                "tel": { "type": "string", "example": "01000000000", "description": "전화번호" },
 *                "addr": { "type": "string", "example": "서울시 강남구 역삼동", "description": "사업장주소" },
 *                "addr2": { "type": "string", "example": "사업장 상세주소", "description": "사업장 상세주소" },
 *                "type": { "type": "number", "example": 1, "description": "업태/업종 고유번호" },
 *                "capacity": { "type": "number", "example": 100, "description": "수용인원" },
 *                "area": { "type": "number", "example": 100, "description": "면적" },
 *                "tables": { "type": "array", items: { type: object }, example: [{ title: '1인석', count: 10 }], description: 테이블 수(1인석~단체석) },
 *              }
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
router.post('/update', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx = 0, business_num, owner, open_date, title, tel, addr, addr2, type, capacity, area, tables, user, nowDt, ip } = req.body;



    try {

        if (idx) {

            if (!title || !tel || !addr || !addr2 || !type || !capacity || !area) {
                sendError(req, res, "params");
                return;
            }

            const row = await models.STORE_TB.findOne({
                where: {
                    idx: idx,
                    user_idx: user?.idx
                }
            });

            if (!row) throw new Error("auth_fail");

            let ob = {
                title: title,
                tel: tel,
                addr: addr,
                addr2: addr2,
                type: type,
                capacity: capacity,
                area: area,
                tables: tables,
            };

            await row.update(ob);
        } else {


            if (business_num?.length !== 10 || !owner || !open_date || !title || !tel || !addr || !addr2 || !type || !capacity || !area) {
                sendError(req, res, "params");
                return;
            }

            let count = await models.STORE_TB.count({
                where: {
                    user_idx: user?.idx,
                    business_num: business_num
                }
            });

            if (count > 0) throw new Error("store_cert_business_num");

            let ob = {
                user_idx: user?.idx,
                title: title,
                business_num: business_num,
                name: title,
                owner: owner,
                open_date: dayjs(open_date).format('YYYYMMDD'),
                tel: tel,
                addr: addr,
                addr2: addr2,
                type: type,
                capacity: capacity,
                area: area,
                tables: tables,
            };


            let createData = await models.STORE_TB.create(ob)
            idx = createData?.idx;

            await user.update({
                store_idx: idx
            });
        }

        rt.result = idx;

    } catch ({ message }) {
        console.log('error', message);
        sendError(req, res, message || "default");
        return;
    }


    send(req, res, rt);
});





/**
 * @openapi
 * /v1/store/change:
 *   post:
 *     summary: 매장 변경
 *     tags: [Front]
  *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1, "description": "매장 고유번호" }
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
 *         description: Returns true
 */
router.post('/change', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: true
    }

    let { idx = 0, user, nowDt, ip } = req.body;

    let row = await models.STORE_TB.scope(['active', { method: ['my', user?.idx] }]).findOne({
        where: { idx: idx }
    });

    if (!row) {
        sendError(req, res, "req_invalid");
        return;
    }

    await user.update({
        store_idx: idx
    });


    send(req, res, rt);
});



/**
 * @openapi
 * /v1/store/info:
 *   post:
 *     summary: 매장 정보
 *     tags: [Front]
  *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1, "description": "매장 고유번호" }
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
 *         description: Returns true
 */
router.post('/info', checkStore, async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx = 0, change, store, user, nowDt, ip } = req.body;

    if (idx) {
        let row = await models.STORE_TB.scope(['active', 'viewer', 'typeText', { method: ['my', user?.idx] }]).findOne({
            where: { idx: idx }
        });

        if (!row) {
            sendError(req, res, "code_1000");
            return;
        }

        rt.result = row;
    } else {
        rt.result = store;
    }



    send(req, res, rt);
});








/**
 * @openapi
 * /v1/store/delete:
 *   post:
 *     summary: 매장 삭제
 *     tags: [Front]
  *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1, "description": "매장 고유번호" }
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
 *         description: Returns true
 */
router.post('/delete', async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx = 0, user, nowDt, ip } = req.body;

    let row = await models.STORE_TB.scope(['active', 'viewer', { method: ['my', user?.idx] }]).findOne({
        where: { idx: idx }
    });

    if (!row) {
        sendError(req, res, "code_1000");
        return;
    }

    await models.STORE_TB.update({
        deleteAt: nowDt
    }, {
        where: { idx: row?.idx },
    })

    let newStore = await models.STORE_TB.scope(['active', { method: ['my', user?.idx] }]).findOne();

    await user.update({
        store_idx: newStore?.idx || null
    });


    send(req, res, rt);
});


module.exports = router;
