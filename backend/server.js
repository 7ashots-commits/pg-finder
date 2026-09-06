console.log('🔄 server.js starting...');

const express = require('express');
console.log('✅ express imported');

const cors = require('cors');
console.log('✅ cors imported');

require('dotenv').config();
console.log('✅ dotenv loaded');

const supabase = require('./db');
console.log('✅ supabase imported');

const multer = require('multer');
console.log('✅ multer imported');

const upload = multer({ storage: multer.memoryStorage() });
console.log('✅ multer storage configured');

const app = express();
console.log('✅ express app created');

// MIDDLEWARE
app.use(cors({
  origin: '*',
  credentials: true
}));
console.log('✅ CORS middleware added');

app.use(express.json());
console.log('✅ express.json middleware added');

console.log('🔄 Adding routes...');

// TEST ROUTE
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});
console.log('✅ /api/test route added');

// GET ALL PROPERTIES
app.get('/api/properties', async (req, res) => {
  try {
    const { location, minPrice, maxPrice } = req.query;
    let query = supabase.from('properties').select('*');
    if (location) query = query.ilike('location', `%${location}%`);
    if (minPrice) query = query.gte('price', parseInt(minPrice));
    if (maxPrice) query = query.lte('price', parseInt(maxPrice));
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
console.log('✅ /api/properties routes added');

// ADD PROPERTY
app.post('/api/properties', async (req, res) => {
  try {
    const { data, error } = await supabase.from('properties').insert([req.body]).select();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE PROPERTY
app.put('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('properties').update(req.body).eq('id', id).select();
    if (error) throw error;
    res.json({ message: 'Updated', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE PROPERTY
app.delete('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('properties').delete().eq('id', id).select();
    if (error) throw error;
    res.json({ message: 'Deleted', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
console.log('✅ Property CRUD routes added');

// IMAGE UPLOAD
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📸 Upload request received');
    console.log('File:', req.file ? 'YES' : 'NO');
    console.log('File name:', req.file?.originalname);
    console.log('File size:', req.file?.size);
    
    if (!req.file) {
      console.error('❌ No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('🔄 Preparing upload to Supabase...');
    const fileName = `${Date.now()}-${req.file.originalname}`;
    console.log('📝 File name:', fileName);
    
    console.log('🔄 Uploading to Supabase Storage...');
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(fileName, req.file.buffer, { 
        contentType: req.file.mimetype,
        upsert: false 
      });
    
    if (error) {
      console.error('❌ Supabase Storage error:', error);
      throw error;
    }
    
    console.log('✅ File uploaded to Supabase');
    console.log('📍 Uploaded data:', data);
    
    console.log('🔄 Getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);
    
    console.log('✅ Public URL:', publicUrl);
    
    res.json({ 
      url: publicUrl,
      message: 'Image uploaded successfully',
      fileName: fileName 
    });
    
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ 
      error: err.message,
      details: err.toString()
    });
  }
});
console.log('✅ /api/upload route added');

// SIGNUP
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, userType, phone } = req.body;
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;
    const { data, error } = await supabase.from('users').insert([{ id: authData.user.id, email, name, user_type: userType, phone }]).select();
    if (error) throw error;
    res.json({ message: 'Signup successful', user: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: userData } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    res.json({ message: 'Login successful', user: userData, session: data.session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
console.log('✅ Auth routes added');

// GET CURRENT USER
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    const { data: userData } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    res.json({ user: userData });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// GET FAVORITES
app.get('/api/favorites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase.from('favorites').select('property_id, properties(*)').eq('user_id', userId);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD TO FAVORITES
app.post('/api/favorites/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { userId } = req.body;
    const { data, error } = await supabase.from('favorites').insert([{ user_id: userId, property_id: propertyId }]).select();
    if (error) throw error;
    res.json({ message: 'Added to favorites', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REMOVE FROM FAVORITES
app.delete('/api/favorites/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { userId } = req.body;
    const { data, error } = await supabase.from('favorites').delete().eq('user_id', userId).eq('property_id', propertyId).select();
    if (error) throw error;
    res.json({ message: 'Removed from favorites', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
console.log('✅ Favorites routes added');

console.log('🔄 Starting server...');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});