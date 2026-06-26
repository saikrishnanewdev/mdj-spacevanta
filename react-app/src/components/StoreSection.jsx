export default function StoreSection({ onOpenModal }) {
  return (
    <section className="store-section" id="store">
      <div className="store-container">
        
        {/* SECTION HEADER */}
        <div className="store-header">
          <h2 className="store-section-title">Hardware Store</h2>
          <p className="store-section-subtitle">
            Sleek, industrial-grade physical devices calibrated for high-speed automated academic grading.
          </p>
        </div>

        {/* PRODUCT SHOWCASE CARD */}
        <div className="product-card">
          
          {/* Product Image Section */}
          <div className="product-image-box">
            <div className="product-badge">INTEGRATED HARDWARE</div>
            <img 
              src="/product_new.jpg" 
              alt="SpaceVanta High-Speed Document Printer" 
              className="product-img"
            />
            <div className="product-image-glow" />
          </div>

          {/* Product Details Section */}
          <div className="product-details-box">
            <h3 className="product-title">SpaceVanta High-Speed Document Printer/Scanner</h3>
            <p className="product-tagline">Calibrated for MDJ SpaceVanta AI Examination grading</p>
            
            <p className="product-description">
              Deploy an industrial-grade sheets-fed scanner and high-resolution duplex laser printer. 
              Designed to handle volume examination bundles with multi-page ultrasonic sensors to prevent double-feeds. 
              Integrates directly with the SpaceVanta cloud to sync scanned sheets instantly to your AI grading ledger.
            </p>

            {/* TECHNICAL SPECIFICATIONS GRID */}
            <div className="specs-grid">
              <div className="spec-item">
                <span className="spec-label">ADF Feeder Capacity</span>
                <span className="spec-value">150 Sheets (Duplex)</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Scanning Speed</span>
                <span className="spec-value">95 PPM / 190 IPM</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Print Quality</span>
                <span className="spec-value">1200 x 1200 DPI</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Sync Connection</span>
                <span className="spec-value">Wi-Fi / Direct Cloud</span>
              </div>
            </div>

            {/* PRICING & PURCHASE ACTIONS */}
            <div className="product-price-row">
              <div className="price-tag">
                <span className="currency">$</span>
                <span className="amount">1,299</span>
                <span className="period">/ unit</span>
              </div>
              
              <button 
                type="button" 
                className="btn btn-teal btn-bracket purchase-btn"
                onClick={onOpenModal}
              >
                [GET A DEMO & QUOTE]
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}
