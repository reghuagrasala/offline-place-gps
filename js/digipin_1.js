// DIGIPIN - Official India Post implementation
// Grid and Bounds from official spec
const DIGIPIN_GRID = [
  ['F', 'C', '9', '8'],
  ['J', '3', '2', '7'],
  ['K', '4', '5', '6'],
  ['L', 'M', 'P', 'T']
];
const BOUNDS = {
  minLat: 2.5,
  maxLat: 38.5,
  minLon: 63.5,
  maxLon: 99.5
};

function encodeDIGIPIN(lat, lon){
  if(typeof lat !== 'number' || typeof lon !== 'number') throw new Error('Invalid coords');
  if(lat < BOUNDS.minLat || lat > BOUNDS.maxLat || lon < BOUNDS.minLon || lon > BOUNDS.maxLon){
    return 'OUTSIDE INDIA';
  }
  let minLat = BOUNDS.minLat, maxLat = BOUNDS.maxLat;
  let minLon = BOUNDS.minLon, maxLon = BOUNDS.maxLon;
  let pin = '';
  for(let level=1; level<=10; level++){
    const latDiv = (maxLat - minLat)/4;
    const lonDiv = (maxLon - minLon)/4;
    let row = 3 - Math.floor((lat - minLat)/latDiv);
    let col = Math.floor((lon - minLon)/lonDiv);
    row = Math.max(0, Math.min(row,3));
    col = Math.max(0, Math.min(col,3));
    pin += DIGIPIN_GRID[row][col];
    if(level===3 || level===6) pin += '-';
    maxLat = minLat + latDiv * (4 - row);
    minLat = minLat + latDiv * (3 - row);
    minLon = minLon + lonDiv * col;
    maxLon = minLon + lonDiv;
  }
  return pin;
}

function decodeDIGIPIN(digipin){
  const pin = digipin.replace(/-/g,'').toUpperCase();
  if(pin.length !== 10) throw new Error('Invalid DIGIPIN length');
  let minLat = BOUNDS.minLat, maxLat = BOUNDS.maxLat;
  let minLon = BOUNDS.minLon, maxLon = BOUNDS.maxLon;
  for(let i=0;i<10;i++){
    const ch = pin[i];
    let row=-1,col=-1;
    for(let r=0;r<4;r++) for(let c=0;c<4;c++) if(DIGIPIN_GRID[r][c]===ch){row=r;col=c;}
    if(row===-1) throw new Error('Invalid char '+ch);
    const latDiv = (maxLat - minLat)/4;
    const lonDiv = (maxLon - minLon)/4;
    maxLat = minLat + latDiv * (4 - row);
    minLat = minLat + latDiv * (3 - row);
    minLon = minLon + lonDiv * col;
    maxLon = minLon + lonDiv;
  }
  return {
    latitude: (minLat+maxLat)/2,
    longitude: (minLon+maxLon)/2
  };
}

function getLatLngFromDigiPin(code){ return decodeDIGIPIN(code); }
function getDigiPin(lat,lon){ return encodeDIGIPIN(lat,lon); }

// Expose globally
window.DIGIPIN = { encode: encodeDIGIPIN, decode: decodeDIGIPIN, getDigiPin, getLatLngFromDigiPin, GRID: DIGIPIN_GRID, BOUNDS };
window.getDigiPin = getDigiPin;
window.encodeDIGIPIN = encodeDIGIPIN;
