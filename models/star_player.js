const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  regionId: Number,
  realmId: Number,
  profileId: Number,
  profileGameId: Number,
  name: String,
  discriminator: Number,
  battleTag: String,
  avatar: String
});

const Profile = mongoose.model('starPlayer', profileSchema);

module.exports = Profile;