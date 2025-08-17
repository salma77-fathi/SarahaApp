import mongoose from "mongoose";
const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      minLength: 2,
      maxLength: 20000,
      required: function () {
        return this.attachment?.length ? false : true; // Content is required if there are no attachments
      },
    },
    attachments: [
      {
        secure_url: String,
        public_id: String,
      },
    ],
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);
export const MessageModel =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
