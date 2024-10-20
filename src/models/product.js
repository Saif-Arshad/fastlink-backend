const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        productCode: {
            type: String,
            required: true,
        },
        productName: {
            type: String,
            required: true,
        },
        styleCode: {
            type: String,
            required: true,
        },
        colorCode: {
            type: String,
            required: true,
        },
        colorDescription: {
            type: String,
            required: true,
        },
        collection: {
            type: String,
            required: true,
        },
        notes: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["to-shoot", "shot", "images-ready", "approved", "changes-required"],
            // enum: ["draft", "media-added", "finalized", "changes-required"],
            required: true,
            default: "to-shoot",
        },

    },
    {
        timestamps: true,
    }
);

const Product = mongoose.model("Product", productSchema);

module.exports = { Product };