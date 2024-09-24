// 缓存星际玩家数据

const express = require('express');
const router = express.Router();
const axios = require('axios');
const Player = require('../../models/star_player'); // 确保路径与实际模型文件位置匹配
const Avatar = require('../../models/star_avatar'); // 确保路径与实际模型文件位置匹配
const fs = require('fs-extra');
const AWS = require('aws-sdk');
const path = require('path');


// 配置AWS SDK
const s3 = new AWS.S3({
    accessKeyId: '96pXaJWIiBlRv5mf',
    secretAccessKey: '5GtaHBCeYIrDnJiZU56FHvMdeckC9u',
    endpoint: 'https://cn-sy1.rains3.com/sc2cloudsave', // 对象存储服务的endpoint
    s3ForcePathStyle: true, // 如果你的服务不是AWS S3，可能需要设置为true
    // 其他配置...
});

// 确保临时目录存在
const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(tempDir);

// 获取用户资料的路由
router.get('/:regionId/:realmId/:profileId', async (req, res) => {
    try {
        // 尝试从数据库中获取玩家资料
        let playerFromDb = await Player.findOne({ profileId: req.params.profileId }).exec();
        if (!playerFromDb) {
            // 如果数据库中没有玩家数据，从远程API获取
            const response = await axios.get(`https://api.sc2arcade.com/profiles/${req.params.regionId}/${req.params.realmId}/${req.params.profileId}`);
            if (response.status !== 200) {
                return res.status(500).send('Failed to fetch profile data');
            }
            playerFromDb = new Player(response.data);
            await playerFromDb.save();
        }

        // 尝试从数据库中获取头像信息
        let avatarFromDb = await Avatar.findOne({ avatar: playerFromDb.avatar }).exec();
        if (avatarFromDb && avatarFromDb.avatarUrl) {
            // 如果头像信息已存在且上传成功，更新玩家资料中的头像URL
            // playerFromDb.avatarUrl = avatarFromDb.avatarUrl;
            res.json(playerFromDb);
        } else {
            // 如果头像信息不存在或未上传成功，上传头像
            try {
                await uploadAvatar(playerFromDb.avatar);
                // 保存头像信息到数据库
                const newAvatar = new Avatar({
                    avatar: playerFromDb.avatar,
                    avatarUrl: `https://cn-sy1.rains3.com/sc2cloudsave/playerAvatars/${playerFromDb.avatar}.png`
                });
                await newAvatar.save();
                // 更新玩家资料中的头像URL
                // playerFromDb.avatarUrl = newAvatar.avatarUrl;
                // await playerFromDb.save();
                res.json(playerFromDb);
            } catch (error) {
                console.error('Error uploading avatar:', error);
                res.status(500).send('Failed to upload avatar');
            }
        }
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('An error occurred');
    }
});


// 上传头像的函数
async function uploadAvatar(avatar) {
    const bucketName = 'playerAvatars'; // 你的存储桶名称
    const objectName = `${avatar}.png`; // 对象名称
    const tempFilePath = path.join(tempDir, objectName);
    const imageUrl = `https://static.sc2arcade.com/media/portraits/${avatar}.png`;  // 头像URL

    // 检查对象存储中是否存在头像
    const params = {
        Bucket: bucketName,
        Key: objectName
    };

    try {
        await s3.headObject({ Bucket: bucketName, Key: objectName }).promise();
        console.log('Avatar already exists in object storage.');
    } catch (err) {
        if (err.statusCode === 404) {
            // 头像不存在，下载并上传头像
            const writeStream = fs.createWriteStream(tempFilePath);
            const downloadResponse = await axios({
                method: 'get',
                url: imageUrl,
                responseType: 'stream'
            });
            downloadResponse.data.pipe(writeStream);

            writeStream.on('finish', () => {
                const uploadParams = {
                    Bucket: bucketName,
                    Key: objectName,
                    Body: fs.createReadStream(tempFilePath),
                    ACL: 'public-read',
                    ContentType: 'image/png'
                };

                s3.upload(uploadParams, (err, data) => {
                    if (err) {
                        throw new Error('Error uploading avatar');
                    }
                    console.log('Avatar uploaded successfully:', data.Location);
                    // 删除临时文件
                    fs.unlink(tempFilePath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error('Error deleting temporary file:', unlinkErr);
                        }
                    });
                });
            });

            writeStream.on('error', (err) => {
                throw new Error('Error writing avatar to disk');
            });
        } else {
            throw new Error('Error checking object in storage');
        }
    }
}

module.exports = router;