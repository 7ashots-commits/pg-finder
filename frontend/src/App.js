import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import Signup from './Signup';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showSignup, setShowSignup] = useState(false);
  const [properties, setProperties] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchLocation, setSearchLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    rooms: '',
    bathrooms: '',
    amenities: '',
    phone: '',
    email: '',
    images: []
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
      fetchProperties();
    }
  }, []);

 useEffect(() => {
  const loadFavorites = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/favorites/${currentUser.id}`);
      const data = await response.json();
      setFavorites(data.map(fav => fav.property_id));
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };
  
  if (currentUser) {
    loadFavorites();
  }
}, [currentUser]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signup') === 'true') {
      setShowSignup(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchProperties = async (location = '', min = '', max = '') => {
    try {
      let url = 'http://localhost:5000/api/properties';
      const params = new URLSearchParams();
      if (location) params.append('location', location);
      if (min) params.append('minPrice', min);
      if (max) params.append('maxPrice', max);
      if (params.toString()) url += '?' + params.toString();
      const response = await fetch(url);
      const data = await response.json();
      setProperties(data);
    } catch (err) {
      console.error('Error fetching:', err);
    }
  };
  const fetchFavorites = async () => { 
    try {
      const response = await fetch(`http://localhost:5000/api/favorites/${currentUser.id}`);
      const data = await response.json();
      setFavorites(data.map(fav => fav.property_id));
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  const toggleFavorite = async (propertyId) => {
    try {
      const isFavorited = favorites.includes(propertyId);
      
      if (isFavorited) {
        await fetch(`http://localhost:5000/api/favorites/${propertyId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id })
        });
        setFavorites(favorites.filter(id => id !== propertyId));
      } else {
        await fetch(`http://localhost:5000/api/favorites/${propertyId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id })
        });
        setFavorites([...favorites, propertyId]);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setProperties([]);
    setFavorites([]);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProperties(searchLocation, minPrice, maxPrice);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      await response.json();
      fetchProperties();
      setFormData({ title: '', description: '', price: '', location: '', rooms: '', bathrooms: '', amenities: '', phone: '', email: '', images: [] });
      alert('Property added!');
    } catch (err) {
      console.error('Error:', err);
      alert('Error adding property');
    }
  };

  const handleEditClick = (property) => {
    setFormData(property);
    setEditingId(property.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:5000/api/properties/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      fetchProperties(searchLocation, minPrice, maxPrice);
      setEditingId(null);
      setFormData({ title: '', description: '', price: '', location: '', rooms: '', bathrooms: '', amenities: '', phone: '', email: '', images: [] });
      alert('Property updated!');
    } catch (err) {
      console.error('Error:', err);
      alert('Error updating property');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Kya aap sure ho delete karna hai?')) {
      try {
        await fetch(`http://localhost:5000/api/properties/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        fetchProperties(searchLocation, minPrice, maxPrice);
        alert('Property deleted!');
      } catch (err) {
        console.error('Error:', err);
        alert('Error deleting property');
      }
    }
  };

  if (!currentUser) {
    return showSignup ? (
      <Signup onSignupSuccess={() => setShowSignup(false)} />
    ) : (
      <Login onLoginSuccess={setCurrentUser} />
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#333' }}>🏠 PG Finder</h1>
        <div>
          <p style={{ marginRight: '20px', display: 'inline' }}>Welcome, <strong>{currentUser.name}</strong> ({currentUser.user_type})</p>
          <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
        </div>
      </div>

      <div style={{ backgroundColor: '#e8f4f8', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ color: '#333' }}>🔍 Search Properties</h2>
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <input type="text" placeholder="Search Location..." value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
          <input type="number" placeholder="Min Price (₹)" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
          <input type="number" placeholder="Max Price (₹)" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
          <button type="submit" style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Search</button>
          <button type="button" onClick={() => { setSearchLocation(''); setMinPrice(''); setMaxPrice(''); fetchProperties(); }} style={{ padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Clear</button>
        </form>
      </div>

      {currentUser.user_type === 'landlord' && (
        <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
          <h2 style={{ color: '#333' }}>{editingId ? '✏️ Edit Property' : 'Add Property'}</h2>
          <form onSubmit={editingId ? handleUpdate : handleSubmit}>
            <input type="text" name="title" placeholder="Property Title" value={formData.title} onChange={handleChange} required style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px' }}></textarea>
            <input type="number" name="price" placeholder="Price (₹)" value={formData.price} onChange={handleChange} required style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} required style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="number" name="rooms" placeholder="Number of Rooms" value={formData.rooms} onChange={handleChange} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="number" name="bathrooms" placeholder="Number of Bathrooms" value={formData.bathrooms} onChange={handleChange} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="text" name="amenities" placeholder="Amenities (WiFi, AC, Parking)" value={formData.amenities} onChange={handleChange} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: editingId ? '#ffc107' : '#007bff', color: editingId ? 'black' : 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>{editingId ? '✏️ Update Property' : 'Add Property'}</button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setFormData({ title: '', description: '', price: '', location: '', rooms: '', bathrooms: '', amenities: '', phone: '', email: '', images: [] }); }} style={{ width: '100%', padding: '12px', marginTop: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel Edit</button>
            )}
          </form>
        </div>
      )}

      <h2 style={{ color: '#333' }}>All Properties ({properties.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {properties && properties.map((property) => (
          <div key={property.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'relative' }}>
            
            {currentUser.user_type === 'tenant' && (
              <button
                onClick={() => toggleFavorite(property.id)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: '0'
                }}
              >
                {favorites.includes(property.id) ? '❤️' : '🤍'}
              </button>
            )}

            <h3 style={{ color: '#333' }}>{property.title}</h3>
            <p><strong>Price:</strong> ₹{property.price}</p>
            <p><strong>Location:</strong> {property.location}</p>
            <p><strong>Rooms:</strong> {property.rooms}</p>
            <p><strong>Bathrooms:</strong> {property.bathrooms}</p>
            <p><strong>Amenities:</strong> {property.amenities}</p>
            <p><strong>Phone:</strong> {property.phone}</p>
            <p><strong>Email:</strong> {property.email}</p>
            {currentUser.user_type === 'landlord' && (
              <>
                <button onClick={() => handleEditClick(property)} style={{ width: '100%', padding: '8px', marginTop: '10px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '5px' }}>✏️ Edit Property</button>
                <button onClick={() => handleDelete(property.id)} style={{ width: '100%', padding: '8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Delete Property</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;