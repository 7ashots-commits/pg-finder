const express = require('express');
const cors = require('cors');
require('dotenv').config();
const supabase = require('./db');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const app = express();

// MIDDLEWARE - सही order में
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// TEST ROUTE
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// GET ALL PROPERTIES (with search/filter)
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

// IMAGE UPLOAD
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const { data, error } = await supabase.storage.from('property-images').upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(fileName);
    res.json({ url: publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// GET CURRENT USER
app.get('/api/auth/me', async (req, res) => {
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

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});