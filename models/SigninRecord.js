// models/SigninRecord.js
const mongoose = require('mongoose');

const signinRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  signinDate: {
    type: Date,
    default: Date.now
  }
});

const SigninRecord = mongoose.model('SigninRecord', signinRecordSchema);

module.exports = SigninRecord;