import multer from "multer";
//here we use multer to upload the files from frontend to backend
export const fileValidators = {
  image: ["image/png", "image/jpeg", "image/gif"],
  document: ["application/pdf", "application/msword"],
};
export function cloudFileUpload({ fileValidation = [], maxSizeMB = 2 } = {}) {
  const fileFilter = (req, file, callback) => {
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
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  }); //substitute for uploads folder
}
