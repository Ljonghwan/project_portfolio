const crypto = require('crypto');
const Hashids = require('hashids');
const hashids = new Hashids(process.env.ENCRYPTION_KEY, 8);

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.ENCRYPTION_KEY; // 32자리 키
const IV_LENGTH = 16;

// 암호화
module.exports.encrypt = (text) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

// 복호화
module.exports.decrypt = (encryptedText) => {
    try {
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        return null;
    }
}



// 단일 숫자
module.exports.encodeId = (id) => {
    return hashids.encode(id);
}

module.exports.decodeId = (hash) => {
    try {
        const [id] = hashids.decode(hash);
        return id;
    } catch (error) {
        return null;
    }
    
}