const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const dayjs = require("dayjs");

const models = require("../../models")
const { encryptePassword, checkUser, isLogin } = require('../../service/auth.js');
const { send, sendError, scd, validateRequiredFields, maskString, sendSms, regEmail, regPhone, regPassword, makeRandomNick, deleteFile } = require('../../service/utils.js');
const jwtUtil = require('../../service/jwt.js');
const { sendEmailAuthMail } = require('../../service/mailform.js');
const { leaveUserDefaultData } = require('../../service/define.js');
const { sendMessage } = require('../../service/hyphen.js');

router.use((req, res, next) => {
    next();
})


/**
 * @openapi
 * /v1/auth/login:
 *   post:
 *     summary: 유저 로그인
 *     tags: [User]
 *     requestBody: {
 *       "required": true,
 *       "description":"type: account|naver|kakao|google|apple (소셜일 경우 socialId 만 입력)",
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "type": { "type": "string", "example":"account", "description": "로그인 유형" },
 *                "account": { "type": "string", "example":"account", "description": "아이디" },
 *                "pass": { "type": "string", "example":"password", "description": "비밀번호" },
 *                "socialId": { "type": "string", "example":"socialidcode","description": "소셜 고유아이디" },
 *                "deviceToken": { "type": "string", "example":"deviceToken", "description": "디바이스 토큰" },
 *                "deviceInfo": { "type": "string", "example":"deviceInfo", "description": "디바이스 정보" },
 *              },
 *              "required": ["type"]
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
 *         description: Return JWT Token
 */
router.post("/login", async (req, res) => {

    const {
        type,
        account,
        pass,
        deviceToken,
        socialId,
        deviceInfo,
        ip
    } = req.body;

    let rt = {
        ok: true,
        msg: '',
        result: {}
    }

    try {

        let loginUser = null;

        if (type === "account") {
            // 계정 로그인

            if (!account || !pass || !deviceInfo) {
                sendError(req, res, 'req_invalid');
                return;
            }

            // 가입 검사
            loginUser = await models.USER_TB.findOne({
                where: {
                    type: type,
                    account,
                }
            });

            if (!loginUser) {
                sendError(req, res, "login_fail");
                return
            }

            /** 비밀번호 5회이상 틀렸을시 잠금상태 확인 */
            if (loginUser?.lockAt && !dayjs().isAfter(dayjs(loginUser?.lockAt))) {
                sendError(req, res, "login_fail_count");
                return;
            }


            if (!bcrypt.compareSync(pass, loginUser?.password)) {

                await models.USER_LOGIN_LOG_TB.create({
                    user_idx: loginUser?.idx,
                    ip: ip,
                    device: deviceInfo,
                    status: 2
                });

                let loginFailCount = await models.USER_LOGIN_LOG_TB.scope(['desc']).count({
                    where: {
                        user_idx: loginUser?.idx,
                        status: 2,
                        createdAt: {
                            [Op.gte]: dayjs().subtract(15, 'minute').format('YYYY-MM-DD HH:mm:ss')
                        }
                    }
                })

                /** 비밀번호 5회이상 틀렸을시 잠금상태 설정 */
                if (loginFailCount >= 5) {
                    sendError(req, res, "login_fail_count");

                    await loginUser.update({
                        lockAt: dayjs().add(15, 'minute').format('YYYY-MM-DD HH:mm:ss')
                    })
                    return;
                }

                sendError(req, res, "login_fail");
                return;
            }



        } else if (type === "google" || type === "apple" || type === "naver" || type === "kakao") {

            // 가입 검사
            loginUser = await models.USER_TB.findOne({
                where: {
                    type: type,
                    socialId: socialId + "",
                }
            });

            if (!loginUser) {
                sendError(req, res, "login_social_fail");
                return
            }

        } else {
            //알수없는 타입의 로그인
            sendError(req, res, "code_1000");
            return
        }




        if (loginUser?.status !== 1) {
            sendError(req, res, loginUser?.status === 2 ? "ban_login" : "leave_login");
            return;
        }

        await loginUser.update({
            deviceToken: loginUser?.deviceToken === null ? deviceToken : loginUser?.deviceToken,
            lockAt: null
        });
        await models.USER_LOGIN_LOG_TB.create({
            user_idx: loginUser?.idx,
            ip: ip,
            device: deviceInfo,
        });

        await models.USER_LOGIN_LOG_TB.destroy({
            where: {
                user_idx: loginUser?.idx,
                status: 2
            }
        });


        const token = jwtUtil.sign({ idx: loginUser?.idx });
        rt.result = token;

        send(req, res, rt);

    } catch (e) {
        console.log("[login error]", e)
        sendError(req, res, "code_1000");
        return
    }
})



