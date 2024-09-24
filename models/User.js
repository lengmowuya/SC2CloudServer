const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  Email: String,
  Password: String,
  CreateTime: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;