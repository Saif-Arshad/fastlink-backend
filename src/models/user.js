const { mongoose } = require("../../config/database");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      validate: {
        validator: function (v) {
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    full_name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    profileImage: {
      type: String,
      required: false,
      default: "https://res.cloudinary.com/di6r722sv/image/upload/v1730553017/6596121_f1dn2l.png",
    },
    type: {
      type: String,
      enum: ["admin", "employee"],
      required: true,
      default: "employee",
    },
    tasks: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: false,
    },
    timeSchedule: [
      {
        sign_in: {
          type: Date,
          required: false,
        },
        sign_out: {
          type: Date,
          required: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const UserTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);
const UserToken = mongoose.model("UserToken", UserTokenSchema);

module.exports = { User, UserToken };
