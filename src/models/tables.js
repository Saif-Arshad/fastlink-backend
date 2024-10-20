const mongoose = require('mongoose');

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
        productCollection: {
            type: String,
            required: true,
        },
        notes: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            enum: ["to-shoot", "shot", "images-ready", "approved", "changes-required"],
            // enum: ["draft", "media-added", "finalized", "changes-required"],
            required: true,
            default: "to-shoot",
        },
        images: [
            {
                originalName: { type: String, required: true },
                url: { type: String, required: true }
            }
        ],
    },
    {
        timestamps: true,
    }
);

const tableSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    permission: [],
    products: [productSchema]
});

const Table = mongoose.model('Table', tableSchema);
module.exports = { Table };

