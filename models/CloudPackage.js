const mongoose = require('mongoose');

// 假设 CloudSave 模型已经定义并导出
// const CloudSave = require('./CloudSaves'); // 请替换为 CloudSave 模型的实际路径

const cloudPackageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        // required: true,
        default:''
    },
    cloudSaves: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CloudSave'
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    isOver:{
        type:Boolean,
        default:false
    },
    autoUploadType:{
        type:Boolean,
        default:true
    }
});

// 使用 pre 钩子来自动更新 updatedAt 字段
cloudPackageSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const CloudPackage = mongoose.model('CloudPackage', cloudPackageSchema);

module.exports = CloudPackage;