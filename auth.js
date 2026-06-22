// iChama Auth Helper — include this on every page
// <script src="/auth.js"></script>

var SUPABASE_URL      = 'https://zdijvyqkoiekwylxbjll.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkaWp2eXFrb2lla3d5bHhiamxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzAxNDUsImV4cCI6MjA5NzMwNjE0NX0.7C7hnKmpIRMnrNU9VJWO-lWp4tu00wF8atxzCNYfi6E';

function getToken()   { return localStorage.getItem('ichama_token'); }
function getRefresh() { return localStorage.getItem('ichama_refresh'); }
function getUser()    { try { return JSON.parse(localStorage.getItem('ichama_user')); } catch(e) { return null; } }

function setSession(data) {
  localStorage.setItem('ichama_token',   data.access_token);
  localStorage.setItem('ichama_refresh', data.refresh_token);
  if (data.user) localStorage.setItem('ichama_user', JSON.stringify({id: data.user.id, email: data.user.email}));
}

function doLogout() {
  localStorage.removeItem('ichama_token');
  localStorage.removeItem('ichama_refresh');
  localStorage.removeItem('ichama_user');
  window.location.href = 'login.html';
}

function authHeaders() {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + getToken(),
    'Content-Type': 'application/json'
  };
}

// Refresh token if expired or about to expire
async function refreshToken() {
  var refresh = getRefresh();
  if (!refresh) return false;
  try {
    var res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh })
    });
    if (!res.ok) return false;
    var data = await res.json();
    setSession(data);
    return true;
  } catch(e) {
    return false;
  }
}

// Check if token is expired or about to expire (within 5 minutes)
function tokenExpiringSoon() {
  var token = getToken();
  if (!token) return true;
  try {
    var payload = JSON.parse(atob(token.split('.')[1]));
    var exp = payload.exp * 1000;
    return Date.now() > exp - 5 * 60 * 1000; // 5 min buffer
  } catch(e) {
    return true;
  }
}

// Smart fetch — auto refreshes token if needed
async function sbGet(path) {
  if (tokenExpiringSoon()) {
    var refreshed = await refreshToken();
    if (!refreshed) { doLogout(); return null; }
  }
  var res = await fetch(SUPABASE_URL + path, { headers: authHeaders() });
  if (res.status === 401) {
    // Try refresh once on 401
    var refreshed = await refreshToken();
    if (!refreshed) { doLogout(); return null; }
    res = await fetch(SUPABASE_URL + path, { headers: authHeaders() });
    if (!res.ok) return null;
  }
  return res.ok ? res.json() : null;
}

// Auto refresh every 50 minutes while app is open
setInterval(async function() {
  if (getToken() && tokenExpiringSoon()) {
    await refreshToken();
  }
}, 50 * 60 * 1000);

// Refresh on page focus (user comes back to app)
document.addEventListener('visibilitychange', async function() {
  if (document.visibilityState === 'visible' && getToken() && tokenExpiringSoon()) {
    var refreshed = await refreshToken();
    if (!refreshed) doLogout();
  }
});
