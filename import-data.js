const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const Product = require('./models/productModel');

// Load environment variables
dotenv.config({ path: `${__dirname}/config.env` });

// Connect to database
const DB = process.env.DATABASE_LOCAL;
mongoose
  .connect(DB)
  .then(() => console.log('DB connection successful'))
  .catch(err => {
    console.error('DB connection error:', err);
    process.exit(1);
  });

// Read products data
const data = fs.readFileSync(`${__dirname}/data/products.json`, 'utf-8');
const products = JSON.parse(data);

// Function to import data
const importData = async () => {
  try {
    // Clear existing data
    await Product.deleteMany({});
    console.log('Old data deleted');

    // Insert new data with hooks disabled
    const products_with_slugs = products.map(product => ({
      ...product,
      productSlug: (product.name || '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .toUpperCase()
    }));
    
    await Product.insertMany(products_with_slugs);
    console.log('Data successfully loaded');
    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

// Function to delete data
const deleteData = async () => {
  try {
    await Product.deleteMany({});
    console.log('Data successfully deleted');
    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
