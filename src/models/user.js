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
    signature: {
      type: String,
      required: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    type: {
      type: String,
      enum: ["admin", "employee"],
      required: true,
      default: "employee",
    },
  },
  {
    timestamps: true,
  }
);

const userTokenSchema = new mongoose.Schema(
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
const UserToken = mongoose.model("UserToken", userTokenSchema);

module.exports = {};
module.exports = { User, UserToken };
