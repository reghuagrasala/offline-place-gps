// Detail bottom sheet
document.addEventListener('DOMContentLoaded', ()=>{
  const overlay = document.getElementById('sheet-overlay');
  const sheet = document.getElementById('detail-sheet');
  const title = document.getElementById('detail-title');
  const big = document.getElementById('detail-value');
  const desc = document.getElementById('detail-desc');
  const btnCopy = document.getElementById('btn-copy');
  const btnClose = document.getElementById('btn-close-sheet');
  const toast = document.getElementById('toast');
  let currentVal = '';

  function openDetail(t, v, d){
    title.textContent=t; big.textContent=v; desc.textContent=d||''; currentVal=v;
    sheet.classList.add('open'); overlay.classList.add('open');
  }
  function closeDetail(){ sheet.classList.remove('open'); overlay.classList.remove('open'); }
  function showToast(msg){ toast.textContent=msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),1800); }

  window.openDetail = openDetail;
  window.showToast = showToast;

  document.querySelectorAll('.metric-card, .sky-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      const label = card.querySelector('.label')?.textContent || 'Detail';
      const value = card.querySelector('.value')?.textContent || '--';
      const sub = card.querySelector('.label')?.textContent ? card.id || '' : '';
      openDetail(label, value, card.title || 'Tap copy to copy value. Long data from GPS/Sky calculations.');
      currentVal = value;
    });
  });

  overlay.addEventListener('click', closeDetail);
  btnClose.addEventListener('click', closeDetail);
  btnCopy.addEventListener('click', ()=>{
    navigator.clipboard.writeText(currentVal).then(()=>{ showToast('Copied: '+currentVal); closeDetail(); });
  });
});