/**
 * @openapi
 * /v1/auth/checkRegiste:
 *   post:
 *     summary: 회원가입 가능여부 체크
 *     tags: [User]
 *     requestBody: {
 *       "required": true,
 *       "content": {
 *         "application/json": {
 *           "schema": {
 *             "type": "object",
 *             "properties": {
 *               "hp": { "type": "string", "example": "01012341234", "description": "휴대폰 번호" },
 *             },
 *             "required": []
 *           }
 *         }
 *       }
 *     }
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: 사용가능여부(true,false) 
 */
router.post("/checkRegiste", async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: true
    }

    try {
        const {
            hp,
            nowDt
        } = req.body;

        console.log("hp", hp);

        // 필수 파라미터 검증
        if (!hp || !regPhone.test(hp)) {
            throw new Error("params");
        }

        let count = await models.USER_TB.count({
            where: {
                hp: hp,
            }
        });

        rt.result = Boolean(count < 1);

        send(req, res, rt);

    } catch ({ message }) {
        sendError(req, res, message || 'default');
        // return
    }
})



/**
 * @openapi
 * /v1/auth/checkNickname:
 *   post:
 *     summary: 닉네임 중복 체크
 *     tags: [User]
 *     requestBody: {
 *       "required": true,
 *       "content": {
 *         "application/json": {
 *           "schema": {
 *             "type": "object",
 *             "properties": {
 *               "nickname": { "type": "string", "example": "nickname", "description": "닉네임" },
 *             },
 *             "required": []
 *           }
 *         }
 *       }
 *     }
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: 사용가능여부(true,false) 
 */
router.post("/checkNickname", async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: true
    }

    try {
        const {
            nickname,
            nowDt
        } = req.body;

        console.log("nickname", nickname);

        // 필수 파라미터 검증
        if (!nickname) {
            throw new Error("params");
        }

        let count = await models.USER_TB.count({
            where: {
                nickname: nickname,
            }
        });

        if (count > 0) throw new Error("use_nick");

        rt.result = true;

        send(req, res, rt);

    } catch ({ message }) {
        sendError(req, res, message || 'default');
        // return
    }
})



/**
 * @openapi
 * /v1/auth/checkAccount:
 *   post:
 *     summary: 계정 이메일 인증 
 *     tags: [User]
 *     requestBody: {
 *       "required": true,
 *       "content": {
 *         "application/json": {
 *           "schema": {
 *             "type": "object",
 *             "properties": {
 *               "account": { "type": "string", "example": "test01@test.com", "description": "계정 이메일" },
 *             },
 *             "required": []
 *           }
 *         }
 *       }
 *     }
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Return JWT Token
 */
router.post("/checkAccount", async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: true
    }

    try {
        const {
            account,
            mode,
            nowDt
        } = req.body;

        console.log("account", account);

        // 필수 파라미터 검증
        if (!account || !regEmail.test(account)) {
            throw new Error("params");
        }

        let count = await models.USER_TB.count({
            where: {
                account: account,
                type: 'account'
            }
        });

        if (mode === 'find') {
            if (count > 0) {
                rt.result = false;
            } else {
                rt.result = true;
            }
            send(req, res, rt);
            return;
        }

        let count2 = await models.USER_AUTH_NUM_TB.count({
            where: {
                email: account,
                type: 'register',
                createdAt: {
                    [Op.gte]: models.sequelize.literal("NOW() - INTERVAL '30 seconds'")
                }
            }
        });
        console.log('count2', count2);
        if (count2 >= 5) {
            throw new Error("default");
        }


        let number = '';
        for (let i = 0; i < 6; i++) {
            number += Math.floor(Math.random() * 10);
        };

        let status = await sendEmailAuthMail(account, number);
        if (!status) throw new Error("auth_num_fail");

        const saveData = await models.USER_AUTH_NUM_TB.create({
            number: number,
            email: account,
            type: 'register'
        });

        const token = jwtUtil.createToken({ idx: saveData?.idx });
        rt.result = token;


        send(req, res, rt);

    } catch ({ message }) {
        sendError(req, res, message || 'default');
        // return
    }
})





