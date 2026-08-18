function fill(prefix, name, handle, pronouns) {
  const el = document.getElementById(prefix);
  el.classList.toggle('hidden', !name);
  document.getElementById(prefix + '-name').textContent = name || '';
  document.getElementById(prefix + '-meta').textContent = [handle, pronouns]
    .filter(Boolean)
    .join(' · ');
}

function render(state) {
  fill('c1', state.commentator1Name, state.commentator1Handle, state.commentator1Pronouns);
  fill('c2', state.commentator2Name, state.commentator2Handle, state.commentator2Pronouns);
}

// One connection for both this page's data and its own skin-watch — see
// /overlay/:module in src/routes/overlays.ts, which skips injecting a
// second watcher for this pack specifically because of this.
const source = new EventSource('/api/bus/stream?ns=casters,casters-overlay');
source.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.ns === 'casters') render(msg.data);
  else if ((msg.data.skin || '') !== '') location.reload();
};
