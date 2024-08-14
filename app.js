const express = require('express');
const app = express();

const { authenticateToken, errorHandler } = require('./middlewares/authenticateToken');


// 引入分拆的路由
const userRoutes = require('./routes/route_user');
const cloudSavesRoutes = require('./routes/route_cloudSaves');

app.use(express.json()); // 解析 JSON 请求体

// 使用拆分的路由
app.use('/users', userRoutes);

// // 使用验证 token 的中间件
// app.use(authenticateToken);

app.use('/cloudsaves', authenticateToken,cloudSavesRoutes);

// 全局错误处理中间件
app.use(errorHandler);

app.get('/', (req, res) => {
    res.send('Hello World!');
  });


app.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
