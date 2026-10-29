
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BuyNow.css";

const readJSON = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function BuyNow({ product, onClose }) {
  const navigate = useNavigate();
  const user = readJSON("shopzone_user", null);

  const [quantity, setQuantity] = useState(1);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="buy-modal-backdrop">
        <div className="buy-modal">
          <button className="buy-close" onClick={onClose}>×</button>
          <h2>Please log in first</h2>
          <p>Login chesina tarvatha product order cheyyachu.</p>
          <button
            className="buy-primary"
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const price = Number(product.price || 0);
  const total = price * quantity;

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const confirmBooking = (event) => {
    event.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      setError("Valid 10-digit Indian mobile number enter cheyyi.");
      return;
    }

    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setError("Valid 6-digit pincode enter cheyyi.");
      return;
    }

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.address.trim() ||
      !form.city.trim()
    ) {
      setError("All customer details fill cheyyi.");
      return;
    }

    const order = {
      orderId: `SZ${Date.now().toString().slice(-10)}`,
      customerName: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      pincode: form.pincode.trim(),
      productId: product.id,
      productName: product.name || product.title || "Product",
      brand: product.brand || "ShopZone",
      image: product.image || "",
      price,
      quantity,
      total,
      status: "Confirmed",
      paymentMethod: "Cash on Delivery",
      createdAt: new Date().toISOString(),
    };

    const orders = readJSON("shopzone_orders", []);
    orders.unshift(order);
    localStorage.setItem("shopzone_orders", JSON.stringify(orders));

    setConfirmedOrder(order);
  };

  return (
    <div className="buy-modal-backdrop">
      <div className="buy-modal">
        <button
          className="buy-close"
          onClick={onClose}
          aria-label="Close booking"
        >
          ×
        </button>

        {confirmedOrder ? (
          <div className="buy-success">
            <div className="buy-success-icon">✓</div>
            <p className="buy-eyebrow">SHOPZONE ORDER</p>
            <h2>Booking Confirmed!</h2>
            <p className="buy-muted">
              Nee order successfully place ayyindi.
            </p>

            <div className="buy-order-number">
              <span>ORDER ID</span>
              <strong>{confirmedOrder.orderId}</strong>
            </div>

            <div className="buy-confirm-summary">
              <div>
                <span>Product</span>
                <strong>{confirmedOrder.productName}</strong>
              </div>
              <div>
                <span>Quantity</span>
                <strong>{confirmedOrder.quantity}</strong>
              </div>
              <div>
                <span>Total amount</span>
                <strong>{money(confirmedOrder.total)}</strong>
              </div>
              <div>
                <span>Payment</span>
                <strong>Cash on Delivery</strong>
              </div>
              <div>
                <span>Status</span>
                <strong className="buy-status">{confirmedOrder.status}</strong>
              </div>
            </div>

            <p className="buy-muted">
              Delivery address: {confirmedOrder.address}, {confirmedOrder.city} - {confirmedOrder.pincode}
            </p>

            <button className="buy-primary" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="buy-eyebrow">SHOPZONE CHECKOUT</p>
            <h2>Complete your order</h2>
            <p className="buy-muted">
              Delivery details enter chesi booking confirm cheyyi.
            </p>

            <div className="buy-product-summary">
              {product.image && (
                <img
                  src={
                    String(product.image).startsWith("http")
                      ? product.image
                      : `https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=200&q=80`
                  }
                  alt={product.name || product.title || "Product"}
                />
              )}
              <div>
                <strong>{product.name || product.title || "Product"}</strong>
                <span>{product.brand || "ShopZone"}</span>
                <b>{money(price)}</b>
              </div>
            </div>

            <form onSubmit={confirmBooking}>
              <div className="buy-form-grid">
                <label>
                  Full name
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    required
                    placeholder="Enter full name"
                  />
                </label>

                <label>
                  Email address
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateField}
                    required
                    placeholder="Enter email"
                  />
                </label>

                <label>
                  Mobile number
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={updateField}
                    required
                    maxLength={10}
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                  />
                </label>

                <label>
                  City
                  <input
                    name="city"
                    value={form.city}
                    onChange={updateField}
                    required
                    placeholder="Enter city"
                  />
                </label>

                <label className="buy-full-width">
                  Delivery address
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={updateField}
                    required
                    rows={2}
                    placeholder="House no, street, area"
                  />
                </label>

                <label>
                  Pincode
                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={updateField}
                    required
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="6-digit pincode"
                  />
                </label>

                <label>
                  Quantity
                  <select
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(Number(event.target.value))
                    }
                  >
                    {[1, 2, 3, 4, 5].map((number) => (
                      <option key={number} value={number}>
                        {number}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="buy-total-row">
                <span>Total amount</span>
                <strong>{money(total)}</strong>
              </div>

              <div className="buy-payment-note">
                Payment method: <strong>Cash on Delivery</strong>
              </div>

              {error && <p className="buy-error">{error}</p>}

              <button type="submit" className="buy-primary">
                Confirm Booking · {money(total)}
              </button>
              <button
                type="button"
                className="buy-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
