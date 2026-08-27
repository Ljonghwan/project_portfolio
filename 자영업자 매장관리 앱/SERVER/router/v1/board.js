const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { Op } = require("sequelize");
const dayjs = require('dayjs');

const models = require('../../models');
const { isLogin, checkUser } = require('../../service/auth.js');
const { send, sendError, saveImages, encodeBase64, decodeBase64 } = require('../../service/utils.js');
const { limit } = require('../../service/consts.js');
/**
 * @openapi
 * /v1/board/list:
 *   post:
 *     summary: 게시판 리스트
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "cate": { "type": "number", "example":1,"description": "게시판 종류" },
 *                "sort": { "type": "number", "example":1,"description": "정렬 방식(1=최신순, 2=인기순)" },
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
router.post('/list', isLogin, async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { cate = 1, sort=1, page=1, nextToken, user, nowDt, ip } = req.body;

    let order = [['idx', 'DESC']];

    if (sort === 2) {
        order = [['like_count', 'DESC'], ...order];
    }

    let { count, rows } = await models.BOARD_TB.scope([
        'active',
        'status',
        'list',
        'count',
        'user',
        { method: ['notBlocked', user?.idx || 0] },
        { method: ['my', user?.idx || 0] },
        { method: ['page', { page: page, limit: limit } ] },
    ]).findAndCountAll(
        {
            where: {
                cate: cate,
            },
            order: order
        }
    )

    rt.result.list = rows?.map(x => {
        const json = x.toJSON();
        json.comment = json.commentStrip;
        return json;
    });

    rt.result.pagination = {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page * limit < count,
        hasPrevPage: page > 1,
    };

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/board/get:
 *   post:
 *     summary: 게시판 상세
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example": 1,"description": "게시글 고유번호" },
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
router.post('/get', checkUser, async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx = 0, user, nowDt, ip } = req.body;

    let row = await models.BOARD_TB.scope(['active', 'status', 'count', 'user', { method: ['my', user?.idx] }]).findOne(
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

    row = row.get({ plain: true });

    if (row?.isBlock) {
        sendError(req, res, "blocked");
        return;
    }

    let replys = await models.REPLY_TB.scope(['desc', 'user', 'count', { method: ['my', user?.idx] }]).findAll(
        {
            where: {
                board_idx: idx
            }
        }
    )

    replys = await Promise.all(
        replys.filter(reply => !reply.parent_idx) // 댓글만 필터링
            .map(comment => {
                const json = comment.toJSON();
                return {
                    ...json,
                    child: replys.filter(reply => reply.parent_idx === comment.idx)  // 해당 댓글의 대댓글들
                        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                }
            })
    );

    let votes = await models.BOARD_VOTE_TB.scope(['count']).findAll(
        {
            where: {
                target_idx: idx
            }
        }
    )
    let myVote = await models.BOARD_VOTE_JOIN_TB.findOne(
        {
            where: {
                user_idx: user?.idx || 0,
                board_idx: row?.idx
            }
        }
    )

    rt.result = {
        item: row,
        replys: replys,
        votes: votes,
        myVote: myVote?.target_idx || 0
    };

    send(req, res, rt);
});



/**
 * @openapi
 * /v1/board/update:
 *   post:
 *     summary: 게시판 등록/수정
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number | null", "example":1, "description": "게시글 고유번호" },
 *                "cate": { "type": "number", "example": 1, "description": "게시글 카테고리" },
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
router.post('/update', checkUser, async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx, cate, title, comment, image, vote, user, nowDt, ip } = req.body;

    // 필수 파라미터 검증
    if (!cate || !title || !comment) {
        sendError(req, res, "params");
        return;
    }

    if(vote?.length > 0 && vote?.filter(x => x?.title?.trim()?.length < 1)?.length > 0) {
        sendError(req, res, "params");
        return;
    }
    if(vote?.length === 1) {
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
        if (idx) {
            const row = await models.BOARD_TB.findOne({
                where: {
                    idx: idx,
                    user_idx: user?.idx
                }
            });

            if (!row) throw new Error("auth_fail");

            await row.update(ob)
        } else {
            let createData = await models.BOARD_TB.create(ob)
            idx = createData?.idx;

            // await models.BOARD_TB.create(ob)
            // await models.BOARD_TB.create(ob)
            // await models.BOARD_TB.create(ob)
            // await models.BOARD_TB.create(ob)
        }

    } catch ({ message }) {
        console.log('error', message);
        sendError(req, res, message || "req_invalid");
        return;
    }


    const row = await models.BOARD_TB.findOne({
        where: {
            idx: idx
        }
    });


    const paths = await saveImages({
        ori: row?.image,
        files: image,
        folder: `board/${idx}`
    });

    console.log('vote', vote);

    await row.update({
        image: paths
    });

    if(vote?.length > 0 ) {
        let deleteIdxs = vote?.filter(x => x?.idx)?.map(x => x?.idx);

        await models.BOARD_VOTE_TB.destroy({
            where: {
                idx: { [Op.notIn]: deleteIdxs }
            }
        });
        await models.BOARD_VOTE_JOIN_TB.destroy({
            where: {
                target_idx: { [Op.notIn]: deleteIdxs }
            }
        });

        for (const x of vote || []) {
            await models.BOARD_VOTE_TB.upsert({
                idx: x?.idx || undefined,  // undefined면 auto increment
                title: x?.title,
                target_idx: row?.idx
            });
        }
    }
   




    rt.result = row?.idx;

    send(req, res, rt);
});


/**
 * @openapi
 * /v1/board/delete:
 *   post:
 *     summary: 게시판 삭제
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "idx": { "type": "number", "example":1, "description": "게시글 고유번호" },
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
router.post('/delete', checkUser, async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { idx, user, nowDt, ip } = req.body;

    try {

        const row = await models.BOARD_TB.findOne({
            where: {
                idx: idx,
                user_idx: user?.idx
            }
        });

        if (!row) throw new Error("auth_fail");

        await row.update({
            deleteAt: nowDt
        })

    } catch ({ message }) {
        sendError(req, res, message || "default");
        return;
    }

    rt.result = true;

    send(req, res, rt);
});





/**
 * @openapi
 * /v1/board/myList:
 *   post:
 *     summary: 게시판 리스트
 *     tags: [Front]
 *     requestBody: {
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "cate": { "type": "number", "example":1,"description": "탭 종류" },
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
router.post('/myList', checkUser, async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    let { cate = 1, page=1, user, nowDt, ip } = req.body;

    let ob = {};
    let result = [];

    if (cate === 1) {
        ob.user_idx = user?.idx;
    } else {
        const idxs = await models.BOOKMARK_TB.findAll({
            attributes: ['target_idx'],
            raw: true,
            where: {
                user_idx: user?.idx
            }
        });

        ob.idx = { [Op.in]: idxs?.map(x => x?.target_idx) };
    }

    let { count, rows } = await models.BOARD_TB.scope([
        'active',
        'status',
        'list',
        'count',
        'user',
        { method: ['notBlocked', user?.idx || 0] },
        { method: ['my', user?.idx || 0] },
        { method: ['page', { page: page, limit: limit } ] },
    ]).findAndCountAll(
        {
            where: ob,
            order: [
                cate === 1 ? ['idx', 'DESC'] : ['isBookmark', 'DESC']
            ]
        }
    )

    rt.result.list = rows?.map(x => {
        const json = x.toJSON();
        json.comment = json.commentStrip;
        return json;
    });
    rt.result.pagination = {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page * limit < count,
        hasPrevPage: page > 1,
    };



    send(req, res, rt);
});



module.exports = router;
