import React from 'react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="signup-container">
      {/* Header */}
      <div className="signup-header">
        <div className="signup-logo">
          <h1>HomeBridgr</h1>
          <p>Sign up to see photos and videos from your friends.</p>
        </div>
      </div>

      {/* Signup Form */}
      <div className="signup-form-container">
        <form className="signup-form">
          <input 
            type="email" 
            placeholder="Mobile Number or Email" 
            className="signup-input"
          />
          <input 
            type="text" 
            placeholder="Full Name" 
            className="signup-input"
          />
          <input 
            type="text" 
            placeholder="Username" 
            className="signup-input"
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="signup-input"
          />
          
          <button type="submit" className="signup-button">
            Sign Up
          </button>
        </form>

        {/* Terms */}
        <div className="signup-terms">
          <p>
            By signing up, you agree to our{' '}
            <a href="#" className="terms-link">Terms</a>,{' '}
            <a href="#" className="terms-link">Data Policy</a> and{' '}
            <a href="#" className="terms-link">Cookies Policy</a>.
          </p>
        </div>
      </div>

      {/* Login Link */}
      <div className="signup-login-link">
        <div className="login-box">
          <p>Have an account? <Link href="/" className="login-link">Log in</Link></p>
        </div>
      </div>

      {/* Get the app */}
      <div className="get-app-signup">
        <p>Get the app.</p>
        <div className="app-stores">
          <div className="app-store-button">App Store</div>
          <div className="app-store-button">Google Play</div>
        </div>
      </div>
    </div>
  )
}
