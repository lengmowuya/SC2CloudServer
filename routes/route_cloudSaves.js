const mongoose = require('./../db');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const CloudSave = require('./../models/CloudSaves');
const CloudPackage  = require('./../models/CloudPackage');
// const authenticateToken = require('./../middlewares/authenticateToken'); // 引入验证 token 的中间件
const crypto = require('crypto');
const SaveFiles = require('./../models/SaveFiles'); // 引入你的模型

// 设置Multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let cache = {}; // 内存中的缓存对象
let cacheTimeouts = {}; // 存储定时器ID的对象

// 缓存过期函数
const setCacheExpire = (key, duration) => {
    const timeoutId = setTimeout(() => {
        delete cache[key];
        delete cacheTimeouts[key];
        console.log(`Cache for ${key} expired`);
    }, duration);
    cacheTimeouts[key] = timeoutId;
};

function 检查必要字段(body, 必要字段) {
    const 缺少的字段 = [];
    必要字段.forEach(field => {
        if (!body[field]) {
            缺少的字段.push(field);
        }
    });
    return 缺少的字段;
}

function 清除文件计算缓存(userId){
    // const userId = req.auth.id; // 假设用户ID已经通过身份验证获得
    const cacheKey = `userSpaceTotalSize_${userId}`;
    delete cache[cacheKey]; // 删除缓存
    // console.log(`Cache for user ${userId} cleared`);
}


// 文件上传和验证路由
router.post('/upload',upload.single('file'), async (req, res) => {
    try {
        const {fileName, fileContent, fileSize, fileSpace, fileModifiedTime, dir1, dir2, dir3 } = req.body;

        // 定义必要字段
        const 必要字段 = [ 'fileName', 'fileContent', 'fileSize', 'fileSpace', 'fileModifiedTime'];

        // 检查缺少的字段
        const 缺少的字段 = 检查必要字段(req.body, 必要字段);

        if (缺少的字段.length > 0) {
            console.log(req.body);
            // console.log({ error: '缺少必要的字段', 缺少的字段 });
            return res.status(400).json({ error: '缺少必要的字段', 缺少的字段 });
        }

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (fileSize > MAX_FILE_SIZE) {
            // console.log("文件过大");
            return res.status(400).json({ error: '文件过大' });
        }
        // 验证文件扩展名是否为 .SC2Bank
        if (!fileName.endsWith('.SC2Bank')) {
            // console.log({ error: '无效的文件格式。只允许 .SC2Bank 文件。' });
            return res.status(400).json({ error: '无效的文件格式。只允许 .SC2Bank 文件。' });
        }

        // 计算文件内容的哈希值
        const hash = crypto.createHash('sha256').update(fileContent).digest('hex');


        // // 将 Base64 编码的文件内容解码为二进制数据
        // // const fileBuffer = Buffer.from(fileContent, 'base64');

        // // 创建新的 CloudSave 文档
        // const newCloudSave = new CloudSave({
        //     fileContent: fileContent,
        //     contentType: 'application/octet-stream', // 根据需要调整
        //     user: req.auth.id,
        //     directory: { dir1, dir2, dir3 },
        //     fileName: fileName,
        //     fileSize: fileSize,
        //     fileSpace: fileSpace,
        //     fileModifiedTime: new Date(fileModifiedTime)
        // });

        // // 保存到数据库
        // await newCloudSave.save();
        // res.json({ message: '文件上传并成功保存' });
        // 检查SaveFiles集合中是否已经存在这个哈希值
        const existingSaveFile = await SaveFiles.findOne({ hash: hash });
        var newCloudSave
        if (existingSaveFile) {
            // 如果存在，增加count字段
            await SaveFiles.updateOne({ _id: existingSaveFile._id }, {
                $inc: { count: 1 } // 将count增加1
            });
            // 直接使用已有的链接
            newCloudSave = new CloudSave({
                fileContent: existingSaveFile._id, // 保存SaveFiles文档的ID作为链接
                contentType: 'application/octet-stream', // 根据需要调整
                user: req.auth.id,
                directory: { dir1, dir2, dir3 },
                fileName: fileName,
                fileSize: fileSize,
                fileSpace: fileSpace,
                fileModifiedTime: new Date(fileModifiedTime)
            });

            // 保存到数据库
            await newCloudSave.save();
        } else {
            // 如果不存在，先保存文件内容到SaveFiles集合
            const newSaveFile = new SaveFiles({
                hash: hash,
                fileContent: fileContent, // 保存文件内容或路径
                user: req.auth.id,
                fileName: fileName,
                count:1,
                fileSize:fileSize
            });

            await newSaveFile.save();

            // 然后创建CloudSave文档
            newCloudSave = new CloudSave({
                fileContent: newSaveFile._id, // 保存SaveFiles文档的ID作为链接
                contentType: 'application/octet-stream', // 根据需要调整
                user: req.auth.id,
                directory: { dir1, dir2, dir3 },
                fileName: fileName,
                fileSize: fileSize,
                fileSpace: fileSpace,
                fileModifiedTime: new Date(fileModifiedTime)
            });

            // 保存到数据库
            await newCloudSave.save();
            
        }
        清除文件计算缓存(req.auth.id)
        // 如果指定了 CloudPackageId，将其添加到 CloudPackage 的子列表中
        var cloudPackageId = req.body.cloudPackageId
        console.log(cloudPackageId)
        if (cloudPackageId) {
            await CloudPackage.findByIdAndUpdate(cloudPackageId, {
                $push: { cloudSaves: newCloudSave._id }
            }, { new: true });
        }
        res.json({ message: '文件上传并成功保存' });


    } catch (err) {
        // console.log({ error: '保存文件到数据库时出错' });
        res.status(500).json({ error: '保存文件到数据库时出错' ,err:err.message});
    }
});

