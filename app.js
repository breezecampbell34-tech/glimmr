/* ====== CONFIG (edit these) ====== */
const GLIMMR_EMAIL = "hello@example.com";              // replace with your email
const GLIMMR_WHATSAPP = "18760000000";                 // digits only, country code first (e.g., 1876xxxxxxx)
const CURRENCY = "JMD";

/* ====== UTIL ====== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const fmtCurrency = (n) => {
  try { return new Intl.NumberFormat('en-JM',{style:'currency',currency:CURRENCY,maximumFractionDigits:0}).format(n); }
  catch { return `JMD $${Math.round(n).toLocaleString()}`; }
};
const save = (k,v)=> localStorage.setItem(k, JSON.stringify(v));
const load = (k, d=[]) => { try{ return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } };
const byId = (id) => document.getElementById(id);

/* ====== DATA (sample products) ====== */
const PRODUCTS = [
  {id:"w1", name:"Mirror Welcome Sign – Classic", price:8000, category:"welcome", img:"", desc:"Timeless serif lettering on mirror.", featured:1},
  {id:"w2", name:"Mirror Welcome Sign – Script", price:9500, category:"welcome", img:"", desc:"Elegant script font, custom names.", featured:1},
  {id:"s1", name:"Seating Chart – 100 Guests", price:18000, category:"seating", img:"", desc:"Mirror/acrylic, table-by-table.", featured:1},
  {id:"s2", name:"Seating Chart – 150 Guests", price:22000, category:"seating", img:"", desc:"Larger layout, design included.", featured:0},
  {id:"v1", name:"Vinyl Decal Set – Champagne Flutes (10)", price:3000, category:"vinyl", img:"", desc:"Names/dates pre‑cut, easy transfer.", featured:0},
  {id:"v2", name:"Custom Name Decal (per piece)", price:1500, category:"vinyl", img:"", desc:"One custom name decal.", featured:0},
  {id:"r1", name:"Easel Rental – Standard", price:2000, category:"rental", img:"", desc:"Per event rental.", featured:0},
  {id:"r2", name:"Easel Rental – Premium", price:3500, category:"rental", img:"", desc:"Per event rental.", featured:0},
];

/* ====== CART STATE ====== */
const CART_KEY = "glimmr_cart";
let cart = load(CART_KEY, []); // [{id, qty}, ...]

const cartCount = () => cart.reduce((n, it) => n + it.qty, 0);
const cartTotal = () => cart.reduce((sum, it) => {
  const p = PRODUCTS.find(x=>x.id===it.id); return sum + (p ? p.price*it.qty : 0);
}, 0);

