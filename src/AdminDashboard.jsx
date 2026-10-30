
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import "./AdminDashboard.css";
import products from "./ShopZone_products.json";

const readLocal = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const productMap = new Map(
  (Array.isArray(products) ? products : []).map((product) => [
    String(product.id),
    product,
  ])
);

function getImageUrl(image) {
  if (!image || typeof image !== "string") return "";
  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("/") ||
    image.startsWith("data:")
  ) {
    return image;
  }
  return `https://images.unsplash.com/${image}?auto=format&fit=crop&w=600&q=85`;
}

function collectData() {
  const storedUsers = readLocal("shopzone_users", []);
  const users = Array.isArray(storedUsers)
    ? storedUsers.map((user) => ({
        name: user.name || "Customer",
        email: (user.email || "").trim().toLowerCase(),
      }))
    : [];

  const activeUser = readLocal("shopzone_user", null);

  if (
    activeUser?.email &&
    !users.some(
      (user) =>
        user.email === String(activeUser.email).trim().toLowerCase()
    )
  ) {
    users.push({
      name: activeUser.name || "Customer",
      email: String(activeUser.email).trim().toLowerCase(),
    });
  }

  const carts = [];
  const wishlists = [];
  const savedOrders = readLocal("shopzone_orders", []);
  const orders = Array.isArray(savedOrders)
    ? savedOrders.map((order) => ({
        ...order,
        total: Number(
          order.total ??
            Number(order.price || 0) * Number(order.quantity || 1)
        ),
        price: Number(order.price || 0),
        quantity: Number(order.quantity || 1),
        status: order.status || "Confirmed",
      }))
    : [];

  Object.keys(localStorage).forEach((key) => {
    const cartMatch = key.match(/^shopzone_cart(?:_(.+))?$/);
    const wishlistMatch = key.match(/^shopzone_wishlist(?:_(.+))?$/);

    if (cartMatch) {
      const email = (cartMatch[1] || "Legacy cart").toLowerCase();
      const items = readLocal(key, []);

      if (Array.isArray(items)) {
        items.forEach((item) => {
          const price = Number(item.price || 0);
          const quantity = Number(item.quantity || 1);

          carts.push({
            email,
            id: item.id,
            name: item.name || item.title || "Product",
            brand: item.brand || "ShopZone",
            image: item.image || "",
            price,
            quantity,
            total: price * quantity,
          });
        });
      }
    }

    if (wishlistMatch) {
      const email = (wishlistMatch[1] || "Legacy wishlist").toLowerCase();
      const savedItems = readLocal(key, []);

      if (Array.isArray(savedItems)) {
        savedItems.forEach((savedItem) => {
          const id =
            typeof savedItem === "object" ? savedItem.id : savedItem;
          const product = productMap.get(String(id));
          const item =
            typeof savedItem === "object" ? savedItem : product || {};

          wishlists.push({
            email,
            id,
            name: item.name || item.title || product?.name || `Product ${id}`,
            brand: item.brand || product?.brand || "ShopZone",
            image: item.image || product?.image || "",
            price: Number(item.price || product?.price || 0),
          });
        });
      }
    }
  });

  return { users, carts, wishlists, orders };
}

