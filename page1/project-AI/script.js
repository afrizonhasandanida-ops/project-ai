const productImage = document.querySelector("#product-image");
const selectedColor = document.querySelector("#selected-color");
const swatches = [...document.querySelectorAll(".swatch")];
const thumbnails = [...document.querySelectorAll(".thumbnail")];

const quantityOutput = document.querySelector("#quantity");
const minusButton = document.querySelector("#quantity-minus");
const plusButton = document.querySelector("#quantity-plus");
const purchaseRow = document.querySelector(".purchase-row");
const product = { stock: 5, price: 8999000 };
let minimumQuantity = 1;
let maximumQuantity = product.stock;
let unitPrice = product.price;
let quantity = product.stock > 0
  ? Math.min(Number(quantityOutput.textContent) || minimumQuantity, product.stock)
  : 0;
const addToCartButton = document.querySelector("#confirm-order");
const stockStatus = document.querySelector("#stock-status");
const engravingPrice = 350000;

const totalDisplay = document.createElement("p");
totalDisplay.className = "order-total";
totalDisplay.innerHTML = "<span>Total harga</span><strong></strong>";
Object.assign(totalDisplay.style, {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  margin: "16px 0 0",
  paddingTop: "13px",
  borderTop: "1px solid #e5e5e5",
  fontSize: "11px"
});
Object.assign(totalDisplay.querySelector("strong").style, {
  color: "#111111",
  fontSize: "16px",
  fontWeight: "600"
});
purchaseRow.insertAdjacentElement("beforebegin", totalDisplay);

function formatRupiah(amount) {
  return `Rp${new Intl.NumberFormat("id-ID").format(amount)}`;
}

function updateQuantity(nextQuantity) {
  quantity = product.stock === 0
    ? 0
    : Math.max(minimumQuantity, Math.min(maximumQuantity, nextQuantity));
  quantityOutput.value = quantity;
  quantityOutput.textContent = quantity;
  minusButton.disabled = quantity === minimumQuantity;
  plusButton.disabled = product.stock === 0 || quantity >= product.stock;
  addToCartButton.disabled = product.stock === 0;
  addToCartButton.textContent = product.stock === 0 ? "Stok Habis" : "Konfirmasi Pesanan";
  if (stockStatus) {
    stockStatus.textContent = product.stock === 0 ? "Stok Habis" : `Stok tersedia: ${product.stock}`;
  }
  const currentUnitPrice = unitPrice + (document.querySelector("#engraving-toggle")?.checked ? engravingPrice : 0);
  totalDisplay.querySelector("strong").textContent = formatRupiah(currentUnitPrice * quantity);
}

updateQuantity(quantity);

minusButton.addEventListener("click", () => updateQuantity(quantity - 1));
plusButton.addEventListener("click", () => updateQuantity(quantity + 1));

swatches.forEach((swatch) => {
  swatch.addEventListener("click", () => {
    swatches.forEach((item) => {
      item.classList.remove("is-selected");
      item.setAttribute("aria-pressed", "false");
    });

    swatch.classList.add("is-selected");
    swatch.setAttribute("aria-pressed", "true");
    selectedColor.textContent = swatch.dataset.color;
    productImage.src = swatch.dataset.image;
    productImage.alt = `Headphone MW75 premium berwarna ${swatch.dataset.color}`;

    thumbnails.forEach((thumbnail) => {
      thumbnail.classList.toggle("is-active", thumbnail.dataset.image === productImage.getAttribute("src"));
    });
  });
});

thumbnails.forEach((thumbnail) => {
  thumbnail.addEventListener("click", () => {
    productImage.src = thumbnail.dataset.image;
    thumbnails.forEach((item) => item.classList.remove("is-active"));
    thumbnail.classList.add("is-active");

    const matchingSwatch = swatches.find((swatch) => swatch.dataset.image === thumbnail.dataset.image);
    if (matchingSwatch) {
      swatches.forEach((swatch) => {
        swatch.classList.toggle("is-selected", swatch === matchingSwatch);
        swatch.setAttribute("aria-pressed", String(swatch === matchingSwatch));
      });
      selectedColor.textContent = matchingSwatch.dataset.color;
      productImage.alt = `Headphone MW75 premium berwarna ${matchingSwatch.dataset.color}`;
    }
  });
});

const engravingToggle = document.querySelector("#engraving-toggle");
const engravingField = document.querySelector("#engraving-field");
const engravingInput = document.querySelector("#engraving-input");
const characterCount = document.querySelector("#character-count");
const engravingOverlay = document.querySelector(".engraving-overlay, .engraving-preview");
const previewText = engravingOverlay.querySelector(".preview-text");

engravingToggle.addEventListener("change", () => {
  const isEnabled = engravingToggle.checked;
  engravingField.hidden = !isEnabled;
  engravingInput.disabled = !isEnabled;

  if (isEnabled) {
    engravingInput.focus();
    updateQuantity(quantity);
    return;
  }

  engravingInput.value = "";
  characterCount.textContent = "0 / 12";
  previewText.textContent = "";
  engravingOverlay.hidden = true;
});

engravingInput.addEventListener("input", () => {
  const value = engravingInput.value.replace(/[^a-z0-9]/gi, "").slice(0, 12).toLocaleUpperCase("id-ID");
  engravingInput.value = value;
  characterCount.textContent = `${value.length} / 12`;
  previewText.textContent = value.toLocaleUpperCase("id-ID");
  engravingOverlay.hidden = !value.trim();
  updateQuantity(quantity);
});

document.querySelector("#confirm-order").addEventListener("click", () => {
  if (product.stock === 0 || quantity > product.stock) {
    updateQuantity(Math.min(quantity, product.stock));
    return;
  }
  const message = document.querySelector("#confirmation-message");
  const engraving = engravingToggle.checked && engravingInput.value.trim()
    ? engravingInput.value.trim().toLocaleUpperCase("id-ID")
    : "Tidak ada";

  message.style.whiteSpace = "pre-line";
  message.textContent = [
    "Rincian pesanan",
    `Warna: ${selectedColor.textContent}`,
    `Engraving: ${engraving}`,
    `Qty: ${quantity}`,
    `Total Harga: ${formatRupiah((unitPrice + (engravingToggle.checked ? engravingPrice : 0)) * quantity)}`
  ].join("\n");
  message.hidden = false;
});
