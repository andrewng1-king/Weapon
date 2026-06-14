/* =====================================================================
 * WEAPON V1 — client sync (Supabase, user-picker model, no login)
 *
 * Stores each user's ENTIRE app state (the `db` object: logs, custom
 * exercises, reports, profile, bodyweight, display) as one JSON blob in
 * app_users.data. Switching user loads that user's blob; every local
 * save() also saves to the cloud (debounced). This guarantees each user
 * keeps their own progress.
 *
 * Load order in index.html (before </body>):
 *   supabase-js → env.js → app's inline script → sync.js → picker
 * (sync.js is added after the inline app script, so window.save / db exist.)
 * ===================================================================== */

const SB_URL  = (window.SUPABASE_URL  || 'https://YOUR-PROJECT.supabase.co');
const SB_ANON = (window.SUPABASE_ANON || 'YOUR-ANON-KEY');
const sb  = window.supabase.createClient(SB_URL, SB_ANON);
const CUR = 'weapon_user_id';

/* ---------- users ---------------------------------------------------- */
async function listUsers() {
  const { data, error } = await sb.from('app_users')
    .select('id,username,display_name').order('username');
  if (error) throw error;
  return data || [];
}

async function addUser(username) {
  const name = (username || '').trim();
  const { data, error } = await sb.from('app_users')
    .insert({ username: name, display_name: name }).select('id,username').single();
  if (error) throw error;
  return data;
}

function currentUserId() { return localStorage.getItem(CUR); }

async function selectUser(id) {
  localStorage.setItem(CUR, id);
  await loadUserData(id);
  document.dispatchEvent(new CustomEvent('wpn-user-changed', { detail: { id } }));
  renderApp();
}

/* ---------- whole-state save / load ---------------------------------- */

// a fresh, empty app state for brand-new users
function freshDb() {
  const eb = (typeof emptyBucket === 'function')
    ? emptyBucket()
    : { logs: [], custom: [], removed: [] };
  const eb2 = (typeof emptyBucket === 'function')
    ? emptyBucket()
    : { logs: [], custom: [], removed: [] };
  return { mode: 'strength', bw: 75, strength: eb, endurance: eb2, profile: {}, display: {} };
}

// replace the live db's contents in place (so all references stay valid)
function applyBlob(blob) {
  if (typeof db === 'undefined' || !blob) return;
  Object.keys(db).forEach(k => { delete db[k]; });
  Object.assign(db, blob);
  db.profile = db.profile || {};
  db.display = db.display || {};
}

let _origSave = null;     // the app's real localStorage save
let _saveTimer = null;
let _suppress = false;    // don't echo cloud-saves while loading

// wrap the app's global save() so every change also syncs to the cloud
function wrapSave() {
  if (typeof window.save === 'function' && !window.save.__wrapped) {
    _origSave = window.save;
    const wrapped = function () { _origSave(); if (!_suppress) scheduleCloudSave(); };
    wrapped.__wrapped = true;
    window.save = wrapped;
  }
}

function scheduleCloudSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(saveUserData, 600);
}

async function saveUserData() {
  const id = currentUserId();
  if (!id || typeof db === 'undefined') return;
  const { error } = await sb.from('app_users').update({ data: db }).eq('id', id);
  if (error) console.error('cloud save failed', error);
}

async function loadUserData(id) {
  const { data, error } = await sb.from('app_users').select('data').eq('id', id).single();
  if (error) { console.error('load failed', error); return; }

  _suppress = true;
  try {
    if (data && data.data) {
      applyBlob(data.data);                 // existing user → their saved state
      if (_origSave) _origSave();           // refresh local cache only
    } else {
      // brand-new user with no saved state yet
      let legacy = null;
      if (!localStorage.getItem('weapon_legacy_imported')) {
        try { legacy = JSON.parse(localStorage.getItem('gymtracker_v3')); } catch (e) {}
        localStorage.setItem('weapon_legacy_imported', '1');   // import old data once, total
      }
      applyBlob(legacy || freshDb());
      if (_origSave) _origSave();
      await saveUserData();                 // persist their initial blob
    }
  } finally { _suppress = false; }
}

/* re-render with the app's own functions (no single renderAll) */
function renderApp() {
  try { if (typeof applyDisplay === 'function') applyDisplay(); } catch (e) {}
  try { if (typeof applyMode === 'function') applyMode(); } catch (e) {}
  try { if (typeof renderIDCard === 'function') renderIDCard(); } catch (e) {}
}

/* pushProfile kept for the existing hooks in index.html → just force a save */
function pushProfile() { scheduleCloudSave(); }

window.WeaponSync = {
  listUsers, addUser, selectUser, currentUserId,
  loadUserData, saveUserData, pushProfile,
};

/* ---------- boot (sync layer v2: whole-state blob) ------------------- */
wrapSave();
if (currentUserId()) {
  loadUserData(currentUserId()).then(renderApp).catch(e => console.error(e));
}
