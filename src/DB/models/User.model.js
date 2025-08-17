import mongoose, { Schema } from "mongoose";
export let genderEnum = { male: "male", female: "female" };
export let roleEnum = { user: "User", admin: "Admin" };
export let providerEnum = { system: "system", google: "google" };

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 20,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: function () {
        // console.log({ DOC: this });
        return this.provider === providerEnum.system ? true : false;
      },
    },
    gender: {
      type: String,
      enum: {
        values: Object.values(genderEnum),
        message: `gender only can take ${Object.values(genderEnum)}`,
      },
      default: genderEnum.male,
    },
    provider: {
      type: String,
      enum: Object.values(providerEnum),
      default: providerEnum.system,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(roleEnum),
        message: `role only can take ${Object.values(roleEnum)}`,
      },
      default: roleEnum.user,
    },
    oldPasswords: {
      type: [String],
    },
    phone: String,
    confirmEmail: Date,
    cover: [{ secure_url: String, public_id: String }],
    picture: { secure_url: String, public_id: String },
    confirmEmailOtp: {
      type: String,
      required: function () {
        // console.log({ DOC: this });
        return this.provider === providerEnum.system ? true : false;
      },
    },
    forgotCode: String,
    freezedAt: Date,
    freezedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changeLoginCredentials: Date,
    confirmEmailOtpCreatedAt: { type: Date },
    confirmEmailOtpExpires: { type: Date, required: false },
    confirmEmailOtpAttempt: { type: Number, default: 0 },
    confirmEmailOtpBlockedUntil: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toJSON: { virtuals: true } }
);
userSchema
  .virtual("fullName")
  .set(function (value) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName });
  })
  .get(function () {
    return this.firstName + " " + this.lastName;
  });
userSchema.virtual("messages", {
  localField: "_id",
  foreignField: "receiverId",
  ref: "Message",
});

export const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);
UserModel.syncIndexes();
