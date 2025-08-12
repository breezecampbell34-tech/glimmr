/* ====== CONFIG (edit these) ====== */
const GLIMMR_EMAIL = "hello@example.com";     // replace with your email
const GLIMMR_WHATSAPP = "1876XXXXXXX";        // digits only, country code first (e.g., 1876...)
const CURRENCY = "JMD";

/* ====== UTIL ====== */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const fmtCurrency = (n) => {
  try { return new Intl.NumberFormat('en-JM',{style:'currency',currency:CURRENCY,maximumFractionDigits:0}).format(n); }
  catch { return `JMD $${Math.round(n).toLocaleString()}`; }
};
const save = (k,v)=> localStorage.setItem(k, JSON.stringify(v));
const load = (k, d=[]) => { try{ return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } };
const byId = (id) => document.getElementById(id);

/* ====== DATA (Glimmr) ====== */
const PRODUCTS = [
  // Mirror Welcome Sign (Rental)
  {
    id: "mirror-welcome",
    name: "Mirror Welcome Sign (Rental)",
    price: 8000, // base rental
    category: "welcome",
    img: "assets/img/mirror-welcome.jpg",
    desc: "Elegant mirror welcome sign with crisp vinyl lettering. 3 hours rental included. Delivery charged separately.",
    featured: 1
  },
  // Decor add-on
  {
    id: "decor-addon",
    name: "Add-on Décor",
    price: 2000,
    category: "decor",
    img: "assets/img/decor-addon.jpg",
    desc: "Candles, lanterns, flowers, and styling to elevate your signage.",
    featured: 0
  },
  // Foam/PVC Welcome Signs (Purchase) — with size options
  {
    id: "foamboard-welcome",
    name: "Foam Board / PVC Welcome Sign (Purchase)",
    price: 5250, // min price used for "from"
    category: "welcome",
    img: "assets/img/foamboard-welcome.jpg",
    desc: "Full-color printed welcome sign on foam board or PVC. Choose a size.",
    featured: 1,
    sizes: [
      { label: '18" × 24"', price: 5250 },
      { label: '24" × 36"', price: 9750 },
      { label: '30" × 40"', price: 13245 },
      { label: '36" × 48"', price: 18750 }
    ]
  },
  // Seating Chart
  {
    id: "seating-chart",
    name: "Seating Chart",
    price: 10000,
    category: "seating",
    img: "assets/img/seating-chart.jpg",
    desc: "Custom seating chart on mirror or acrylic board. Delivery charged separately.",
    featured: 1
  },
  // Vinyl for DIY
  {
    id: "vinyl-decals",
    name: "Custom Vinyl Decals",
    price: 1000,
    category: "vinyl",
    img: "assets/img/vinyl-decals.jpg",
    desc: "Personalised decals for DIY (boxes, glassware, favors). Starting price.",
    featured: 0
  }
];

/* helpers */
const minPrice = (p) => p.sizes ? Math.min(...p.sizes.map(s => s.price)) : p.price;

/* ====== CART STATE ====== */
const CART_KEY = "glimmr_cart";
let cart = load(CART_KEY, []); // items: {id, qty, unitPrice, optionLabel}

