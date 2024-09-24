const mongoose = require('./../db');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const CloudSave = require('./../models/CloudSaves');
// const authenticateToken = require('./../middlewares/authenticateToken'); // 引入验证 token 的中间件
const SaveFiles = require('./../models/SaveFiles'); // 引入你的模型

// 删除指定ID的 saveFileId
router.delete('/delete/:saveFileId', async (req, res) => {
    try {
        const { saveFileId } = req.params; // 从 URL 参数中获取 saveFileId
        const userId = req.auth.id; // 从 token 中获取用户ID

        // 检查用户是否有权限访问这个 SaveFile
        // const cloudSave = await SaveFiles.findOne({ user: userId, fileContent: saveFileId }).lean();
        // if (!cloudSave) {
        //     return res.status(404).json({ error: '未找到对应的 CloudSave 或者您没有权限访问' });
        // }

        // 查找对应的 SaveFile 文档
        console.log(saveFileId)
        const saveFile = await SaveFiles.findById(saveFileId).lean();

        // 如果找到了 SaveFile，返回详细信息
        if (saveFile) {
            res.json(saveFile);
        } else {
            res.status(404).json({ error: '未找到对应的 SaveFile' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '获取 SaveFile 时出错', details: err.message });
    }
});

// 获取指定ID的 saveFile 详情
router.get('/detail/:saveFileId', async (req, res) => {
    try {
        const { saveFileId } = req.params; // 从 URL 参数中获取 saveFileId
        const userId = req.auth.id; // 从 token 中获取用户ID

        console.log(saveFileId,userId)
        // 查找对应的 SaveFile 文档
        const saveFile = await SaveFiles.findOne({ _id: saveFileId, user: userId }).lean();

        // 如果找到了 SaveFile，返回详细信息
        if (saveFile) {
            res.json(saveFile);
        } else {
            // 如果没有找到 SaveFile 或者用户没有权限访问，返回 404 错误
            res.status(404).json({ error: '未找到对应的 SaveFile 或者您没有权限访问' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '获取 SaveFile 时出错', details: err.message });
    }
});

module.exports = router;