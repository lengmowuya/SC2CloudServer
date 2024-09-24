const express = require('express');
const app = express();

const { authenticateToken, errorHandler } = require('./middlewares/authenticateToken');


// 引入分拆的路由
const userRoutes = require('./routes/route_user');
const cloudSavesRoutes = require('./routes/route_cloudSaves');
const signinRoutes = require('./routes/route_signin');
const saveFileRoutes = require('./routes/route_saveFile');
const cloudPackageRoutes = require('./routes/route_cloudPackage');
const starMapRoutes = require('./routes/other/starmap');
const starPlayerRoutes = require('./routes/other/starplayer');

app.use(express.json()); // 解析 JSON 请求体

// 使用拆分的路由
app.use('/users', userRoutes);

// // 使用验证 token 的中间件
// app.use(authenticateToken);

app.use('/cloudsaves', authenticateToken,cloudSavesRoutes);
app.use('/sign', authenticateToken,signinRoutes);
app.use('/savefile', authenticateToken,saveFileRoutes);
app.use('/cloudpackage', authenticateToken,cloudPackageRoutes);
app.use('/starmap', authenticateToken,starMapRoutes);
app.use('/starplayer', authenticateToken,starPlayerRoutes);

// 全局错误处理中间件
app.use(errorHandler);

app.get('/', (req, res) => {
    res.send('Hello ,This is SC2CloudServer!');
  });


app.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
