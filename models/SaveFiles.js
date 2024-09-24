// 实际链接的文件
const mongoose = require('mongoose');

const saveFileSchema = new mongoose.Schema({
    fileName: {
        type: String, // 可以是文件存储路径或URL
        required: true
    },
    fileContent: {
        type: String, // 可以是文件存储路径或URL
        required: true
    },
    hash: {
        type: String,
        required: true,
        unique: true
      },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' ,required: true},
    fileSize: {
        type: Number, // 可以是文件存储路径或URL
        required: true
    },
    count: {
        type: Number, // 可以是文件存储路径或URL
        required: true
    },
    

});

const SaveFile = mongoose.model('SaveFile', saveFileSchema);

module.exports = SaveFile;