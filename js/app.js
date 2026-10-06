// Main app
document.addEventListener('DOMContentLoaded', ()=>{
  const status = document.getElementById('status');
  if(status) status.textContent = 'Starting GPS...';

  if(window.initGPS) initGPS();
  
  // Clear data button
  const btnClear = document.getElementById('btn-clear-data');
  if(btnClear){
    btnClear.addEventListener('click', ()=>{
      if(confirm('Clear all offline data?')){
        localStorage.clear();
        if('caches' in window){
          caches.keys().then(keys=>keys.forEach(k=>caches.delete(k)));
        }
        location.reload();
      }
    });
  }

  // Events scroll - mock sky events
  const eventsContainer = document.getElementById('events-container');
  if(eventsContainer){
    const events = [
      { name: 'Full Moon', date: 'Today', icon: '🌕' },
      { name: 'Sunrise', date: '06:12', icon: '🌅' },
      { name: 'Sunset', date: '18:24', icon: '🌇' },
      { name: 'Moonrise after 1am', date: '01:17 AM', icon: '🌙' },
    ];
    eventsContainer.innerHTML = events.map(ev=>`
      <div class="event-card">
        <div class="event-icon">${ev.icon}</div>
        <div class="event-name">${ev.name}</div>
        <div class="event-date">${ev.date}</div>
      </div>
    `).join('');
  }

  // Register service worker handled in sw-register.js
});
