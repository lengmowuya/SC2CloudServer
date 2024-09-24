const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema({
    // ... 其他字段
        // ... 其他字段
        profileId: Number,
        avatar: String,
        avatarUrl: { type: String, default: '' } // 存储头像URL的字段
});

const Avatar = mongoose.model("playerAvatar", avatarSchema);

module.exports = Avatar;