const express = require('express');
const productController = require('./../controllers/productController');

const router = express.Router();

router.param('id', productController.checkID);

router
  .route('/product-category')
  .get(productController.getProductStats);

router
  .route('/top-3-cheap')
  .get(productController.aliasTopProducts, productController.getAllProducts);

router
  .route('/')
  .get(productController.getAllProducts)
  .post(productController.createProduct);

router
  .route('/:id')
  .get(productController.getProduct)
  .patch(productController.updateProduct)
  .delete(productController.deleteProduct);

module.exports = router;
