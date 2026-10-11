const API_BASE_URL = window.__PRODUCT_API_BASE_URL__ || 'http://127.0.0.1:3000';
const PRODUCT_ID = new URLSearchParams(window.location.search).get('id') || 'b6ed8dd3-03d6-4b7e-8a92-659f5cbdde78';
const ENGRAVING_FEE = 350000;
const state = { product: null, variant: null, quantity: 1, engraving: false, engravingText: '' };
const $ = (id) => document.getElementById(id);
const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const imageUrl = (path) => { if (!path) return ''; try { return new URL(path, `${API_BASE_URL}/`).toString(); } catch { return ''; } };

function showError(message) { $('loading').hidden = true; $('product-content').hidden = true; $('error').hidden = false; $('error-message').textContent = message; }
function selectedStock() { return Number(state.variant?.stock ?? state.product?.attributes?.stock ?? 0); }
function render() {
  const attrs = state.product.attributes;
  $('product-name').textContent = attrs.name;
  $('product-description').textContent = attrs.description;
  $('product-price').textContent = rupiah(attrs.price);
  $('product-image').src = imageUrl(state.variant?.image || attrs.image);
  $('product-image').alt = `${attrs.name}${state.variant ? ` warna ${state.variant.name}` : ''}`;
  $('product-image').hidden = false; $('image-fallback').hidden = true;
  $('variants').replaceChildren(...(attrs.variants?.colorOrSize || []).map((variant, index) => { const button = document.createElement('button'); button.type='button'; button.className='variant'; button.textContent=variant.name; button.setAttribute('aria-pressed', String(state.variant === variant)); button.disabled = Number(variant.stock) === 0; button.title = button.disabled ? 'Stok habis' : `${variant.stock} tersedia`; button.addEventListener('click', () => { state.variant=variant; state.quantity=Math.min(state.quantity, selectedStock()) || 1; render(); }); return button; }));
  $('variant-status').textContent = selectedStock() > 0 ? `${selectedStock()} tersedia untuk pilihan ini` : 'Stok habis';
  $('stock-total').textContent = selectedStock() > 0 ? `${selectedStock()} tersedia` : 'Stok habis';
  $('quantity').textContent = state.quantity; $('decrease').disabled = state.quantity <= 1; $('increase').disabled = state.quantity >= selectedStock() || selectedStock() === 0; $('confirm').disabled = selectedStock() === 0;
  $('total-price').textContent = rupiah((attrs.price + (state.engraving ? ENGRAVING_FEE : 0)) * state.quantity);
  $('engraving-fields').hidden = !state.engraving; $('engraving').checked = state.engraving; $('engraving-text').value = state.engravingText; $('character-count').textContent = `${state.engravingText.length} / 12`; $('engraving-preview').textContent = state.engravingText || 'YOUR INITIALS';
}
async function loadProduct() {
  $('error').hidden = true; $('loading').hidden = false;
  try { const response = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(PRODUCT_ID)}`, { headers: { Accept: 'application/vnd.api+json' } }); const body = await response.json(); if (!response.ok || !body.data || body.data.type !== 'products') throw new Error(response.status === 404 ? 'Produk yang diminta tidak ditemukan.' : (body.errors?.[0]?.detail || 'Produk tidak ditemukan.')); state.product=body.data; state.variant=state.product.attributes.variants?.colorOrSize?.[0] || null; state.quantity=selectedStock() ? 1 : 0; $('loading').hidden=true; $('product-content').hidden=false; render(); } catch (error) { showError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat produk.'); }
}
$('product-image').addEventListener('error', () => { $('product-image').hidden=true; $('image-fallback').hidden=false; });
$('retry').addEventListener('click', loadProduct);
$('decrease').addEventListener('click', () => { state.quantity=Math.max(1,state.quantity-1); render(); });
$('increase').addEventListener('click', () => { state.quantity=Math.min(selectedStock(),state.quantity+1); render(); });
$('engraving').addEventListener('change', (event) => { state.engraving=event.target.checked; render(); });
$('engraving-text').addEventListener('input', (event) => { state.engravingText=event.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g,'').slice(0,12); event.target.value=state.engravingText; render(); });
$('confirm').addEventListener('click', () => { if (!state.product || selectedStock() < 1) return; if (state.engraving && !state.engravingText.trim()) { $('engraving-error').textContent='Isi teks engraving terlebih dahulu.'; $('engraving-error').hidden=false; $('engraving-text').focus(); return; } $('engraving-error').hidden=true; $('summary').hidden=false; $('summary-text').textContent=`${state.product.attributes.name} · ${state.variant?.name || 'Pilihan standar'} · ${state.quantity} unit${state.engraving ? ` · engraving “${state.engravingText}”` : ''} · ${$('total-price').textContent}`; $('confirm-message').textContent='Ringkasan pesanan berhasil diperbarui.'; $('confirm-message').hidden=false; $('summary').scrollIntoView({ behavior:'smooth', block:'start' }); });
loadProduct();
