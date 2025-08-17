import bcrypt, { hash } from "bcryptjs";
export const generateHash = async ({
  plaintext = "",
  saltRound = process.env.SALTROUND,
} = {}) => {
  return bcrypt.hashSync(plaintext, parseInt(saltRound));
};
export const compareHash = async ({ plaintext = "", hashValue = "" } = {}) => {
  return bcrypt.compareSync(plaintext, hashValue);
};
