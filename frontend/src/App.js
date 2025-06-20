import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [products, setProducts] = useState([]);
  const [customerEmail, setCustomerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    type: 'lesson'
  });
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetchProducts();
    if (showAdmin) fetchPayments();
  }, [showAdmin]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products/`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${API_URL}/payments/`);
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const createProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;

    try {
      const response = await fetch(`${API_URL}/products/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price)
        }),
      });

      if (response.ok) {
        setNewProduct({ name: '', description: '', price: '', type: 'lesson' });
        fetchProducts();
      }
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handlePayment = async (productId) => {
    if (!customerEmail) {
      alert('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/create-checkout-session/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          customer_email: customerEmail
        }),
      });

      const { checkout_url } = await response.json();
      window.location.href = checkout_url;
    } catch (error) {
      console.error('Error:', error);
      alert('Payment failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Language Learning Platform</h1>

      <button
        onClick={() => setShowAdmin(!showAdmin)}
        style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}
      >
        {showAdmin ? 'Hide Admin' : 'Show Admin Panel'}
      </button>

      {showAdmin && (
        <div style={{ border: '2px solid #ddd', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
          <h3>Admin: Create Product/Course</h3>
          <form onSubmit={createProduct}>
            <input
              type="text"
              placeholder="Product name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <textarea
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              style={{ width: '100%', padding: '8px', marginBottom: '10px', height: '60px' }}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price (USD)"
              value={newProduct.price}
              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
              style={{ width: '150px', padding: '8px', marginBottom: '10px', marginRight: '10px' }}
            />
            <select
              value={newProduct.type}
              onChange={(e) => setNewProduct({...newProduct, type: e.target.value})}
              style={{ padding: '8px', marginBottom: '10px' }}
            >
              <option value="lesson">Single Lesson</option>
              <option value="course">Full Course</option>
            </select>
            <br />
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
              Create Product
            </button>
          </form>

          <h3 style={{marginTop: '30px'}}>Recent Payments</h3>
          {payments.length === 0 ? (
            <p>No payments yet</p>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} style={{
                border: '1px solid #ddd',
                padding: '10px',
                marginBottom: '10px',
                borderRadius: '4px',
                backgroundColor: payment.status === 'completed' ? '#e8f5e8' : '#fff3cd'
              }}>
                <strong>Status:</strong> {payment.status} |
                <strong> Amount:</strong> ${payment.amount} |
                <strong> Email:</strong> {payment.customer_email} |
                <strong> Date:</strong> {new Date(payment.created_at).toLocaleString()}
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <input
          type="email"
          placeholder="Your email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          style={{ width: '300px', padding: '10px', marginRight: '10px' }}
        />
      </div>

      <div>
        <h2>Available Courses & Lessons</h2>
        {products.length === 0 ? (
          <p>No products available</p>
        ) : (
          products.map((product) => (
            <div key={product.id} style={{
              border: '1px solid #ccc',
              padding: '20px',
              marginBottom: '15px',
              borderRadius: '8px'
            }}>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p><strong>Type:</strong> {product.type}</p>
              <p><strong>Price:</strong> ${product.price}</p>
              <button
                onClick={() => handlePayment(product.id)}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
