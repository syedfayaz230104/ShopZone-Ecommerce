
import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import "./App.css";
import "./BuyNow.css";
import productData from "./ShopZone_products.json";
import AdminDashboard from "./AdminDashboard";

const products = productData;

// Safely read saved data from browser localStorage.
const readLocal = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
};

const categories = [
  { name: "All", icon: "✦" },
  { name: "Men", icon: "♙" },
  { name: "Women", icon: "♧" },
  { name: "Electronics", icon: "⌁" },
  { name: "Shoes", icon: "◈" },
  { name: "Home", icon: "⌂" },
  { name: "Beauty", icon: "✧" },
  { name: "Accessories", icon: "◇" },
];

const heroSlides = [
  { eyebrow: "NEW COLLECTION / 2026", first: "Style for", second: "Every You.", copy: "Top Brands | Best Prices | Latest Trends", image: "photo-1515886657613-9f3515b0c78f", caption: "THE STYLE EDIT" },
  { eyebrow: "TECH THAT MOVES YOU", first: "Upgrade your", second: "Everyday.", copy: "Smart gadgets. Smarter prices. Only at ShopZone.", image: "photo-1519389950473-47ba0277781c", caption: "THE TECH EDIT" },
  { eyebrow: "MAKE IT YOURS", first: "Little things.", second: "Big style.", copy: "Fresh accessories and home finds you will love.", image: "photo-1490481651871-ab68de25d43d", caption: "THE EVERYDAY EDIT" },
];

const money = (n) => "₹" + n.toLocaleString("en-IN");

