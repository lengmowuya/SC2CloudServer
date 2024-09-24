const mongoose = require('./../../db');
const express = require('express');
const router = express.Router();
const axios = require('axios');
const StarMap = require('./../../models/star_map');
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
// 你的其他路由...

router.get('/map/:id', async (req, res) => {
    try {
        // 尝试从数据库中获取地图数据，通过 bnetId 查找
        let mapFromDb = await StarMap.findOne({ bnetId: req.params.id }).exec();
        if (mapFromDb) {
            // 如果地图数据在数据库中存在，检查图片是否已缓存
            if (!mapFromDb.hasCachedImage) {
                // 如果图片未缓存，调用上传图片函数
                await uploadImageIfNotExists(mapFromDb.iconHash);
                // 更新地图数据，标记图片已缓存
                mapFromDb.hasCachedImage = true;
                await mapFromDb.save();
            }
            res.json(mapFromDb);
        } else {
            // 如果数据库中没有数据，从远程API获取
            const response = await axios.get(`https://api.sc2arcade.com/maps/3/${req.params.id}`);
            if (response.status !== 200) {
                // 如果API请求失败，返回错误信息
                return res.status(500).send('Failed to fetch map data');
            }
            const mapData = response.data;

            // 将获取的数据缓存到数据库
            const newMap = new StarMap(mapData);
            await newMap.save();

            // 上传图片
            await uploadImageIfNotExists(newMap.iconHash);

            // 返回缓存的数据
            res.json(newMap);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});

// 上传图片的函数
async function uploadImageIfNotExists(iconHash) {
    const bucketName = 'mapCover'; // 你的存储桶名称
    const objectName = `${iconHash}.jpg`; // 对象名称
    const imageUrl = `https://static.sc2arcade.com/dimg/${iconHash}.jpg?region=kr`; // 图片URL
    const tempFilePath = path.join(tempDir, objectName);
    // 检查对象存储中是否存在图片
    const params = {
        Bucket: bucketName,
        Key: objectName
    };

    try {
        const exists = await s3.headObject(params).promise();
        console.log('Image already exists in object storage.');
    } catch (err) {
        if (err.statusCode === 404) {
            // 图片不存在，下载并上传图片
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
                    ACL: 'public-read', // 设置为公共读取，根据需要调整
                    ContentType: 'image/jpeg' // 设置正确的Content-Type
                };

                s3.upload(uploadParams, (err, data) => {
                    if (err) {
                        console.error('Error uploading image:', err);
                    } else {
                        console.log('Image uploaded successfully:', data.Location);
                    }
                    // 删除临时文件
                    fs.unlink(tempFilePath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error('Error deleting temporary file:', unlinkErr);
                        } else {
                            console.log('Temporary file deleted:', tempFilePath);
                        }
                    });
                });
            });

            writeStream.on('error', (err) => {
                console.error('Error writing image to disk:', err);
                // 删除临时文件
                fs.unlink(tempFilePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting temporary file:', unlinkErr);
                    } else {
                        console.log('Temporary file deleted:', tempFilePath);
                    }
                });
            });
        } else {
            console.error('Error checking object:', err);
        }
    }
}
// 重新上传所有地图图片的函数
async function reuploadAllImages() {
    try {
        // 查找所有地图记录
        const maps = await StarMap.find({}).exec();
        for (const map of maps) {
            console.log(`Processing map with bnetId: ${map.bnetId}`);
            await uploadImageIfNotExists(map.iconHash, map);
        }
    } catch (error) {
        console.error('Error reuploading images:', error);
    }
}
// 运行脚本
// reuploadAllImages();
module.exports = router;