require('dotenv').config();
const path = require('path');
const express = require('express');
const { db } = require('./firebase-admin');

const app = express();
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, '..', 'public');

app.use(express.json());
app.use(express.static(publicDir));

app.get('/api/checkouts', async (req, res) => {
  try {
    const country = req.query.country;
    let query = db.collection('checkouts');

    if (country) {
      query = query.where('country', '==', country);
    }

    const snapshot = await query.orderBy('timestamp', 'desc').get();

    if (snapshot.empty) {
      return res.json([]);
    }

    const checkouts = [];
    snapshot.forEach((doc) => {
      checkouts.push({ id: doc.id, ...doc.data() });
    });

    return res.json(checkouts);
  } catch (error) {
    console.error('Error getting checkouts:', error);
    return res.status(500).json({ message: 'Failed to fetch checkouts' });
  }
});

app.get('/api/checkouts/by-country/:country', async (req, res) => {
  try {
    const country = req.params.country;
    const snapshot = await db.collection('checkouts')
      .where('country', '==', country)
      .orderBy('timestamp', 'desc')
      .get();

    if (snapshot.empty) {
      return res.json([]);
    }

    const checkouts = [];
    snapshot.forEach((doc) => {
      checkouts.push({ id: doc.id, ...doc.data() });
    });

    return res.json(checkouts);
  } catch (error) {
    console.error('Error getting checkouts by country:', error);
    return res.status(500).json({ message: 'Failed to fetch checkouts by country' });
  }
});

app.get('/api/checkouts/:id', async (req, res) => {
  try {
    const doc = await db.collection('checkouts').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Checkout not found' });
    }
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error getting checkout:', error);
    return res.status(500).json({ message: 'Failed to fetch checkout' });
  }
});

app.delete('/api/checkouts/:id', async (req, res) => {
  try {
    const ref = db.collection('checkouts').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Checkout not found' });
    }

    await ref.delete();
    return res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('Error deleting checkout:', error);
    return res.status(500).json({ message: 'Failed to delete checkout' });
  }
});

app.patch('/api/checkouts/:id/paid', async (req, res) => {
  try {
    const { paid } = req.body;
    const ref = db.collection('checkouts').doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Checkout not found' });
    }

    await ref.update({ paid: Boolean(paid) });
    const updated = await ref.get();
    return res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('Error updating paid status:', error);
    return res.status(500).json({ message: 'Failed to update paid status' });
  }
});

const mapProductDoc = (doc) => ({ id: doc.id, ...doc.data() });

const getAllProducts = async () => {
  const snapshot = await db.collection('products').get();
  return snapshot.docs.map(mapProductDoc);
};

app.get('/api/products', async (req, res) => {
  try {
    const products = await getAllProducts();
    return res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Error getting products:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
});

app.get('/api/products/meta/categories', async (req, res) => {
  try {
    const products = await getAllProducts();
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    return res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
  }
});

app.get('/api/products/meta/sizes', async (req, res) => {
  try {
    const products = await getAllProducts();
    const sizes = [...new Set(products.map(p => p.size).filter(Boolean))];
    return res.json({ success: true, count: sizes.length, data: sizes });
  } catch (error) {
    console.error('Error getting sizes:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch sizes', error: error.message });
  }
});

app.get('/api/products/meta/colors', async (req, res) => {
  try {
    const products = await getAllProducts();
    const colors = [...new Set(products.map(p => p.color).filter(Boolean))];
    return res.json({ success: true, count: colors.length, data: colors });
  } catch (error) {
    console.error('Error getting colors:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch colors', error: error.message });
  }
});

app.get('/api/products/stats/all', async (req, res) => {
  try {
    const products = await getAllProducts();
    const totalProducts = products.length;
    const categories = {};
    const sizes = {};
    const colors = {};
    let min = null;
    let max = null;
    let sum = 0;
    let count = 0;

    products.forEach((product) => {
      if (product.category) categories[product.category] = (categories[product.category] || 0) + 1;
      if (product.size) sizes[product.size] = (sizes[product.size] || 0) + 1;
      if (product.color) colors[product.color] = (colors[product.color] || 0) + 1;

      const price = Number(product.price);
      if (!Number.isNaN(price)) {
        min = min === null ? price : Math.min(min, price);
        max = max === null ? price : Math.max(max, price);
        sum += price;
        count += 1;
      }
    });

    const average = count ? sum / count : 0;

    return res.json({
      success: true,
      data: {
        totalProducts,
        categories,
        sizes,
        colors,
        priceRange: { min, max, average }
      }
    });
  } catch (error) {
    console.error('Error getting product stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch product stats', error: error.message });
  }
});

app.get('/api/products/debug/all', async (req, res) => {
  try {
    const products = await getAllProducts();
    products.forEach((product, index) => {
      console.log(`--- Product ${index + 1} ---`, product);
    });
    return res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Error debugging products:', error);
    return res.status(500).json({ success: false, message: 'Failed to debug products', error: error.message });
  }
});

app.get('/api/products/category/:category', async (req, res) => {
  try {
    const snapshot = await db.collection('products')
      .where('category', '==', req.params.category)
      .get();
    const products = snapshot.docs.map(mapProductDoc);
    return res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Error getting products by category:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products by category', error: error.message });
  }
});

app.get('/api/products/size/:size', async (req, res) => {
  try {
    const snapshot = await db.collection('products')
      .where('size', '==', req.params.size)
      .get();
    const products = snapshot.docs.map(mapProductDoc);
    return res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Error getting products by size:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products by size', error: error.message });
  }
});

app.get('/api/products/color/:color', async (req, res) => {
  try {
    const snapshot = await db.collection('products')
      .where('color', '==', req.params.color)
      .get();
    const products = snapshot.docs.map(mapProductDoc);
    return res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Error getting products by color:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products by color', error: error.message });
  }
});

app.get('/api/products/price/:min/:max', async (req, res) => {
  try {
    const min = Number(req.params.min);
    const max = Number(req.params.max);
    const snapshot = await db.collection('products')
      .where('price', '>=', min)
      .where('price', '<=', max)
      .orderBy('price', 'asc')
      .get();
    const products = snapshot.docs.map(mapProductDoc);
    return res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Error getting products by price:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products by price', error: error.message });
  }
});

app.get('/api/products/search/:term', async (req, res) => {
  try {
    const term = req.params.term.toLowerCase();
    const products = await getAllProducts();
    const filtered = products.filter((product) => {
      const name = (product.name || '').toLowerCase();
      const description = (product.description || '').toLowerCase();
      return name.includes(term) || description.includes(term);
    });
    return res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    console.error('Error searching products:', error);
    return res.status(500).json({ success: false, message: 'Failed to search products', error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const doc = await db.collection('products').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, data: mapProductDoc(doc) });
  } catch (error) {
    console.error('Error getting product:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch product', error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const data = req.body;
    const docRef = await db.collection('products').add(data);
    const created = await docRef.get();
    return res.status(201).json({ success: true, message: 'Product created successfully', data: mapProductDoc(created) });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const ref = db.collection('products').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await ref.update(req.body);
    const updated = await ref.get();
    return res.json({ success: true, message: 'Product updated successfully', data: mapProductDoc(updated) });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const ref = db.collection('products').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await ref.delete();
    return res.json({ success: true, message: 'Product deleted successfully', data: { success: true, id: req.params.id } });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