/**
 * @openapi
 * /v1/auth/checkAccountCode:
 *   post:
 *     summary: 이메일 인증번호 체크
 *     tags: [User]
 *     requestBody: {
 *       "required": true,
 *       "content": {
 *         "application/json": {
 *           "schema": {
 *             "type": "object",
 *             "properties": {
 *               "token": { "type": "string", "example": "TOKEN", "description": "TOKEN" },
 *               "code": { "type": "string", "example": "123456", "description": "인증번호" },
 *             },
 *             "required": []
 *           }
 *         }
 *       }
 *     }
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: Return true
 */
router.post("/checkAccountCode", async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: true
    }

    try {
        const {
            token,
            code,
            nowDt
        } = req.body;

        // 필수 파라미터 검증
        if (!token || !code) {
            throw new Error("params");
        }

        let decoded = jwtUtil.verifyToken(token);
        if (!decoded) throw new Error("req_invalid");
        if (decoded === 'expired') throw new Error("auth_num_expired");

        const rows = await models.USER_AUTH_NUM_TB.findOne({
            where: {
                idx: decoded?.idx || 0
            }
        });

        if (!rows || !rows?.email) throw new Error("req_invalid");
        if (rows?.number !== code) throw new Error("auth_num_wrong");

        await rows.update({ status: true });

        rt.result = rows?.email;

        send(req, res, rt);

    } catch ({ message }) {
        console.log("[find error]", e)
        sendError(req, res, message || 'default');
        // return
    }
})



/**
 * @openapi
 * /v1/auth/register:
 *   post:
 *     summary: 유저 회원가입
 *     tags: [User]
 *     requestBody: {
 *       "required": true,
 *       "description":"type: account|naver|kakao|google|apple (소셜일 경우 socialId 입력)",
 *       "content": {
 *          "application/json": {
 *            "schema": {
 *              "type": "object",
 *              "properties": {
 *                "type": { "type": "string", "example": "account", "description": "로그인 유형 account|naver|kakao|google|apple" },
 *                "name": { "type": "string", "example": "홍길동", "description": "사용자 이름" },
 *                "hp": { "type": "string", "example": "01012341234", "description": "휴대폰 번호" },
 *                "birth": { "type": "string", "example": "19990101", "description": "생년월일(YYYYMMDD)" },
 *                "gender": { "type": "integer", "example": 1, "description": "성별 (1: 남성, 2: 여성)" },
 *                "nickName": { "type": "string", "example": "test", "description": "닉네임" },
 *                "email": { "type": "string", "example": "test01@test.com", "description": "이메일" },
 *                "pass": { "type": "string", "example": "abcd!1234", "description": "비밀번호" },
 *                "pass2": { "type": "string", "example": "abcd!1234", "description": "비밀번호 확인" },
 *                "socialId": { "type": "string", "example": "socialidsocialid", "description": "소셜 로그인 고유 ID" },
 *                "deviceToken": { "type": "string", "example": "deviceToken", "description": "디바이스 토큰" },
 *                "deviceInfo": { "type": "string", "example": "deviceInfo", "description": "디바이스 정보" },
 *              },
 *              "required": ["type"]
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
 *         description: Return JWT Token
 */
