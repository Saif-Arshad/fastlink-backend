// routes/productRoutes.js

const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { adminOnly } = require("../middlewares/admin");

const { verifyUserToken } = require('../middlewares/jwt')
// Create a new product
router.post("/", adminOnly, productController.createProduct);
router.post("/upload-images", adminOnly, productController.uploadImages);
// Get all 
router.get("/", productController.getProducts);


// table permisiion

router.post("/permission", adminOnly, productController.createTablePermission);
// Get a product by ID
router.get("/:id", productController.getProductById);
router.get("/table/name", productController.getTableNames);

// Update a product by ID
router.put("/:id", productController.updateProduct);

// Delete a product by ID
router.delete("/:id", adminOnly, productController.deleteProduct);
router.delete("/table/:id", adminOnly, productController.deleteTable);

module.exports = router;