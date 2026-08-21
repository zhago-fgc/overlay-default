let countries = [];
let latestState = null;
let type2Games = new Set();

fetch('game-types.json')
  .then((res) => res.json())
  .then((data) => {
    type2Games = new Set(data['type-2'] || []);
    if (latestState) render(latestState);
  });

function countryFlag(countryCode) {
  const value = String(countryCode || '').toLowerCase();
  const country = countries.find((c) => c.code === value || c.id === value || c.iso?.toLowerCase() === value);
  if (!country) return '';
  return '/modules/countries/' + country.flag;
}

// The design has one flag/name slot per side, not a per-participant list —
// a 2XKO duo side collapses to its first participant's flag and every
// participant's name joined, since there's no room here for a stacked
// roster like the previous skin had.
function fill(prefix, side) {
  const el = document.getElementById(prefix);
  const participants = side?.participants || [];
  el.classList.toggle('hidden', !participants.length);

  const teams = new Set(participants.map((p) => p.team).filter(Boolean));
  const sharedTeam = teams.size === 1 ? [...teams][0] : '';
  document.getElementById(prefix + '-tag').textContent = sharedTeam;

  // A shared team goes in the dedicated tag slot and names stay bare. When a
  // side's participants are on different orgs (a 2XKO duo split across two
  // teams), that slot can't express it — fold each participant's own tag
  // into their name instead, reusing the `.tag` class so it keeps the same
  // small/muted look rather than inheriting the bold name style as plain
  // text. Each pair is its own flex row (`.participant`) so the tag centers
  // against its name the same way the dedicated tag slot centers against
  // .label — plain inline nesting would fall back to baseline alignment.
  const nameEl = document.getElementById(prefix + '-name');
  nameEl.replaceChildren();
  participants.forEach((p, i) => {
    if (!p.player) return;
    if (i > 0) nameEl.append(' / ');
    const participant = document.createElement('span');
    participant.className = 'participant';
    if (!sharedTeam && p.team) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = p.team;
      participant.append(tag);
    }
    participant.append(p.player);
    nameEl.append(participant);
  });

  const flagImg = document.getElementById(prefix + '-flag');
  const flag = countryFlag(participants[0]?.country);
  flagImg.src = flag;
  flagImg.style.visibility = flag ? 'visible' : 'hidden';
  flagImg.alt = participants[0]?.country?.toUpperCase() || '';

  document.getElementById(prefix + '-score').textContent = side?.score ?? 0;
}

function render(state) {
  latestState = state;
  const [side1, side2] = state.sides || [];
  fill('p1', side1);
  fill('p2', side2);
  document.getElementById('round').textContent = state.round || '';
  document.getElementById('board').dataset.type = type2Games.has(state.game) ? 'type-2' : 'type-1';
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