router.post("/register", async (req, res) => {
    try {
        let {
            type,
            name,
            hp,
            birth,
            gender,
            nickname,
            email,
            pass,
            pass2,
            socialId,
            deviceToken,
            deviceInfo,
            ip
        } = req.body;


        if (type === "account") {
            // 계정 가입
            const requiredFields = {
                name: '이름',
                hp: '휴대폰',
                birth: '생년월일',
                gender: '성별',
                // nickname: '닉네임',
                email: '이메일',
                pass: '비밀번호',
                pass2: '비밀번호 확인',
            };

            // 필수값 검증
            const missingFields = validateRequiredFields(req.body, requiredFields);
            if (missingFields.length > 0) {
                sendError(req, res, "params")
                return;
            }

            if (!regPhone.test(hp)) {
                sendError(req, res, "req_invalid");
                return;
            }

            if (!regPassword.test(pass)) {
                sendError(req, res, "req_invalid");
                return;
            }
            // 추가 검증
            if (pass !== pass2) {
                sendError(req, res, "req_invalid");
                return;
            }

            let count = await models.USER_TB.count({
                where: {
                    account: email,
                    type: 'account'
                }
            });
            // 동일 계정 있음
            if (count > 0) {
                sendError(req, res, "use_account");
                return;
            }


        } else if (type === "google" || type === "apple" || type === "naver" || type === "kakao") {
            // 소셜 가입

            const requiredFields = {
                socialId: '소셜아이디',
                name: '이름',
                hp: '휴대폰',
                birth: '생년월일',
                gender: '성별',
                // nickname: '닉네임',
                email: '이메일',
            };

            // 필수값 검증
            const missingFields = validateRequiredFields(req.body, requiredFields);
            if (missingFields.length > 0) {
                sendError(req, res, "params")
                return;
            }
            if (!regPhone.test(hp)) {
                sendError(req, res, "req_invalid");
                return;
            }

            let count = await models.USER_TB.count({
                where: {
                    socialId: socialId + "",
                    type: type
                }
            });

            // 동일 소셜 아이디 있음
            if (count > 0) {
                sendError(req, res, "use_social_id");
                return;
            };

        } else {
            //알수없는 타입의 가입
            sendError(req, res, "params")
            return
        }



        let validCount = await models.USER_TB.count({
            where: {
                hp: hp
            }
        });

        // 동일 휴대폰번호 있음
        if (validCount > 0) {
            sendError(req, res, "use_hp");
            return;
        }


        if (!nickname) {
            nickname = await makeRandomNick();
        }

        validCount = await models.USER_TB.count({
            where: {
                nickname: nickname
            }
        });

        // 동일 닉네임 있음
        if (validCount > 0) {
            sendError(req, res, "use_nick");
            return;
        }




        let makeData = {
            type: type,
            name: name,
            hp: hp,
            birth: birth,
            gender: gender,
            nickname: nickname,
            account: email,
            socialId: type === 'account' ? null : socialId + "",
            password: encryptePassword(type === 'account' ? pass : socialId + ""),
            deviceToken: deviceToken || null,
        };

        console.log(makeData);
        const saveData = await models.USER_TB.create(makeData);
        console.log("saveData", saveData.idx)
        const token = jwtUtil.sign({ idx: saveData.idx });

        await models.USER_LOGIN_LOG_TB.create({
            user_idx: saveData?.idx,
            ip: ip,
            device: deviceInfo,
        });

        send(req, res, { result: token });
        return;


    } catch (e) {
        console.log("[login error]", e)
        sendError(req, res, "code_1000");
        return
    }
})



/**
 * @openapi
 * /v1/auth/find:
 *   post:
 *     summary: 아이디 & 비밀번호 찾기
 *     tags: [User]
 *     requestBody: {
 *       "required": true,
 *       "content": {
 *         "application/json": {
 *           "schema": {
 *             "type": "object",
 *             "properties": {
 *               "type": { "type": "string", "example": "id | password", "description": "인증 타입 종류" },
 *               "name": { "type": "string", "example": "홍길동", "description": "이름(아이디 찾기)" },
 *               "account": { "type": "string", "example": "account", "description": "아이디(비밀번호 찾기)" },
 *               "hp": { "type": "string", "example": "01012345678", "description": "휴대폰번호" },
 *             }
 *           }
 *         }
 *       }
 *     }
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: return true 
 */
router.post("/find", async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: true
    }

    try {
        const {
            type,
            name,
            account,
            hp,
            nowDt
        } = req.body;

        // 필수 파라미터 검증
        if (!type || !hp) {
            throw new Error("params");
        }

        const count = await models.USER_AUTH_NUM_TB.count({
            where: {
                hp: hp,
                type: type,
                createdAt: {
                    [Op.gte]: models.sequelize.literal("NOW() - INTERVAL '30 seconds'")
                }
            }
        });
        console.log('count', count);
        if (count >= 5) {
            throw new Error("default");
        }

        let number = '';
        for (let i = 0; i < 6; i++) {
            number += Math.floor(Math.random() * 10);
        };

        // number = '123456';

        let content = `[오너톡] 인증번호는 [${number}] 입니다.`;
        const { ok, msg, result, errorMsg } = await sendMessage({ hp, message: content });

        if (!ok) throw new Error("auth_num_fail");

        const saveData = await models.USER_AUTH_NUM_TB.create({
            number: number,
            hp: hp,
            type: type
        });

        const token = jwtUtil.createToken({ idx: saveData?.idx });
        rt.result = token;

        send(req, res, rt);

    } catch ({ message }) {
        sendError(req, res, message || 'default');
        // return
    }
})



