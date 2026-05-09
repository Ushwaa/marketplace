const http = require('http');
const auth = Buffer.from('meloi:123456').toString('base64');

function req(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + auth
      }
    };

    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: body ? JSON.parse(body) : null });
      });
    });

    req.on('error', reject);

    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  // Test 3: Built-in validator - long description >50 chars
  console.log('TEST 3: Built-in validator - long desc');
  const invalidDesc = await req('POST', '/api/v1/products', { name: 'Test Long Desc', price: 500, category: 'Test', description: 'This description is way longer than 50 characters it should fail validation because maxlength is 50 characters exactly or something like this to test.'.slice(0,55), seller: 'Test' });
  console.log('Expected 400:', invalidDesc);

  // Test 3: Custom validator - discount >= price
  console.log('TEST 3: Custom validator - invalid discount');
  const invalidDiscount = await req('POST', '/api/v1/products', { name: 'Test Invalid Discount', price: 500, priceDiscount: 600, category: 'Test', description: 'Short desc', seller: 'Test' });
  console.log('Expected 400:', invalidDiscount);

  // Test 4/5/6: Create valid, check virtual daysPosted, productSlug, excludes premium
  console.log('TEST 4/5/6: Create valid product (check virtual, slug, no premium)');
  const validCreate = await req('POST', '/api/v1/products', { name: 'Test Product Slug Test', price: 400, category: 'Test', description: 'Valid short desc', seller: 'Test Seller' });
  console.log('Valid create:', validCreate);
  const productId = validCreate.body.data.product._id;

  // Get single to check virtual/slug
  const getSingle = await req('GET', '/api/v1/products/' + productId);
  console.log('Single product - check daysPosted virtual & productSlug:', getSingle.body.data.product);

  // Get all - check excludes premium=true
  const getAll = await req('GET', '/api/v1/products');
  console.log('All products (should exclude premium=true):', getAll.body.results, 'products');

  // Test 7: Product category aggregation
  console.log('TEST 7: /product-category aggregation (price<1000, group, stats, sort avg)');
  const categoryStats = await req('GET', '/api/v1/products/product-category');
  console.log('Category stats:', categoryStats.body.data.stats);

  // Cleanup
  await req('DELETE', '/api/v1/products/' + productId);
  console.log('Cleanup done');
})();