/* compute */
const cartCount = () => cart.reduce((n, it) => n + it.qty, 0);
const cartTotal = () => cart.reduce((sum, it) => sum + (it.unitPrice ?? (PRODUCTS.find(p=>p.id===it.id)?.price || 0)) * it.qty, 0);

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
    const term = (q?.value || "").toLowerCase().trim();
    if (term) list = list.filter(p => (p.name + " " + p.desc).toLowerCase().includes(term));

    // category
    if (cat && cat.value !== "all") list = list.filter(p => p.category === cat.value);

    // sort
    if (sort){
      if (sort.value === "price-asc") list.sort((a,b)=> minPrice(a)-minPrice(b));
      if (sort.value === "price-desc") list.sort((a,b)=> minPrice(b)-minPrice(a));
      if (sort.value === "name-asc") list.sort((a,b)=> a.name.localeCompare(b.name));
      if (sort.value === "featured") list.sort((a,b)=> b.featured - a.featured);
    }

    grid.innerHTML = list.map(p => {
      const displayPrice = p.sizes ? `from ${fmtCurrency(minPrice(p))}` : `${fmtCurrency(p.price)}`;
      return `
        <article class="product" data-id="${p.id}">
          <div class="p-img" role="img" aria-label="${p.name}">
            <img src="${p.img}" alt="${p.name}" onerror="this.parentNode.innerHTML='<svg width=100 height=60 viewBox=0 0 100 60><rect width=100 height=60 fill=#e9e9ee></rect><text x=50 y=35 text-anchor=middle font-size=10 fill=#999>GLIMMR</text></svg>'">
          </div>
          <div class="p-body">
            <h3>${p.name}</h3>
            <p class="muted">${p.desc}</p>
            <div class="price">${displayPrice}</div>
          </div>
          <div class="p-actions">
            <button class="btn" data-action="details">Details</button>
            <button class="btn primary" data-action="add">Add to Cart</button>
          </div>
        </article>
      `;
    }).join("");
  };

  [q,cat,sort].forEach(el=> el && el.addEventListener("input", apply));
  apply();

  grid.addEventListener("click", (e)=>{
    const btn  = e.target.closest("[data-action]");
    if(!btn) return;
    const card = e.target.closest(".product");
    const id   = card?.dataset.id;
    if(!id) return;

    if(btn.dataset.action === "add"){ showDetails(id, true); } // open details to capture size if needed
    if(btn.dataset.action === "details"){ showDetails(id, false); }
  });
}

/* ====== DETAILS / VARIANTS ====== */
function showDetails(id, autoAddIfSimple=false){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;

  const modal = byId("checkout-modal");

  // Build size selector if product has sizes
  const hasSizes = Array.isArray(p.sizes) && p.sizes.length > 0;
  const defaultPrice = hasSizes ? p.sizes[0].price : p.price;

  if(!hasSizes && autoAddIfSimple){
    addToCart({id: p.id, qty: 1, unitPrice: p.price, optionLabel: ""});
    openCart();
    return;
  }

  modal.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-label="Product details">
      <div class="cart-head">
        <strong>${p.name}</strong>
        <button class="btn" data-close>Close</button>
      </div>
      <div style="padding:12px">
        <p>${p.desc}</p>
        ${hasSizes ? `
          <label>Size
            <select id="size-select">
              ${p.sizes.map(s => `<option value="${s.price}">${s.label} — ${fmtCurrency(s.price)}</option>`).join("")}
            </select>
          </label>
        ` : ``}
        <p class="price" id="detail-price">${fmtCurrency(defaultPrice)}</p>
        <button class="btn primary" id="detail-add">Add to Cart</button>
      </div>
    </div>`;
  openModal(modal);

  const close = ()=> closeModal(modal);
  modal.querySelector("[data-close]").addEventListener("click", close);

  const priceEl = byId("detail-price");
  const sel = byId("size-select");
  let chosenPrice = defaultPrice;
  let chosenLabel = hasSizes ? p.sizes[0].label : "";

  if(sel){
    sel.addEventListener("change", ()=>{
      chosenPrice = Number(sel.value);
      chosenLabel = sel.options[sel.selectedIndex].text.split(" — ")[0]; // label before price
      priceEl.textContent = fmtCurrency(chosenPrice);
    });
  }

  byId("detail-add").addEventListener("click", ()=>{
    addToCart({id: p.id, qty: 1, unitPrice: chosenPrice, optionLabel: chosenLabel});
    close();
    openCart();
  });
}

/* ====== CART ====== */
function addToCart({id, qty=1, unitPrice, optionLabel=""}){
  const keyMatch = (a,b) => a.id===b.id && (a.optionLabel||"") === (b.optionLabel||"");
  const existingIndex = cart.findIndex(it => keyMatch(it, {id, optionLabel}));
  if(existingIndex >= 0){ cart[existingIndex].qty += qty; }
  else { cart.push({id, qty, unitPrice, optionLabel}); }
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
      <div class="cart-foot"><div class="muted">Tip: Add a welcome sign and easel rental.</div></div>`;
  } else {
    const rows = cart.map(it=>{
      const p = PRODUCTS.find(x=>x.id===it.id);
      const unit = it.unitPrice ?? (p?.price || 0);
      const opt  = it.optionLabel ? `<div class="muted">${it.optionLabel}</div>` : "";
      return `
        <div class="cart-item" data-id="${it.id}" data-opt="${encodeURIComponent(it.optionLabel||"")}">
          <div style="width:54px;height:54px;background:#f0f0f3;border:1px solid var(--line);border-radius:8px"></div>
          <div>
            <div><strong>${p?.name || it.id}</strong></div>
            ${opt}
            <div class="muted">${fmtCurrency(unit)} each</div>
            <div class="qty">
              <button data-qty="-1" aria-label="Decrease quantity">–</button>
              <span>${it.qty}</span>
              <button data-qty="1" aria-label="Increase quantity">+</button>
              <button data-remove class="btn" style="margin-left:8px">Remove</button>
            </div>
          </div>
          <div><strong>${fmtCurrency(unit * it.qty)}</strong></div>
        </div>`;
    }).join("");

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

  // qty changes
  drawer.querySelectorAll("[data-qty]").forEach(b=>{
    b.addEventListener("click", (e)=>{
      const row = e.target.closest(".cart-item");
      const id  = row.dataset.id; 
      const opt = decodeURIComponent(row.dataset.opt||"");
      const change = Number(e.target.dataset.qty);
      const i = cart.findIndex(x=> x.id===id && (x.optionLabel||"")===opt);
      if(i<0) return;
      cart[i].qty += change;
      if(cart[i].qty<=0) cart.splice(i,1);
      save(CART_KEY, cart); updateCartBadge(); renderCart();
    });
  });
  // remove
  drawer.querySelectorAll("[data-remove]").forEach(b=>{
    b.addEventListener("click",(e)=>{
      const row = e.target.closest(".cart-item");
      const id  = row.dataset.id; 
      const opt = decodeURIComponent(row.dataset.opt||"");
      cart = cart.filter(x=> !(x.id===id && (x.optionLabel||"")===opt));
      save(CART_KEY,cart); updateCartBadge(); renderCart();
    });
  });

  drawer.querySelector("[data-close]")?.addEventListener("click", closeCart);
  byId("promo-code")?.addEventListener("input", updateTotals);
  byId("checkout-btn")?.addEventListener("click", openCheckout);
}

