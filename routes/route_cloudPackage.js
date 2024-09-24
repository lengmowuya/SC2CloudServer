const mongoose = require('./../db');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const CloudPackage  = require('./../models/CloudPackage');
const CloudSave = require('./../models/CloudSaves');
// const authenticateToken = require('./../middlewares/authenticateToken'); // 引入验证 token 的中间件
// const crypto = require('crypto');
// const SaveFiles = require('./../models/SaveFiles'); // 引入你的模型

// 设置Multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });




// 验证输入数据
// const validateCloudPackageInput = [
//     body('name', '名称不能为空').not().isEmpty(),
//     body('cloudSaves', '云保存列表不能为空').isArray({ min: 1 })
//   ];
  
  // 新增 CloudPackage 路由
  router.post('/add', async (req, res) => {
    try {
      // 验证请求数据
      // const errors = validationResult(req);
      // if (!errors.isEmpty()) {
      //   return res.status(400).json({ errors: errors.array() });
      // }
      let owner = req.auth.id
      // 从请求中提取数据
      const { name, description,autoUploadType } = req.body;

        // 根据 autoUploadType 确定是自动上传还是手动上传
      let baseName;
      if (autoUploadType) {
        // 查询数据库获取当前自动上传类型的已有数量
        const autoUploadCount = await CloudPackage.countDocuments({ owner, autoUploadType:true });
        baseName = `自动上传${autoUploadType}${autoUploadCount + 1}`;
      } else {
        // 查询数据库获取当前手动上传的已有数量
        const manualUploadCount = await CloudPackage.countDocuments({ owner, autoUploadType: false });
        baseName = `手动上传${manualUploadCount + 1}`;
      }
  
      // 创建一个新的 CloudPackage 实例
      const newCloudPackage = new CloudPackage({
        name: baseName,
        description,
        cloudSaves:[],
        owner,
        autoUploadType
      });
  
      // 保存 CloudPackage 实例
      const savedCloudPackage = await newCloudPackage.save();
  
      // 返回成功响应
      res.status(201).json(savedCloudPackage);
    } catch (error) {
      // 处理错误
      res.status(500).json({ message: error.message });
    }
  });
  
  module.exports = router;

// 获取用户所有的 CloudPackages
router.get('/all', async (req, res) => {
  try {
      const userId = req.auth.id; // 从 token 中获取用户ID

      console.log(userId)
      // 查找用户的所有 CloudPackages
      const cloudPackages = await CloudPackage.find({ owner: userId }).lean();

      // 提取所有 cloudSaves 的 ID
      const cloudSaveIds = cloudPackages.flatMap(cp => cp.cloudSaves);

      // 查找所有对应的 CloudSave 文档
      const cloudSavesDetails = await CloudSave.find({ _id: { $in: cloudSaveIds } }).lean();

      // 创建一个映射，以便快速查找 CloudSave 文档
      const cloudSavesMap = new Map(cloudSavesDetails.map(cs => [cs._id.toString(), cs]));

      // 将 CloudSave 文档的详细数据添加到 CloudPackages 结果中
      const detailedCloudPackages = cloudPackages.map(cp => {
          return {
              ...cp,
              cloudSaves: cp.cloudSaves.map(cloudSaveId => {
                  const cloudSaveDetail = cloudSavesMap.get(cloudSaveId.toString());
                  return cloudSaveDetail || { _id: cloudSaveId, error: 'CloudSave not found' };
              })
          };
      });

      res.json(detailedCloudPackages);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: '获取 CloudPackages 时出错', details: err.message });
  }
});

// 删除指定ID的 cloudPackage
router.delete('/delete/:id', async (req, res) => {
    try {
        const cloudSaveId = req.params.id; // 从请求参数中获取 CloudSave ID
        const userId = req.auth.id; // 从 token 中获取用户ID

        // 查找并删除指定ID的 CloudSave
        const result = await CloudSave.findOneAndDelete({ _id: cloudSaveId, user: userId });

        if (result) {
            res.status(200).json({ message: 'CloudSave 删除成功' }); // 返回200状态码表示成功
        } else {
            res.status(404).json({ error: '未找到指定的 CloudSave' }); // 返回404状态码表示未找到
        }
    } catch (err) {
        res.status(500).json({ error: '删除 CloudSave 时出错' }); // 返回500状态码表示服务器错误
    }
});

module.exports = router;
