// controllers/productController.js

const { Table } = require("../models/tables");
const { User } = require("../models/user");
const cloudinary = require('../utils/cloudinary');
const formidable = require('formidable');


// Create a new product
exports.createProduct = async (req, res) => {
    const data = await req.body;
    const tableName = data.tableName;
    const Products = data.products;
    const tableId = data.tableId;
    if (tableId) {
        console.log("🚀 ~ exports.createProduct= ~ tableId:", tableId)
        try {
            const table = await Table.findById(tableId);
            console.log("🚀 ~ exports.createProduct= ~ table:", table)
            if (!table) {
                return res.status(404).json({
                    success: false,
                    message: "Table not found.",
                });
            }
            table.products.push(...Products);
            const updatedTable = await table.save();
            return res.status(201).json({
                success: true,
                message: `Table '${table.tableName}' created and ${Products.length} products added successfully.`,
                data: table,
            });
        } catch (error) {
            console.log("🚀 ~ exports.createProduct= ~ error:", error)
            return res.status(500).json({
                success: false,
                message: "An error occurred while adding products to the table.",
                error: error.message,
            });
        }

    }
    else {

        try {
            let table = await Table.findOne({ name: tableName });

            if (!table) {
                table = new Table({
                    name: tableName,
                    products: Products
                });
                await table.save();

                return res.status(201).json({
                    success: true,
                    message: `Table '${tableName}' created and ${Products.length} products added successfully.`,
                    data: table,
                });
            }

            table.products.push(...Products);
            const updatedTable = await table.save();

            return res.status(201).json({
                success: true,
                message: `${Products.length} products added to table '${tableName}' successfully.`,
                data: updatedTable,
            });

        } catch (error) {
            // Error handling
            console.error("Error adding products to table:", error);
            return res.status(500).json({
                success: false,
                message: "An error occurred while adding products to the table.",
                error: error.message,
            });
        }
    }
};

// table permission API

exports.createTablePermission = async (req, res) => {
    const { tableId, Ids } = req.body;

    try {
        const table = await Table.findOne({ _id: tableId });

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Table not found.",
            });
        }

        table.permission = Ids;

        await table.save();

        return res.status(201).json({
            success: true,
            message: "Users added to table permission successfully.",
            data: table,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "An error occurred while adding users to table permission.",
            error: error.message,
        });
    }
};

// Get all table names and IDs
exports.getTableNames = async (req, res) => {
    console.log(req.user);

    try {
        const user = await User.findById(req.user.id);
        console.log("🚀 ~ exports.getTableNames= ~ user:", user);

        let tables;

        if (user.type !== "admin") {
            const allTables = await Table.find({}, '_id name permission');
            console.log("🚀 ~ exports.getTableNames= ~ allTables:", allTables)

            tables = allTables.filter(table => table.permission.includes(user._id));
        } else {
            // Admin gets all tables
            tables = await Table.find({}, '_id name');
        }

        console.log("🚀 ~ exports.getTableNames= ~ tables:", tables);

        return res.status(200).json({
            success: true,
            message: "Table names and IDs retrieved successfully.",
            data: tables,
        });

    } catch (error) {
        console.error("🚀 ~ exports.getTableNames= ~ error:", error);

        // Return an error response if something goes wrong
        return res.status(500).json({
            success: false,
            message: "An error occurred while retrieving table names and IDs.",
            error: error.message,
        });
    }
};





// Get all products
exports.getProducts = async (req, res) => {

    try {
        const user = await User.findById(req.user.id);
        console.log("🚀 ~ exports.getProducts= ~ user:", user);
        // console.log("🚀 ~ exports.getProducts= ~ searchQuery:", searchQuery)
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const tableId = req.query.tableId;
        const currentTable = req.query.currentTable;
        console.log("🚀 ~ exports.getProducts= ~ currentTable:", currentTable)
        const calculateStatusCounts = (products) => {
            const statusCounts = products.reduce((acc, product) => {
                const status = product.status;
                if (status) {
                    acc[status] = (acc[status] || 0) + 1;
                }
                return acc;
            }, {});
            return statusCounts;
        };
        let tables;

        if (currentTable) {
            tables = await Table.findById(currentTable);

            if (!tables) {
                return res.status(404).json({
                    success: false,
                    message: `Table with ID ${currentTable} not found`,
                });
            }

            if (user.type !== 'admin' && !tables.permission.includes(user._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this table',
                });
            }

            tables = [tables];
        } else {
            if (user.type === 'admin') {
                tables = await Table.find();
            } else {
                tables = await Table.find({ permission: { $in: [user._id] } });
            }
        }

        if (tables.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No tables found based on your permissions',
            });
        }

        const tablesWithPaginatedProducts = tables.map(table => {
            // Default pagination for all tables
            const defaultLimit = 10;
            const defaultPage = 1;

            // Determine the pagination parameters for the current table
            const useCustomPagination = tableId === String(table._id);
            const appliedLimit = useCustomPagination ? limit : defaultLimit;
            const appliedPage = useCustomPagination ? page : defaultPage;

            const totalItems = table.products.length;
            const totalPages = Math.ceil(totalItems / appliedLimit);

            const startIndex = (appliedPage - 1) * appliedLimit;
            const endIndex = startIndex + appliedLimit;

            const paginatedProducts = table.products.slice().reverse().slice(startIndex, endIndex);

            const pageItems = paginatedProducts.length;
            const statusCounts = calculateStatusCounts(table.products);
            return {
                _id: table._id,
                name: table.name,
                permission: table.permission,
                products: paginatedProducts,
                totalProducts: totalItems,
                statusCounts,
                meta: {
                    currentPage: appliedPage,
                    pageItems: pageItems,
                    totalItems: totalItems,
                    totalPages: totalPages,
                },
            };
        });

        // Return the response with paginated tables and products
        return res.status(200).json({
            success: true,
            message: "Tables with paginated products fetched successfully",
            data: tablesWithPaginatedProducts,
        });

    } catch (error) {
        console.error("Error fetching tables with products:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch tables with products",
            error: error.message,
        });
    }
};


