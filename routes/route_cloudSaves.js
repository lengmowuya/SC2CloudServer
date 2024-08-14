const mongoose = require('./../db');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const CloudSave = require('./../models/CloudSaves');
// const authenticateToken = require('./../middlewares/authenticateToken'); // 引入验证 token 的中间件

// 设置Multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 文件上传和验证路由
router.post('/upload',upload.single('file'), async (req, res) => {
    try {
        const { id, fileName, fileContent, fileSize, fileSpace, fileModifiedTime, dir1, dir2, dir3 } = req.body;

        if (!id || !fileName || !fileContent || !fileSize || !fileSpace || !fileModifiedTime) {
            return res.status(400).json({ error: '缺少必要的字段' });
        }

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (fileSize > MAX_FILE_SIZE) {
            return res.status(400).json({ error: '文件过大' });
        }
        // 验证文件扩展名是否为 .SC2Bank
        if (!fileName.endsWith('.SC2Bank')) {
            return res.status(400).json({ error: '无效的文件格式。只允许 .SC2Bank 文件。' });
        }

        // 将 Base64 编码的文件内容解码为二进制数据
        // const fileBuffer = Buffer.from(fileContent, 'base64');

        // 创建新的 CloudSave 文档
        const newCloudSave = new CloudSave({
            fileContent: fileContent,
            contentType: 'application/octet-stream', // 根据需要调整
            user: id,
            directory: { dir1, dir2, dir3 },
            fileName: fileName,
            fileSize: fileSize,
            fileSpace: fileSpace,
            fileModifiedTime: new Date(fileModifiedTime)
        });

        // 保存到数据库
        await newCloudSave.save();
        res.json({ message: '文件上传并成功保存' });
    } catch (err) {
        res.status(500).json({ error: '保存文件到数据库时出错' });
    }
});

// 获取用户所有的 CloudSaves
router.get('/all', async (req, res) => {
    try {
        const userId = req.auth.id; // 从 token 中获取用户ID
        console.log(userId);
        // 查找用户的所有 CloudSaves
        const cloudSaves = await CloudSave.find({ user: userId });

        res.json(cloudSaves);
    } catch (err) {
        res.status(500).json({ error: '获取 CloudSaves 时出错' });
    }
});

module.exports = router;
