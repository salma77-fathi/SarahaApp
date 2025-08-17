import CryptoJS from "crypto-js";
export const generateEncrption = async ({
  plaintext = "",
  secretKey = process.env.ENC_SECRET,
} = {}) => {
  return CryptoJS.AES.encrypt(plaintext, secretKey).toString();
};
export const decrytEncrption = async ({
  ciphertext = "",
  secretKey = process.env.ENC_SECRET,
} = {}) => {
  return CryptoJS.AES.decrypt(ciphertext, secretKey).toString(
    CryptoJS.enc.Utf8
  );
};
