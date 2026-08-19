let countries = [];
let latestState = null;

function countryFlag(countryCode) {
  const value = String(countryCode || '').toLowerCase();
  const country = countries.find((c) => c.code === value || c.id === value || c.iso?.toLowerCase() === value);
  if (!country) return '';
  return '/modules/countries/' + country.flag;
}

// A side's team label collapses to one shared tag when every participant is
// on the same org (the common case) — repeating an identical team name next
// to each player would be noise. It only expands to per-participant tags
// when they actually differ (a cross-org duo: FLY's SonicFox + SHR's INZEM
// on one side), which is exactly the case a single shared `side.team`
// string can't express.
function fill(prefix, side) {
  const el = document.getElementById(prefix);
  const participants = side?.participants || [];
  el.classList.toggle('hidden', !participants.length);

  const teams = new Set(participants.map((p) => p.team).filter(Boolean));
  const sharedTeam = teams.size === 1 ? [...teams][0] : '';
  const teamEl = document.getElementById(prefix + '-team');
  teamEl.textContent = sharedTeam;
  teamEl.classList.toggle('hidden', !sharedTeam);

  const list = document.getElementById(prefix + '-participants');
  list.innerHTML = '';
  participants.forEach((p) => {
    const line = document.createElement('div');
    line.className = 'participant-line';

    const flag = countryFlag(p.country);
    if (flag) {
      const img = document.createElement('img');
      img.className = 'participant-flag';
      img.src = flag;
      img.alt = p.country?.toUpperCase() || '';
      line.appendChild(img);
    }

    const text = document.createElement('span');
    const bits = [];
    if (!sharedTeam && p.team) bits.push(p.team);
    if (p.player) bits.push(p.player);
    const chars = (p.characters || []).join(' + ');
    if (chars) bits.push('(' + chars + ')');
    text.textContent = bits.join(' ');
    line.appendChild(text);
    list.appendChild(line);
  });

  document.getElementById(prefix + '-score').textContent = side?.score ?? 0;
}

function render(state) {
  latestState = state;
  const [side1, side2] = state.sides || [];
  fill('p1', side1);
  fill('p2', side2);
  document.getElementById('round').textContent = state.round || '';
}

function loadCountries() {
  const es = new EventSource('/api/bus/countries/stream');
  es.onmessage = (e) => {
    es.close();
    countries = JSON.parse(e.data)?.countries || [];
    if (latestState) render(latestState);
  };
}

loadCountries();

// One connection for both this page's data and its own skin-watch — see
// /overlay/:module in src/routes/overlays.ts, which skips injecting a
// second watcher for this pack specifically because of this.
const source = new EventSource('/api/bus/stream?ns=match,match-overlay');
source.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.ns === 'match') render(msg.data);
  else if ((msg.data.skin || '') !== '') location.reload();
};
