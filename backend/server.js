const express = require('express');
const cors = require('cors');
require('dotenv').config();
const supabase = require('./db');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Real estate property finder backend is running!' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

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

app.post('/api/properties', async (req, res) => {
  try {
    const { data, error } = await supabase.from('properties').insert([req.body]).select();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('properties').update(req.body).eq('id', id).select();
    if (error) throw error;
    res.json({ message: 'Property updated successfully', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('properties').delete().eq('id', id).select();
    if (error) throw error;
    res.json({ message: 'Property deleted successfully', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload image
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('=== UPLOAD REQUEST RECEIVED ===');
    console.log('File:', req.file?.originalname);
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
    
    if (!req.file) {
      console.log('NO FILE UPLOADED');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    console.log('Uploading as:', fileName);
    
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      console.log('SUPABASE UPLOAD ERROR:', error);
      throw error;
    }

    console.log('Upload successful:', data);

    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);

    console.log('Public URL:', publicUrl);
    console.log('=== UPLOAD COMPLETE ===');

    res.json({ url: publicUrl });
  } catch (err) {
    console.log('CATCH ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

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
// Add to favorites
app.post('/api/favorites/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { userId } = req.body;
    
    const { data, error } = await supabase
      .from('favorites')
      .insert([{ user_id: userId, property_id: propertyId }])
      .select();
    
    if (error) throw error;
    res.json({ message: 'Added to favorites', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove from favorites
app.delete('/api/favorites/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { userId } = req.body;
    
    const { data, error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('property_id', propertyId)
      .select();
    
    if (error) throw error;
    res.json({ message: 'Removed from favorites', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's favorites
app.get('/api/favorites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('favorites')
      .select('property_id, properties(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if property is favorited
app.get('/api/favorites/check/:propertyId/:userId', async (req, res) => {
  try {
    const { propertyId, userId } = req.params;
    
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('property_id', propertyId)
      .single();
    
    res.json({ isFavorited: !!data });
  } catch (err) {
    res.json({ isFavorited: false });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));