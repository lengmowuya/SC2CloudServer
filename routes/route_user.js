const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt'); // 用于密码加密
const User = require('./../models/User');
const jwt = require('jsonwebtoken'); // 用于生成JWT

// 注册用户
router.post('/register', [
    check('Email').isEmail().withMessage('请输入有效的邮箱地址'),
    check('Password').isLength({ min: 8 }).withMessage('密码长度至少为8个字符')
        .matches(/[a-zA-Z]/).withMessage('密码必须包含至少一个字母')
        .matches(/\d/).withMessage('密码必须包含至少一个数字')
  ], async (req, res) => {
    // 输出接收到的 JSON 数据
    // console.log('Received JSON:', req.body);
  
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }
  
    const { Email, Password } = req.body;
  
    try {
        // 检查邮箱是否已存在
        const existingUser = await User.findOne({ Email });
        if (existingUser) {
            // 邮箱已存在，重定向到登录路由
            return res.status(400).json({ error: '邮箱已经存在,请勿重复注册,请点击登录' });
        }
  
        // 加密密码
        const hashedPassword = await bcrypt.hash(Password, 10);
  
        const newUser = new User({ Email, Password : hashedPassword });
        await newUser.save();
        // console.log('User registered successfully:', newUser);
        res.json({ action: 'access', message: '注册成功' });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: '数据库错误' });
    }
  });
  
// 登录用户
router.post('/login', [
    check('Email').isEmail().withMessage('请输入有效的邮箱地址'),
    check('Password').notEmpty().withMessage('密码不能为空')
  ], async (req, res) => {
    // 输出接收到的 JSON 数据
    console.log('Received JSON:', req.body);
  
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }
  
    const { Email, Password } = req.body;
  
    try {
        // 查找用户
        const user = await User.findOne({ Email });
        if (!user) {
            return res.status(400).json({ error: '用户不存在' });
        }
  
        // 检查密码
        const isMatch = await bcrypt.compare(Password, user.Password);
        if (!isMatch) {
            return res.status(400).json({ error: '密码错误' });
        }
  
        // 生成JWT
        const token = jwt.sign({ id: user._id }, 'lengmowuya123456', { expiresIn: '30d' });
  
        // 登录成功，返回JWT和用户ID
        res.json({ action: 'access', message: '登录成功', token, userId: user._id });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: '数据库错误' });
    }
  });






module.exports = router;