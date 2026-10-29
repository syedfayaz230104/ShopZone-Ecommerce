
import React, { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  if (sessionStorage.getItem("shopzone_user")) {
    return <Navigate to="/pages/profile" replace />;
  }

  const getUsers = () => {
    try {
      return JSON.parse(localStorage.getItem("shopzone_users") || "[]");
    } catch {
      return [];
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const users = getUsers();

    if (isSignup) {
      if (password.length < 8) {
        setError("Password must contain at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      if (users.some((u) => u.email === cleanEmail)) {
        setError("Account already exists. Please log in.");
        setIsSignup(false);
        return;
      }

      users.push({ name: name.trim(), email: cleanEmail, password });

      try {
        localStorage.setItem("shopzone_users", JSON.stringify(users));
      } catch {
        setError("Could not save account. Please try again.");
        return;
      }

      setIsSignup(false);
      setPassword("");
      setConfirmPassword("");
      setError("Account created! Now log in with your details.");
      return;
    }

    const user = users.find(
      (u) => u.email === cleanEmail && u.password === password
    );

    if (!user) {
      setError("Account not found or password is incorrect. Please sign up if you are new.");
      return;
    }

    sessionStorage.setItem(
      "shopzone_user",
      JSON.stringify({ name: user.name, email: user.email })
    );

    navigate(location.state?.from || "/pages/profile", { replace: true });
  };

  return (
    <main className="auth-screen">
      <Link to="/" className="auth-logo">
        Shop<span>Zone</span>
      </Link>

      <section className="auth-card">
        <p className="auth-eyebrow">WELCOME TO SHOPZONE</p>

        <h1>{isSignup ? "Create account." : "Welcome back."}</h1>

        <p className="auth-description">
          {isSignup
            ? "Create your account and discover your favourites."
            : "Log in to continue your shopping journey."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <label>Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </>
          )}

          <label>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignup ? "At least 8 characters" : "Enter password"}
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : undefined}
            required
          />

          {isSignup && (
            <>
              <label>Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
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
            {isSignup ? "CREATE ACCOUNT" : "LOG IN"}
            <span>→</span>
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "New to ShopZone?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
              setPassword("");
              setConfirmPassword("");
            }}
          >
            {isSignup ? "Log in" : "Create an account"}
          </button>
        </p>

        <Link to="/" className="auth-back">
          ← Continue browsing
        </Link>
      </section>
    </main>
  );
}
