import path from "node:path";
import fs from "node:fs";
import multer from "multer";
//here we use multer to upload the files from frontend to backend
export const fileValidators = {
  image: ["image/png", "image/jpeg", "image/gif"],
  document: ["application/pdf", "application/msword"],
};
export function localFileUpload({
  customPath = "general",
  fileValidation = [],
  maxSizeMB = 2,
} = {}) {
  let basePath = `uploads/${customPath}`;
  let fullPath = path.resolve(`./src/${basePath}`);
  const storage = multer.diskStorage({
    //where i want to store the file
    destination: function (req, file, callback) {
      //make sure the user login
      if (req.user?._id) {
        basePath += `/${req.user._id.toString()}`;
        fullPath = path.resolve(`./src/${basePath}`);
      }
      //if the path does not exist, create it
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      callback(null, path.resolve(fullPath));
    },
    //what the file name will be
    filename: function (req, file, callback) {
      console.log({ file });
      const uniqueFileName =
        Date.now() + "_" + Math.random() + "_" + file.originalname;
      // here we made finalPath to store it in DB from uploads
      file.finalPath = basePath + "/" + uniqueFileName;
      callback(null, uniqueFileName);
    },
  });
  //here the validation of file type
  const fileFilter = (req, file, callback) => {
    console.log({ fileFilter: file });
    console.log({
      fileValidation,
      currentFile: file.mimetype,
      result: fileValidation.includes(file.mimetype),
    });

    if (!fileValidation.includes(file.mimetype)) {
      return callback("Invalid file format", false);
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return callback("file too large", false);
    }
    callback(null, true);
  };
  return multer({
    dest: "temp",
    fileFilter,
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  }); //substitute for uploads folder
}
