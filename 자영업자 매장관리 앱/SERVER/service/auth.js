const bcrypt = require("bcrypt");
const jwtUtil = require('../service/jwt.js');
const { sendError } = require('../service/utils.js');
const models = require('../models')

module.exports.AuthLevel =
{
    READ: 0x01 << 0, // 1        읽기
    WRITE: 0x01 << 1, // 2       쓰기
    MODIFY: 0x01 << 2, // 4      수정
    DELETE: 0x01 << 3, // 8      삭제
};

module.exports.checkAuth = (checkAuth, userAuth) => {
    try {
        const isAuth = (userAuth & checkAuth) === checkAuth;
        return isAuth;
    }
    catch (e) {
        return false;
    }
}

module.exports.checkLevel = (userLevel, level) => {
    try {
        return userLevel == level;
    }
    catch (e) {
        return false;
    }
}

module.exports.encryptePassword = (pass) => {
    return bcrypt.hashSync(pass, 5);
}


module.exports.isLogin = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        let decoded = jwtUtil.verifyToken(token, process.env.JWT_ADMIN_KEY);

        if (typeof decoded !== "object") throw new Error("");

        let idx = decoded?.idx;

        let user = await models.USER_TB.findOne({
            where: { idx: idx || 0 }
        });

        if (!user) throw new Error("");
        if (user?.status !== 1) {
            throw new Error(user?.status === 2 ? "ban" : "leave");
        }

        req.body.user = user;
        next();

    } catch ({ message }) {
        req.body.user = {};
        next();
    }
}

module.exports.checkUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        let decoded = jwtUtil.verifyToken(token, process.env.JWT_ADMIN_KEY);

        if (typeof decoded !== "object") throw new Error("");

        let idx = decoded?.idx;

        let user = await models.USER_TB.findOne({
            where: { idx: idx || 0 }
        });

        if (!user) throw new Error("");
        if (user?.status !== 1) {
            throw new Error(user?.status === 2 ? "ban" : "leave");
        }

        req.body.user = user;
        next();
    } catch ({ message }) {
        // 유저 정보가 없음
        sendError(req, res, message || "unverified");
        return
    }
}
module.exports.checkStore = async (req, res, next) => {
    try {
        const { user } = req.body;

        let row = await models.STORE_TB.scope(['active', 'typeText', { method: ['my', user?.idx] }]).findOne(
            {
                where: {
                    idx: user?.store_idx || 0
                }
            }
        )

        req.body.store = row;

        next();
    } catch ({ message }) {
        // 매장 정보가 없음
        sendError(req, res, "store_invalid");
        return
    }
}

module.exports.checkAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        let decoded = jwtUtil.verifyAdminToken(token, process.env.JWT_ADMIN_KEY);

        if (typeof decoded === "object") {
            let idx = decoded?.idx;

            let user = await models.ADMIN_TB.scope(['auth']).findOne({
                where: { idx: idx }
            });

            if (user) {
                req.body.user = user;
            } else {
                // console.log( "checkuser > not found user" )
                sendError(req, res, "code_1000");
                return
            }
        } else {
            // console.log( "checkuser > decode null" )
            sendError(req, res, "code_1000");
            return
        }
        next();
    } catch (e) {
        // 유저 정보가 없음
        sendError(req, res, "code_1000");
        return
    }
}

module.exports.logs = async ({
    type,
    title,
    status=1,
    user_idx,
    store_idx,
    comment=""
}) => {
    try {
        if(!type || !title || !user_idx) throw new Error("");

        console.log(title, user_idx, store_idx, comment);
        await models.LOG_TB.create({
            user_idx,
            store_idx,
            type,
            title,
            status,
            comment
        });

    } catch (e) {
        console.log(e)
    }
}