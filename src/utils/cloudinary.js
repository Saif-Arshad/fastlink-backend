const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUDNAIRY_CLOUD_NAME,
    api_key: process.env.CLOUDNAIRY_API_KEY,
    api_secret: process.env.CLOUDNAIRY_API_SECRET

})


module.exports = cloudinary;
