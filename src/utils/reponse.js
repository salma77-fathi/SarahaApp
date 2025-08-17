export const asyncHandler = (fun) => {
  return async (req, res, next) => {
    await fun(req, res, next).catch((error) => {
      return next(error, { cause: 500 });
    });
  };
};
export const globalErorrHandling = (error, req, res, next) => {
  return res
    .status(error.cause || 400)
    .json({
      message: error.message,
      stack: process.env.MOOD === "DEV" ? error.stack : undefined,
    });
};

export const successResponse = ({
  res,
  message = "Done",
  status = 200,
  data = {},
} = {}) => {
  return res.status(status).json({ message, data });
};
