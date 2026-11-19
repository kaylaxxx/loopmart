import { cartTotals, formatUSD } from "/src/pricing.mjs";

export const PRODUCTS = [
  { id: "keyboard", name: "Mechanical Keyboard", price: 49.99 },
  { id: "mug", name: "Ceramic Mug", price: 12.5 },
  { id: "notebook", name: "Linen Notebook", price: 8.75 },
  { id: "headphones", name: "Wireless Headphones", price: 79.0 },
  { id: "stickers", name: "Sticker Pack", price: 4.25 },
  { id: "plant", name: "Desk Plant", price: 19.99 },
];

const cart = new Map(); // id -> qty
let promo = "";

const $ = (id) => document.getElementById(id);

function renderProducts() {
  $("products").innerHTML = PRODUCTS.map(
    (p) => `<article class="card">
      <h3>${p.name}</h3><p>${formatUSD(p.price)}</p>
      <button type="button" data-add="${p.id}">Add to cart</button>
    </article>`,
  ).join("");
}

function renderCart() {
  const lines = [...cart.entries()]
    .map(([id, qty]) => {
      const p = PRODUCTS.find((x) => x.id === id);
      return { ...p, qty };
    })
    .filter((l) => l.qty > 0);
  $("cart-items").innerHTML =
    lines.length === 0
      ? "<p>Your cart is empty.</p>"
      : lines
          .map(
            (l) => `<div class="cart-line">
              <span>${l.name} × ${l.qty}</span>
              <span>${formatUSD(l.price * l.qty)}
                <button type="button" data-dec="${l.id}" aria-label="Remove one ${l.name}">−</button>
              </span></div>`,
          )
          .join("");
  const t = cartTotals(lines, promo);
  $("subtotal").textContent = formatUSD(t.subtotal);
  $("discount").textContent = `-${formatUSD(t.discount)}`;
  $("tax").textContent = formatUSD(t.tax);
  $("shipping").textContent =
    t.shipping === 0 ? "Free" : formatUSD(t.shipping);
  $("total").textContent = formatUSD(t.total);
}

document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  const dec = e.target.closest("[data-dec]");
  if (add) cart.set(add.dataset.add, (cart.get(add.dataset.add) || 0) + 1);
  if (dec) cart.set(dec.dataset.dec, Math.max(0, (cart.get(dec.dataset.dec) || 0) - 1));
  if (add || dec) renderCart();
});

$("apply-promo").addEventListener("click", () => {
  promo = $("promo").value.trim().toUpperCase();
  renderCart();
});

$("checkout").addEventListener("click", () => {
  const lines = [...cart.values()].reduce((a, b) => a + b, 0);
  $("order-status").textContent =
    lines === 0
      ? "Your cart is empty."
      : `Order placed — ${lines} item(s). Thank you for shopping at LoopMart!`;
});

renderProducts();
renderCart();