const image = (photo) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=650&q=85`;

function ShopHome() {
  // Each account gets its own cart and wishlist, keyed by normalized email.
  const [loggedInUser, setLoggedInUser] = useState(() => readLocal("shopzone_user", null));
  const userStorageKey = (type, user = loggedInUser) =>
    user?.email ? `shopzone_${type}_${user.email.trim().toLowerCase()}` : null;
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [wishlist, setWishlist] = useState(() => {
    const user = readLocal("shopzone_user", null);
    const key = user?.email ? `shopzone_wishlist_${user.email.trim().toLowerCase()}` : null;
    return key ? readLocal(key, []) : [];
  });
  const [cart, setCart] = useState(() => {
    const user = readLocal("shopzone_user", null);
    const key = user?.email ? `shopzone_cart_${user.email.trim().toLowerCase()}` : null;
    return key ? readLocal(key, []) : [];
  });
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState("Home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [toast, setToast] = useState("");
  const [checkout, setCheckout] = useState(false);
  const [buyNowProduct, setBuyNowProduct] = useState(null);
  const navigate = useNavigate();

  // Hero carousel is intentionally static: no automatic slide changes.
  // Users can still switch slides manually using the carousel controls.

  // Persist only to the currently logged-in user's private localStorage keys.
  useEffect(() => {
    const key = userStorageKey("cart");
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(cart)); } catch (error) {
      console.error("Could not save cart to localStorage", error);
    }
  }, [cart, loggedInUser]);

  useEffect(() => {
    const key = userStorageKey("wishlist");
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(wishlist)); } catch (error) {
      console.error("Could not save wishlist to localStorage", error);
    }
  }, [wishlist, loggedInUser]);

  const handleLogout = () => {
    // Keep this account's saved cart/wishlist; only clear them from the screen.
    localStorage.removeItem("shopzone_user");
    setLoggedInUser(null);
    setCart([]);
    setWishlist([]);
    setCheckout(false);
    navigate("/login", { replace: true });
    notify("You have logged out successfully");
  };

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(window.__shopToast);
    window.__shopToast = window.setTimeout(() => setToast(""), 2200);
  };

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      const matchesCategory = category === "All" || p.category === category;
      const matchesSearch = `${p.name} ${p.brand} ${p.category}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesPage = page !== "Wishlist" || wishlist.includes(p.id);
      return matchesCategory && matchesSearch && matchesPage;
    });

    if (sort === "low") list.sort((a, b) => a.price - b.price);
    if (sort === "high") list.sort((a, b) => b.price - a.price);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [category, search, sort, page, wishlist]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );
  const shipping = subtotal === 0 || subtotal >= 1999 ? 0 : 99;

  const requireLogin = (actionName = "continue") => {
    const activeUser = readLocal("shopzone_user", null);
    if (!activeUser) {
      notify(`Please log in to ${actionName}.`);
      navigate("/login", { state: { from: window.location.pathname }, replace: false });
      return false;
    }
    return true;
  };

  const startBuyNow = (product) => {
    if (!requireLogin("buy products")) return;
    setBuyNowProduct(product);
  };

  const addToCart = (product) => {
    if (!requireLogin("add products to your cart")) return;
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      return found
        ? current.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...current, { ...product, quantity: 1 }];
    });
    notify("✓ " + product.name + " added to cart");
  };

  const updateQuantity = (id, amount) => {
    if (!requireLogin("change your cart")) return;
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const toggleWishlist = (product) => {
    if (!requireLogin("use your wishlist")) return;
    const exists = wishlist.includes(product.id);
    setWishlist((current) =>
      exists
        ? current.filter((id) => id !== product.id)
        : [...current, product.id]
    );
    notify(exists ? "Removed from wishlist" : "♥ Added to wishlist");
  };

  const goHome = () => {
    setPage("Home");
    setCategory("All");
    setSearch("");
    document.getElementById("shop")?.scrollIntoView({ behavior: "auto" });
  };

  const chooseCategory = (name) => {
    setPage("Home");
    setCategory(name);
    document.getElementById("shop")?.scrollIntoView({ behavior: "auto" });
  };

  const showPage = (name) => {
    if ((name === "Cart" || name === "Wishlist") && !requireLogin(`open your ${name.toLowerCase()}`)) {
      setMenuOpen(false);
      return;
    }
    setPage(name);
    if (name === "Home") {
      setCategory("All");
      setSearch("");
    }
    if (name === "Cart") {
      document.getElementById("cart")?.scrollIntoView({ behavior: "auto" });
    } else {
      document.getElementById("shop")?.scrollIntoView({ behavior: "auto" });
    }
    setMenuOpen(false);
  };

  return (
    <div className="shopzone">
      <div className="top-strip">
        FREE SHIPPING ON ORDERS ABOVE ₹1,999
        <span>PREMIUM PICKS. EVERYDAY PRICES.</span>
      </div>

      <header className="header">
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>

        <button className="logo" onClick={goHome}>
          Shop<span>Zone</span>
        </button>

        <div className="search-box">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage("Home");
            }}
            placeholder="Search for products, brands and more..."
          />
          <span>⌕</span>
        </div>

        <div className="header-actions">
          <button onClick={() => showPage("Wishlist")}>
            <span className="header-icon">♡</span>
            <span className="header-label">Wishlist</span>
            <b>{wishlist.length}</b>
          </button>
          <button onClick={() => showPage("Cart")}>
            <span className="header-icon">♧</span>
            <span className="header-label">Cart</span>
            <b>{cartCount}</b>
          </button>
          {loggedInUser ? (
            <>
              <span className="header-user-name">
                Hi, {loggedInUser.name || loggedInUser.username || "User"}!
              </span>
              <button className="header-logout" onClick={handleLogout}>
                <span className="header-icon">↪</span>
                <span className="header-label">Logout</span>
              </button>
            </>
          ) : (
            <button onClick={() => navigate("/login")}>
              <span className="header-icon">♙</span>
              <span className="header-label">Login</span>
            </button>
          )}
        </div>
      </header>

      <nav className={`navbar ${menuOpen ? "navbar-open" : ""}`}>
        <button onClick={() => chooseCategory("All")}>☷ All Categories⌄</button>
        {categories.slice(1).map((item) => (
          <button key={item.name} onClick={() => chooseCategory(item.name)}>
            {item.name}
          </button>
        ))}
        <button onClick={() => chooseCategory("All")}>More⌄</button>
      </nav>

      <main>
        <section className="hero">
          <img
            key={heroSlides[activeSlide].image}
            className="hero-bg"
            src={image(heroSlides[activeSlide].image)}
            alt={heroSlides[activeSlide].caption}
          />
          <div className="hero-overlay" />
          <button className="hero-arrow hero-prev" aria-label="Previous slide" onClick={() => setActiveSlide((activeSlide + heroSlides.length - 1) % heroSlides.length)}>‹</button>
          <div className="hero-content" key={activeSlide}>
            <p className="eyebrow">{heroSlides[activeSlide].eyebrow}</p>
            <h1>{heroSlides[activeSlide].first}<br /><span>{heroSlides[activeSlide].second}</span></h1>
            <p>{heroSlides[activeSlide].copy}</p>
            <button className="gold-btn" onClick={() => chooseCategory("All")}>
              Shop Now <span>→</span>
            </button>
          </div>
          <button className="hero-arrow hero-next" aria-label="Next slide" onClick={() => setActiveSlide((activeSlide + 1) % heroSlides.length)}>›</button>
          <div className="hero-caption">
            <span>{heroSlides[activeSlide].caption}</span>
            <div className="hero-dots">
              {heroSlides.map((slide, index) => (
                <button key={slide.caption} aria-label={`Go to slide ${index + 1}`} className={activeSlide === index ? "hero-dot active" : "hero-dot"} onClick={() => setActiveSlide(index)} />
              ))}
            </div>
            <span>0{activeSlide + 1} — 0{heroSlides.length}</span>
          </div>
        </section>

        <section className="category-circles">
          {categories.slice(1).map((item) => (
            <button key={item.name} onClick={() => chooseCategory(item.name)}>
              <span className="circle">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
          <button onClick={() => chooseCategory("All")}>
            <span className="circle">⊞</span>
            <span>More</span>
          </button>
        </section>

        <section className="benefits-strip">
          <div><span>✦</span><p><strong>Curated Finds</strong><small>Picked for your everyday</small></p></div>
          <div><span>↗</span><p><strong>Great Prices</strong><small>Deals worth discovering</small></p></div>
          <div><span>◇</span><p><strong>Easy Shopping</strong><small>Simple cart & wishlist</small></p></div>
          <div><span>⌂</span><p><strong>Free Shipping</strong><small>On orders above ₹1,999</small></p></div>
        </section>

        <section className="deals-section" id="shop">
          <div className="section-title">
            <div>
              <p className="eyebrow">
                {page === "Wishlist" ? "YOUR SAVED ITEMS" : "HANDPICKED FOR YOU"}
              </p>
              <h2>
                {page === "Wishlist" ? "My Wishlist" : "Deals of the Day"}
              </h2>
              <p className="subtext">
                {filteredProducts.length} products to explore
              </p>
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="featured">Sort: Featured</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          <div className="filters">
            {categories.map((item) => (
              <button
                key={item.name}
                className={category === item.name ? "filter-active" : ""}
                onClick={() => {
                  setCategory(item.name);
                  setPage("Home");
                }}
              >
                {item.name}
              </button>
            ))}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image-wrap">
                    <img src={image(product.image)} alt={product.name} loading="lazy" />
                    <span className="discount">-{product.discount}%</span>
                    <button
                      className={`heart ${wishlist.includes(product.id) ? "hearted" : ""}`}
                      onClick={() => toggleWishlist(product)}
                    >
                      {wishlist.includes(product.id) ? "♥" : "♡"}
                    </button>
                    <button
                      className="quick-add"
                      onClick={() => addToCart(product)}
                    >
                      + ADD TO CART
                    </button>
                  </div>
                  <div className="product-details">
                    <p className="product-brand">{product.brand}</p>
                    <h3>{product.name}</h3>
                    <p className="rating">★ {product.rating} <span> | Customer rating</span></p>
                    <div className="price">
                      <strong>{money(product.price)}</strong>
                      <del>{money(product.old)}</del>
                    </div>
                    <button className="add-btn" onClick={() => addToCart(product)}>
                      Add to Cart <span>→</span>
                    </button>
                    <button className="buy-now-button" onClick={() => startBuyNow(product)}>
                      Buy Now →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No products found ♡</h3>
              <p>Try a different keyword or explore all products.</p>
              <button className="gold-btn" onClick={goHome}>View All Products</button>
            </div>
          )}
        </section>

        <section className="promo-grid">
          <button className="promo promo-fashion" onClick={() => chooseCategory("Men")}>
            <span>01 / COLLECTION</span>
            <h2>Men's Fashion</h2>
            <p>Minimal. Modern. Timeless.</p>
            <b>SHOP MEN →</b>
          </button>
          <button className="promo promo-tech" onClick={() => chooseCategory("Electronics")}>
            <span>02 / TECHNOLOGY</span>
            <h2>Next-Gen Tech</h2>
            <p>Everyday upgrades.</p>
            <b>SHOP TECH →</b>
          </button>
          <button className="promo promo-home" onClick={() => chooseCategory("Home")}>
            <span>03 / LIVING</span>
            <h2>Home & Living</h2>
            <p>Make your space yours.</p>
            <b>EXPLORE →</b>
          </button>
        </section>

        <section className="trending">
          <div className="section-title">
            <div>
              <p className="eyebrow">WHAT EVERYONE LOVES</p>
              <h2>Trending Products</h2>
            </div>
            <button className="view-all" onClick={goHome}>VIEW ALL →</button>
          </div>
          <div className="product-grid">
            {products.slice(4, 12).map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image-wrap">
                  <img src={image(product.image)} alt={product.name} loading="lazy" />
                  <span className="discount">-{product.discount}%</span>
                  <button
                    className={`heart ${wishlist.includes(product.id) ? "hearted" : ""}`}
                    onClick={() => toggleWishlist(product)}
                  >
                    {wishlist.includes(product.id) ? "♥" : "♡"}
                  </button>
                </div>
                <div className="product-details">
                  <p className="product-brand">{product.brand}</p>
                  <h3>{product.name}</h3>
                  <p className="rating">★ {product.rating}</p>
                  <div className="price">
                    <strong>{money(product.price)}</strong>
                    <del>{money(product.old)}</del>
                  </div>
                  <button className="add-btn" onClick={() => addToCart(product)}>
                    Add to Cart <span>→</span>
                  </button>
                  <button className="buy-now-button" onClick={() => startBuyNow(product)}>
                    Buy Now →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="cart-section" id="cart">
          <div className="section-title">
            <div>
              <p className="eyebrow">YOUR SELECTION</p>
              <h2>My Shopping Cart</h2>
            </div>
            <button className="view-all" onClick={goHome}>← CONTINUE SHOPPING</button>
          </div>

          {cart.length === 0 ? (
            <div className="empty-state">
              <h3>Your cart is empty ♧</h3>
              <p>Discover your favourites and add them to your bag.</p>
              <button className="gold-btn" onClick={goHome}>Start Shopping →</button>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-items">
                {cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <img src={image(item.image)} alt={item.name} />
                    <div className="cart-item-info">
                      <p className="product-brand">{item.brand}</p>
                      <h3>{item.name}</h3>
                      <strong>{money(item.price)}</strong>
                      <div className="quantity">
                        <button onClick={() => updateQuantity(item.id, -1)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                      </div>
                    </div>
                    <div className="cart-item-end">
                      <strong>{money(item.price * item.quantity)}</strong>
                      <button onClick={() => setCart((current) => current.filter((p) => p.id !== item.id))}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <aside className="summary">
                <p className="eyebrow">ORDER DETAILS</p>
                <h3>Price Details</h3>
                <div><span>Subtotal</span><span>{money(subtotal)}</span></div>
                <div><span>Shipping</span><span>{shipping === 0 ? "FREE" : money(shipping)}</span></div>
                <div className="summary-total"><strong>Total Amount</strong><strong>{money(subtotal + shipping)}</strong></div>
                <p className="shipping-hint">
                  {subtotal >= 1999 ? "Free shipping unlocked!" : `Add ${money(1999 - subtotal)} more for free shipping.`}
                </p>
                <button className="gold-btn checkout-btn" onClick={() => setCheckout(true)}>
                  Proceed to Checkout →
                </button>
                <p className="secure">◇ Secure checkout demo</p>
              </aside>
            </div>
          )}
        </section>

        <section className="newsletter">
          <p className="eyebrow">THE SHOPZONE EDIT</p>
          <h2>Good finds. Great style.</h2>
          <p>Discover fresh arrivals, special deals and everyday favourites.</p>
          <form onSubmit={(e) => { e.preventDefault(); notify("Thanks for subscribing!"); e.target.reset(); }}>
            <input type="email" placeholder="Enter your email address" required />
            <button type="submit">SUBSCRIBE →</button>
          </form>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-main">
          <div>
            <button className="logo footer-logo" onClick={goHome}>Shop<span>Zone</span></button>
            <p>Your style. Your tech. Your lifestyle.<br />Everything you love, all in one place.</p>
          </div>
          <div>
            <h4>SHOP</h4>
            <button onClick={() => chooseCategory("Men")}>Men's Fashion</button>
            <button onClick={() => chooseCategory("Women")}>Women's Fashion</button>
            <button onClick={() => chooseCategory("Electronics")}>Electronics</button>
            <button onClick={() => chooseCategory("Shoes")}>Shoes</button>
          </div>
          <div>
            <h4>YOUR ACCOUNT</h4>
            <button onClick={() => showPage("Wishlist")}>Wishlist</button>
            <button onClick={() => showPage("Cart")}>Shopping Cart</button>
            {loggedInUser ? (
              <>
                <button onClick={() => navigate("/pages/profile")}>My Profile</button>
                <button onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <button onClick={() => navigate("/login")}>Login / Sign Up</button>
            )}
          </div>
          <div>
            <h4>SHOPZONE PROMISE</h4>
            <p>Curated products.<br />Great value.<br />Everyday inspiration.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 SHOPZONE. ALL RIGHTS RESERVED.</span>
          <span>MADE FOR YOUR EVERYDAY.</span>
        </div>
      </footer>

      {toast && <div className="toast">{toast}</div>}

      {buyNowProduct && (
        <BuyNowModal
          product={buyNowProduct}
          user={loggedInUser}
          onClose={() => setBuyNowProduct(null)}
          notify={notify}
        />
      )}

      {checkout && (
        <div className="modal-backdrop" onClick={() => setCheckout(false)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setCheckout(false)}>×</button>
            <span className="modal-symbol">◇</span>
            <p className="eyebrow">SHOPZONE CHECKOUT</p>
            <h2>Almost there!</h2>
            <p>This is a demo checkout. Payment processing and order placement are not connected yet.</p>
            <div className="modal-total"><span>Order Total</span><strong>{money(subtotal + shipping)}</strong></div>
            <button className="gold-btn checkout-btn" onClick={() => setCheckout(false)}>CONTINUE SHOPPING</button>
          </div>
        </div>
      )}
    </div>
  );
}

function BuyNowModal({ product, user, onClose, notify }) {
  const [quantity, setQuantity] = useState(1);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  const total = Number(product.price || 0) * quantity;
  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const confirmBooking = (event) => {
    event.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setError("Enter a valid 6-digit pincode.");
      return;
    }
    if (!form.name.trim() || !form.email.trim() || !form.address.trim() || !form.city.trim()) {
      setError("Please complete all customer and delivery details.");
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
      price: Number(product.price || 0),
      quantity,
      total,
      status: "Confirmed",
      paymentMethod: "Cash on Delivery",
      createdAt: new Date().toISOString(),
    };

    try {
      const savedOrders = readLocal("shopzone_orders", []);
      localStorage.setItem("shopzone_orders", JSON.stringify([order, ...savedOrders]));
      setConfirmedOrder(order);
      notify("Booking confirmed successfully!");
    } catch {
      setError("Could not save the order in this browser. Please try again.");
    }
  };

  return (
    <div className="buy-modal-backdrop" onClick={onClose}>
      <div className="buy-modal" onClick={(event) => event.stopPropagation()}>
        <button className="buy-close" onClick={onClose} aria-label="Close">×</button>

        {confirmedOrder ? (
          <div className="buy-success">
            <div className="buy-success-icon">✓</div>
            <p className="buy-eyebrow">SHOPZONE ORDER</p>
            <h2>Booking Confirmed!</h2>
            <p className="buy-muted">Your order has been saved successfully.</p>
            <div className="buy-order-number">
              <span>ORDER ID</span>
              <strong>{confirmedOrder.orderId}</strong>
            </div>
            <div className="buy-confirm-summary">
              <div><span>Product</span><strong>{confirmedOrder.productName}</strong></div>
              <div><span>Quantity</span><strong>{confirmedOrder.quantity}</strong></div>
              <div><span>Total amount</span><strong>{money(confirmedOrder.total)}</strong></div>
              <div><span>Payment</span><strong>Cash on Delivery</strong></div>
              <div><span>Status</span><strong className="buy-status">{confirmedOrder.status}</strong></div>
            </div>
            <p className="buy-muted">Delivery: {confirmedOrder.address}, {confirmedOrder.city} - {confirmedOrder.pincode}</p>
            <button className="buy-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <p className="buy-eyebrow">SHOPZONE CHECKOUT</p>
            <h2>Complete your order</h2>
            <p className="buy-muted">Enter your delivery details to confirm your booking.</p>

            <div className="buy-product-summary">
              <img src={image(product.image)} alt={product.name} />
              <div>
                <strong>{product.name}</strong>
                <span>{product.brand}</span>
                <b>{money(Number(product.price || 0))}</b>
              </div>
            </div>

            <form onSubmit={confirmBooking}>
              <div className="buy-form-grid">
                <label>Full name
                  <input name="name" value={form.name} onChange={updateField} required placeholder="Enter full name" />
                </label>
                <label>Email address
                  <input name="email" type="email" value={form.email} onChange={updateField} required placeholder="Enter email" />
                </label>
                <label>Mobile number
                  <input name="phone" value={form.phone} onChange={updateField} required maxLength={10} inputMode="numeric" placeholder="10-digit number" />
                </label>
                <label>City
                  <input name="city" value={form.city} onChange={updateField} required placeholder="Enter city" />
                </label>
                <label className="buy-full-width">Delivery address
                  <textarea name="address" value={form.address} onChange={updateField} required rows={2} placeholder="House no, street, area" />
                </label>
                <label>Pincode
                  <input name="pincode" value={form.pincode} onChange={updateField} required maxLength={6} inputMode="numeric" placeholder="6-digit pincode" />
                </label>
                <label>Quantity
                  <select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>
                    {[1, 2, 3, 4, 5].map((number) => <option key={number} value={number}>{number}</option>)}
                  </select>
                </label>
              </div>
              <div className="buy-total-row"><span>Total amount</span><strong>{money(total)}</strong></div>
              <div className="buy-payment-note">Payment method: <strong>Cash on Delivery</strong></div>
              {error && <p className="buy-error">{error}</p>}
              <button type="submit" className="buy-primary">Confirm Booking · {money(total)}</button>
              <button type="button" className="buy-secondary" onClick={onClose}>Cancel</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = readLocal("shopzone_user", null);
  if (currentUser) return <Navigate to={currentUser.role === "admin" ? "/admin" : "/"} replace />;

  const getUsers = () => {
    try {
      return JSON.parse(localStorage.getItem("shopzone_users") || "[]");
    } catch {
      return [];
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    const users = getUsers();

    if (isSignup) {
      if (cleanEmail === "admin@shopzone.com") {
        setError("This email is reserved for the ShopZone administrator.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (users.some((item) => item.email === cleanEmail)) {
        setError("Account already exists. Please log in.");
        setIsSignup(false);
        return;
      }

      // Demo only: never store plain-text passwords in a real application.
      try {
        localStorage.setItem(
          "shopzone_users",
          JSON.stringify([...users, { name: name.trim(), email: cleanEmail, password }])
        );
      } catch {
        setError("Unable to save your account in this browser.");
        return;
      }

      setIsSignup(false);
      setPassword("");
      setConfirmPassword("");
      setError("Account created successfully. Please log in.");
      return;
    }

    // Demo admin account. For production, validate admin credentials on a backend.
    if (cleanEmail === "admin@shopzone.com" && password === "Admin@123") {
      localStorage.setItem(
        "shopzone_user",
        JSON.stringify({ name: "ShopZone Admin", email: cleanEmail, role: "admin" })
      );
      navigate("/admin", { replace: true });
      return;
    }

    const found = users.find(
      (item) => item.email === cleanEmail && item.password === password
    );

    if (!found) {
      setError("Account not found or password is incorrect. Please sign up if you are new.");
      return;
    }

    localStorage.setItem(
      "shopzone_user",
      JSON.stringify({ name: found.name, email: found.email, role: "user" })
    );
    navigate(location.state?.from || "/", { replace: true });
  };

  return (
    <main className="auth-screen">
      <Link to="/" className="auth-logo">Shop<span>Zone</span></Link>
      <section className="auth-card">
        <div className="auth-brand-mark">S</div>
        <p className="auth-eyebrow">WELCOME TO SHOPZONE</p>
        <h1>{isSignup ? "Create account." : "Welcome back."}</h1>
        <p className="auth-description">
          {isSignup
            ? "Create an account to save your favourites and manage your shopping."
            : "Log in to continue your shopping journey."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <label htmlFor="signup-name">Full name</label>
              <input
                id="signup-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </>
          )}

          <label htmlFor="auth-email">Email address</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={isSignup ? "At least 8 characters" : "Enter your password"}
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : undefined}
            required
          />

          {isSignup && (
            <>
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
              />
            </>
          )}

          {error && (
            <p className={error.startsWith("Account created") ? "auth-success" : "auth-error"}>
              {error}
            </p>
          )}

          <button className="auth-submit" type="submit">
            {isSignup ? "CREATE ACCOUNT" : "LOG IN"} <span>→</span>
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "New to ShopZone?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignup((value) => !value);
              setError("");
              setPassword("");
              setConfirmPassword("");
            }}
          >
            {isSignup ? "Log in" : "Create an account"}
          </button>
        </p>
        <Link to="/" className="auth-back">← Continue browsing</Link>
        <p className="auth-secure">◇ Your shopping journey starts here.</p>
      </section>
      <p className="auth-footer">© 2026 SHOPZONE · PREMIUM SHOPPING</p>
    </main>
  );
}

function AccountPage() {
  const navigate = useNavigate();
  const routePage = window.location.pathname.split("/").pop();
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("shopzone_user") || "null");
  } catch {
    user = null;
  }

  const logout = () => {
    localStorage.removeItem("shopzone_user");
    navigate("/login", { replace: true });
  };

  const title =
    routePage === "orders" ? "My Orders" :
    routePage === "cart" ? "My Cart" : "My Profile";

  return (
    <main className="protected-store-page">
      <header className="protected-store-header">
        <Link to="/" className="protected-store-logo">Shop<span>Zone</span></Link>
        <button onClick={logout}>Logout ↗</button>
      </header>
      <section className="protected-store-content">
        <p className="eyebrow">YOUR SHOPZONE ACCOUNT</p>
        <h1>{title}</h1>
        <p>Welcome back, {user?.name}!</p>

        {routePage === "profile" && (
          <div className="account-panel">
            <h2>Account Details</h2>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
          </div>
        )}
        {routePage === "orders" && (
          <div className="account-panel">
            <h2>Your Orders</h2>
            <p>No orders yet. Your orders will appear here when order processing is connected.</p>
          </div>
        )}
        {routePage === "cart" && (
          <div className="account-panel">
            <h2>Your Shopping Cart</h2>
            <p>This is a protected cart page. Browse products to continue shopping.</p>
            <Link to="/">Browse Products →</Link>
          </div>
        )}
        <div className="account-links">
          <Link to="/pages/profile">Profile</Link>
          <Link to="/pages/orders">Orders</Link>
          <Link to="/pages/cart">Cart</Link>
          <Link to="/">Continue shopping</Link>
        </div>
      </section>
    </main>
  );
}

function AdminRoute() {
  const user = readLocal("shopzone_user", null);
  if (!user) return <Navigate to="/login" replace state={{ from: "/admin" }} />;
  if (user.role !== "admin" || user.email !== "admin@shopzone.com") return <Navigate to="/" replace />;
  return <AdminDashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ShopHome />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/pages/profile" element={<AccountPage />} />
          <Route path="/pages/orders" element={<AccountPage />} />
          <Route path="/pages/cart" element={<AccountPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