exports.uploadImages = async (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to parse form data.' });
        }

        try {
            const { tableId, productId, existingImages } = fields;

            let parsedExistingImages = [];
            try {
                parsedExistingImages = existingImages ? JSON.parse(existingImages) : [];
            } catch (parseError) {
                console.error('Error parsing existing images:', parseError);
                parsedExistingImages = [];
            }

            const images = files.newImages;

            // Validate input data
            if (!tableId || !productId) {
                return res.status(400).json({
                    success: false,
                    message: 'Table ID and Product ID are required.',
                });
            }

            const uploadedImages = [];

            if (images) {
                const imageFiles = Array.isArray(images) ? images : [images];

                for (const image of imageFiles) {
                    const result = await cloudinary.uploader.upload(image.filepath, {
                        folder: 'user',
                        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
                    });

                    uploadedImages.push({
                        originalName: image.originalFilename || 'unknown', 
                        url: result.secure_url
                    });
                }
            }

            const allImages = [...parsedExistingImages, ...uploadedImages].filter(image => image !== '[]');

            const table = await Table.findById(tableId);
            const product = table.products.id(productId);
            product.status = "images-ready";
            product.images = allImages;
            await table.save();

            return res.status(200).json({
                success: true,
                message: 'Images uploaded and updated successfully.',
                data: product.images,
            });
        } catch (error) {
            console.error('Error uploading images:', error);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while uploading images.',
                error: error.message,
            });
        }
    });
};


// Get a single product by ID
exports.getProductById = async (req, res) => {
    const { id } = req.params;

    const productId = req.query.item;

    try {
        const table = await Table.findById(id);
        console.log("🚀 ~ exports.getProductById= ~ table:", table)

        if (!table) {
            return res.status(404).json({ status: 404, message: "Table not found" });
        }

        const product = table.products.find((product) => product._id.toString() === productId);

        if (!product) {
            return res.status(404).json({ status: 404, message: "Product not found in the specified table" });
        }

        return res.status(200).json({ status: 200, message: "Product found successfully", data: product });

    } catch (error) {
        return res.status(500).json({ status: 500, message: "Internal server error", error: error.message });
    }
};


// Update a product by ID
exports.updateProduct = async (req, res) => {
    const data = req.body;
    const productId = req.params.id;
    console.log(req.body)
    try {
        const table = await Table.findById(data.tableId);
        if (!table) {
            return res.status(404).json({ status: 404, message: "Table not found" });
        }
        const productIndex = table.products.findIndex((product) => product._id.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ status: 404, message: "Product not found in the specified table" });
        }
        table.products[productIndex] = data;
        await table.save();
        return res.status(200).json({ status: 200, message: "Product updated successfully in the table" });

    } catch (error) {
        return res.error(error);

    }
};

// Delete a product by ID
exports.deleteProduct = async (req, res) => {
    const id = req.params.id;
    const [productId, tableId] = id.split('-');


    try {
        const table = await Table.findById(tableId);
        if (!table) {
            return res.status(404).json({ status: 404, message: "Table not found" });
        }

        const productIndex = table.products.findIndex((product) => product._id.toString() === productId);
        console.log("🚀 ~ exports.deleteProduct ~ productIndex:", productIndex)
        if (productIndex === -1) {
            return res.status(404).json({ status: 404, message: "Product not found in the specified table" });
        }

        table.products.splice(productIndex, 1);

        await table.save();

        return res.status(200).json({ status: 200, message: "Product deleted successfully from the table" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: "Internal server error", error });
    }
    // try {
    //     const product = await Product.findByIdAndDelete(req.params.id);
    //     if (!product) {
    //         return res.error({ status: 404, message: "Product not found" });
    //     }
    //     return res.success({ message: "Product deleted successfully" });
    // } catch (error) {
    //     return res.error(error);
    // }
};
exports.deleteTable = async (req, res) => {
    try {
        const deletedTable = await Table.findByIdAndDelete(req.params.id);
        if (!deletedTable) {
            return res.error({ status: 404, message: "Table not found" });
        }
        return res.success({ message: "Table deleted successfully" });
    } catch (error) {
        console.log("🚀 ~ exports.deleteTable ~ error:", error)

        return res.error(error);
    }
};