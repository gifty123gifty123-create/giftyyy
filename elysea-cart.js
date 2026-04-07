/**
 * ELYSEA — Full Site JavaScript
 * Handles: Cart system, Login, Contact form, all nav + CTA buttons
 * Add to every page just before </body>:  <script src="elysea-cart.js"></script>
 */

(function () {
  "use strict";

  /* ═══════════════════════════════════════════════
     CART STORE  (sessionStorage — persists per tab)
  ═══════════════════════════════════════════════ */
  let cart = [];
  try { cart = JSON.parse(sessionStorage.getItem("elysea_cart") || "[]"); } catch (_) {}

  function saveCart()  { sessionStorage.setItem("elysea_cart", JSON.stringify(cart)); }

  function addItem(name, price) {
    const found = cart.find(i => i.name === name);
    found ? found.qty++ : cart.push({ name, price, qty: 1 });
    saveCart();
    renderCart();
    openCart();
    pulseBadge();
    toast(`${name} added to cart ✦`);
  }

  function removeItem(name) {
    cart = cart.filter(i => i.name !== name);
    saveCart(); renderCart();
  }

  function changeQty(name, delta) {
    const item = cart.find(i => i.name === name);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) removeItem(name);
    else { saveCart(); renderCart(); }
  }

  const cartTotal = () => cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = () => cart.reduce((s, i) => s + i.qty, 0);

  /* ═══════════════════════════════════════════════
     INJECT STYLES
  ═══════════════════════════════════════════════ */
  function injectStyles() {
    const s = document.createElement("style");
    s.textContent = `
      /* ── Overlay ── */
      #ec-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9998;opacity:0;pointer-events:none;transition:opacity .35s ease;backdrop-filter:blur(4px)}
      #ec-overlay.open{opacity:1;pointer-events:all}

      /* ── Panel ── */
      #ec-panel{position:fixed;top:0;right:0;width:390px;max-width:100vw;height:100%;z-index:9999;background:url('hie.jpg') center/cover no-repeat;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-left:1px solid rgba(183,110,121,.35);box-shadow:-8px 0 50px rgba(0,0,0,.8);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .42s cubic-bezier(.77,0,.175,1)}
      #ec-panel::before{content:'';position:absolute;inset:0;background:rgba(8,8,8,.85);z-index:0;pointer-events:none}
      #ec-head,#ec-items,#ec-foot{position:relative;z-index:1}
      #ec-panel.open{transform:translateX(0)}

      /* ── Header ── */
      #ec-head{display:flex;justify-content:space-between;align-items:center;padding:26px 26px 18px;border-bottom:1px solid rgba(183,110,121,.2)}
      #ec-head h2{font-family:'Cinzel',serif;font-size:18px;letter-spacing:4px;text-transform:uppercase;background:linear-gradient(to right,#b76e79,#f7cac9,#dfbe9f);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
      #ec-close{background:none;border:none;color:rgba(247,202,201,.6);font-size:24px;cursor:pointer;transition:color .25s,transform .3s;padding:4px 8px;line-height:1}
      #ec-close:hover{color:#f7cac9;transform:rotate(90deg)}

      /* ── Items ── */
      #ec-items{flex:1;overflow-y:auto;padding:18px 26px;scrollbar-width:thin;scrollbar-color:rgba(183,110,121,.35) transparent}
      #ec-items::-webkit-scrollbar{width:3px}
      #ec-items::-webkit-scrollbar-thumb{background:rgba(183,110,121,.35);border-radius:2px}

      /* ── Empty ── */
      #ec-empty{text-align:center;padding:70px 0;color:rgba(247,202,201,.4);font-family:'Cormorant Garamond',serif;font-size:17px;letter-spacing:2px}
      #ec-empty span{display:block;font-size:38px;margin-bottom:14px;opacity:.35}

      /* ── Item row ── */
      .ec-item{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(183,110,121,.12);animation:ecIn .3s ease}
      @keyframes ecIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
      .ec-iname{font-family:'Cinzel',serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#f7cac9;margin-bottom:4px}
      .ec-iprice{font-family:'Cormorant Garamond',serif;font-size:15px;color:#dfbe9f}
      .ec-ctrl{display:flex;align-items:center;gap:9px}
      .ec-qbtn{width:27px;height:27px;border-radius:50%;border:1px solid rgba(183,110,121,.45);background:rgba(183,110,121,.08);color:#f7cac9;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s,border-color .2s;line-height:1}
      .ec-qbtn:hover{background:rgba(183,110,121,.38);border-color:#b76e79}
      .ec-qnum{font-family:'Cinzel',serif;font-size:13px;color:#f7cac9;min-width:16px;text-align:center}
      .ec-rm{background:none;border:none;color:rgba(183,110,121,.45);font-size:17px;cursor:pointer;margin-left:5px;transition:color .2s,transform .2s;padding:4px}
      .ec-rm:hover{color:#f7cac9;transform:scale(1.2)}

      /* ── Footer ── */
      #ec-foot{padding:20px 26px 28px;border-top:1px solid rgba(183,110,121,.2)}
      #ec-total-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
      #ec-total-lbl{font-family:'Cinzel',serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:rgba(247,202,201,.55)}
      #ec-total-amt{font-family:'Cinzel',serif;font-size:22px;background:linear-gradient(to right,#b76e79,#f7cac9,#dfbe9f);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
      #ec-checkout{width:100%;padding:14px;border-radius:35px;border:1px solid rgba(183,110,121,.55);background:rgba(183,110,121,.1);color:#f7cac9;font-family:'Cinzel',serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;transition:background .3s,box-shadow .3s,color .3s}
      #ec-checkout:hover{background:rgba(183,110,121,.45);box-shadow:0 0 22px rgba(183,110,121,.35);color:#fff}

      /* ── FAB ── */
      #ec-fab{position:fixed;bottom:32px;right:32px;z-index:9997;width:56px;height:56px;border-radius:50%;background:rgba(10,10,10,.88);border:1px solid rgba(183,110,121,.5);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.55);transition:transform .3s,box-shadow .3s,border-color .3s}
      #ec-fab:hover{transform:scale(1.1);border-color:#b76e79;box-shadow:0 8px 28px rgba(183,110,121,.3)}
      #ec-fab svg{width:22px;height:22px;stroke:#b76e79;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
      #ec-badge{position:absolute;top:-3px;right:-3px;width:19px;height:19px;border-radius:50%;background:linear-gradient(135deg,#b76e79,#f7cac9);color:#0a0a0a;font-family:'Cinzel',serif;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(0);transition:opacity .25s,transform .25s}
      #ec-badge.on{opacity:1;transform:scale(1)}
      #ec-badge.pulse{animation:bdgPulse .35s ease}
      @keyframes bdgPulse{0%{transform:scale(1)}50%{transform:scale(1.45)}100%{transform:scale(1)}}

      /* ── Toast ── */
      #ec-toast{position:fixed;bottom:105px;right:32px;z-index:10000;background:rgba(8,8,8,.92);border:1px solid rgba(183,110,121,.38);border-radius:40px;padding:11px 20px;font-family:'Cinzel',serif;font-size:10px;letter-spacing:2px;color:#f7cac9;backdrop-filter:blur(10px);opacity:0;transform:translateY(8px);transition:opacity .28s,transform .28s;pointer-events:none;white-space:nowrap}
      #ec-toast.show{opacity:1;transform:translateY(0)}

      /* ── Modal (checkout / forgot / register) ── */
      #ec-modal{position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:opacity .3s}
      #ec-modal.open{opacity:1;pointer-events:all}
      #ec-modal-box{width:460px;max-width:92vw;padding:45px 40px;border-radius:24px;background:url('hie.jpg') center/cover no-repeat;border:1px solid rgba(183,110,121,.35);box-shadow:0 20px 60px rgba(0,0,0,.8);text-align:center;position:relative;animation:modalIn .35s ease}
      #ec-modal-box::before{content:'';position:absolute;inset:0;border-radius:24px;background:rgba(8,8,8,.82);z-index:0;pointer-events:none}
      #ec-modal-close,#ec-modal-title,#ec-modal-body,#ec-modal-cta{position:relative;z-index:1}
      @keyframes modalIn{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}
      #ec-modal-close{position:absolute;top:16px;right:20px;background:none;border:none;color:rgba(247,202,201,.5);font-size:22px;cursor:pointer;transition:color .2s,transform .3s}
      #ec-modal-close:hover{color:#f7cac9;transform:rotate(90deg)}
      #ec-modal-title{font-family:'Cinzel',serif;font-size:22px;letter-spacing:4px;text-transform:uppercase;background:linear-gradient(to right,#b76e79,#f7cac9,#dfbe9f);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:10px}
      #ec-modal-body{font-family:'Cormorant Garamond',serif;font-size:17px;color:rgba(247,202,201,.75);line-height:1.7;margin-bottom:28px}
      #ec-modal-cta{padding:13px 40px;border-radius:35px;border:1px solid rgba(183,110,121,.55);background:rgba(183,110,121,.12);color:#f7cac9;font-family:'Cinzel',serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;transition:background .3s,box-shadow .3s}
      #ec-modal-cta:hover{background:rgba(183,110,121,.45);box-shadow:0 0 20px rgba(183,110,121,.3)}

      /* ── Button feedback ── */
      .ec-btn-added{background:rgba(183,110,121,.35)!important;color:#fff!important;border-color:#b76e79!important}

      /* ── Modal input fields ── */
      .ec-modal-input{width:100%;padding:13px 20px;border-radius:30px;border:1px solid rgba(183,110,121,.35);background:rgba(255,255,255,.04);color:#f7cac9;font-family:'Cormorant Garamond',serif;font-size:16px;margin-bottom:14px;outline:none;transition:border-color .3s}
      .ec-modal-input:focus{border-color:rgba(247,202,201,.6);background:rgba(255,255,255,.07)}
      .ec-modal-input::placeholder{color:rgba(247,202,201,.4)}
      .ec-modal-input-label{font-family:'Cinzel',serif;font-size:10px;letter-spacing:2px;color:rgba(247,202,201,.5);text-align:left;display:block;margin-bottom:6px;text-transform:uppercase}

      /* ── Payment method cards ── */
      .ec-pay-methods{display:flex;flex-direction:column;gap:12px;margin-bottom:22px}
      .ec-pay-option{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:16px;border:1px solid rgba(183,110,121,.25);background:rgba(255,255,255,.03);cursor:pointer;transition:border-color .25s,background .25s}
      .ec-pay-option:hover{border-color:rgba(183,110,121,.6);background:rgba(183,110,121,.08)}
      .ec-pay-option.selected{border-color:#b76e79;background:rgba(183,110,121,.15);box-shadow:0 0 14px rgba(183,110,121,.2)}
      .ec-pay-option input[type=radio]{accent-color:#b76e79;width:16px;height:16px;cursor:pointer}
      .ec-pay-icon{font-size:22px;min-width:28px;text-align:center}
      .ec-pay-label{font-family:'Cinzel',serif;font-size:12px;letter-spacing:2px;color:#f7cac9;text-transform:uppercase}
      .ec-pay-sub{font-family:'Cormorant Garamond',serif;font-size:13px;color:rgba(247,202,201,.5);margin-top:2px}

      /* ── Card fields panel ── */
      #ec-card-fields{margin-bottom:18px;display:none}
      #ec-card-fields.visible{display:block}
      .ec-card-row{display:flex;gap:10px}
      .ec-card-row .ec-modal-input{margin-bottom:0}

      /* ── UPI field panel ── */
      #ec-upi-field{margin-bottom:18px;display:none}
      #ec-upi-field.visible{display:block}

      /* ── Modal secondary btn ── */
      #ec-modal-cta2{padding:13px 40px;border-radius:35px;border:1px solid rgba(183,110,121,.3);background:transparent;color:rgba(247,202,201,.55);font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:background .3s,color .3s;margin-top:12px;display:none}
      #ec-modal-cta2.visible{display:inline-block}
      #ec-modal-cta2:hover{background:rgba(255,255,255,.05);color:#f7cac9}
    `;
    document.head.appendChild(s);
  }

  /* ═══════════════════════════════════════════════
     INJECT DOM
  ═══════════════════════════════════════════════ */
  function injectDOM() {
    document.body.insertAdjacentHTML("beforeend", `
      <div id="ec-overlay"></div>

      <div id="ec-panel" aria-label="Shopping cart">
        <div id="ec-head">
          <h2>Your Cart</h2>
          <button id="ec-close" aria-label="Close">&#x2715;</button>
        </div>
        <div id="ec-items"></div>
        <div id="ec-foot">
          <div id="ec-total-row">
            <span id="ec-total-lbl">Total</span>
            <span id="ec-total-amt">$0.00</span>
          </div>
          <button id="ec-checkout">Proceed to Checkout</button>
        </div>
      </div>

      <button id="ec-fab" aria-label="Open cart">
        <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        <span id="ec-badge"></span>
      </button>

      <div id="ec-toast"></div>

      <div id="ec-modal">
        <div id="ec-modal-box">
          <button id="ec-modal-close">&#x2715;</button>
          <div id="ec-modal-title"></div>
          <div id="ec-modal-body"></div>
          <button id="ec-modal-cta"></button>
          <br>
          <button id="ec-modal-cta2"></button>
        </div>
      </div>
    `);

    /* ── listeners ── */
    document.getElementById("ec-overlay").addEventListener("click", closeCart);
    document.getElementById("ec-close").addEventListener("click", closeCart);
    document.getElementById("ec-fab").addEventListener("click", openCart);
    document.getElementById("ec-checkout").addEventListener("click", handleCheckout);
    document.getElementById("ec-modal-close").addEventListener("click", closeModal);
    document.addEventListener("keydown", e => { if (e.key === "Escape") { closeCart(); closeModal(); } });
  }

  /* ═══════════════════════════════════════════════
     RENDER CART
  ═══════════════════════════════════════════════ */
  function renderCart() {
    const wrap  = document.getElementById("ec-items");
    const total = document.getElementById("ec-total-amt");
    const badge = document.getElementById("ec-badge");
    if (!wrap) return;

    wrap.innerHTML = "";

    if (!cart.length) {
      wrap.innerHTML = `<div id="ec-empty"><span>✦</span>Your cart is empty</div>`;
      total.textContent = "$0.00";
      badge.textContent = "";
      badge.classList.remove("on");
      return;
    }

    cart.forEach(item => {
      const row = document.createElement("div");
      row.className = "ec-item";
      row.innerHTML = `
        <div>
          <div class="ec-iname">${item.name}</div>
          <div class="ec-iprice">$${(item.price * item.qty).toFixed(2)}</div>
        </div>
        <div class="ec-ctrl">
          <button class="ec-qbtn" data-n="${item.name}" data-d="-1">−</button>
          <span class="ec-qnum">${item.qty}</span>
          <button class="ec-qbtn" data-n="${item.name}" data-d="1">+</button>
          <button class="ec-rm" data-n="${item.name}">✕</button>
        </div>`;
      wrap.appendChild(row);
    });

    wrap.querySelectorAll(".ec-qbtn").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.n, +b.dataset.d)));
    wrap.querySelectorAll(".ec-rm").forEach(b => b.addEventListener("click", () => removeItem(b.dataset.n)));

    total.textContent = `$${cartTotal().toFixed(2)}`;
    const c = cartCount();
    badge.textContent = c > 99 ? "99+" : c;
    badge.classList.toggle("on", c > 0);
  }

  /* ═══════════════════════════════════════════════
     OPEN / CLOSE CART
  ═══════════════════════════════════════════════ */
  function openCart()  {
    document.getElementById("ec-panel")?.classList.add("open");
    document.getElementById("ec-overlay")?.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    document.getElementById("ec-panel")?.classList.remove("open");
    document.getElementById("ec-overlay")?.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ═══════════════════════════════════════════════
     MODAL HELPER
  ═══════════════════════════════════════════════ */
  function showModal(title, body, ctaText, ctaFn, cta2Text, cta2Fn) {
    document.getElementById("ec-modal-title").textContent = title;
    document.getElementById("ec-modal-body").innerHTML   = body;

    const cta = document.getElementById("ec-modal-cta");
    cta.textContent = ctaText;
    cta.onclick = () => { if (ctaFn) ctaFn(); };

    const cta2 = document.getElementById("ec-modal-cta2");
    if (cta2Text) {
      cta2.textContent = cta2Text;
      cta2.classList.add("visible");
      cta2.onclick = () => { if (cta2Fn) cta2Fn(); };
    } else {
      cta2.classList.remove("visible");
      cta2.onclick = null;
    }

    document.getElementById("ec-modal").classList.add("open");
  }
  function closeModal() { document.getElementById("ec-modal")?.classList.remove("open"); }

  /* ═══════════════════════════════════════════════
     TOAST
  ═══════════════════════════════════════════════ */
  let _toastTimer;
  function toast(msg) {
    const el = document.getElementById("ec-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }

  function pulseBadge() {
    const b = document.getElementById("ec-badge");
    if (!b) return;
    b.classList.remove("pulse");
    void b.offsetWidth;
    b.classList.add("pulse");
  }

  /* ═══════════════════════════════════════════════
     PRICE PARSER
  ═══════════════════════════════════════════════ */
  function parsePrice(el) {
    if (!el) return 0;
    const m = el.textContent.match(/\$?([\d,]+\.?\d*)/);
    return m ? parseFloat(m[1].replace(",", "")) : 0;
  }

  /* ═══════════════════════════════════════════════
     GET PRODUCT DATA FROM BUTTON CONTEXT
  ═══════════════════════════════════════════════ */
  function getProduct(btn) {
    const card =
      btn.closest(".card") ||
      btn.closest(".glass-box") ||
      btn.closest(".product-card") ||
      btn.closest(".glass-section");
    if (!card) return null;

    const nameEl =
      card.querySelector(".title") ||
      card.querySelector(".info h3") ||
      card.querySelector(".product-info h3") ||
      card.querySelector("h3");

    const priceEl = card.querySelector(".price");
    return { name: nameEl?.textContent.trim() || "Product", price: parsePrice(priceEl) };
  }

  /* ═══════════════════════════════════════════════
     BUTTON FLASH FEEDBACK
  ═══════════════════════════════════════════════ */
  function flashBtn(btn) {
    const orig = btn.textContent;
    btn.textContent = "Added ✦";
    btn.classList.add("ec-btn-added");
    setTimeout(() => { btn.textContent = orig; btn.classList.remove("ec-btn-added"); }, 1400);
  }

  /* ═══════════════════════════════════════════════
     WIRE: ADD TO CART BUTTONS
  ═══════════════════════════════════════════════ */
  function bindCartButtons() {
    document.querySelectorAll(".cart-bar").forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault();
        const p = getProduct(btn);
        if (p) { addItem(p.name, p.price); flashBtn(btn); }
      });
    });

    document.querySelectorAll("button.btn, a.btn").forEach(btn => {
      if (/add to cart/i.test(btn.textContent)) {
        btn.addEventListener("click", e => {
          e.preventDefault();
          const p = getProduct(btn);
          if (p) { addItem(p.name, p.price); flashBtn(btn); }
        });
      }
    });
  }

  /* ═══════════════════════════════════════════════
     WIRE: BEGIN THE JOURNEY (index.html)
  ═══════════════════════════════════════════════ */
  function bindBeginJourney() {
    document.querySelectorAll("a.btn, button.btn").forEach(btn => {
      if (/begin the journey/i.test(btn.textContent)) {
        btn.addEventListener("click", e => {
          e.preventDefault();
          const target = document.querySelector("#prod1");
          target ? target.scrollIntoView({ behavior: "smooth" }) : null;
        });
      }
    });
  }

  /* ═══════════════════════════════════════════════
     WIRE: DISCOVER MORE (about.html)
  ═══════════════════════════════════════════════ */
  function bindDiscoverMore() {
    document.querySelectorAll("a.btn, button.btn").forEach(btn => {
      if (/discover more/i.test(btn.textContent)) {
        btn.addEventListener("click", e => {
          e.preventDefault();
          showModal(
            "The Elysea Story",
            `Elysea was born from a reverence for the divine feminine. Every fragrance is an ode to the Greek goddesses — their power, their mystery, their eternal elegance.<br><br>
             Our perfumers travel across ancient lands to source the rarest botanicals, distilling them into scents that become a second skin.`,
            "Shop the Collection",
            () => { closeModal(); window.location.href = "products.html"; }
          );
        });
      }
    });
  }

  /* ═══════════════════════════════════════════════
     WIRE: CHECKOUT → ORDER SUMMARY → PAYMENT
  ═══════════════════════════════════════════════ */
  function handleCheckout() {
    if (!cart.length) { toast("Your cart is empty ✦"); return; }

    const lines = cart.map(i =>
      `<span style="color:#dfbe9f;font-family:'Cinzel',serif;font-size:13px;letter-spacing:1px">${i.name} × ${i.qty}</span> — $${(i.price * i.qty).toFixed(2)}`
    ).join("<br>");

    closeCart();
    showModal(
      "Order Summary",
      `${lines}<br><br><strong style="color:#f7cac9;font-family:'Cinzel',serif;letter-spacing:2px">Total: $${cartTotal().toFixed(2)}</strong>`,
      "Place Order",
      () => showPaymentModal(),
      "Continue Shopping",
      () => { closeModal(); openCart(); }
    );
  }

  /* ═══════════════════════════════════════════════
     PAYMENT MODAL
  ═══════════════════════════════════════════════ */
  function showPaymentModal() {
    const total = cartTotal().toFixed(2);

    const body = `
      <p style="margin-bottom:20px;font-size:15px;color:rgba(247,202,201,.6);">Amount to pay: <strong style="color:#f7cac9;font-family:'Cinzel',serif;">$${total}</strong></p>

      <div class="ec-pay-methods">
        <label class="ec-pay-option selected" id="ec-pay-card-opt">
          <input type="radio" name="ec-pay" value="card" checked>
          <span class="ec-pay-icon">💳</span>
          <div>
            <div class="ec-pay-label">Credit / Debit Card</div>
            <div class="ec-pay-sub">Visa, Mastercard, Amex</div>
          </div>
        </label>
        <label class="ec-pay-option" id="ec-pay-upi-opt">
          <input type="radio" name="ec-pay" value="upi">
          <span class="ec-pay-icon">📱</span>
          <div>
            <div class="ec-pay-label">UPI</div>
            <div class="ec-pay-sub">GPay, PhonePe, Paytm</div>
          </div>
        </label>
        <label class="ec-pay-option" id="ec-pay-cod-opt">
          <input type="radio" name="ec-pay" value="cod">
          <span class="ec-pay-icon">📦</span>
          <div>
            <div class="ec-pay-label">Cash on Delivery</div>
            <div class="ec-pay-sub">Pay when you receive</div>
          </div>
        </label>
      </div>

      <div id="ec-card-fields" class="visible">
        <input class="ec-modal-input" id="ec-card-name" placeholder="Cardholder Name" autocomplete="off">
        <input class="ec-modal-input" id="ec-card-num" placeholder="Card Number (16 digits)" maxlength="19" autocomplete="off">
        <div class="ec-card-row">
          <input class="ec-modal-input" id="ec-card-exp" placeholder="MM / YY" maxlength="7" style="flex:1">
          <input class="ec-modal-input" id="ec-card-cvv" placeholder="CVV" maxlength="3" type="password" style="flex:1">
        </div>
      </div>

      <div id="ec-upi-field">
        <input class="ec-modal-input" id="ec-upi-id" placeholder="yourname@upi" autocomplete="off">
      </div>
    `;

    showModal("Payment", body, "Pay Now", () => processPayment());

    // Wire payment option switching
    setTimeout(() => {
      const opts    = document.querySelectorAll(".ec-pay-option");
      const radios  = document.querySelectorAll('input[name="ec-pay"]');
      const cardF   = document.getElementById("ec-card-fields");
      const upiF    = document.getElementById("ec-upi-field");

      function updateFields() {
        const val = document.querySelector('input[name="ec-pay"]:checked')?.value;
        opts.forEach(o => o.classList.remove("selected"));
        document.querySelector(`input[name="ec-pay"]:checked`)?.closest(".ec-pay-option")?.classList.add("selected");
        cardF.classList.toggle("visible", val === "card");
        upiF.classList.toggle("visible",  val === "upi");
      }

      radios.forEach(r => r.addEventListener("change", updateFields));
      opts.forEach(o => o.addEventListener("click", () => { setTimeout(updateFields, 0); }));

      // Card number auto-formatting
      const cardNum = document.getElementById("ec-card-num");
      if (cardNum) {
        cardNum.addEventListener("input", () => {
          let v = cardNum.value.replace(/\D/g, "").slice(0, 16);
          cardNum.value = v.replace(/(.{4})/g, "$1 ").trim();
        });
      }

      // Expiry auto-formatting
      const cardExp = document.getElementById("ec-card-exp");
      if (cardExp) {
        cardExp.addEventListener("input", () => {
          let v = cardExp.value.replace(/\D/g, "").slice(0, 4);
          if (v.length >= 3) v = v.slice(0,2) + " / " + v.slice(2);
          cardExp.value = v;
        });
      }
    }, 100);
  }

  /* ═══════════════════════════════════════════════
     PROCESS PAYMENT
  ═══════════════════════════════════════════════ */
  function processPayment() {
    const method = document.querySelector('input[name="ec-pay"]:checked')?.value;

    if (method === "card") {
      const name   = document.getElementById("ec-card-name")?.value.trim();
      const num    = document.getElementById("ec-card-num")?.value.replace(/\s/g,"");
      const exp    = document.getElementById("ec-card-exp")?.value.trim();
      const cvv    = document.getElementById("ec-card-cvv")?.value.trim();

      if (!name)                     { toast("Please enter cardholder name ✦"); return; }
      if (num.length !== 16)         { toast("Please enter a valid 16-digit card number ✦"); return; }
      if (!/^\d{2}\s*\/\s*\d{2}$/.test(exp)) { toast("Please enter a valid expiry (MM / YY) ✦"); return; }
      if (cvv.length !== 3)          { toast("Please enter a valid 3-digit CVV ✦"); return; }
    }

    if (method === "upi") {
      const upiId = document.getElementById("ec-upi-id")?.value.trim();
      if (!upiId || !upiId.includes("@")) { toast("Please enter a valid UPI ID ✦"); return; }
    }

    // Success
    const labels = { card: "Card", upi: "UPI", cod: "Cash on Delivery" };
    cart = []; saveCart(); renderCart();

    showModal(
      "Order Confirmed ✦",
      `<span style="font-size:38px;display:block;margin-bottom:16px">🌸</span>
       Your order has been placed successfully!<br><br>
       <span style="color:#dfbe9f;font-family:'Cinzel',serif;font-size:13px;letter-spacing:1px">Payment via ${labels[method] || method}</span><br><br>
       You will receive a confirmation shortly. Thank you for choosing Elysea.`,
      "Continue Shopping",
      () => { closeModal(); }
    );
  }

  /* ═══════════════════════════════════════════════
     WIRE: LOGIN FORM
  ═══════════════════════════════════════════════ */
  function bindLogin() {
    const form = document.querySelector(".wrapper form");
    if (!form) return;

    form.addEventListener("submit", e => {
      e.preventDefault();
      const user = form.querySelector('input[type="text"]')?.value.trim();
      const pass = form.querySelector('input[type="password"]')?.value.trim();

      if (!user || !pass) { toast("Please fill in all fields ✦"); return; }

      toast(`Welcome back, ${user} ✦`);
      sessionStorage.setItem("elysea_user", user);
      setTimeout(() => window.location.href = "index.html", 1600);
    });

    // ── Forgot Password ──
    form.querySelectorAll("a").forEach(a => {
      if (/forgot/i.test(a.textContent)) {
        a.addEventListener("click", e => {
          e.preventDefault();
          showModal(
            "Reset Password",
            `<p style="margin-bottom:18px;font-size:15px">Enter the email address linked to your account and we'll send you a reset link.</p>
             <input class="ec-modal-input" id="ec-forgot-email" type="email" placeholder="Your email address" autocomplete="email">`,
            "Send Reset Link",
            () => {
              const email = document.getElementById("ec-forgot-email")?.value.trim();
              if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                toast("Please enter a valid email address ✦");
                return;
              }
              closeModal();
              showModal(
                "Check Your Inbox",
                `<span style="font-size:36px;display:block;margin-bottom:14px">✉️</span>
                 A password reset link has been sent to<br>
                 <strong style="color:#f7cac9">${email}</strong><br><br>
                 <span style="font-size:14px;color:rgba(247,202,201,.5)">Please check your spam folder if it doesn't arrive within a few minutes.</span>`,
                "Back to Login",
                () => closeModal()
              );
            }
          );
        });
      }
    });

    // ── Register ──
    const regLink = document.querySelector(".register-link a");
    if (regLink) {
      regLink.addEventListener("click", e => {
        e.preventDefault();
        showModal(
          "Create Account",
          `<input class="ec-modal-input" id="ec-reg-name"  placeholder="Full Name" autocomplete="name">
           <input class="ec-modal-input" id="ec-reg-email" type="email" placeholder="Email Address" autocomplete="email">
           <input class="ec-modal-input" id="ec-reg-pass"  type="password" placeholder="Password (min. 6 characters)">
           <input class="ec-modal-input" id="ec-reg-pass2" type="password" placeholder="Confirm Password">`,
          "Create Account",
          () => {
            const name  = document.getElementById("ec-reg-name")?.value.trim();
            const email = document.getElementById("ec-reg-email")?.value.trim();
            const pass  = document.getElementById("ec-reg-pass")?.value;
            const pass2 = document.getElementById("ec-reg-pass2")?.value;

            if (!name)                                            { toast("Please enter your full name ✦"); return; }
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast("Please enter a valid email ✦"); return; }
            if (!pass || pass.length < 6)                         { toast("Password must be at least 6 characters ✦"); return; }
            if (pass !== pass2)                                   { toast("Passwords do not match ✦"); return; }

            sessionStorage.setItem("elysea_user", name);
            closeModal();
            showModal(
              "Welcome to Elysea ✦",
              `<span style="font-size:36px;display:block;margin-bottom:14px">🌸</span>
               Your account has been created,<br>
               <strong style="color:#f7cac9">${name}</strong>.<br><br>
               You are now part of the Elysea world. Begin your fragrance journey.`,
              "Explore Collection",
              () => { closeModal(); window.location.href = "products.html"; }
            );
          }
        );
      });
    }
  }

  /* ═══════════════════════════════════════════════
     WIRE: CONTACT FORM (about.html)
  ═══════════════════════════════════════════════ */
  function bindContact() {
    const form = document.querySelector(".contact form");
    if (!form) return;

    form.addEventListener("submit", e => {
      e.preventDefault();
      const name  = form.querySelector('input[type="text"]')?.value.trim();
      const email = form.querySelector('input[type="email"]')?.value.trim();
      const msg   = form.querySelector("textarea")?.value.trim();

      if (!name || !email || !msg) { toast("Please fill in all fields ✦"); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast("Please enter a valid email ✦"); return; }

      form.reset();
      showModal(
        "Message Sent",
        `Thank you, <strong style="color:#f7cac9">${name}</strong>.<br><br>We've received your message and will respond to <em style="color:#dfbe9f">${email}</em> within 24 hours.`,
        "Back to Elysea",
        () => closeModal()
      );
    });
  }

  /* ═══════════════════════════════════════════════
     WIRE: NAV ACTIVE STATE
  ═══════════════════════════════════════════════ */
  function setActiveNav() {
    const page = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".navbar a").forEach(a => {
      const href = a.getAttribute("href");
      if (href && href.split("#")[0] === page) {
        a.style.filter = "drop-shadow(0 0 8px rgba(247,202,201,0.7))";
        a.style.opacity = "1";
      }
    });
  }

  /* ═══════════════════════════════════════════════
     ENHANCEMENT: SCROLL TO TOP BUTTON
  ═══════════════════════════════════════════════ */
  function injectScrollToTop() {
    const btn = document.createElement("button");
    btn.id = "ec-scroll-top";
    btn.innerHTML = "&#8679;";
    btn.setAttribute("aria-label", "Scroll to top");
    document.body.appendChild(btn);

    const style = document.createElement("style");
    style.textContent = `
      #ec-scroll-top{position:fixed;bottom:105px;right:32px;z-index:9996;width:42px;height:42px;border-radius:50%;border:1px solid rgba(183,110,121,.5);background:rgba(10,10,10,.88);color:#b76e79;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .3s,transform .3s,box-shadow .3s;backdrop-filter:blur(10px)}
      #ec-scroll-top.visible{opacity:1;pointer-events:all}
      #ec-scroll-top:hover{transform:translateY(-3px);box-shadow:0 0 18px rgba(183,110,121,.4);border-color:#b76e79}
    `;
    document.head.appendChild(style);

    window.addEventListener("scroll", () => {
      btn.classList.toggle("visible", window.scrollY > 300);
    });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ═══════════════════════════════════════════════
     ENHANCEMENT: WISHLIST HEART TOGGLE
  ═══════════════════════════════════════════════ */
  function injectWishlist() {
    let wishlist = [];
    try { wishlist = JSON.parse(sessionStorage.getItem("elysea_wish") || "[]"); } catch (_) {}

    const style = document.createElement("style");
    style.textContent = `
      .ec-wish{position:absolute;top:12px;right:12px;z-index:6;background:rgba(10,10,10,.6);border:1px solid rgba(183,110,121,.35);border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;transition:transform .2s,border-color .2s,background .2s;backdrop-filter:blur(6px)}
      .ec-wish:hover{transform:scale(1.15);border-color:#b76e79}
      .ec-wish.on{background:rgba(183,110,121,.25);border-color:#b76e79}
    `;
    document.head.appendChild(style);

    document.querySelectorAll(".card").forEach(card => {
      const titleEl = card.querySelector(".title");
      if (!titleEl) return;
      const name = titleEl.textContent.trim();

      const heart = document.createElement("button");
      heart.className = "ec-wish" + (wishlist.includes(name) ? " on" : "");
      heart.innerHTML = wishlist.includes(name) ? "♥" : "♡";
      heart.setAttribute("aria-label", "Toggle wishlist");
      card.style.position = "relative";
      card.appendChild(heart);

      heart.addEventListener("click", () => {
        const idx = wishlist.indexOf(name);
        if (idx === -1) {
          wishlist.push(name);
          heart.innerHTML = "♥";
          heart.classList.add("on");
          toast(`${name} added to wishlist ✦`);
        } else {
          wishlist.splice(idx, 1);
          heart.innerHTML = "♡";
          heart.classList.remove("on");
          toast(`${name} removed from wishlist ✦`);
        }
        sessionStorage.setItem("elysea_wish", JSON.stringify(wishlist));
      });
    });
  }

  /* ═══════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════ */
  function init() {
    injectStyles();
    injectDOM();
    renderCart();
    bindCartButtons();
    bindBeginJourney();
    bindDiscoverMore();
    bindLogin();
    bindContact();
    setActiveNav();
    injectScrollToTop();
    injectWishlist();
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();

})();
