
const qs=s=>document.querySelector(s); const qsa=s=>Array.from(document.querySelectorAll(s));
let CART = JSON.parse(localStorage.getItem('cart_bw_v11')||'[]');
const save=()=>localStorage.setItem('cart_bw_v11', JSON.stringify(CART));
const fmt=n=>n.toFixed(2).replace('.', ',')+' PLN';
function totals(method){ const sub=CART.reduce((s,i)=>s+i.price*i.qty,0); const del=method==='delivery'?6:0; return {sub,del,total:sub+del}; }
function updateCartCount(){ const cnt = CART.reduce((a,b)=>a+b.qty,0); qsa('.cart-count').forEach(el=>el.textContent = cnt); }
function addItem(p){ const f=CART.find(x=>x.id===p.id); if(f) f.qty++; else CART.push({id:p.id,name:p.n,price:p.p,qty:1}); save(); updateCartCount(); }
function removeItem(id){ CART = CART.filter(x=>x.id!==id); save(); updateCartCount(); }
function changeQty(id, delta){ const it=CART.find(x=>x.id===id); if(!it) return; it.qty=Math.max(1,(it.qty||1)+delta); save(); updateCartCount(); }

function renderMenu(){
  const root=document.getElementById('menu-root'); if(!root || !window.MENU) return;
  root.innerHTML='';
  Object.entries(window.MENU).forEach(([cat,items])=>{
    const h=document.createElement('h3'); h.textContent=cat; root.appendChild(h);
    items.forEach(p=>{
      const row=document.createElement('div'); row.className='menu-item';
      row.innerHTML=`<img src="${p.img||''}" alt="${p.n}">
        <div><div class="menu-title">${p.n}</div><div class="small">${p.d}</div></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <div><strong>${p.p} PLN</strong></div>
          <button class="cta" data-add="${p.id}" style="padding:6px 10px">Dodaj</button>
        </div>`;
      row.querySelector('button').onclick=()=>{ const btn=row.querySelector('button'); addItem(p); btn.textContent='Dodano ✓'; setTimeout(()=>btn.textContent='Dodaj',700); };
      root.appendChild(row);
    });
  });
}

function renderOrder(){
  const tbody = qs('#order-items'); if(!tbody) return;
  tbody.innerHTML='';
  CART.forEach(it=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${it.name}</td>
    <td>${fmt(it.price)}</td>
    <td class="qty"><button data-a="dec">−</button><span>${it.qty}</span><button data-a="inc">+</button></td>
    <td>${fmt(it.price*it.qty)}</td>
    <td><button data-a="rm" title="Usuń">✕</button></td>`;
    tr.querySelector('[data-a=inc]').onclick=()=>{changeQty(it.id, +1); renderOrder();};
    tr.querySelector('[data-a=dec]').onclick=()=>{changeQty(it.id, -1); renderOrder();};
    tr.querySelector('[data-a=rm]').onclick=()=>{removeItem(it.id); renderOrder();};
    tbody.appendChild(tr);
  });
  const method = qs('#deliveryMethod')?.value || 'pickup';
  const t = totals(method);
  const map = {subtotal:t.sub,delivery:t.del,total:t.total};
  ['subtotal','delivery','total'].forEach(k=>{ const el=qs(`#sum-${k}`); if(el) el.textContent = fmt(map[k]); });
  updateCartCount();
}

function hydrateBrand(){
  if(!window.BRAND) return;
  const b = window.BRAND;
  const ph = document.getElementById('phone-link'); if(ph){ ph.href='tel:'+b.phone.replace(/\s+/g,''); ph.textContent=b.phone; }
  const em = document.getElementById('email-link'); if(em){ em.href='mailto:'+b.email; em.textContent=b.email; }
  const addr = document.getElementById('address'); if(addr) addr.textContent=b.address;
  const hero = document.getElementById('hero-img'); if(hero && b.hero){ hero.src=b.hero; }
  const logo = document.getElementById('brand-logo'); if(logo && b.logo){ logo.src=b.logo; }
}

document.addEventListener('DOMContentLoaded',()=>{
  updateCartCount(); hydrateBrand(); renderMenu();
  if(qs('#order-items')){
    const dm=qs('#deliveryMethod'); if(dm) dm.onchange=renderOrder;
    const pay = qs('#payNow'); if(pay){
      pay.onclick=async()=>{
        if(CART.length===0){ alert('Koszyk jest pusty'); return; }
        const pickup = qs('#pickup').checked;
        const name = qs('#name').value.trim();
        const phone = qs('#phone').value.trim();
        const address = pickup ? 'Odbiór osobisty' :
          `${qs('#street').value.trim()}, ${qs('#zip').value.trim()} ${qs('#city').value.trim()}`;
        if(!name || !phone || (!pickup && (qs('#street').value.trim()==='' || qs('#zip').value.trim()==='' || qs('#city').value.trim()===''))){
          alert('Uzupełnij dane zamówienia.'); return;
        }
        const method = pickup ? 'pickup' : 'delivery';
        const payload = { cart: CART, delivery: method==='delivery'?6:0, currency:'pln', customer:{name,phone,address,method} };
        const res = await fetch('/.netlify/functions/create-checkout-session', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        if(!res.ok){ alert('Błąd płatności ('+res.status+'): '+await res.text()); return; }
        const data = await res.json(); location.href = data.url;
      };
    }
    const clear = qs('#clearCart'); if(clear) clear.onclick=()=>{ CART=[]; save(); renderOrder(); };
    renderOrder();
  }
});