/**
 * @openapi
 * /v1/auth/findVerification:
 *   post:
 *     summary: 아이디 & 비밀번호 인증번호 검증
 *     tags: [User]
 *     requestBody: {
 *       "required": true,
 *       "content": {
 *         "application/json": {
 *           "schema": {
 *             "type": "object",
 *             "properties": {
 *               "token": { "type": "string", "example": "token", "description": "인증번호 발송시 토큰" },
 *               "code": { "type": "string", "example": "123456", "description": "인증번호" },
 *             }
 *           }
 *         }
 *       }
 *     }
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: return true 
 */
router.post("/findVerification", async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: true
    }

    try {
        const {
            token,
            code,
            input,
            nowDt
        } = req.body;

        // 필수 파라미터 검증
        if (!token || !code) {
            throw new Error("params");
        }

        let decoded = jwtUtil.verifyToken(token);
        if (!decoded) throw new Error("req_invalid");
        if (decoded === 'expired') throw new Error("auth_num_expired");

        const rows = await models.USER_AUTH_NUM_TB.findOne({
            where: {
                idx: decoded?.idx || 0
            }
        });

        if (!rows) throw new Error("req_invalid");
        if (rows?.number !== code) throw new Error("auth_num_wrong");

        if (rows?.type === 'id') {

            const user = await models.USER_TB.scope(['active', 'desc']).findOne({
                where: {
                    name: input || '',
                    hp: rows?.hp
                }
            });

            if (!user) rt.result = null;
            else {
                rt.result = {
                    findType: rows?.type,
                    type: user?.type,
                    name: user?.name,
                    account: user?.type === 'account' ? maskString(user?.account) : user?.account,
                    createdAt: user?.createdAt
                }
            }

        } else if (rows?.type === 'password') {

            const user = await models.USER_TB.scope(['active', 'desc']).findOne({
                where: {
                    account: input || '',
                    hp: rows?.hp,
                    type: 'account'
                }
            });

            if (!user) rt.result = null;
            else {
                const token = jwtUtil.createToken({ idx: user?.idx });
                rt.result = {
                    findType: rows?.type,
                    token: token
                }
            }
        }

        await rows.update({
            status: true
        });

        send(req, res, rt);

    } catch ({ message }) {
        console.log("[find error]", message)
        sendError(req, res, message || 'default');
        // return
    }
})



/**
 * @openapi
 * /v1/auth/resetPassword:
 *   post:
 *     summary: 비밀번호 재설정
 *     tags: [User]
 *     requestBody: {
 *       "required": true,
 *       "content": {
 *         "application/json": {
 *           "schema": {
 *             "type": "object",
 *             "properties": {
 *               "token": { "type": "string", "example": "token", "description": "인증번호 검증후 토큰" },
 *               "password": { "type": "string", "example": "password", "description": "비밀번호" },
 *             }
 *           }
 *         }
 *       }
 *     }
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: return true 
 */
router.post("/resetPassword", async (req, res) => {

    let rt = {
        ok: true,
        msg: '',
        result: true
    }

    try {
        const {
            token,
            password,
            nowDt
        } = req.body;

        // 필수 파라미터 검증
        if (!token || !password) {
            throw new Error("params");
        }

        let decoded = jwtUtil.verifyToken(token);
        if (!decoded) throw new Error("req_invalid");
        if (decoded === 'expired') throw new Error("auth_num_expired");

        const user = await models.USER_TB.scope(['active', 'desc']).findOne({
            where: {
                idx: decoded?.idx || 0,
                type: 'account'
            }
        });

        if (!user) throw new Error("req_invalid");
        if (bcrypt.compareSync(password, user?.password)) throw new Error("password_same");

        await user.update({
            password: encryptePassword(password)
        });

        send(req, res, rt);

    } catch ({ message }) {
        console.log("[find error]", message)
        sendError(req, res, message || 'default');
        // return
    }
})





/**
 * @openapi
 * /v1/auth/logout:
 *   post:
 *     summary: 로그아웃 (디바이스 토큰 제거)
 *     tags: [User]
 *     requestBody: {
 *       "required": true,
 *       "content": {
 *         "application/json": {
 *           "schema": {
 *             "type": "object",
 *             "properties": {
 *               "deviceToken": { "type": "string", "example": "device token", "description": "디바이스 토큰" },
 *             },
 *             "required": ["deviceToken"]
 *           }
 *         }
 *       }
 *     }
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: return true 
 */
router.post("/logout", async (req, res) => {

    try {
        const {
            deviceToken = "",
        } = req.body;

        console.log('deviceToken', deviceToken);

        send(req, res, { result: true });

        await models.USER_TB.update(
            { deviceToken: null },
            {
                where: {
                    deviceToken: deviceToken,
                },
            }
        );

    } catch (e) {
        console.log("[logout error]", e)
        // sendError(req, res, "code_1000");
        // return
    }
})


