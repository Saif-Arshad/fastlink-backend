
const cloudinary = require(".././utils/Cloudnairy")
const uploadFile = async (req, res) => {
    console.log("🚀 ~ uploadFile ~ req:", req.file)
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const file = req.files.file;

    try {
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            resource_type: "auto"
        });

        res.json({
            message: 'File uploaded successfully',
            url: result.secure_url
        });
    } catch (error) {
        console.log('Error:', error);
        res.status(500).json({
            message: 'Failed to upload file',
            error
        });
    }
};

module.exports = {
    uploadFile
};