const slides = [
  {
    label: "SHOPZONE MANAGEMENT",
    title: "Your store.",
    highlight: "Your insights.",
    description:
      "Manage customers, review shopping activity and export your store data.",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85",
  },
  {
    label: "CUSTOMER EXPERIENCE",
    title: "Know your",
    highlight: "customers.",
    description:
      "Explore customer accounts, saved carts and favourite products.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=85",
  },
  {
    label: "STORE ANALYTICS",
    title: "Data made",
    highlight: "simple.",
    description:
      "View your saved records and download an Excel workbook in seconds.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=85",
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [slide, setSlide] = useState(0);
  const [search, setSearch] = useState("");
  const [data, setData] = useState(collectData);

  const refresh = () => setData(collectData());

  useEffect(() => {
    const slideTimer = window.setInterval(() => {
      setSlide((current) => (current + 1) % slides.length);
    }, 5000);

    const dataTimer = window.setInterval(() => {
      setData(collectData());
    }, 2000);

    const storageListener = () => setData(collectData());
    window.addEventListener("storage", storageListener);

    return () => {
      window.clearInterval(slideTimer);
      window.clearInterval(dataTimer);
      window.removeEventListener("storage", storageListener);
    };
  }, []);

  const filteredUsers = useMemo(
    () =>
      data.users.filter((user) =>
        `${user.name} ${user.email}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [data.users, search]
  );

  const filteredCarts = useMemo(
    () =>
      data.carts.filter((item) =>
        `${item.email} ${item.name} ${item.brand}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [data.carts, search]
  );

  const filteredWishlists = useMemo(
    () =>
      data.wishlists.filter((item) =>
        `${item.email} ${item.name} ${item.brand}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [data.wishlists, search]
  );

  const filteredOrders = useMemo(
    () =>
      data.orders.filter((order) =>
        `${order.orderId || ""} ${order.customerName || ""} ${
          order.email || ""
        } ${order.productName || order.name || ""} ${order.status || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [data.orders, search]
  );

  const cartValue = data.carts.reduce(
    (total, item) => total + item.total,
    0
  );

  const orderValue = data.orders.reduce(
    (total, order) => total + Number(order.total || 0),
    0
  );

  const exportExcel = () => {
    const workbook = XLSX.utils.book_new();

    const addSheet = (name, rows, fallback) => {
      const sheet = XLSX.utils.json_to_sheet(
        rows.length ? rows : [fallback]
      );
      XLSX.utils.book_append_sheet(workbook, sheet, name);
    };

    addSheet(
      "Summary",
      [
        { Metric: "Registered customers", Value: data.users.length },
        { Metric: "Cart entries", Value: data.carts.length },
        { Metric: "Wishlist entries", Value: data.wishlists.length },
        { Metric: "Buy Now orders", Value: data.orders.length },
        { Metric: "Order value INR", Value: orderValue },
        { Metric: "Saved cart value INR", Value: cartValue },
        { Metric: "Exported at", Value: new Date().toLocaleString() },
      ],
      { Metric: "", Value: "" }
    );

    addSheet("Customers", data.users, { name: "", email: "" });

    addSheet(
      "Carts",
      data.carts.map(
        ({ email, id, name, brand, price, quantity, total }) => ({
          email,
          productId: id,
          product: name,
          brand,
          price,
          quantity,
          total,
        })
      ),
      { email: "", product: "", quantity: 0, total: 0 }
    );

    addSheet(
      "Wishlists",
      data.wishlists.map(({ email, id, name, brand, price }) => ({
        email,
        productId: id,
        product: name,
        brand,
        price,
      })),
      { email: "", product: "", price: 0 }
    );

    addSheet(
      "Orders",
      data.orders.map((order) => ({
        orderId: order.orderId || "",
        customerName: order.customerName || "",
        email: order.email || "",
        phone: order.phone || "",
        productName: order.productName || order.name || "",
        brand: order.brand || "",
        price: order.price || 0,
        quantity: order.quantity || 1,
        total: order.total || 0,
        status: order.status || "Confirmed",
        paymentMethod: order.paymentMethod || "Cash on Delivery",
        address: order.address || "",
        city: order.city || "",
        pincode: order.pincode || "",
        createdAt: order.createdAt || "",
      })),
      {
        orderId: "",
        customerName: "",
        email: "",
        productName: "",
        total: 0,
        status: "",
      }
    );

    XLSX.writeFile(
      workbook,
      `ShopZone_Data_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const logout = () => {
    localStorage.removeItem("shopzone_user");
    sessionStorage.removeItem("shopzone_user");
    navigate("/login", { replace: true });
  };

  const navItems = [
    { id: "overview", icon: "⌂", label: "Overview" },
    { id: "users", icon: "♙", label: "Customers" },
    { id: "carts", icon: "🛍", label: "Cart Data" },
    { id: "wishlists", icon: "♡", label: "Wishlist Data" },
    { id: "orders", icon: "📦", label: "Buy Now Orders" },
  ];

  const heading = navItems.find((item) => item.id === tab)?.label || "Overview";

  return (
    <div className="sz-admin">
      <aside className="sz-admin-sidebar">
        <Link to="/" className="sz-admin-brand">
          Shop<span>Zone</span>
          <small>ADMIN STUDIO</small>
        </Link>

        <div className="sz-admin-profile">
          <div className="sz-admin-avatar">S</div>
          <div className="sz-admin-profile-text">
            <strong>ShopZone Admin</strong>
            <small>Administrator</small>
          </div>
          <i />
        </div>

        <p className="sz-admin-nav-label">WORKSPACE</p>

        <nav className="sz-admin-navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`sz-admin-nav ${
                tab === item.id ? "active" : ""
              }`}
              onClick={() => {
                setTab(item.id);
                setSearch("");
              }}
            >
              <span>{item.icon}</span>
              {item.label}
              {tab === item.id && <b>›</b>}
            </button>
          ))}
        </nav>

        <div className="sz-admin-sidebar-bottom">
          <Link to="/">← Visit ShopZone</Link>
          <button onClick={logout}>↪ Logout</button>
        </div>
      </aside>

      <main className="sz-admin-main">
        <header className="sz-admin-topbar">
          <div>
            <p className="sz-admin-kicker">SHOPZONE / MANAGEMENT</p>
            <h1>{heading}</h1>
            <p className="sz-admin-subtitle">
              Welcome back! Here is your store activity.
            </p>
          </div>

          <div className="sz-admin-actions">
            <button className="sz-admin-refresh" onClick={refresh}>
              ↻ Refresh
            </button>
            <button className="sz-admin-export" onClick={exportExcel}>
              ↓ Export Excel
            </button>
          </div>
        </header>

        {tab === "overview" && (
          <>
            <section
              className="sz-admin-hero"
              style={{ backgroundImage: `url("${slides[slide].image}")` }}
            >
              <div className="sz-admin-hero-overlay" />
              <div className="sz-admin-hero-content">
                <p>{slides[slide].label}</p>
                <h2>
                  {slides[slide].title}
                  <br />
                  <span>{slides[slide].highlight}</span>
                </h2>
                <div>{slides[slide].description}</div>
                <button onClick={() => setTab("users")}>
                  Explore customers →
                </button>
              </div>

              <div className="sz-admin-carousel-controls">
                <button
                  aria-label="Previous slide"
                  onClick={() =>
                    setSlide((slide - 1 + slides.length) % slides.length)
                  }
                >
                  ‹
                </button>

                {slides.map((item, index) => (
                  <button
                    key={item.label}
                    aria-label={`Slide ${index + 1}`}
                    className={slide === index ? "selected" : ""}
                    onClick={() => setSlide(index)}
                  />
                ))}

                <button
                  aria-label="Next slide"
                  onClick={() => setSlide((slide + 1) % slides.length)}
                >
                  ›
                </button>
              </div>
            </section>

            <section className="sz-admin-metrics">
              <MetricCard
                icon="♙"
                label="REGISTERED CUSTOMERS"
                value={data.users.length}
                note="Accounts in this browser"
                color="teal"
                onClick={() => setTab("users")}
              />
              <MetricCard
                icon="🛍"
                label="CART ITEMS"
                value={data.carts.length}
                note="Saved product entries"
                color="gold"
                onClick={() => setTab("carts")}
              />
              <MetricCard
                icon="♡"
                label="WISHLIST ITEMS"
                value={data.wishlists.length}
                note="Saved favourite products"
                color="pink"
                onClick={() => setTab("wishlists")}
              />
              <MetricCard
                icon="📦"
                label="BUY NOW ORDERS"
                value={data.orders.length}
                note={`${money(orderValue)} total order value`}
                color="blue"
                onClick={() => setTab("orders")}
              />
            </section>

            <section className="sz-admin-shortcuts">
              <div className="sz-admin-section-heading">
                <p>QUICK ACCESS</p>
                <h2>Manage your store</h2>
              </div>

              <div className="sz-admin-shortcut-grid">
                <Shortcut
                  image="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=500&q=80"
                  title="Customers"
                  description="Explore customer accounts"
                  onClick={() => setTab("users")}
                />
                <Shortcut
                  image="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=500&q=80"
                  title="Shopping carts"
                  description="Review saved cart products"
                  onClick={() => setTab("carts")}
                />
                <Shortcut
                  image="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=500&q=80"
                  title="Wishlists"
                  description="Explore saved favourites"
                  onClick={() => setTab("wishlists")}
                />
              </div>
            </section>

            <section className="sz-admin-panel">
              <div className="sz-admin-panel-heading">
                <div>
                  <p>YOUR CUSTOMERS</p>
                  <h2>Recently registered</h2>
                </div>
                <button onClick={() => setTab("users")}>View all →</button>
              </div>
              <CustomerTable users={data.users.slice(-5).reverse()} />
            </section>

            <div className="sz-admin-data-note">
              <strong>ⓘ Browser storage mode</strong>
              <span>
                This demo displays records saved in this browser only. It is
                not a shared online database.
              </span>
            </div>
          </>
        )}

        {tab !== "overview" && (
          <section className="sz-admin-records">
            <div className="sz-admin-records-hero">
              <div>
                <p>SHOPZONE / CUSTOMER MANAGEMENT</p>
                <h2>
                  {tab === "users"
                    ? "Our Customers"
                    : tab === "carts"
                    ? "Shopping Cart Details"
                    : tab === "wishlists"
                    ? "Wishlist Collection"
                    : "Buy Now Orders"}
                </h2>
                <span>
                  {tab === "users"
                    ? "Explore registered customer accounts."
                    : tab === "carts"
                    ? "View products customers added to their carts."
                    : tab === "wishlists"
                    ? "Discover products customers saved for later."
                    : "Review customer orders confirmed through Buy Now."}
                </span>
              </div>
              <div className="sz-admin-records-hero-icon">
                {tab === "users"
                  ? "♙"
                  : tab === "carts"
                  ? "🛍"
                  : tab === "wishlists"
                  ? "♡"
                  : "📦"}
              </div>
            </div>

            <div className="sz-admin-record-stats">
              <article>
                <span>
                  {tab === "users"
                    ? "TOTAL CUSTOMERS"
                    : tab === "carts"
                    ? "CART ENTRIES"
                    : tab === "wishlists"
                    ? "SAVED ITEMS"
                    : "CONFIRMED ORDERS"}
                </span>
                <strong>
                  {tab === "users"
                    ? data.users.length
                    : tab === "carts"
                    ? data.carts.length
                    : tab === "wishlists"
                    ? data.wishlists.length
                    : data.orders.length}
                </strong>
              </article>

              <article>
                <span>UNIQUE CUSTOMER KEYS</span>
                <strong>
                  {
                    new Set(
                      (tab === "users"
                        ? data.users.map((user) => user.email)
                        : tab === "carts"
                        ? data.carts.map((item) => item.email)
                        : tab === "wishlists"
                        ? data.wishlists.map((item) => item.email)
                        : data.orders.map((item) => item.email)
                      ).filter(Boolean)
                    ).size
                  }
                </strong>
              </article>

              <article>
                <span>
                  {tab === "users"
                    ? "ACCOUNT STATUS"
                    : tab === "carts"
                    ? "SAVED CART VALUE"
                    : tab === "wishlists"
                    ? "WISHLIST VALUE"
                    : "TOTAL ORDER VALUE"}
                </span>
                <strong>
                  {tab === "users"
                    ? "Active"
                    : tab === "carts"
                    ? money(
                        data.carts.reduce((sum, item) => sum + item.total, 0)
                      )
                    : tab === "wishlists"
                    ? money(
                        data.wishlists.reduce(
                          (sum, item) => sum + item.price,
                          0
                        )
                      )
                    : money(orderValue)}
                </strong>
              </article>
            </div>

            <div className="sz-admin-records-panel">
              <div className="sz-admin-records-toolbar">
                <div>
                  <h3>
                    {tab === "users"
                      ? "Customer Directory"
                      : tab === "carts"
                      ? "Customer Cart Items"
                      : tab === "wishlists"
                      ? "Saved Wishlist Items"
                      : "Confirmed Buy Now Orders"}
                  </h3>
                  <p>Search records and review saved details.</p>
                </div>

                <input
                  className="sz-admin-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="⌕ Search name, email or product..."
                />
              </div>

              {tab === "users" && <CustomerCards users={filteredUsers} />}

              {tab === "carts" && (
                <ProductCards items={filteredCarts} mode="cart" />
              )}

              {tab === "wishlists" && (
                <ProductCards items={filteredWishlists} mode="wishlist" />
              )}

              {tab === "orders" && <OrdersCards orders={filteredOrders} />}
            </div>
          </section>
        )}

        <footer className="sz-admin-footer">
          SHOPZONE ADMIN STUDIO · {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
}

function MetricCard({ icon, label, value, note, color, onClick }) {
  return (
    <article className={`sz-admin-metric-card ${color}-card`}>
      <div className="sz-admin-card-top">
        <span>{label}</span>
        <span className="sz-admin-card-icon">{icon}</span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
      <button onClick={onClick}>View details →</button>
    </article>
  );
}

function Shortcut({ image, title, description, onClick }) {
  return (
    <button className="sz-admin-shortcut" onClick={onClick}>
      <img src={image} alt={title} loading="lazy" />
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <b>→</b>
    </button>
  );
}

function CustomerTable({ users }) {
  return (
    <DataTable
      headers={["Customer", "Email address", "Account type"]}
      rows={users.map((user) => [user.name, user.email, "Customer"])}
    />
  );
}

function CustomerCards({ users }) {
  const photos = [
    "photo-1534528741775-53994a69daeb",
    "photo-1500648767791-00dcc994a43e",
    "photo-1524504388940-b1c1722653e1",
  ];

  if (!users.length) return <EmptyState title="No customers found" />;

  return (
    <div className="sz-admin-customer-grid">
      {users.map((user, index) => (
        <article
          className="sz-admin-customer-card"
          key={`${user.email}-${index}`}
        >
          <div className="sz-admin-customer-banner">
            <img
              src={`https://images.unsplash.com/${
                photos[index % photos.length]
              }?auto=format&fit=crop&w=250&q=80`}
              alt="Customer profile"
              loading="lazy"
            />
            <span>Customer</span>
          </div>
          <div className="sz-admin-customer-info">
            <h3>{user.name || "Customer"}</h3>
            <p>{user.email}</p>
            <div className="sz-admin-customer-footer">
              <span>● Registered account</span>
              <span>#{index + 1}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function ProductCards({ items, mode }) {
  if (!items.length) {
    return (
      <EmptyState
        title={
          mode === "cart"
            ? "No cart items found"
            : "No wishlist items found"
        }
      />
    );
  }

  return (
    <div className="sz-admin-product-grid">
      {items.map((item, index) => {
        const imageUrl = getImageUrl(item.image);

        return (
          <article
            className="sz-admin-product-card"
            key={`${item.email}-${item.name}-${index}`}
          >
            <div className="sz-admin-product-photo">
              {imageUrl ? (
                <img src={imageUrl} alt={item.name} loading="lazy" />
              ) : (
                <div className="sz-admin-product-placeholder">
                  {mode === "cart" ? "🛍" : "♡"}
                </div>
              )}
              <span
                className={`sz-admin-product-tag ${
                  mode === "wishlist" ? "wishlist-tag" : ""
                }`}
              >
                {mode === "cart" ? "IN CART" : "♥ SAVED"}
              </span>
            </div>

            <div className="sz-admin-product-info">
              <small>{item.brand || "SHOPZONE COLLECTION"}</small>
              <h3>{item.name}</h3>
              <p className="sz-admin-product-email">{item.email}</p>

              <div className="sz-admin-product-price">
                <strong>{money(item.price)}</strong>
                {mode === "cart" && <span>Qty: {item.quantity}</span>}
              </div>

              {mode === "cart" && (
                <div className="sz-admin-product-total">
                  <span>Item total</span>
                  <strong>{money(item.total)}</strong>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function OrdersCards({ orders }) {
  if (!orders.length) {
    return <EmptyState title="No Buy Now orders found" />;
  }

  return (
    <div className="sz-admin-orders-grid">
      {orders.map((order, index) => {
        const imageUrl = getImageUrl(order.image);
        const productName = order.productName || order.name || "Product";
        const quantity = Number(order.quantity || 1);
        const price = Number(order.price || 0);
        const total = Number(order.total || price * quantity);
        const address = [order.address, order.city, order.pincode]
          .filter(Boolean)
          .join(", ");

        return (
          <article
            className="sz-admin-order-card"
            key={order.orderId || `${order.email}-${index}`}
          >
            <div className="sz-admin-order-top">
              <div>
                <span className="sz-admin-order-label">SHOPZONE ORDER</span>
                <p className="sz-admin-order-id">
                  Order ID: {order.orderId || "N/A"}
                </p>
              </div>
              <span className="sz-admin-order-status">
                <i /> {order.status || "Confirmed"}
              </span>
            </div>

            <div className="sz-admin-order-product">
              {imageUrl ? (
                <img
                  className="sz-admin-order-image"
                  src={imageUrl}
                  alt={productName}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="sz-admin-order-image-placeholder">📦</div>
              )}

              <div className="sz-admin-order-product-info">
                <small>{order.brand || "SHOPZONE COLLECTION"}</small>
                <h3>{productName}</h3>
                <strong className="sz-admin-order-price">
                  {money(price || total)}
                </strong>
                <span>Quantity: {quantity}</span>
              </div>
            </div>

            <p className="sz-admin-order-section-title">
              CUSTOMER INFORMATION
            </p>

            <div className="sz-admin-order-details">
              <div>
                <span>Customer Name</span>
                <strong>{order.customerName || "Customer"}</strong>
              </div>
              <div>
                <span>Mobile Number</span>
                <strong>{order.phone || "—"}</strong>
              </div>
              <div className="sz-admin-order-full">
                <span>Email Address</span>
                <strong>{order.email || "—"}</strong>
              </div>
              <div className="sz-admin-order-full">
                <span>Delivery Address</span>
                <strong>{address || "Address not available"}</strong>
              </div>
              <div>
                <span>Payment Method</span>
                <strong>{order.paymentMethod || "Cash on Delivery"}</strong>
              </div>
              <div>
                <span>Order Status</span>
                <strong className="sz-admin-order-confirmed">
                  {order.status || "Confirmed"}
                </strong>
              </div>
            </div>

            <div className="sz-admin-order-total">
              <div>
                <span>Total Amount</span>
                <small>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString()
                    : "Date not available"}
                </small>
              </div>
              <strong>{money(total)}</strong>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function EmptyState({ title }) {
  return (
    <div className="sz-admin-record-empty">
      <span>⌕</span>
      <h3>{title}</h3>
      <p>Records appear here after customers save data in this browser.</p>
    </div>
  );
}

function DataTable({ headers, rows }) {
  return (
    <div className="sz-admin-table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((value, cellIndex) => (
                <td key={cellIndex}>{value || "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="sz-admin-empty">No records found.</div>
      )}
    </div>
  );
}
