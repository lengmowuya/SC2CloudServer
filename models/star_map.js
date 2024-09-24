const mongoose = require('mongoose');

const mapSchema = new mongoose.Schema({
  id: Number,
  regionId: Number,
  bnetId: Number,
  type: String,
  availableLocales: Number,
  mainLocale: { type: String, required: true },
  mainLocaleHash: String,
  iconHash: String,
  thumbnailHash: String,
  name: { type: String, required: true },
  description: { type: String, required: true },
  website: String,
  mainCategoryId: Number,
  maxPlayers: Number,
  maxHumanPlayers: Number,
  updatedAt: { type: Date, required: true },
  publishedAt: { type: Date, required: true },
  userReviewsCount: Number,
  userReviewsRating: Number,
  removed: { type: Boolean, default: false },
    //  已缓存封面图片
   hasCachedImage: { type: Boolean, default: false },
  currentVersion: {
    id: Number,
    majorVersion: Number,
    minorVersion: Number,
    isPrivate: { type: Boolean, default: false },
    archiveSize: Number,
    uploadedAt: { type: Date, required: true }
  },
  author: {
    regionId: Number,
    realmId: Number,
    profileId: Number,
    name: { type: String, required: true },
    discriminator: Number,
    avatar: String
  }
});

const MapModel = mongoose.model('starMap', mapSchema);

module.exports = MapModel;