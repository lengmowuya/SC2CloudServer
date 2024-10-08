const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/sc2cloud')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Connection error:', err));

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('数据库连接成功');
});

module.exports = mongoose;
