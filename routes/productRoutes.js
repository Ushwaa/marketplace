const express = require('express');
const productController = require('./../controllers/productController');
const catchAsync = require('./../utils/catchAsync');

const router = express.Router();

// This handles Requirement: router.param()
router.param('id', productController.checkID);

router
  .route('/product-category')
  .get(catchAsync(productController.getProductStats));

router
  .route('/top-3-cheap')
.get(productController.aliasTopProducts, catchAsync(productController.getAllProducts));

router
  .route('/')
  .get(catchAsync(productController.getAllProducts))
.post(catchAsync(productController.createProduct));

router
  .route('/:id')
  .get(catchAsync(productController.getProduct))
  .patch(catchAsync(productController.updateProduct))
  .delete(catchAsync(productController.deleteProduct));

module.exports = router;