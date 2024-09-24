// routes/signin.js
const express = require('express');
const router = express.Router();
const SigninRecord = require('../models/signinRecord');

// 用户签到路由
router.get('/new', async (req, res) => {
  const userId = req.auth.id; // 从请求中获取用户 ID

  // 获取当前时间，并设置为 UTC 时间的开始
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 将时间设置为当天的开始（本地时间）
  const beijingOffset = 8 * 60; // 北京时间偏移量，单位为分钟
  today.setMinutes(today.getMinutes() - (today.getTimezoneOffset() + beijingOffset));

  try {
    // 检查用户今天是否已经签到
    const existingRecord = await SigninRecord.findOne({
      user: userId,
      signinDate: { $gte: today }
    });
    if (existingRecord) {
      return res.status(400).json({ message: '你今天已经签到过了' });
    }

    // 创建新的签到记录
    const newRecord = new SigninRecord({
      user: userId,
      signinDate: today
    });
    await newRecord.save();

    res.json({ message: '签到成功', record: newRecord });
  } catch (err) {
    console.error('签到失败:', err);
    res.status(500).json({ error: '签到失败', details: err.message });
  }
});

// 获取用户签到记录
router.get('/all', async (req, res) => {
  const userId = req.auth.id; // 确保这里正确获取了用户 ID
  // console.log('获取签到记录的用户 ID:', userId); // 调试日志

  try {
    const records = await SigninRecord.find({ user: userId })
      .sort({ signinDate: -1 })
      .exec();

    // console.log('查询到的签到记录:', records); // 调试日志

    res.json({ 记录: records, 累计次数: records.length });
  } catch (err) {
    console.error('获取签到记录失败:', err); // 调试日志
    res.status(500).json({ error: '获取签到记录失败', details: err.message });
  }
});

module.exports = router;