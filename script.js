const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let map;
let marker;
let watchId = null;
let isEmergencyActive = false;
let currentPosition = null;

const hospitalDatabase = [
  { name: "Apollo Hospital Chennai", lat: 13.0023, lng: 80.2388, address: "Greams Road, Chennai" },
  { name: "Saveetha Hospital", lat: 13.027023, lng: 80.016547, address: "Saveetha Medical College & Hospital, Thandalam, Chennai" },
  { name: "Sriperumbudur Government Hospital", lat: 12.967833, lng: 79.948151, address: "State Highways Rd, Near Govt Bus Stand, Sriperumbudur-602105" },
];

window.onload = function() {
  try {
    initMap();
  } catch (error) {}
};

function initMap() {
  const defaultCenter = [20.5937, 78.9629];
  map = L.map('map').setView(defaultCenter, 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(map);
  marker = L.marker(defaultCenter).addTo(map);
}

function startEmergency() {
  if (!navigator.geolocation) {
    showToast("Location not supported!", "error", 3500);
    return;
  }
  isEmergencyActive = true;
  document.getElementById('status').textContent = 'Active 🚨';
  document.getElementById('status').className = 'value active';
  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('stopBtn').style.display = 'block';
  watchId = navigator.geolocation.watchPosition(
    updateLocation,
    (error) => showToast("Location error: "+error.message, "error", 3500),
    { enableHighAccuracy: true, timeout: 5000 }
  );
  db.ref("traffic/emergency").set({ active: true, timestamp: Date.now() });
  showToast("Emergency Mode Activated!", "success", 2500);
}

function stopEmergency() {
  if (watchId) navigator.geolocation.clearWatch(watchId);
  isEmergencyActive = false;
  document.getElementById('status').textContent = 'Inactive';
  document.getElementById('status').className = 'value inactive';
  document.getElementById('startBtn').style.display = 'block';
  document.getElementById('stopBtn').style.display = 'none';
  db.ref("traffic/emergency").set({ active: false, timestamp: Date.now() });
  showToast("Emergency Mode Stopped.", "success", 2500);
}

function updateLocation(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  const speed = position.coords.speed || 0;
  currentPosition = { lat, lng: lon };
  document.getElementById('latitude').textContent = lat.toFixed(6);
  document.getElementById('longitude').textContent = lon.toFixed(6);
  document.getElementById('speed').textContent = ((speed || 0) * 3.6).toFixed(1) + ' km/h';
  document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
  map.setView([lat, lon], 15);
  marker.setLatLng([lat, lon]);
  db.ref("traffic/location").set({
    lat: lat,
    lng: lon,
    speed: speed,
    timestamp: Date.now()
  });
}

function sendSOS() {
  db.ref("traffic/sos").set({ active: true, location: currentPosition, timestamp: Date.now() });
  showToast("SOS sent! Police alert triggered.", "success", 3500);
  setTimeout(() => {
    db.ref("traffic/sos").set({ active: false, location: currentPosition, timestamp: Date.now() });
  }, 6000);
}

function findHospitals() {
  if (!currentPosition) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        currentPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        displayHospitals();
        showToast("Location fetched! Showing nearest hospitals.", "success", 2500);
      },
      (error) => { showToast("Location permission denied!", "error", 3000); }
    );
  } else {
    displayHospitals();
    showToast("Showing nearest hospitals.", "success", 2500);
  }
}

function displayHospitals() {
  const hospitalsWithDistance = hospitalDatabase.map(h => ({
    ...h,
    distance: calculateDistance(currentPosition.lat, currentPosition.lng, h.lat, h.lng)
  }));
  hospitalsWithDistance.sort((a, b) => a.distance - b.distance);
  const listDiv = document.getElementById('hospitalList');
  listDiv.style.display = 'block';
  listDiv.innerHTML = '<b>🏥 Nearest Hospitals:</b><br>';
  hospitalsWithDistance.slice(0, 8).forEach((h, i) => {
    const item = document.createElement('div');
    item.className = 'hospital-item';
    item.innerHTML = `<strong>${i === 0 ? '🏆 CLOSEST' : '#' + (i + 1)}. ${h.name}</strong>
      <div class="address">${h.address}</div>
      <div class="distance">${h.distance.toFixed(2)} km</div>`;
    item.onclick = function() {
      selectHospital(h);
      showToast(`${h.name} selected. Signal will turn green.`, "success", 3000);
    };
    listDiv.appendChild(item);
  });
}

function selectHospital(hospital) {
  db.ref("traffic/selectedHospital").set({
    name: hospital.name,
    lat: hospital.lat,
    lng: hospital.lng,
    timestamp: Date.now()
  });
  db.ref("traffic/signalStatus").set("green");
}

function showToast(message, type='success', time=2500) {
  var pt = document.getElementById('popup-toast');
  pt.innerText = message;
  pt.classList.remove('toast-success', 'toast-error');
  pt.classList.add(type === 'error' ? 'toast-error' : 'toast-success');
  pt.style.display = 'block';
  setTimeout(()=>{ pt.style.opacity="0.98"; }, 100);
  setTimeout(()=>{ pt.style.opacity="0"; pt.style.display="none"; }, time);
}

// Utility: Calculate distance (haversine)
function calculateDistance(lat1, lng1, lat2, lng2) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
