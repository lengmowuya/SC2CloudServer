const { expressjwt: expressJwt } = require('express-jwt');
const logger = require("./../logger.js")

const secretKey = 'lengmowuya123456'; // 请使用一个安全的密钥

// 验证 token 的中间件
const authenticateToken = expressJwt({
    secret: secretKey,
    algorithms: ['HS256'],
    requestProperty: 'auth' // 将解码后的 token 信息附加到 req.auth
}).unless({
    path: ['/users'] // 不需要验证 token 的路由
});

// 错误处理函数
const errorHandler = (err, req, res, next) => {
    logger.error(err.message, { metadata: err }); // 记录错误到数据库
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({ error: "Token错误,无法识别和格式化"});
    } else {
        res.status(500).json({ error: '服务器网络错误' });
    }
};

module.exports = { authenticateToken, errorHandler };
