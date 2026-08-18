// A side's team label collapses to one shared tag when every participant is
// on the same org (the common case) — repeating an identical team name next
// to each player would be noise. It only expands to per-participant tags
// when they actually differ (a cross-org duo: FLY's SonicFox + SHR's INZEM
// on one side), which is exactly the case a single shared `side.team`
// string can't represent.
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
    const bits = [];
    if (!sharedTeam && p.team) bits.push(p.team);
    if (p.player) bits.push(p.player);
    const chars = (p.characters || []).join(' + ');
    if (chars) bits.push('(' + chars + ')');
    line.textContent = bits.join(' ');
    list.appendChild(line);
  });

  document.getElementById(prefix + '-score').textContent = side?.score ?? 0;
}

function render(state) {
  const [side1, side2] = state.sides || [];
  fill('p1', side1);
  fill('p2', side2);
  document.getElementById('round').textContent = state.round || '';
}

// One connection for both this page's data and its own skin-watch — see
// /overlay/:module in src/routes/overlays.ts, which skips injecting a
// second watcher for this pack specifically because of this.
const source = new EventSource('/api/bus/stream?ns=match,match-overlay');
source.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.ns === 'match') render(msg.data);
  else if ((msg.data.skin || '') !== '') location.reload();
};