/**
 * @openapi
 * /v1/auth/info:
 *   post:
 *     summary: 유저 정보 가져오기
 *     tags: [User]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: return true 
 */
router.post("/info", checkUser, async (req, res) => {

    let { user, nowDt, ip } = req.body;

    try {

        let rt = {
            ok: true,
            msg: '',
            result: {}
        }

        let store = await models.STORE_TB.scope(['active', 'desc', 'viewer', { method: ['my', user?.idx] }]).findAll();

        rt.result = {
            ...user.get({ plain: true }),
            store: store,
            // store: []
        }

        send(req, res, rt);

    } catch (e) {
        console.log("[info error]", e)
        sendError(req, res, "default");
    }
})


/**
 * @openapi
 * /v1/auth/tracking:
 *   post:
 *     summary: 유저 접속통계
 *     tags: [User]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: return true 
 */
router.post("/tracking", isLogin, async (req, res) => {

    let { user, nowDt, ip } = req.body;

    let now = dayjs().format('YYYY-MM-DD HH:mm:00');

    send(req, res, { result: true });

    if (!user?.idx) return;

    try {
        await models.APP_TRACKING_TB.findOrCreate({
            where: {
                user_idx: user?.idx,
                createdAt: now
            },
            defaults: {
                user_idx: user?.idx,
                createdAt: now
            }
        });
    } catch (error) {
    }
})



/**
 * @openapi
 * /v1/auth/badge:
 *   post:
 *     summary: 뱃지 팝업 읽음처리
 *     tags: [User]
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: return true 
 */
router.post("/badge", checkUser, async (req, res) => {

    let { user, nowDt, ip } = req.body;

    try {

        let rt = {
            ok: true,
            msg: '',
            result: {}
        }

        await user.update({
            newBadge: null,
            newBadgeAt: null
        });

        send(req, res, rt);

    } catch (e) {
        console.log("[info error]", e)
        sendError(req, res, "default");
    }
})



/**
 * @openapi
 * /v1/auth/leave:
 *   post:
 *     summary: 회원탈퇴
 *     tags: [User]
 *     requestBody: {
 *       "required": true,
 *       "content": {
 *         "application/json": {
 *           "schema": {
 *             "type": "object",
 *             "properties": {
 *               "type": { "type": "string", "example": "type", "description": "탈퇴 타입" },
 *               "desc": { "type": "string", "example": "desc", "description": "탈퇴 사유" },
 *             },
 *           }
 *         }
 *       }
 *     }
 *     parameters: [
 *       { $ref: "#/components/parameters/scd"},
 *       { $ref: "#/components/parameters/contentType"},
 *     ]
 *     responses:
 *       200:
 *         description: return true 
 */
router.post("/leave", checkUser, async (req, res) => {

    let { type, desc, user, ip } = req.body;

    let rt = {
        ok: true,
        msg: '',
        result: true
    }

    // 필수 파라미터 검증
    if (!type) {
        sendError(req, res, "params");
        return;
    }

    const transaction = await models.sequelize.transaction();
    let nowDt = dayjs().toDate();

    try {

        // TODO: 회원탈퇴시 해당회원의 게시물, 댓글, 기타등등 처리

        // 매장 삭제
        await models.STORE_TB.update({
            deleteAt: nowDt
        }, {
            where: { user_idx: user.idx },
            transaction
        })

        // 게시물 삭제
        // await models.BOARD_TB.update({
        //     deleteAt: nowDt
        // }, {
        //     where: { user_idx: user.idx },
        //     transaction
        // })

        // 댓글 삭제
        // await models.REPLY_TB.update({
        //     deleteAt: nowDt
        // }, {
        //     where: { user_idx: user.idx },
        //     transaction
        // })

        // TODO: 회원탈퇴시 재가입 가능하게

        await deleteFile(user?.profile);

        await user.update({
            status: 9,
            delete_type: type,
            delete_desc: desc,
            deleteAt: nowDt,
            account: `leave_${user?.idx || 0}@example.com`,
            nickname: `탈퇴회원#${user?.idx || 0}`,
            ...leaveUserDefaultData
        })

        // 모든 작업 성공 시 커밋
        await transaction.commit();

        send(req, res, rt);

    } catch (e) {

        // 오류 발생 시 롤백
        await transaction.rollback();

        sendError(req, res, 'leave_fail');
    }
})


module.exports = router;