function updateTotals(){
  const subtotal = cartTotal();
  const code = (byId("promo-code")?.value || "").trim().toUpperCase();
  const discount = (code === "GLIMMR5") ? Math.round(subtotal * 0.05) : 0;
  const estDelivery = 0; // delivery quoted later
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
    const unit = it.unitPrice ?? (p?.price || 0);
    const opt  = it.optionLabel ? ` (${it.optionLabel})` : "";
    return `• ${p?.name || it.id}${opt} × ${it.qty} — ${fmtCurrency(unit*it.qty)}`;
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
          <label>Notes (names, fonts, colours, links)
            <textarea name="notes" rows="4"></textarea>
          </label>
          <div class="row">
            <button type="submit" class="btn primary">Submit via Email</button>
            <button type="button" id="wa-btn" class="btn">Send via WhatsApp</button>
            <button type="button" id="copy-btn" class="btn ghost">Copy Summary</button>
          </div>
          <p class="muted">We’ll confirm design, delivery, and payment before production.</p>
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
    const unit = it.unitPrice ?? (p?.price || 0);
    const opt  = it.optionLabel ? ` (${it.optionLabel})` : "";
    return `• ${p?.name || it.id}${opt} × ${it.qty} — ${fmtCurrency(unit*it.qty)}`;
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

/* ====== CONTACT FORM ====== */
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

/* ====== INIT ====== */
function init(){
  const y = byId("year"); if(y) y.textContent = String(new Date().getFullYear());
  initNav();
  renderProducts();
  renderCart();
  updateCartBadge();
  byId("open-cart")?.addEventListener("click", openCart);

  // click outside to close cart
  document.addEventListener("click", (e)=>{
    const d = byId("cart-drawer");
    if(!d) return;
    if(d.classList.contains("open") && !d.contains(e.target) && !e.target.closest("#open-cart")){
      closeCart();
    }
  });
  // Esc
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape"){
      closeCart();
      const m = byId("checkout-modal"); m && closeModal(m);
    }
  });

  initContactForm();
}
document.addEventListener("DOMContentLoaded", init);
