import React, { useState, useEffect, useCallback } from 'react';

function Favorites({ currentUser, onBack, BACKEND_URL }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchFavorites();
    }
  }, [currentUser]);

  const fetchFavorites = useCallback(async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/favorites/${currentUser.id}`);
    const data = await response.json();
    setFavorites(data);
    setLoading(false);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    setLoading(false);
  }
}, [currentUser.id, BACKEND_URL]);
    }
  };

  const removeFavorite = async (propertyId) => {
    try {
      await fetch(`${BACKEND_URL}/api/favorites/${propertyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      setFavorites(favorites.filter(fav => fav.property_id !== propertyId));
      alert('Removed from favorites!');
    } catch (err) {
      console.error('Error:', err);
      alert('Error removing favorite');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#333' }}>❤️ My Favorites</h1>
        <button onClick={onBack} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>← Back to Home</button>
      </div>

      {/* Loading State */}
      {loading && <p style={{ textAlign: 'center', fontSize: '18px', color: '#666' }}>Loading favorites...</p>}

      {/* Empty State */}
      {!loading && favorites.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
          <p style={{ fontSize: '20px', color: '#999' }}>No favorites yet! 🤍</p>
          <p style={{ color: '#666' }}>Add properties to favorites from the home page.</p>
        </div>
      )}

      {/* Favorites Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {favorites && favorites.map((fav) => {
          const property = fav.properties;
          return (
            <div key={fav.property_id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'relative' }}>
              
              {/* Image */}
              {property.images && property.images.length > 0 && (
                <div style={{ marginBottom: '10px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f0f0f0', height: '200px' }}>
                  <img src={property.images[0]} alt="Property" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {/* Favorite Button */}
              <button onClick={() => removeFavorite(fav.property_id)} style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'transparent', border: 'none', fontSize: '28px', cursor: 'pointer', padding: '0' }}>❤️</button>

              {/* Details */}
              <h3 style={{ color: '#333' }}>{property.title}</h3>
              <p><strong>Price:</strong> ₹{property.price}</p>
              <p><strong>Location:</strong> {property.location}</p>
              <p><strong>Rooms:</strong> {property.rooms}</p>
              <p><strong>Bathrooms:</strong> {property.bathrooms}</p>
              <p><strong>Amenities:</strong> {property.amenities}</p>
              <p><strong>Phone:</strong> {property.phone}</p>
              <p><strong>Email:</strong> {property.email}</p>

              {/* Remove Button */}
              <button onClick={() => removeFavorite(fav.property_id)} style={{ width: '100%', padding: '8px', marginTop: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Remove from Favorites</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Favorites;