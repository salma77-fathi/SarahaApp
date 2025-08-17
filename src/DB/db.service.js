
export const findOne = async ({ model, filter = {}, select = "" } = {}) => {
  return await model.findOne(filter).select(select);
};
export const create = async ({
  model,
  data = [{}],
  options = { ValidateBeforeSave: true },
} = {}) => {
  return await model.create(data, options);
};
export const findById = async ({ model, id, select = "" } = {}) => {
  return await model.findById(id).select(select);
};
export const updateOne = async ({
  model,
  filter = {},
  data = {},
  options = { runValidators: true },
} = {}) => {
  return model.updateOne(filter, data, options);
};
export const findOneAndUpdate = async ({
  model,
  filter = {},
  data = {},
  select = "",
  populate = [],
  options = { runValidators: true, new: true },
} = {}) => {
  return model
    .findOneAndUpdate(filter, data, options)
    .select(select)
    .populate(populate);
};

export const deleteOne = async ({ model, filter = {} } = {}) => {
  return model.deleteOne(filter);
};

export const deleteMany = async ({ model, filter = {} } = {}) => {
  return model.deleteMany(filter);
};