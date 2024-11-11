const cloudinary = require(".././utils/Cloudnairy");

const uploadFile = async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const file = req.files.file;
    console.log("🚀 ~ uploadFile ~ file:", file)

    try {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const isDocument = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'].includes(fileExtension);

        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            resource_type: isDocument ? "raw" : "auto"  // Use "raw" for documents, "auto" for others
        });

        res.json({
            message: 'File uploaded successfully',
            url:
            {
                name: file.name,
                url: result.secure_url
            }

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