// 获取用户所有的 CloudSaves
router.get('/all', async (req, res) => {
    try {
        const userId = req.auth.id; // 从 token 中获取用户ID

        // 查找用户的所有 CloudSaves
        const cloudSaves = await CloudSave.find({ user: userId }).lean();

        // 将 CloudSave 文档的数组转换为 SaveFiles 文档的 ID 数组
        const saveFileIds = cloudSaves.map(cs => new mongoose.Types.ObjectId(cs.fileContent));

        // 查找所有对应的 SaveFiles 文档
        const saveFiles = await SaveFiles.find({ _id: { $in: saveFileIds } }).lean();

        // 将 SaveFiles 文档的信息添加到 CloudSaves 结果中
        const detailedCloudSaves = cloudSaves.map(cs => {
            const saveFile = saveFiles.find(sf => sf._id.toString() === cs.fileContent);
            return {
                ...cs,
                fileContentDetails: saveFile // 包含文件的详细信息
            };
        });

        res.json(detailedCloudSaves);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '获取 CloudSaves 时出错', details: err.message });
    }
});

// // 删除指定ID的 CloudSave
// router.delete('/delete/:id', async (req, res) => {
//     try {
//         const cloudSaveId = req.params.id; // 从请求参数中获取 CloudSave ID
//         const userId = req.auth.id; // 从 token 中获取用户ID

//         // 查找并删除指定ID的 CloudSave
//         const result = await CloudSave.findOneAndDelete({ _id: cloudSaveId, user: userId });

//         if (result) {
//             res.status(200).json({ message: 'CloudSave 删除成功' }); // 返回200状态码表示成功
//         } else {
//             res.status(404).json({ error: '未找到指定的 CloudSave' }); // 返回404状态码表示未找到
//         }
//     } catch (err) {
//         res.status(500).json({ error: '删除 CloudSave 时出错' }); // 返回500状态码表示服务器错误
//     }
// });

// 删除指定ID的 CloudSave 以及更新 SaveFile 计数
router.delete('/:cloudSaveId', async (req, res) => {
    try {
        const { cloudSaveId } = req.params; // 从 URL 参数中获取 cloudSaveId
        const userId = req.auth.id; // 从 token 中获取用户ID

        // 查找对应的 CloudSave 文档
        const cloudSave = await CloudSave.findById(cloudSaveId);

        // 检查 CloudSave 是否存在以及用户是否有权限删除
        if (!cloudSave || cloudSave.user.toString() !== userId) {
            return res.status(404).json({ error: '未找到对应的 CloudSave 或者您没有权限删除' });
        }

        // 查找对应的 SaveFile 文档
        const saveFile = await SaveFiles.findById(cloudSave.fileContent);

        // 检查 SaveFile 是否存在
        if (!saveFile) {
            return res.status(404).json({ error: '未找到对应的 SaveFile' });
        }

        // 更新 SaveFile 的计数
        await SaveFiles.updateOne({ _id: saveFile._id }, {
            $inc: { count: -1 } // 将 count 减少 1
        });

        // 如果 SaveFile 计数小于 1，则删除 SaveFile
        if (saveFile.count <= 1) {
            await SaveFiles.findByIdAndDelete(saveFile._id);
        }

        // 删除 CloudSave 文档
        await CloudSave.findByIdAndDelete(cloudSaveId);

        // 如果 CloudSave 被包含在任何 CloudPackage 中，将其移出数组
        await CloudPackage.updateMany({ 'cloudSaves': cloudSaveId }, {
            $pull: { 'cloudSaves': cloudSaveId }
        });

        res.json({ message: 'CloudSave 已删除，SaveFile 计数已更新，CloudPackage 已更新' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '删除 CloudSave 时出错', details: err.message });
    }
});

// 用户空间路由，获取用户所有cloudSave的总大小
router.get('/space', async (req, res) => {
    try {
        const userId = req.auth.id; // 假设用户ID已经通过身份验证获得
        const cacheKey = `userSpaceTotalSize_${userId}`;
        var 结果 = { totalSize: 0,玩家上限:8888000}
        // 检查缓存中是否有现有的总大小数据
        if (cache[cacheKey]) {
            结果.totalSize = cache[cacheKey]
            // console.log("已缓存:",cache[cacheKey]);
            return res.json(结果);
        }

        // 查询数据库获取用户所有cloudSave记录
        const cloudSaves = await CloudSave.find({ user: userId });

        // 计算总大小
        结果.totalSize = 0
        for (const cloudSave of cloudSaves) {
            // const saveFile = await SaveFiles.findById(cloudSave.fileContent);
            // if (saveFile) {
                结果.totalSize += cloudSave.fileSize; // 假设文件大小存储在SaveFiles集合的fileSize字段
            // }
        }

        // 将结果缓存24小时（86400秒）
        cache[cacheKey] = 结果.totalSize;
        setCacheExpire(cacheKey, 86400 * 1000);

        // 返回总大小
        res.json(结果);
    } catch (err) {
        res.status(500).json({ error: '获取用户空间总大小时出错' });
    }
});


// 用户文件路由，获取用户所有cloudSave的总数量
router.get('/amount', async (req, res) => {
    try {
        const userId = req.auth.id; // 假设用户ID已经通过身份验证获得
        // const cacheKey = `userSpaceTotalSize_${userId}`;


        // 查询数据库获取用户所有cloudSave记录
        const cloudSaves = await CloudSave.find({ user: userId });

        // 返回总数量
        res.json({ 总数量: cloudSaves.length ,玩家上限:8000});
    } catch (err) {
        res.status(500).json({ error: '获取用户文件总数量时出错' });
    }
});


module.exports = router;
