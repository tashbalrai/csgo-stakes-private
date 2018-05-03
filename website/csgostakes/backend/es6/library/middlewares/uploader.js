const multer = require('multer');
const uuid = require('uuid');
const path = require('path');
var fs = require("fs-extra");


import config from './../../config/config.js';

module.exports = (dirName) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = path.resolve(__dirname, '../../../../uploads', dirName);
      fs.ensureDirSync(dir);
      cb(null, dir);
    },

    filename: function (req, file, cb) {
      cb(null, uuid() + path.extname(file.originalname));
    }
  });
  return multer({
    storage: storage,
    fileFilter (req, file, cb) {
      if(file.mimetype.includes('image/')) {
        cb(null, file);
      } else {
        cb(new Error('File must be an image'));
      }
    },
    limits: {
      files: 1,
      fileSize: 1024 * 1024 * 5 //5mb
    }
  });
};