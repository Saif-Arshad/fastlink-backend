const { mongoose } = require("../../config/database");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      // validate the email format
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
    type: {
      type: String,
      enum: ["admin", "user"],
      required: true,
      default: "user",
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
    timestamps: true, // This will add `createdAt` and `updatedAt` fields automatically
  }
);

const User = mongoose.model("User", UserSchema);
const UserToken = mongoose.model("UserToken", userTokenSchema);

module.exports = {};
module.exports = { User, UserToken };
