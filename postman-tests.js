const http = require('http');
const auth = Buffer.from('meloi:123456').toString('base64');

function req(method, path, data = null) {
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
    const request = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ statusCode: res.statusCode, body });
        }
      });
    });
    request.on('error', reject);
    if (data) request.write(JSON.stringify(data));
    request.end();
  });
}

(async () => {
  console.log('=== TEST 1: Built-in desc validator ===');
  const test1 = await req('POST', '/api/v1/products', {name:'Long',price:500,category:'Test',description:'.'.repeat(55),seller:'Test'});
  console.log('EXPECTED 400:', test1);

  console.log('\\n=== TEST 2: Custom discount validator ===');
  const test2 = await req('POST', '/api/v1/products', {name:'Bad',price:500,priceDiscount:600,category:'Test',description:'ok',seller:'Test'});
  console.log('EXPECTED 400:', test2);

  console.log('\\n=== TEST 5: Query mid GET all no premium ===');
  const getAll = await req('GET', '/api/v1/products');
  console.log('EXPECTED results<20:', getAll.body);

  console.log('\\n=== TEST 6: Agg pipeline ===');
  const agg = await req('GET', '/api/v1/products/product-category');
  console.log('EXPECTED 5 categories:', agg.body);

  console.log('\\n=== DONE - Screenshot console for prof ===');
})();