/* ====== NAV / ACTIVE ====== */
function initNav(){
  const page = document.body.getAttribute("data-page");
  $$("#nav-menu a").forEach(a => { if (a.dataset.active === page) a.classList.add("active"); });
  const toggle = $(".nav-toggle");
  if(toggle){
    toggle.addEventListener("click", ()=>{
      const menu = $("#nav-menu");
      const open = !menu.classList.contains("open");
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
  }
}

/* ====== RENDER PRODUCTS ====== */
function renderProducts(){
  const grid = byId("product-grid");
  if(!grid) return;

  const q = byId("search");
  const cat = byId("category");
  const sort = byId("sort");

  const apply = () => {
    let list = PRODUCTS.slice();

    // search
    const term = (q.value || "").toLowerCase().trim();
    if (term) list = list.filter(p => (p.name + " " + p.desc).toLowerCase().includes(term));

    // category
    if (cat.value !== "all") list = list.filter(p => p.category === cat.value);

    // sort
    if (sort.value === "price-asc") list.sort((a,b)=> a.price-b.price);
    if (sort.value === "price-desc") list.sort((a,b)=> b.price-a.price);
    if (sort.value === "name-asc") list.sort((a,b)=> a.name.localeCompare(b.name));
    if (sort.value === "featured") list.sort((a,b)=> b.featured - a.featured);

    // render
    grid.innerHTML = list.map(p => `
      <article class="product" data-id="${p.id}">
        <div class="p-img" role="img" aria-label="${p.name}">
          <!-- Placeholder visual -->
          <svg width="100" height="60" viewBox="0 0 100 60" aria-hidden="true">
            <rect width="100" height="60" fill="#e9e9ee"></rect>
            <text x="50" y="35" text-anchor="middle" font-size="10" fill="#999">GLIMMR</text>
          </svg>
        </div>
        <div class="p-body">
          <h3>${p.name}</h3>
          <p class="muted">${p.desc}</p>
          <div class="price">${fmtCurrency(p.price)}</div>
        </div>
        <div class="p-actions">
          <button class="btn" data-action="details">Details</button>
          <button class="btn primary" data-action="add">Add to Cart</button>
        </div>
      </article>
    `).join("");
  };

  [q,cat,sort].forEach(el=> el && el.addEventListener("input", apply));
  apply();

  grid.addEventListener("click", (e)=>{
    const btn = e.target.closest("[data-action]");
    if(!btn) return;
    const card = e.target.closest(".product");
    const id = card?.dataset.id;
    if(!id) return;

    if(btn.dataset.action === "add"){ addToCart(id, 1); openCart(); }
    if(btn.dataset.action === "details"){ showDetails(id); }
  });
}

function showDetails(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  const modal = byId("checkout-modal");
  modal.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-label="Product details">
      <div class="cart-head">
        <strong>${p.name}</strong>
        <button class="btn" data-close>Close</button>
      </div>
      <div style="padding:12px">
        <p>${p.desc}</p>
        <p class="price">${fmtCurrency(p.price)}</p>
        <button class="btn primary" data-add>Add to Cart</button>
      </div>
    </div>`;
  openModal(modal);
  modal.querySelector("[data-add]").addEventListener("click", ()=> { addToCart(id,1); closeModal(modal); openCart(); });
  modal.querySelector("[data-close]").addEventListener("click", ()=> closeModal(modal));
}

/* ====== CART RENDER ====== */
function addToCart(id, qty=1){
  const i = cart.findIndex(x=>x.id===id);
  if(i>=0){ cart[i].qty += qty; }
  else { cart.push({id, qty}); }
  save(CART_KEY, cart);
  updateCartBadge();
  renderCart();
}
function updateCartBadge(){ const el = byId("cart-count"); if(el) el.textContent = String(cartCount()); }

function renderCart(){
  const drawer = byId("cart-drawer");
  if(!drawer) return;
  if(cart.length === 0){
    drawer.innerHTML = `
      <div class="cart-head"><strong>Your Cart</strong><button class="btn" data-close>Close</button></div>
      <div class="cart-items"><p class="muted">Cart is empty.</p></div>
      <div class="cart-foot">
        <div class="muted">Tip: Add a welcome sign and easel rental.</div>
      </div>`;
  } else {
    const rows = cart.map(it=>{
      const p = PRODUCTS.find(x=>x.id===it.id);
      if(!p) return "";
      return `
        <div class="cart-item" data-id="${it.id}">
          <div style="width:54px;height:54px;background:#f0f0f3;border:1px solid var(--line);border-radius:8px"></div>
          <div>
            <div><strong>${p.name}</strong></div>
            <div class="muted">${fmtCurrency(p.price)} each</div>
            <div class="qty">
              <button data-qty="-1" aria-label="Decrease quantity">–</button>
              <span>${it.qty}</span>
              <button data-qty="1" aria-label="Increase quantity">+</button>
              <button data-remove class="btn" style="margin-left:8px">Remove</button>
            </div>
          </div>
          <div><strong>${fmtCurrency(p.price * it.qty)}</strong></div>
        </div>`;
    }).join("");

    const subtotal = cartTotal();

    drawer.innerHTML = `
      <div class="cart-head"><strong>Your Cart</strong><button class="btn" data-close>Close</button></div>
      <div class="cart-items">${rows}</div>
      <div class="cart-foot">
        <label>Promo Code
          <input id="promo-code" placeholder="Enter code (GLIMMR5)">
        </label>
        <div id="totals" class="muted"></div>
        <button class="btn primary" id="checkout-btn">Proceed to Checkout</button>
      </div>`;
    updateTotals();
  }

  drawer.querySelectorAll("[data-qty]").forEach(b=>{
    b.addEventListener("click", (e)=>{
      const row = e.target.closest(".cart-item");
      const id = row.dataset.id; const change = Number(e.target.dataset.qty);
      const i = cart.findIndex(x=>x.id===id); if(i<0) return;
      cart[i].qty += change;
      if(cart[i].qty<=0) cart.splice(i,1);
      save(CART_KEY, cart); updateCartBadge(); renderCart();
    });
  });
  drawer.querySelectorAll("[data-remove]").forEach(b=>{
    b.addEventListener("click",(e)=>{
      const id = e.target.closest(".cart-item").dataset.id;
      cart = cart.filter(x=>x.id!==id); save(CART_KEY,cart); updateCartBadge(); renderCart();
    });
  });

  const closeBtn = drawer.querySelector("[data-close]");
  if(closeBtn) closeBtn.addEventListener("click", closeCart);

  const promoInput = byId("promo-code");
  if(promoInput) promoInput.addEventListener("input", updateTotals);

  const checkoutBtn = byId("checkout-btn");
  if(checkoutBtn) checkoutBtn.addEventListener("click", openCheckout);
}

function updateTotals(){
  const subtotal = cartTotal();
  const code = (byId("promo-code")?.value || "").trim().toUpperCase();
  const discount = (code === "GLIMMR5") ? Math.round(subtotal * 0.05) : 0;
  const estDelivery = 0; // set on quote; leave 0 here
  const total = Math.max(subtotal - discount + estDelivery, 0);
  const el = byId("totals");
  if(!el) return;
  el.innerHTML = `
    Subtotal: <strong>${fmtCurrency(subtotal)}</strong><br>
    Discount: <strong>− ${fmtCurrency(discount)}</strong><br>
    Delivery (TBD): <strong>${fmtCurrency(estDelivery)}</strong><br>
    <hr>
    Total: <strong>${fmtCurrency(total)}</strong>
  `;
}

/* ====== CART OPEN/CLOSE ====== */
function openCart(){ const d = byId("cart-drawer"); d?.classList.add("open"); d?.setAttribute("aria-hidden","false"); }
function closeCart(){ const d = byId("cart-drawer"); d?.classList.remove("open"); d?.setAttribute("aria-hidden","true"); }

/* ====== MODAL ====== */
function openModal(m){ m.classList.add("open"); m.setAttribute("aria-hidden","false"); }
function closeModal(m){ m.classList.remove("open"); m.setAttribute("aria-hidden","true"); }

/* ====== CHECKOUT ====== */
function openCheckout(){
  const modal = byId("checkout-modal");
  const order = cart.map(it=>{
    const p = PRODUCTS.find(x=>x.id===it.id);
    return p ? `• ${p.name} × ${it.qty} — ${fmtCurrency(p.price*it.qty)}` : "";
  }).join("\n");
  const subtotal = cartTotal();
  const code = (byId("promo-code")?.value || "").trim().toUpperCase();
  const discount = (code==="GLIMMR5")? Math.round(subtotal*0.05) : 0;
  const total = subtotal - discount;

  modal.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-label="Checkout">
      <div class="cart-head">
        <strong>Checkout</strong>
        <button class="btn" data-close>Close</button>
      </div>
      <div style="padding:12px">
        <p><strong>Order Summary</strong></p>
        <pre style="background:#f7f7f8;padding:10px;border-radius:8px;white-space:pre-wrap">${order || "Cart is empty."}</pre>
        <p>Subtotal: ${fmtCurrency(subtotal)}${discount?` | Discount: −${fmtCurrency(discount)}`:""}<br><strong>Total (excl. delivery): ${fmtCurrency(total)}</strong></p>
        <form id="checkout-form" class="form">
          <label>Full Name<input required name="name" autocomplete="name"></label>
          <label>Email<input required type="email" name="email" autocomplete="email"></label>
          <label>Phone<input type="tel" name="phone" autocomplete="tel"></label>
          <label>Event Date<input type="date" name="eventDate"></label>
          <label>Delivery or Pickup
            <select name="method">
              <option value="Delivery">Delivery (quoted)</option>
              <option value="Pickup">Pickup (by appointment)</option>
            </select>
          </label>
          <label>Address / Venue (if delivery)<input name="address"></label>
          <label>Notes (names, fonts, colours, Pinterest links)
            <textarea name="notes" rows="4"></textarea>
          </label>
          <div class="row">
            <button type="submit" class="btn primary">Submit via Email</button>
            <button type="button" id="wa-btn" class="btn">Send via WhatsApp</button>
            <button type="button" id="copy-btn" class="btn ghost">Copy Summary</button>
          </div>
          <p class="muted">We’ll confirm final pricing, delivery, and design proofs before payment.</p>
        </form>
      </div>
    </div>`;

  openModal(modal);

  modal.querySelector("[data-close]").addEventListener("click", ()=> closeModal(modal));
  const form = byId("checkout-form");
  form?.addEventListener("submit", (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const msg = buildOrderMessage(data, code);
    const mailto = `mailto:${encodeURIComponent(GLIMMR_EMAIL)}?subject=${encodeURIComponent("New Glimmr Order")}&body=${encodeURIComponent(msg)}`;
    window.location.href = mailto;
  });

  byId("wa-btn")?.addEventListener("click", ()=>{
    const data = Object.fromEntries(new FormData(byId("checkout-form")).entries());
    const msg = buildOrderMessage(data, code);
    const wa = `https://wa.me/${GLIMMR_WHATSAPP}?text=${encodeURIComponent(msg)}`;
    window.open(wa, "_blank");
  });

  byId("copy-btn")?.addEventListener("click", ()=>{
    const data = Object.fromEntries(new FormData(byId("checkout-form")).entries());
    const msg = buildOrderMessage(data, code);
    navigator.clipboard.writeText(msg).then(()=> alert("Order summary copied."));
  });
}

function buildOrderMessage(data, promo){
  const lines = cart.map(it=>{
    const p = PRODUCTS.find(x=>x.id===it.id);
    return p ? `• ${p.name} × ${it.qty} — ${fmtCurrency(p.price*it.qty)}` : "";
  }).join("\n");
  const subtotal = cartTotal();
  const discount = promo==="GLIMMR5" ? Math.round(subtotal*0.05) : 0;
  const total = subtotal - discount;

  return `New Glimmr Order
=====================
${lines || "(no items)"}

Subtotal: ${fmtCurrency(subtotal)}
${discount?`Discount (${promo}): −${fmtCurrency(discount)}\n`:""}Total (excl. delivery): ${fmtCurrency(total)}

Customer
--------
Name: ${data.name || ""}
Email: ${data.email || ""}
Phone: ${data.phone || ""}
Event Date: ${data.eventDate || ""}
Method: ${data.method || ""}
Address/Venue: ${data.address || ""}
Notes: ${data.notes || ""}

Preferences & next steps: confirm design, delivery, and payment link.`;
}

/* ====== CONTACT FORM (mailto fallback) ====== */
function initContactForm(){
  const form = byId("contact-form");
  if(!form) return;
  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const msg = `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone || ""}\n\nMessage:\n${data.message}`;
    const mailto = `mailto:${encodeURIComponent(GLIMMR_EMAIL)}?subject=${encodeURIComponent("Glimmr Enquiry")}&body=${encodeURIComponent(msg)}`;
    window.location.href = mailto;
  });
}

/* ====== LIFECYCLE ====== */
function init(){
  // Year
  const y = byId("year"); if(y) y.textContent = String(new Date().getFullYear());

  initNav();
  renderProducts();
  renderCart();
  updateCartBadge();

  const openCartBtn = byId("open-cart"); openCartBtn?.addEventListener("click", openCart);

  // close cart when clicking outside
  document.addEventListener("click", (e)=>{
    const d = byId("cart-drawer");
    if(!d) return;
    if(d.classList.contains("open") && !d.contains(e.target) && !e.target.closest("#open-cart")){
      closeCart();
    }
  });

  // Esc to close modal/cart
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape"){
      closeCart();
      const m = byId("checkout-modal"); m && closeModal(m);
    }
  });

  initContactForm();
}
document.addEventListener("DOMContentLoaded", init);
