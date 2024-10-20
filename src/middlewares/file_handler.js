const multer = require("multer");

const fileStorageEngine = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, file?.originalname);
  },
});

const fileFilter = (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported"), false);
    }
};

module.exports = {
  upload: multer({
    storage: fileStorageEngine,
    fileFilter: fileFilter,
  }),
};
