
const mongoose = require('mongoose');

const cloudSaveSchema = new mongoose.Schema({
    fileContent: { type: mongoose.Schema.Types.ObjectId, ref: 'SaveFile' },
    contentType: { type: String, default: 'SC2Bank' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    directory: {
        dir1: String,
        dir2: String,
        dir3: String
    },
    fileName: String,
    fileSize: Number,
    fileSpace: Number,
    fileModifiedTime: Date,
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const CloudSave = mongoose.model('CloudSave', cloudSaveSchema);

module.exports = CloudSave;