/* Astro demo mode.
   Runs the real Astro app with sample friends, chats, plans and bills. Nothing leaves this page:
   every call to the database is answered here, changes live in memory, and reloading starts fresh.
   Friends reply when you message them (with the typing asteroids first). */
(function () {
  'use strict';
  var HOST = 'vxalwjzvlxtdcjcjvlqp.supabase.co';

  // A link straight to a demo page (/demo/chats) comes back here as /demo/?to=/demo/chats; open that page.
  try { var to = new URLSearchParams(location.search).get('to'); if (to && /^\/demo\/[A-Za-z0-9/_?=&%-]*$/.test(to)) history.replaceState(null, '', to); } catch (e) {}

  // Keep the demo's sign-in and settings apart from the real app on the same site.
  var P = 'astro-demo:';
  var SP = Storage.prototype, gi = SP.getItem, si = SP.setItem, ri = SP.removeItem;
  SP.getItem = function (k) { return gi.call(this, P + k); };
  SP.setItem = function (k, v) { return si.call(this, P + k, v); };
  SP.removeItem = function (k) { return ri.call(this, P + k); };

  // ---------- sample world ----------
  var ME = '00000000-0000-4000-8000-000000000001';
  var now = Date.now();
  var ago = function (min) { return new Date(now - min * 60000).toISOString(); };
  var inH = function (h) { return new Date(now + h * 3600000).toISOString(); };
  var until = inH(6);
  var uid = function (n) { return '00000000-0000-4000-8000-0000000000' + (n < 10 ? '0' : '') + n; };
  var person = function (n, name, color, status, planet) {
    return { id: uid(n), display_name: name, username: name.toLowerCase(), color: color, status: status, status_until: status ? until : null, planet: planet || 'auto', avatar_url: null, zelle: name.toLowerCase() + '@example.com' };
  };
  var me = person(1, 'Jamie', '#7C5CFF', null, 'ring'); me.bio = 'Plans the poker nights. Will bring snacks.';
  // Astro is 18+. Jamie confirms once on first open (kept in this browser), so the demo shows the real gate.
  try { me.age_confirmed_at = localStorage.getItem('astro.demo.age') || null; } catch (e) { me.age_confirmed_at = null; }
  var F = {
    maya: person(11, 'Maya', '#D2558E', 'free', 'swirl'),
    theo: person(12, 'Theo', '#17905A', 'free', 'bands'),
    priya: person(13, 'Priya', '#6B5BD6', 'free', 'glow'),
    marcus: person(14, 'Marcus', '#C4651F', 'gaming', 'craters'),
    lena: person(15, 'Lena', '#0E7F8E', 'gym', 'bands'),
    diego: person(16, 'Diego', '#2B62F0', 'out', 'ring'),
    sofia: person(17, 'Sofia', '#A9822F', 'watch', 'swirl'),
    ben: person(18, 'Ben', '#1FB8A0', null, 'craters'),
    nora: person(19, 'Nora', '#C2453A', 'busy', 'glow'),
    kai: person(20, 'Kai', '#3FA0D9', 'free', 'auto'),
    // not friends yet, but you share a group (shows up in "From your groups" and Recent people)
    omar: person(21, 'Omar', '#B34A6A', null, 'bands'),
    ruby: person(22, 'Ruby', '#E0864A', null, 'swirl')
  };
  // Payment apps for the Wallet demo. Links never open for real in the demo (see openPayDemo below).
  F.maya.venmo = 'maya-demo'; F.maya.paypal = 'mayademo'; F.theo.cashapp = 'theodemo'; F.theo.venmo = 'theo-demo'; F.priya.paypal = 'priyademo'; F.lena.venmo = 'lena-demo'; F.lena.cashapp = 'lenademo';
  F.maya.bio = 'Brunch enthusiast. Usually free on Sundays.'; F.theo.bio = 'Host of poker night. Ask me about the chips.'; F.lena.bio = 'Runs before sunrise. Come to the 5K!';
  var friends = [F.maya, F.theo, F.priya, F.marcus, F.lena, F.diego, F.sofia, F.ben, F.nora, F.kai];
  // Jamie's own notes: Maya is a favorite, Theo has a nickname.
  var personNotes = {}; personNotes[F.maya.id] = { favorite: true, nickname: null }; personNotes[F.theo.id] = { favorite: false, nickname: 'T' };
  var everyone = [me].concat(friends, [F.omar, F.ruby]);
  everyone.concat([]).forEach(function (p) { if (p !== me) p.age_confirmed_at = ago(60 * 24 * 40); });
  // People on Astro you don't know yet, so the search has something to find.
  var strangers = [person(31, 'Mason', '#4F7BE8', null, 'craters'), person(32, 'Maddie', '#D86A9A', null, 'glow'), person(33, 'Tess', '#2FA87A', null, 'ring'), person(34, 'Leo', '#C4651F', null, 'bands'), person(35, 'Priyanka', '#8A5BD6', null, 'swirl')];
  var byId = {}; everyone.concat(strangers).forEach(function (p) { byId[p.id] = p; });
  var friendships = friends.map(function (p) { return { user_a: ME, user_b: p.id, requested_by: ME, status: 'accepted' }; });
  friendships.push({ user_a: ME, user_b: F.omar.id, requested_by: F.omar.id, status: 'pending' });

  var G = function (id, kind, name, icon, color, members, code, pinned) {
    return { id: id, kind: kind, name: name, icon: icon, color: color, invite_code: code, created_by: ME, pinned_at: pinned ? ago(pinned) : null, cleared: false,
      members: members.map(function (p) { return { user_id: p.id, role: p.id === ME ? 'admin' : 'member', profile: p }; }) };
  };
  var groups = [
    G('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'The Crew', 'game', '#7C5CFF', [me, F.maya, F.theo, F.marcus, F.diego, F.kai, F.omar], 'CREW42', 30),
    G('aaaaaaaa-0000-4000-8000-000000000002', 'group', 'Sunday Brunch', 'home', '#E0864A', [me, F.priya, F.sofia, F.lena, F.nora, F.ruby], 'BRUNCH'),
    G('aaaaaaaa-0000-4000-8000-000000000003', 'dm', null, 'users', '#7C5CFF', [me, F.maya], 'DMMAYA', 20),
    G('aaaaaaaa-0000-4000-8000-000000000004', 'dm', null, 'users', '#7C5CFF', [me, F.theo], 'DMTHEO'),
    G('aaaaaaaa-0000-4000-8000-000000000005', 'group', 'Run Club', 'bolt', '#2FA87A', [me, F.lena, F.ben, F.kai], 'RUN5K1')
  ];
  var CREW = groups[0].id, BRUNCH = groups[1].id, DMMAYA = groups[2].id, DMTHEO = groups[3].id, RUN = groups[4].id;
  var gById = {}; groups.forEach(function (g) { gById[g.id] = g; });

  var tonight = new Date(); tonight.setHours(20, 0, 0, 0); if (tonight.getTime() < now + 2 * 3600000) tonight = new Date(now + 3 * 3600000);
  var sunday = new Date(); sunday.setDate(sunday.getDate() + ((7 - sunday.getDay()) % 7 || 7)); sunday.setHours(11, 0, 0, 0);
  var sat = new Date(); sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7)); sat.setHours(8, 0, 0, 0);
  var nextFri = new Date(sat.getTime() + 6 * 86400000); nextFri.setHours(19, 30, 0, 0);
  var gref = function (id) { var g = gById[id]; return { name: g.name, color: g.color, icon: g.icon }; };
  var events = [
    { id: 'e0000000-0000-4000-8000-000000000001', group_id: CREW, title: 'Poker night', icon: 'game', starts_at: tonight.toISOString(), location: "Theo's place", notes: 'Bring $20 and snacks', repeat: null, created_by: F.theo.id },
    { id: 'e0000000-0000-4000-8000-000000000002', group_id: BRUNCH, title: 'Sunday brunch', icon: 'coffee', starts_at: sunday.toISOString(), location: 'Juniper Cafe', notes: null, repeat: 'weekly', created_by: F.priya.id },
    { id: 'e0000000-0000-4000-8000-000000000003', group_id: RUN, title: 'Saturday 5K', icon: 'bolt', starts_at: sat.toISOString(), location: 'Riverside trail', notes: 'Meet at the bridge', repeat: 'weekly', created_by: F.lena.id },
    { id: 'e0000000-0000-4000-8000-000000000004', group_id: CREW, title: 'Game night', icon: 'game', starts_at: nextFri.toISOString(), location: null, notes: null, repeat: null, created_by: ME, share_code: 'DEMO0004', guests_ok: true }
  ];
  // People who answered a plan's guest link (astrosocial.io/e/CODE) without an account. Names and answers only.
  var linkGuests = [
    { id: 'g0000000-0000-4000-8000-000000000001', event_id: events[0].id, name: 'Sam', answer: 'going', user_id: null, created_at: ago(300) },
    { id: 'g0000000-0000-4000-8000-000000000002', event_id: events[3].id, name: 'Riley', answer: 'going', user_id: null, created_at: ago(120) },
    { id: 'g0000000-0000-4000-8000-000000000003', event_id: events[3].id, name: 'Dev', answer: 'maybe', user_id: null, created_at: ago(60) }
  ];
  var rsvps = [
    { event_id: events[0].id, user_id: ME, response: 'going' }, { event_id: events[0].id, user_id: F.theo.id, response: 'going' },
    { event_id: events[0].id, user_id: F.maya.id, response: 'going' }, { event_id: events[0].id, user_id: F.marcus.id, response: 'maybe' },
    { event_id: events[1].id, user_id: F.priya.id, response: 'going' }, { event_id: events[1].id, user_id: F.sofia.id, response: 'going' },
    { event_id: events[2].id, user_id: F.lena.id, response: 'going' }, { event_id: events[3].id, user_id: ME, response: 'going' }
  ];
  var r1 = new Date(); r1.setHours(18, 0, 0, 0);
  var reminders = [
    { id: 'r0000000-0000-4000-8000-000000000001', user_id: ME, group_id: null, title: 'Leg day', icon: 'dumbbell', remind_at: r1.toISOString(), repeat: 'weekdays', done_on: [] },
    { id: 'r0000000-0000-4000-8000-000000000002', user_id: ME, group_id: null, title: "Call Mom", icon: 'phone', remind_at: inH(26), repeat: null, done_on: [] }
  ];
  var share = function (p, amt, paidMin, method) { return { user_id: p.id, amount: amt, paid_at: paidMin == null ? null : ago(paidMin), method: method || null, profiles: p }; };
  var bills = [
    { id: 'b0000000-0000-4000-8000-000000000001', group_id: CREW, event_id: null, title: 'Tacos at Sofia', subtotal: '96.00', tip: '19.20', paid_by: F.maya.id, note: null, created_by: F.maya.id, created_at: ago(300),
      bill_shares: [share(F.maya, '28.80', 300, 'paid the bill'), share(me, '28.80', null), share(F.theo, '28.80', 120, 'Zelle'), share(F.diego, '28.80', null)] },
    { id: 'b0000000-0000-4000-8000-000000000002', group_id: BRUNCH, event_id: null, title: 'Brunch', subtotal: '72.00', tip: '0', paid_by: ME, note: 'Birthday brunch', created_by: ME, created_at: ago(4000),
      bill_shares: [share(me, '24.00', 4000, 'paid the bill'), share(F.priya, '24.00', 3000, 'Zelle'), share(F.sofia, '24.00', null)] }
  ];
  // An itemized bill: everyone taps what they had (Astro Plus "Snap and split").
  bills.push({ id: 'b0000000-0000-4000-8000-000000000003', group_id: CREW, event_id: null, title: 'Pizza night', subtotal: '58.60', tip: '9.00', tax: '4.60', itemized: true, paid_by: F.theo.id, note: null, created_by: F.theo.id, created_at: ago(30),
    bill_shares: [share(F.theo, '0', 30, 'paid the bill'), share(me, '0', null), share(F.maya, '0', null), share(F.diego, '0', null)] });
  var billItems = [
    { id: 'i0000000-0000-4000-8000-000000000001', bill_id: 'b0000000-0000-4000-8000-000000000003', name: 'Large pepperoni', price: 22, position: 0 },
    { id: 'i0000000-0000-4000-8000-000000000002', bill_id: 'b0000000-0000-4000-8000-000000000003', name: 'Margherita', price: 18, position: 1 },
    { id: 'i0000000-0000-4000-8000-000000000003', bill_id: 'b0000000-0000-4000-8000-000000000003', name: 'Garlic knots', price: 7, position: 2 },
    { id: 'i0000000-0000-4000-8000-000000000004', bill_id: 'b0000000-0000-4000-8000-000000000003', name: 'Caesar salad', price: 7, position: 3 }
  ];
  var itemClaims = [{ item_id: billItems[0].id, user_id: F.theo.id }, { item_id: billItems[0].id, user_id: F.diego.id }, { item_id: billItems[1].id, user_id: F.maya.id }];
  function recomputeItems(bid) {
    var b = bills.filter(function (x) { return x.id === bid; })[0]; if (!b) return;
    var total = Math.round((Number(b.subtotal) + Number(b.tip)) * 100), its = billItems.filter(function (i) { return i.bill_id === bid; });
    var itemsC = its.reduce(function (a, i) { return a + i.price * 100; }, 0), extra = total - itemsC, n = b.bill_shares.length;
    var raw = b.bill_shares.map(function (sh) { var f = 0; its.forEach(function (i) { var c = itemClaims.filter(function (x) { return x.item_id === i.id; }); if (!c.length) f += i.price * 100 / n; else if (c.some(function (x) { return x.user_id === sh.user_id; })) f += i.price * 100 / c.length; }); return f; });
    var food = raw.reduce(function (a, x) { return a + x; }, 0);
    raw = raw.map(function (x) { return x + (food > 0 ? extra * x / food : extra / n); });
    var base = raw.map(Math.floor), rem = total - base.reduce(function (a, x) { return a + x; }, 0);
    raw.map(function (x, k) { return [x - base[k], k]; }).sort(function (a, c) { return c[0] - a[0]; }).slice(0, Math.max(0, rem)).forEach(function (p) { base[p[1]]++; });
    b.bill_shares.forEach(function (sh, k) { sh.amount = (base[k] / 100).toFixed(2); });
  }
  recomputeItems('b0000000-0000-4000-8000-000000000003');
  bills.forEach(function (b) { b.groups = gref(b.group_id); });

  var GIF_GO = { url: 'https://media4.giphy.com/media/v1.Y2lkPWNkNzRjOTNlcDFsNjJrZ2lqNDJiOHhjc2dtdTllb2Nrb3Z3bDA4YzJkZHlhMWVpdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5UAofAl6g5t1GL5nO8/200w.gif', webp: 'https://media4.giphy.com/media/v1.Y2lkPWNkNzRjOTNlcDFsNjJrZ2lqNDJiOHhjc2dtdTllb2Nrb3Z3bDA4YzJkZHlhMWVpdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5UAofAl6g5t1GL5nO8/200w.webp', w: 200, h: 113, title: 'Lets Go', gif_id: '5UAofAl6g5t1GL5nO8' };
  var GIF_CAT = { url: 'https://media1.giphy.com/media/v1.Y2lkPWNkNzRjOTNlYWM3d3J6ajI4Nzl2dWd5MDdwN3Ywa2k0bjVmNGR6Nnhtdmg4cTNwNCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/266UxnrJ54aPPDihkC/200w.gif', webp: 'https://media1.giphy.com/media/v1.Y2lkPWNkNzRjOTNlYWM3d3J6ajI4Nzl2dWd5MDdwN3Ywa2k0bjVmNGR6Nnhtdmg4cTNwNCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/266UxnrJ54aPPDihkC/200w.webp', w: 200, h: 200, title: 'Hungry cat', gif_id: '266UxnrJ54aPPDihkC' };

  var nextId = 1000;
  var msgs = [];
  // likes: people who hearted it, or [person, 'thumbs'|'emphasis'] pairs. reply: id of the message it answers.
  var M = function (g, who, kind, body, meta, min, likes, reply) {
    var reacts = {};
    (likes || []).forEach(function (x) { if (Array.isArray(x)) reacts[x[0].id] = x[1]; else reacts[x.id] = 'heart'; });
    msgs.push({ id: ++nextId, group_id: g, user_id: who ? who.id : null, kind: kind, body: body, meta: meta || {}, created_at: ago(min), reacts: reacts, reply_to: reply || null });
    return nextId;
  };
  M(CREW, null, 'system', 'Jamie made The Crew', {}, 60 * 24 * 9);
  var POKER = M(CREW, F.theo, 'text', 'Poker at my place tonight?', null, 190, [[F.diego, 'emphasis'], [F.kai, 'thumbs']]);
  M(CREW, F.theo, 'event', 'Poker night', { event_id: events[0].id, title: 'Poker night', icon: 'game', starts_at: events[0].starts_at, location: "Theo's place" }, 189);
  M(CREW, F.maya, 'text', "I'm in 🙌", null, 150, [F.theo, me], POKER);
  M(CREW, F.marcus, 'text', 'Might be late, finishing a match', null, 120, [[F.theo, 'thumbs']], POKER);
  M(CREW, F.diego, 'gif', null, GIF_GO, 95, [F.maya]);
  M(CREW, F.maya, 'bill', 'Tacos at Sofia', { bill_id: bills[0].id, title: 'Tacos at Sofia', total_cents: 11520, people: 4, paid_by: F.maya.id, paid_by_name: 'Maya' }, 60);
  M(CREW, F.theo, 'bill', 'Pizza night', { bill_id: 'b0000000-0000-4000-8000-000000000003', title: 'Pizza night', total_cents: 6760, people: 4, paid_by: F.theo.id, paid_by_name: 'Theo', itemized: true }, 30);
  M(CREW, null, 'system', 'Theo turned on Crew Pass for everyone', { crew: 'on' }, 26);
  var POLL = M(CREW, F.theo, 'poll', 'Snacks for poker night?', { options: ['Chips and salsa', 'Pizza again', 'Both obviously'] }, 25);
  M(CREW, F.kai, 'text', 'Who has the chips?', null, 12);
  M(BRUNCH, F.priya, 'text', 'Same time Sunday?', null, 600);
  M(BRUNCH, F.sofia, 'text', 'Yes please. Juniper again?', null, 590, [[F.priya, 'thumbs']]);
  M(BRUNCH, F.priya, 'event', 'Sunday brunch', { event_id: events[1].id, title: 'Sunday brunch', icon: 'coffee', starts_at: events[1].starts_at, location: 'Juniper Cafe' }, 585);
  M(BRUNCH, F.lena, 'gif', null, GIF_CAT, 200);
  M(DMMAYA, F.maya, 'text', 'Are you coming tonight?', null, 40);
  M(DMMAYA, me, 'text', 'Wouldn’t miss it', null, 38, [F.maya]);
  M(DMMAYA, F.maya, 'text', 'Bring the good cards 😄', null, 6);
  M(DMTHEO, F.theo, 'text', 'Thanks for the tacos last week', null, 3000);
  M(RUN, F.lena, 'event', 'Saturday 5K', { event_id: events[2].id, title: 'Saturday 5K', icon: 'bolt', starts_at: events[2].starts_at, location: 'Riverside trail' }, 1500);
  M(RUN, F.ben, 'text', 'New personal best last week 🏃', null, 1400, [F.lena, F.kai]);
  M(RUN, me, 'system', 'Jamie made this group a Club', { club: 'on' }, 1300);
  M(RUN, me, 'announce', 'Saturday 5K starts at 8:30 this week. Meet at the north lot, bring water. Check in on the event when you get there.', {}, 900);

  var unread = {}; unread[CREW] = 2; unread[DMMAYA] = 1;

  // ---------- helpers ----------
  var json = function (body, status, extra) {
    return new Response(status === 204 ? null : JSON.stringify(body), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json' }, extra || {}) });
  };
  var eqv = function (u, k) { var v = u.searchParams.get(k); return v && v.indexOf('eq.') === 0 ? decodeURIComponent(v.slice(3)) : null; };
  var inv = function (u, k) { var v = u.searchParams.get(k); if (!v || v.indexOf('in.(') !== 0) return null; return v.slice(4, -1).split(',').map(function (x) { return x.replace(/"/g, ''); }); };
  var lastOf = function (g) { var l = null; msgs.forEach(function (m) { if (m.group_id === g) l = m; }); return l; };
  var rowMsg = function (m) { return { id: m.id, group_id: m.group_id, user_id: m.user_id, kind: m.kind, body: m.body, meta: m.meta, created_at: m.created_at, reply_to: m.reply_to || null, message_likes: Object.keys(m.reacts).map(function (u) { return { user_id: u, reaction: m.reacts[u] }; }) }; };
  var plainRow = function (m) { return { id: m.id, group_id: m.group_id, user_id: m.user_id, kind: m.kind, body: m.body, meta: m.meta, created_at: m.created_at, reply_to: m.reply_to || null }; };
  var eventRow = function (e) {
    return Object.assign({}, e, { groups: gref(e.group_id), rsvps: rsvps.filter(function (r) { return r.event_id === e.id; }).map(function (r) { return { user_id: r.user_id, response: r.response, profiles: byId[r.user_id] }; }) });
  };
  var chatList = function () {
    var list = groups.filter(function (g) { return !g.cleared || msgs.some(function (m) { return m.group_id === g.id && m.created_at > g.cleared; }); });
    list.sort(function (a, b) {
      if (!!a.pinned_at !== !!b.pinned_at) return a.pinned_at ? -1 : 1;
      if (a.pinned_at && b.pinned_at) return a.pinned_at < b.pinned_at ? -1 : 1;
      var la = lastOf(a.id), lb = lastOf(b.id); return (lb ? lb.created_at : '') < (la ? la.created_at : '') ? -1 : 1;
    });
    return list.map(function (g) {
      var last = lastOf(g.id);
      if (last && g.cleared && last.created_at <= g.cleared) last = null;
      return { id: g.id, kind: g.kind, name: g.name, icon: g.icon, color: g.color, invite_code: g.invite_code, created_by: g.created_by, pinned_at: g.pinned_at, members: g.members, last: last ? rowMsg(last) : null };
    });
  };

  // ---------- realtime (fake socket) ----------
  var sockets = [];
  var channels = {};   // topic -> { join_ref, pcs: [{id, event, table, filter}] }
  var presence = {};   // topic -> { key: meta }
  var ref = function () { return Math.random().toString(36).slice(2, 10); };
  function presenceJoin(topic, key, meta) {
    presence[topic] = presence[topic] || {}; var m = Object.assign({}, meta, { phx_ref: ref() }); presence[topic][key] = m;
    var joins = {}; joins[key] = { metas: [m] };
    push(topic, 'presence_diff', { joins: joins, leaves: {} });
  }
  function presenceLeave(topic, key) {
    var m = presence[topic] && presence[topic][key]; if (!m) return; delete presence[topic][key];
    var leaves = {}; leaves[key] = { metas: [m] };
    push(topic, 'presence_diff', { joins: {}, leaves: leaves });
  }
  var mayaTimer = null;
  function push(topic, event, payload) {
    var ch = channels[topic];
    var frame = JSON.stringify([ch ? ch.join_ref : null, null, topic, event, payload]);
    sockets.forEach(function (s) { if (s.readyState === 1 && s.onmessage) s.onmessage({ data: frame }); });
  }
  function dbEvent(table, type, record, old) {
    Object.keys(channels).forEach(function (topic) {
      var ch = channels[topic];
      ch.pcs.forEach(function (pc) {
        if (pc.table !== table || (pc.event !== '*' && pc.event !== type)) return;
        if (pc.filter) { var f = pc.filter.split('=eq.'); if (String((record || old || {})[f[0]]) !== f[1]) return; }
        push(topic, 'postgres_changes', { ids: [pc.id], data: { schema: 'public', table: table, commit_timestamp: new Date().toISOString(), type: type, record: record || {}, old_record: old || {}, columns: [], errors: null } });
      });
    });
  }
  function typingSignal(groupId, who, on) { push('realtime:typing:' + groupId, 'broadcast', { type: 'broadcast', event: 'typing', payload: { user: who.id, on: on } }); }

  var RealWS = window.WebSocket;
  function FakeWS(url) {
    if (String(url).indexOf(HOST) < 0) return new RealWS(url);
    var self = this; this.url = url; this.readyState = 0; this.binaryType = 'arraybuffer'; this.protocol = ''; this.bufferedAmount = 0;
    sockets.push(this);
    setTimeout(function () { self.readyState = 1; if (self.onopen) self.onopen({}); }, 20);
  }
  FakeWS.CONNECTING = 0; FakeWS.OPEN = 1; FakeWS.CLOSING = 2; FakeWS.CLOSED = 3;
  FakeWS.prototype.addEventListener = function (t, fn) { this['on' + t] = fn; };
  FakeWS.prototype.removeEventListener = function () {};
  FakeWS.prototype.close = function () { this.readyState = 3; var s = this; sockets = sockets.filter(function (x) { return x !== s; }); if (this.onclose) this.onclose({ code: 1000, reason: '', wasClean: true }); };
  FakeWS.prototype.send = function (data) {
    if (typeof data !== 'string') return;          // your own typing signal: nobody real to tell
    var m; try { m = JSON.parse(data); } catch (e) { return; }
    var msg = Array.isArray(m) ? { join_ref: m[0], ref: m[1], topic: m[2], event: m[3], payload: m[4] } : m;
    var reply = function (response) {
      var frame = JSON.stringify([msg.join_ref, msg.ref, msg.topic, 'phx_reply', { status: 'ok', response: response || {} }]);
      var s = this; setTimeout(function () { if (s.onmessage) s.onmessage({ data: frame }); }, 5);
    }.bind(this);
    if (msg.event === 'phx_join') {
      var pcs = ((msg.payload && msg.payload.config && msg.payload.config.postgres_changes) || []).map(function (x, i) { return Object.assign({}, x, { id: 1000 + Object.keys(channels).length * 10 + i }); });
      channels[msg.topic] = { join_ref: msg.join_ref, pcs: pcs };
      reply({ postgres_changes: pcs });
      if (msg.topic.indexOf('realtime:voice:') === 0) {
        var state = {}; Object.keys(presence[msg.topic] || {}).forEach(function (k) { state[k] = { metas: [presence[msg.topic][k]] }; });
        var tp = msg.topic; setTimeout(function () { push(tp, 'presence_state', state); }, 10);
      }
    } else if (msg.event === 'phx_leave') { delete channels[msg.topic]; reply(); }
    else if (msg.event === 'presence') {
      reply();
      var pl = msg.payload || {};
      var myKey = (msg.topic.indexOf('realtime:voice:') === 0) ? ME : null;
      if (myKey && pl.event === 'track') {
        var tp2 = msg.topic; var fresh = !(presence[tp2] && presence[tp2][ME]);
        if (!fresh) presenceLeave(tp2, ME);
        presenceJoin(tp2, ME, pl.payload || {});
        // Maya hops in shortly after you start the room.
        if (fresh && tp2 === 'realtime:voice:' + DMMAYA) { if (mayaTimer) clearTimeout(mayaTimer); mayaTimer = setTimeout(function () { if (presence[tp2] && presence[tp2][ME]) presenceJoin(tp2, F.maya.id, { user_id: F.maya.id, muted: false, speaking: false }); }, 2500); }
      } else if (myKey && pl.event === 'untrack') {
        presenceLeave(msg.topic, ME); presenceLeave(msg.topic, F.maya.id); if (mayaTimer) clearTimeout(mayaTimer);
      }
    }
    else reply();
  };
  FakeWS.prototype.CONNECTING = 0; FakeWS.prototype.OPEN = 1; FakeWS.prototype.CLOSING = 2; FakeWS.prototype.CLOSED = 3;
  window.WebSocket = FakeWS;

  // ---------- friends write back ----------
  var REPLIES = {
    text: ['Haha yes', 'On my way 🚀', 'Sounds good to me', 'Love that', 'Wait, really?', 'Count me in', 'Lol', 'I was just thinking that', 'Deal 🤝', 'See you there'],
    q: ['Good question 🤔', 'Yes!', 'Probably, let me check', "I think so, let's do it"]
  };
  var replyN = 0;
  function friendReplies(groupId, mine, mineId) {
    var g = gById[groupId]; if (!g) return;
    var others = g.members.filter(function (x) { return x.user_id !== ME && byId[x.user_id] && friends.indexOf(byId[x.user_id]) >= 0; });
    if (!others.length) return;
    var who = byId[others[replyN % others.length].user_id];
    var bank = /\?\s*$/.test(mine || '') ? REPLIES.q : REPLIES.text;
    var text = bank[replyN++ % bank.length];
    setTimeout(function () { typingSignal(groupId, who, true); }, 900);
    setTimeout(function () { typingSignal(groupId, who, true); }, 3300);
    setTimeout(function () {
      typingSignal(groupId, who, false);
      // Every other time, the friend answers your message as a reply.
      var m = { id: ++nextId, group_id: groupId, user_id: who.id, kind: 'text', body: text, meta: {}, created_at: new Date().toISOString(), reacts: {}, reply_to: replyN % 2 === 0 && mineId ? mineId : null };
      msgs.push(m);
      dbEvent('messages', 'INSERT', plainRow(m));
    }, 4200 + text.length * 40);
    // ...and someone else reacts to what you said.
    var reactor = others.length > 1 ? byId[others[(replyN + 1) % others.length].user_id] : null;
    if (reactor && mineId) setTimeout(function () {
      var r = ['thumbs', 'heart', 'emphasis'][replyN % 3];
      msgs.forEach(function (x) { if (x.id === mineId) x.reacts[reactor.id] = r; });
      dbEvent('message_likes', 'INSERT', { message_id: mineId, user_id: reactor.id, reaction: r });
    }, 2200);
  }
  // While you're chatting, someone else texts you from another chat (shows the new message banner).
  var ELSEWHERE = [
    [DMTHEO, 'theo', 'Still on for tonight? I got the good chips'],
    [BRUNCH, 'sofia', 'Booked a table for 6 on Sunday ☕'],
    [DMMAYA, 'maya', 'Wait, who is bringing the cards??'],
    [RUN, 'lena', 'Rain tomorrow, moving the 5K to Sunday', 'comms']
  ];
  var elseN = 0, elseBusy = false;
  function textFromElsewhere(fromGroup) {
    if (elseBusy) return; elseBusy = true;
    var pick = ELSEWHERE.filter(function (x) { return x[0] !== fromGroup; })[elseN++ % 4];
    setTimeout(function () {
      elseBusy = false;
      var who = F[pick[1]];
      var isComms = pick[3] === 'comms';
      var m = { id: ++nextId, group_id: pick[0], user_id: who.id, kind: isComms ? 'system' : 'text', body: isComms ? who.display_name + ' opened the Comms link' : pick[2], meta: isComms ? { comms: 'open' } : {}, created_at: new Date().toISOString(), reacts: {}, reply_to: null };
      msgs.push(m); if (!isComms) unread[pick[0]] = (unread[pick[0]] || 0) + 1;
      if (isComms) { var tpc = 'realtime:voice:' + pick[0]; presence[tpc] = presence[tpc] || {}; presence[tpc][who.id] = { user_id: who.id, muted: false, speaking: false, phx_ref: ref() }; }
      dbEvent('messages', 'INSERT', plainRow(m));
    }, 9000);
  }

  // A little life while you look around: Maya starts typing to you a few seconds in.
  setTimeout(function () { typingSignal(DMMAYA, F.maya, true); }, 6000);
  setTimeout(function () { typingSignal(DMMAYA, F.maya, false); }, 11000);

  // ---------- Signal ----------
  // Jamie's friends answer a few seconds after a signal goes out; Theo sends one to Jamie a little after the orbit loads.
  var signals = [];
  function sigRow(sg) { return { id: sg.id, owner: sg.owner, text: sg.text, when_text: sg.when_text, status: sg.status, event_id: sg.event_id, group_id: sg.group_id, created_at: sg.created_at, expires_at: sg.expires_at, signal_targets: sg.targets.map(function (x) { return { user_id: x.user_id, answer: x.answer, answered_at: x.answered_at, seen_at: x.seen_at }; }) }; }
  function answerLater(sg, uid, ans, ms) { setTimeout(function () { if (sg.status !== 'open') return; sg.targets.forEach(function (x) { if (x.user_id === uid) { x.answer = ans; x.answered_at = new Date().toISOString(); } }); dbEvent('signal_targets', 'UPDATE', { signal_id: sg.id, user_id: uid, answer: ans }); }, ms); }
  setTimeout(function () {
    var sg = { id: 's0000000-0000-4000-8000-000000000001', owner: F.theo.id, text: 'Poker warm up at 7?', when_text: 'Tonight', status: 'open', event_id: null, group_id: null, created_at: new Date().toISOString(), expires_at: new Date(now + 8 * 3600000).toISOString(), targets: [{ user_id: ME, answer: null, answered_at: null, seen_at: null }, { user_id: F.marcus.id, answer: 'in', answered_at: new Date().toISOString(), seen_at: null }] };
    signals.push(sg); dbEvent('signal_targets', 'INSERT', { signal_id: sg.id, user_id: ME, answer: null });
  }, 14000);

  // ---------- Comms rings ----------
  // You ring people: the first answers and hops on, the next declines, the rest don't pick up.
  // A minute into the demo, Lena rings you from Run Club (she's already on that line).
  var rings = [];
  function ringRow(r) { return { id: r.id, group_id: r.group_id, caller: r.caller, target: r.target, status: r.status, created_at: r.created_at, expires_at: r.expires_at }; }
  function setRing(r, st) { if (r.status !== 'ringing') return; r.status = st; dbEvent('comms_rings', 'UPDATE', ringRow(r), ringRow(r)); }
  setTimeout(function () {
    var tpc = 'realtime:voice:' + RUN; presence[tpc] = presence[tpc] || {}; presence[tpc][F.lena.id] = { user_id: F.lena.id, muted: false, speaking: false, phx_ref: ref() };
    var r = { id: 'r0000000-0000-4000-8000-000000000001', group_id: RUN, caller: F.lena.id, target: ME, status: 'ringing', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30000).toISOString() };
    rings.push(r); dbEvent('comms_rings', 'INSERT', ringRow(r));
  }, 60000);

  // ---------- database answers ----------
  var b64 = function (o) { return btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  var exp = Math.floor(now / 1000) + 7 * 86400;
  var jwt = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: ME, exp: exp, role: 'authenticated', email: 'jamie@demo.astrosocial.io' }) + '.demo';
  var user = { id: ME, aud: 'authenticated', role: 'authenticated', email: 'jamie@demo.astrosocial.io', user_metadata: { display_name: 'Jamie' }, app_metadata: {}, created_at: ago(60 * 24 * 30) };
  var session = { access_token: jwt, refresh_token: 'demo', expires_at: exp, expires_in: 7 * 86400, token_type: 'bearer', user: user };
  try { localStorage.setItem('sb-vxalwjzvlxtdcjcjvlqp-auth-token', JSON.stringify(session)); } catch (e) {}

  // ---------- Astro Plus (demo) ----------
  // Jamie starts without Plus so "Try Plus free" can be tried. A few friends already wear planet styles.
  // Plus and your planet style survive a page refresh in the demo (kept in this browser only).
  var plusRow = null; var myStyle = null;
  try { var keep = JSON.parse(localStorage.getItem('astro.demo.plus') || 'null'); if (keep) { plusRow = keep.plus || null; myStyle = keep.style || null; } } catch (e) {}
  function keepPlus() { try { localStorage.setItem('astro.demo.plus', JSON.stringify({ plus: plusRow, style: cosmetics[ME] || null })); } catch (e) {} }
  var cosmetics = {}; cosmetics[F.maya.id] = { ring: 'saturn', ring_color: '#FFC46B', aura: 'glow' }; cosmetics[F.theo.id] = { moons: 2, moon_color: '#B9A8FF' };
  cosmetics[F.priya.id] = { ring: 'neon', ring_color: '#6FD8FF', aura: 'sparkle' }; cosmetics[F.lena.id] = { ring: 'dust', ring_color: '#7FE7C4', moons: 1 };
  if (myStyle) cosmetics[ME] = myStyle;
  var perks = {};
  function perkRow(g) { return perks[g] || (perks[g] = { group_id: g, crew_on: false, crew_until: null, club: false, theme: {}, crew_by: null, club_by: null, club_since: null }); }
  perkRow(CREW).crew_on = true; perkRow(CREW).crew_by = F.theo.id; perkRow(CREW).theme = { scene: 'aurora', accent: '#3FD99A' };
  perkRow(RUN).club = true; perkRow(RUN).club_by = ME; perkRow(RUN).club_since = ago(1300); perkRow(RUN).admins_only = false;
  var pollVotes = {}; pollVotes[POLL] = {}; pollVotes[POLL][F.maya.id] = 2; pollVotes[POLL][F.theo.id] = 2; pollVotes[POLL][F.diego.id] = 0; pollVotes[POLL][F.kai.id] = 1;
  var checkins = {};
  function sysMsg(g, body, meta) { var sm = { id: ++nextId, group_id: g, user_id: ME, kind: 'system', body: body, meta: meta || {}, created_at: new Date().toISOString(), reacts: {}, reply_to: null }; msgs.push(sm); dbEvent('messages', 'INSERT', plainRow(sm)); }

  var RPC = {
    chat_list: function () { return chatList(); },
    unread_counts: function () { return Object.keys(unread).filter(function (k) { return unread[k] > 0; }).map(function (k) { return { group_id: k, unread: unread[k] }; }); },
    mark_read: function (a) { if (a && a.g) unread[a.g] = 0; return null; },
    request_people: function () { return friendships.filter(function (f) { return f.status === 'pending'; }).map(function (f) { return byId[f.user_a === ME ? f.user_b : f.user_a]; }); },
    recent_people: function () { return [Object.assign({}, F.ruby, { last_at: ago(90), reason: 'In Sunday Brunch' })]; },
    pin_chat: function (a) { var g = gById[a.g]; if (g) g.pinned_at = a.pin ? (g.pinned_at || new Date().toISOString()) : null; return null; },
    delete_chat: function (a) { var g = gById[a.g]; if (g) { g.cleared = new Date().toISOString(); g.pinned_at = null; } return null; },
    open_dm: function (a) {
      var other = a.other, found = groups.filter(function (g) { return g.kind === 'dm' && g.members.some(function (m) { return m.user_id === other; }); })[0];
      if (found) return found.id;
      var g = G('aaaaaaaa-0000-4000-8000-0000000001' + String(10 + groups.length), 'dm', null, 'users', '#7C5CFF', [me, byId[other]], 'DM' + groups.length + 'XYZ'.slice(0, 4 - String(groups.length).length));
      groups.push(g); gById[g.id] = g; return g.id;
    },
    friend_respond: function (a) { friendships.forEach(function (f) { if (f.user_b === a.other || f.user_a === a.other) f.status = a.accept ? 'accepted' : 'declined'; }); if (a.accept && friends.indexOf(byId[a.other]) < 0) friends.push(byId[a.other]); return null; },
    friend_request: function () { return null; },
    find_user: function () { return []; },
    ring_comms: function (a) {
      var g = gById[a.g]; if (!g) throw new Error('Chat not found');
      var who = g.members.map(function (m) { return m.user_id; }).filter(function (u) { return u !== ME && (!a.targets || a.targets.indexOf(u) >= 0); });
      who.forEach(function (u, i) {
        if (rings.some(function (x) { return x.target === u && x.group_id === a.g && x.status === 'ringing'; })) return;
        var r = { id: 'r' + String(Date.now()).slice(-7) + i + '-0000-4000-8000-000000000000', group_id: a.g, caller: ME, target: u, status: 'ringing', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30000).toISOString() };
        rings.push(r); dbEvent('comms_rings', 'INSERT', ringRow(r));
        var k = rings.filter(function (x) { return x.caller === ME; }).length;
        if (k % 3 === 1) setTimeout(function () { setRing(r, 'answered'); presenceJoin('realtime:voice:' + a.g, u, { user_id: u, muted: false, speaking: false }); }, 3500 + i * 900);
        else if (k % 3 === 2) setTimeout(function () { setRing(r, 'declined'); }, 5000 + i * 900);
      });
      return who.length;
    },
    respond_ring: function (a) { rings.forEach(function (r) { if (r.id === a.r && r.target === ME) setRing(r, a.ans); }); return null; },
    cancel_rings: function (a) { rings.forEach(function (r) { if (r.caller === ME && r.group_id === a.g && (!a.who || r.target === a.who)) setRing(r, 'cancelled'); }); return null; },
    send_signal: function (a) {
      signals.forEach(function (x) { if (x.owner === ME && x.status === 'open') x.status = 'closed'; });
      var sg = { id: 's0000000-0000-4000-8000-' + String(Date.now()).slice(-12), owner: ME, text: a.msg, when_text: a.when_txt || null, status: 'open', event_id: null, group_id: null, created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 8 * 3600000).toISOString(),
        targets: (a.targets || []).filter(function (u) { return byId[u] && u !== ME; }).map(function (u) { return { user_id: u, answer: null, answered_at: null, seen_at: null }; }) };
      if (!sg.targets.length) throw new Error('Pick at least one friend');
      signals.push(sg);
      var order = sg.targets.map(function (x) { return x.user_id; });
      order.forEach(function (u, i) { answerLater(sg, u, i % 3 === 2 ? 'out' : 'in', 2500 + i * 1800); });
      return sg.id;
    },
    answer_signal: function (a) { signals.forEach(function (sg) { if (sg.id === a.s) sg.targets.forEach(function (x) { if (x.user_id === ME) { x.answer = a.ans; x.answered_at = a.ans ? new Date().toISOString() : null; } }); }); return null; },
    seen_signal: function () { return null; },
    close_signal: function (a) { signals.forEach(function (sg) { if (sg.id === a.s && sg.owner === ME) sg.status = 'closed'; }); return null; },
    signal_to_plan: function (a) {
      var sg = signals.filter(function (x) { return x.id === a.s; })[0]; if (!sg) throw new Error('Signal not found');
      var ins = sg.targets.filter(function (x) { return x.answer === 'in'; }).map(function (x) { return byId[x.user_id]; });
      var g = G('aaaaaaaa-0000-4000-8000-0000000003' + String(10 + groups.length), 'group', a.group_name || sg.text, a.new_icon || 'spark', '#7C5CFF', [me].concat(ins), 'SIG' + groups.length + 'AB'); groups.push(g); gById[g.id] = g;
      var e = { id: 'e0000000-0000-4000-8000-' + String(Date.now()).slice(-12), group_id: g.id, title: a.new_title || sg.text, icon: a.new_icon || 'spark', starts_at: a.new_starts || inH(2), location: a.new_location || null, notes: null, repeat: null, created_by: ME };
      events.push(e); [me].concat(ins).forEach(function (p) { rsvps.push({ event_id: e.id, user_id: p.id, response: 'going' }); });
      msgs.push({ id: ++nextId, group_id: g.id, user_id: ME, kind: 'system', body: 'Jamie sent a signal: "' + sg.text + '". ' + ins.length + ' said In.', meta: { signal: sg.id }, created_at: new Date().toISOString(), reacts: {}, reply_to: null });
      msgs.push({ id: ++nextId, group_id: g.id, user_id: ME, kind: 'event', body: e.title, meta: { event_id: e.id, title: e.title, icon: e.icon, starts_at: e.starts_at, when: a.when_text || '' }, created_at: new Date().toISOString(), reacts: {}, reply_to: null });
      sg.status = 'planned'; sg.event_id = e.id; sg.group_id = g.id;
      return e.id;
    },
    // Typeahead: everyone on Astro whose @username starts with what you typed (strangers included).
    search_users: function (a) { var q = String(a.q || '').toLowerCase(); if (q.length < 2) return []; return everyone.concat(strangers).filter(function (p) { return p.id !== ME && p.username.indexOf(q) === 0; }).sort(function (x, y) { return (y.username === q) - (x.username === q) || x.username.length - y.username.length; }).slice(0, 8); },
    create_event: function (a) { var e = { id: 'e0000000-0000-4000-8000-' + String(Date.now()).slice(-12), group_id: a.g, title: a.new_title || 'Plan', icon: a.new_icon || 'calendar', starts_at: a.new_starts || inH(24), location: a.new_location || null, notes: a.new_notes || null, repeat: a.new_repeat || null, created_by: ME };
      var ec = { id: ++nextId, group_id: e.group_id, user_id: ME, kind: 'event', body: e.title, meta: { event_id: e.id, title: e.title, icon: e.icon, starts_at: e.starts_at, location: e.location }, created_at: new Date().toISOString(), likes: [] }; msgs.push(ec); events.push(e); rsvps.push({ event_id: e.id, user_id: ME, response: 'going' }); return e.id; },
    update_event: function () { return null; },
    event_share_link: function (a) { var e = events.filter(function (x) { return x.id === a.e; })[0]; if (!e) throw new Error('Event not found'); if (!e.share_code) e.share_code = 'DEMO' + String(events.indexOf(e) + 1).padStart(4, '0'); return e.share_code; },
    reset_share_link: function (a) { var e = events.filter(function (x) { return x.id === a.e; })[0]; if (!e) throw new Error('Event not found'); e.share_code = 'DEMO' + String(Date.now()).slice(-4); return e.share_code; },
    set_guests_ok: function (a) { events.forEach(function (e) { if (e.id === a.e) e.guests_ok = !!a.onoff; }); return null; },
    remove_guest: function (a) { linkGuests = linkGuests.filter(function (g) { return g.id !== a.gid; }); return null; },
    guest_plans: function () { return []; },
    create_group: function (a) { var g = G('aaaaaaaa-0000-4000-8000-0000000002' + String(10 + groups.length), 'group', a.new_name || 'New group', a.new_icon || 'users', a.new_color || '#7C5CFF', [me], 'NEW' + groups.length + 'AB'); groups.push(g); gById[g.id] = g; return g.id; },
    create_bill: function () { return bills[0].id; },
    set_share_paid: function (a) { bills.forEach(function (b) { b.bill_shares.forEach(function (s) { if (b.id === a.b && s.user_id === (a.member || ME)) { s.paid_at = a.paid ? new Date().toISOString() : null; s.method = a.paid ? (a.how || 'Zelle') : null; } }); }); return null; },
    invite_preview: function (a) { var g = groups.filter(function (x) { return x.invite_code === String(a.code || '').toUpperCase(); })[0]; return g ? [{ group_id: g.id, name: g.name, icon: g.icon, color: g.color, people: g.members.length, already: true }] : []; },
    join_group: function () { return CREW; },
    reset_invite: function () { return 'DEMO99'; },
    update_group: function () { return null; },
    set_member_role: function () { return null; },
    remove_member: function () { return null; },
    unfriend: function () { return null; },
    add_to_group: function (a) { var g = gById[a.g], p = byId[a.person]; if (!g || !p) return null; if (g.members.some(function (m) { return m.user_id === p.id; })) throw new Error('They are already in this group');
      g.members.push({ user_id: p.id, role: 'member', profile: p });
      var sm = { id: ++nextId, group_id: g.id, user_id: null, kind: 'system', body: 'Jamie added ' + p.display_name, meta: {}, created_at: new Date().toISOString(), reacts: {}, reply_to: null }; msgs.push(sm);
      dbEvent('messages', 'INSERT', plainRow(sm)); return null; },
    comms_open: function (a) { var sm = { id: ++nextId, group_id: a.g, user_id: ME, kind: 'system', body: 'Jamie opened the Comms link', meta: { comms: 'open' }, created_at: new Date().toISOString(), reacts: {}, reply_to: null }; msgs.push(sm); dbEvent('messages', 'INSERT', plainRow(sm)); return null; },
    set_group_photo: function (a) { var g = gById[a.g]; if (g) g.photo_url = a.url || null; return null; },
    set_bill_receipt: function () { return null; },
    set_event_photo: function (a) { events.forEach(function (e) { if (e.id === a.e) e.photo_url = a.url || null; }); return null; },
    start_plus_beta: function () { plusRow = plusRow || { user_id: ME, source: 'beta', started_at: new Date().toISOString(), expires_at: null }; keepPlus(); return null; },
    end_plus_beta: function () { plusRow = null; keepPlus(); return null; },
    set_cosmetics: function (a) { if (!plusRow && a.c && Object.keys(a.c).length) throw new Error('Planet styles come with Astro Plus'); cosmetics[ME] = a.c && Object.keys(a.c).length ? a.c : null; keepPlus(); return null; },
    get_cosmetics: function (a) { return (a.ids || []).filter(function (id) { return cosmetics[id] && (id !== ME || plusRow); }).map(function (id) { return { id: id, cosmetics: cosmetics[id] }; }); },
    set_crew_pass: function (a) { var r = perkRow(a.g); r.crew_on = !!a.onoff; if (a.onoff) { r.crew_by = ME; sysMsg(a.g, 'Jamie turned on Crew Pass for everyone', { crew: 'on' }); } dbEvent('group_perks', 'UPDATE', r); return null; },
    set_group_theme: function (a) { var r = perkRow(a.g); if (!r.crew_on && !r.club) throw new Error('Group themes come with Crew Pass'); r.theme = a.th || {}; dbEvent('group_perks', 'UPDATE', r); return null; },
    make_club: function (a) { var r = perkRow(a.g); r.club = !!a.onoff; if (a.onoff) { r.club_by = ME; r.club_since = r.club_since || new Date().toISOString(); sysMsg(a.g, 'Jamie made this group a Club', { club: 'on' }); } dbEvent('group_perks', 'UPDATE', r); return null; },
    vote_poll: function (a) { pollVotes[a.m] = pollVotes[a.m] || {}; if (a.pick == null) delete pollVotes[a.m][ME]; else pollVotes[a.m][ME] = a.pick; dbEvent('poll_votes', 'UPDATE', { message_id: a.m, user_id: ME, choice: a.pick }); return null; },
    create_poll: function (a) { var r = perkRow(a.g); if (!r.crew_on && !r.club) throw new Error('Polls come with Crew Pass and Clubs'); var opts = (a.opts || []).map(function (o) { return String(o).trim(); }).filter(Boolean); if (opts.length < 2) throw new Error('Give 2 to 6 options');
      var pm = { id: ++nextId, group_id: a.g, user_id: ME, kind: 'poll', body: a.q, meta: { options: opts }, created_at: new Date().toISOString(), reacts: {}, reply_to: null }; msgs.push(pm); pollVotes[pm.id] = {}; dbEvent('messages', 'INSERT', plainRow(pm));
      var g = gById[a.g]; g.members.filter(function (m) { return m.user_id !== ME; }).slice(0, 3).forEach(function (m, i) { setTimeout(function () { pollVotes[pm.id][m.user_id] = i % opts.length; dbEvent('poll_votes', 'INSERT', { message_id: pm.id, user_id: m.user_id }); }, 1500 + i * 1300); });
      return pm.id; },
    post_announcement: function (a) { var am = { id: ++nextId, group_id: a.g, user_id: ME, kind: 'announce', body: a.txt, meta: {}, created_at: new Date().toISOString(), reacts: {}, reply_to: null }; msgs.push(am); dbEvent('messages', 'INSERT', plainRow(am)); return am.id; },
    set_admins_only: function (a) { perkRow(a.g).admins_only = !!a.onoff; sysMsg(a.g, a.onoff ? 'Jamie made the chat admins only' : 'Jamie opened the chat to everyone'); return null; },
    check_in: function (a) { checkins[a.e] = checkins[a.e] || []; if (a.onoff === false) checkins[a.e] = checkins[a.e].filter(function (x) { return x !== ME; }); else if (checkins[a.e].indexOf(ME) < 0) checkins[a.e].push(ME); return null; },
    club_roster: function (a) { var g = gById[a.g]; return g.members.map(function (m) { return { display_name: m.profile.display_name, username: m.profile.username, role: m.role, joined_at: ago(60 * 24 * 20), checkins: m.user_id === ME ? 3 : 1 }; }); },
    claim_item: function (a) { var who = a.who || ME; itemClaims = itemClaims.filter(function (c) { return !(c.item_id === a.i && c.user_id === who); }); if (a.onoff) itemClaims.push({ item_id: a.i, user_id: who });
      var it = billItems.filter(function (i) { return i.id === a.i; })[0]; if (it) { recomputeItems(it.bill_id); dbEvent('item_claims', 'INSERT', { item_id: a.i, user_id: who }); dbEvent('bill_shares', 'UPDATE', { bill_id: it.bill_id }); } return null; },
    create_item_bill: function (a) { var id = 'b0000000-0000-4000-8000-' + String(Date.now()).slice(-12); var items = a.items || [], itemsC = items.reduce(function (x, i) { return x + (i.cents || 0); }, 0);
      var people = (a.people || []).concat([a.payer]).filter(function (v, i, arr) { return arr.indexOf(v) === i; });
      var b = { id: id, group_id: a.g, event_id: null, title: a.bill_title, subtotal: ((itemsC + (a.tax_cents || 0)) / 100).toFixed(2), tip: ((a.tip_cents || 0) / 100).toFixed(2), tax: ((a.tax_cents || 0) / 100).toFixed(2), itemized: true, paid_by: a.payer, note: a.bill_note || null, created_by: ME, created_at: new Date().toISOString(),
        bill_shares: people.map(function (p) { return share(byId[p], '0', p === a.payer ? 0 : null, p === a.payer ? 'paid the bill' : null); }) };
      b.groups = gref(a.g); bills.unshift(b);
      items.forEach(function (i, k) { billItems.push({ id: 'i' + String(Date.now()).slice(-7) + k + '-0000-4000-8000-000000000000', bill_id: id, name: i.name, price: (i.cents || 0) / 100, position: k }); });
      recomputeItems(id);
      var bm = { id: ++nextId, group_id: a.g, user_id: ME, kind: 'bill', body: a.bill_title, meta: { bill_id: id, title: a.bill_title, total_cents: itemsC + (a.tax_cents || 0) + (a.tip_cents || 0), people: people.length, paid_by: a.payer, paid_by_name: byId[a.payer].display_name, itemized: true }, created_at: new Date().toISOString(), reacts: {}, reply_to: null };
      msgs.push(bm); return id; },
    orbit_recap: function (a) { var grp = a.g ? gById[a.g] : null;
      return { messages: grp ? 86 : 214, my_messages: 214, photos: grp ? 11 : 23, voice: 6, plans: grp ? 4 : 7, comms: grp ? 3 : 9, signals: 5, signal_ins: 14, bills: grp ? 3 : 6, bills_total: grp ? 241.8 : 488.4, settled: 9, new_friends: 3, busiest_day: 'Friday', busiest_hour: 21,
        top_people: (grp ? grp.members.filter(function (m) { return m.user_id !== ME; }).map(function (m) { return m.profile; }) : [F.maya, F.theo, F.priya]).slice(0, 3).map(function (p, i) { return { id: p.id, name: p.display_name, color: p.color, n: [64, 41, 27][i] }; }),
        top_group: grp ? null : { id: CREW, name: 'The Crew', icon: 'game', color: '#7C5CFF', n: 132 }, top_words: ['poker', 'tonight', 'tacos', 'brunch', 'chips'] }; },
    confirm_age: function () { var ts = me.age_confirmed_at || new Date().toISOString(); me.age_confirmed_at = ts; try { localStorage.setItem('astro.demo.age', ts); } catch (e) {} return ts; },
    delete_my_account: function () { return null; }
  };

  function table(t, method, u, body, single) {
    if (t === 'profiles') {
      if (method === 'PATCH') { Object.assign(me, body || {}); return [me]; }
      var id = eqv(u, 'id'), ids = inv(u, 'id');
      if (id) return everyone.filter(function (p) { return p.id === id; });
      if (ids) return everyone.filter(function (p) { return ids.indexOf(p.id) >= 0; });
      return everyone;
    }
    if (t === 'plus_members') return plusRow ? [plusRow] : [];
    if (t === 'poll_votes') { var pm = Number(eqv(u, 'message_id')); var pv = pollVotes[pm] || {}; return Object.keys(pv).map(function (k) { return { user_id: k, choice: pv[k] }; }); }
    if (t === 'event_checkins') { var ce = eqv(u, 'event_id'); return (checkins[ce] || []).map(function (k) { return { user_id: k }; }); }
    if (t === 'bill_items') { var bi = eqv(u, 'bill_id'); return billItems.filter(function (i) { return i.bill_id === bi; }); }
    if (t === 'item_claims') { var bc = eqv(u, 'bill_items.bill_id'); var ids = billItems.filter(function (i) { return i.bill_id === bc; }).map(function (i) { return i.id; }); return itemClaims.filter(function (c) { return ids.indexOf(c.item_id) >= 0; }); }
    if (t === 'group_perks') { var pg = eqv(u, 'group_id'); return pg && perks[pg] ? [perks[pg]] : []; }
    if (t === 'comms_rings') return rings.filter(function (r) { return r.caller === ME || r.target === ME; }).map(ringRow);
    if (t === 'signals') return signals.filter(function (sg) { return sg.owner === ME || sg.targets.some(function (x) { return x.user_id === ME; }); }).map(sigRow);
    if (t === 'person_notes') {
      if (method === 'POST') { var pn = Array.isArray(body) ? body[0] : body; personNotes[pn.person] = { favorite: !!pn.favorite, nickname: pn.nickname || null }; return [pn]; }
      return Object.keys(personNotes).map(function (k) { return { person: k, favorite: personNotes[k].favorite, nickname: personNotes[k].nickname }; });
    }
    if (t === 'friendships') return friendships;
    if (t === 'groups') { var gid = eqv(u, 'id'); var list = groups.filter(function (g) { return !gid || g.id === gid; }); return list.map(function (g) { return Object.assign({}, g, { group_members: g.members.map(function (m) { return { user_id: m.user_id, role: m.role, profiles: m.profile }; }) }); }); }
    if (t === 'group_members') { var g2 = gById[eqv(u, 'group_id')]; return g2 ? g2.members.map(function (m) { return { user_id: m.user_id, role: m.role, profiles: m.profile }; }) : []; }
    if (t === 'messages') {
      if (method === 'POST') {
        var m = { id: ++nextId, group_id: body.group_id, user_id: ME, kind: body.kind || 'text', body: body.body == null ? null : body.body, meta: body.meta || {}, created_at: new Date().toISOString(), reacts: {}, reply_to: body.reply_to || null };
        msgs.push(m); setTimeout(function () { friendReplies(m.group_id, m.body, m.id); textFromElsewhere(m.group_id); }, 50);
        return [plainRow(m)];
      }
      var one = eqv(u, 'id');
      if (one) return msgs.filter(function (x) { return String(x.id) === one; }).map(plainRow);
      var g3 = eqv(u, 'group_id'), lt = u.searchParams.get('created_at');
      var gg = gById[g3];
      var k1 = eqv(u, 'kind'), ks = inv(u, 'kind');
      var rows = msgs.filter(function (x) { return x.group_id === g3 && (!gg || !gg.cleared || x.created_at > gg.cleared) && (!k1 || x.kind === k1) && (!ks || ks.indexOf(x.kind) >= 0); });
      if (lt && lt.indexOf('lt.') === 0) { var c = decodeURIComponent(lt.slice(3)); rows = rows.filter(function (x) { return x.created_at < c; }); }
      return rows.slice().reverse().slice(0, Number(u.searchParams.get('limit') || 60)).map(rowMsg);
    }
    if (t === 'message_likes') {
      var lb = Array.isArray(body) ? body[0] : body;
      var mid = Number((lb && lb.message_id) || eqv(u, 'message_id'));
      msgs.forEach(function (x) { if (x.id === mid) { if (method === 'DELETE') delete x.reacts[ME]; else x.reacts[ME] = (lb && lb.reaction) || 'heart'; } });
      return [];
    }
    if (t === 'events') {
      if (method === 'PATCH') return [];
      var eid = eqv(u, 'id'), eids = inv(u, 'id');
      return events.filter(function (e) { return (!eid || e.id === eid) && (!eids || eids.indexOf(e.id) >= 0); }).sort(function (a, b) { return a.starts_at < b.starts_at ? -1 : 1; }).map(eventRow);
    }
    if (t === 'event_guests') { var ge = eqv(u, 'event_id'); return linkGuests.filter(function (g) { return !ge || g.event_id === ge; }).map(function (g) { return { id: g.id, name: g.name, answer: g.answer, user_id: g.user_id }; }); }
    if (t === 'rsvps') {
      if (method === 'POST' || method === 'PATCH') {
        var b = Array.isArray(body) ? body[0] : body;
        var ex = rsvps.filter(function (r) { return r.event_id === b.event_id && r.user_id === ME; })[0];
        if (ex) ex.response = b.response; else rsvps.push({ event_id: b.event_id, user_id: ME, response: b.response });
        return [];
      }
      if (method === 'DELETE') { var de = eqv(u, 'event_id'); rsvps = rsvps.filter(function (r) { return !(r.event_id === de && r.user_id === ME); }); return []; }
      var ev = eqv(u, 'event_id'), evs = inv(u, 'event_id');
      var who = eqv(u, 'user_id');
      return rsvps.filter(function (r) { return (!ev || r.event_id === ev) && (!evs || evs.indexOf(r.event_id) >= 0) && (!who || r.user_id === who); })
        .map(function (r) { return { event_id: r.event_id, user_id: r.user_id, response: r.response, profiles: byId[r.user_id] }; });
    }
    if (t === 'reminders') {
      if (method === 'POST') { var nr = Object.assign({ id: 'r' + Date.now(), user_id: ME, done_on: [] }, Array.isArray(body) ? body[0] : body); reminders.push(nr); return [nr]; }
      if (method === 'PATCH') { var rid = eqv(u, 'id'); reminders.forEach(function (r) { if (r.id === rid) Object.assign(r, body); }); return reminders.filter(function (r) { return r.id === rid; }); }
      if (method === 'DELETE') { var rd = eqv(u, 'id'); reminders = reminders.filter(function (r) { return r.id !== rd; }); return []; }
      var r1 = eqv(u, 'id'); return reminders.filter(function (r) { return !r1 || r.id === r1; });
    }
    if (t === 'bills') { var bid = eqv(u, 'id'); return bills.filter(function (x) { return !bid || x.id === bid; }); }
    if (t === 'event_alerts') { return method === 'GET' ? events.map(function (e) { return { event_id: e.id, minutes: [1440, 120] }; }).filter(function (x) { var e1 = eqv(u, 'event_id'); return !e1 || x.event_id === e1; }) : []; }
    return [];   // blocks, orbit_picks, reports and anything else: nothing to show
  }

  var realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input.url;
    if (url.indexOf(HOST) < 0) return realFetch(input, init);
    var u = new URL(url), method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    var headers = (init && init.headers) || {};
    var accept = (typeof headers.get === 'function' ? headers.get('Accept') : headers.Accept || headers.accept) || '';
    var single = accept.indexOf('vnd.pgrst.object') >= 0;
    var body = null; try { body = init && init.body ? JSON.parse(init.body) : null; } catch (e) { body = null; }
    var path = u.pathname;
    return new Promise(function (resolve) {
      setTimeout(function () {
        if (path.indexOf('/auth/v1/') === 0) {
          if (path.indexOf('/logout') >= 0) return resolve(json({}, 204));
          if (path.indexOf('/token') >= 0) return resolve(json(session));
          return resolve(json(user));
        }
        if (path.indexOf('/storage/v1/') === 0) return resolve(json({ error: 'Photos are turned off in the demo' }, 400));
        if (path.indexOf('/functions/v1/astro-ai') === 0) {
          if (!plusRow && !(body && body.action === 'catchup' && (perkRow(body.g).crew_on || perkRow(body.g).club))) return resolve(json({ error: 'Turn on Astro Plus to try this in the demo' }, 403));
          if (body && body.action === 'receipt') return setTimeout(function () { resolve(json({ merchant: 'Luigi\'s Pizzeria', items: [{ name: 'Large pepperoni', cents: 2200 }, { name: 'Margherita', cents: 1800 }, { name: 'Garlic knots', cents: 700 }, { name: 'Caesar salad', cents: 900 }, { name: 'Sodas (3)', cents: 750 }], tax_cents: 520, tip_cents: 0, total_cents: 6870 })); }, 1800);
          var gname = (gById[body && body.g] || {}).name;
          var sum = body && body.g === CREW ? '• Poker night is on at Theo\'s tonight. Maya is in, Marcus might be late.\n• Theo posted Pizza night ($67.60). Tap what you had so your share is right.\n• Snack poll: "Both obviously" is winning. You haven\'t voted.\n• Kai is asking who has the chips.'
            : body && body.g === DMMAYA ? '• Maya asked if you\'re coming tonight and you said yes.\n• She wants you to bring the good cards.'
            : '• ' + (gname || 'The chat') + ' has been quiet. Nothing needs your answer.';
          return setTimeout(function () { resolve(json({ summary: sum, count: 18 })); }, 1600);
        }
        if (path.indexOf('/functions/v1/') === 0) return resolve(json({}));
        if (path.indexOf('/rest/v1/rpc/') === 0) {
          var fn = path.split('/').pop(), f = RPC[fn];
          try { return resolve(json(f ? f(body || {}) : null)); } catch (err) { return resolve(json({ message: String(err.message || err), code: 'P0001' }, 400)); }
        }
        var t = path.split('/').pop();
        var out = table(t, method, u, body, single);
        if (method === 'DELETE' && t !== 'messages') return resolve(json(null, 204));
        if (single || (u.searchParams.get('select') && method !== 'GET' && Array.isArray(out) && accept.indexOf('object') >= 0)) out = Array.isArray(out) ? (out[0] || null) : out;
        if (single && out == null) return resolve(json({ code: 'PGRST116', message: 'No rows' }, 406));
        resolve(json(out, method === 'POST' ? 201 : 200, { 'Content-Range': '0-' + Math.max(0, (Array.isArray(out) ? out.length : 1) - 1) + '/*' }));
      }, 60);
    });
  };

  // ---------- video uploads ----------
  // The app uploads videos with XMLHttpRequest (for the progress ring). In the demo the upload is pretended:
  // the ring fills over a couple of seconds and the video plays from your own device. Nothing leaves the browser.
  var RealXHR = window.XMLHttpRequest;
  function FakeXHR() { var x = new RealXHR(); var self = this; this._x = x; this.upload = {}; this.status = 0; this._fake = false;
    this.open = function (m, url) { self._fake = String(url).indexOf(HOST) >= 0 && String(url).indexOf('/storage/v1/object/') >= 0; if (!self._fake) x.open.apply(x, arguments); };
    this.setRequestHeader = function () { if (!self._fake) x.setRequestHeader.apply(x, arguments); };
    this.send = function (body) {
      if (!self._fake) { x.upload.onprogress = self.upload.onprogress; x.onload = function () { self.status = x.status; self.responseText = x.responseText; self.onload && self.onload(); }; x.onerror = function () { self.onerror && self.onerror(); }; return x.send(body); }
      var total = (body && (body.size || body.byteLength)) || 1, step = 0;
      var tick = setInterval(function () { step++; if (self.upload.onprogress) self.upload.onprogress({ lengthComputable: true, loaded: Math.min(total, total * step / 12), total: total }); if (step >= 12) { clearInterval(tick); self.status = 200; self.responseText = '{}'; self.onload && self.onload(); } }, 140);
    };
    this.abort = function () {};
  }
  window.XMLHttpRequest = FakeXHR;

  // ---------- payment links ----------
  // In the demo, Pay with Venmo / PayPal / Cash App shows what would open instead of sending anyone to a real account.
  var realOpen = window.open;
  window.open = function (url) {
    var m = /^https:\/\/(venmo\.com|paypal\.me|cash\.app)\//.exec(String(url || ''));
    if (!m) return realOpen.apply(window, arguments);
    var app = m[1] === 'venmo.com' ? 'Venmo' : m[1] === 'paypal.me' ? 'PayPal' : 'Cash App';
    var amt = (/amount=([0-9.]+)/.exec(url) || /\/([0-9.]+)(USD)?$/.exec(url) || [])[1] || '';
    var box = document.createElement('div');
    var ask = /txn=charge/.test(url);
    box.textContent = 'Demo: in the real app this opens ' + app + (amt ? (ask ? ' with a $' + amt + ' request' : ' to pay $' + amt) : '') + ' and the note filled in.';
    box.setAttribute('style', 'position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:99999;max-width:320px;padding:12px 16px;border-radius:14px;background:#1B2252;color:#EEF0FF;font:600 14px system-ui;border:1px solid #343C78;box-shadow:0 8px 30px rgba(0,0,0,.5);text-align:center');
    document.body.appendChild(box); setTimeout(function () { box.remove(); }, 3500);
    return null;
  };

  // ---------- demo tag ----------
  // A small tag above the tab bar: "Demo" plus a link to the real app. Fades after 10 seconds, or tap it to hide.
  function ribbon() {
    if (document.getElementById('astro-demo-ribbon')) return;
    var d = document.createElement('div');
    d.id = 'astro-demo-ribbon';
    d.setAttribute('role', 'note');
    d.setAttribute('aria-label', 'Demo with sample friends. Nothing is saved.');
    d.innerHTML = '<span style="display:inline-block;width:6px;height:6px;border-radius:3px;background:#3FD99A;margin-right:6px;vertical-align:1px"></span>Demo <a href="/app/" style="color:#C9B8FF;font-weight:700;margin-left:6px;text-decoration:none">Real app \u2192</a>';
    d.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom, 0px) + 92px);z-index:99999;background:rgba(18,16,40,.88);border:1px solid rgba(124,92,255,.55);color:#fff;font:700 11.5px/1 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;letter-spacing:.3px;padding:7px 10px;border-radius:999px;box-shadow:0 4px 18px rgba(0,0,0,.5);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);white-space:nowrap;transition:opacity .3s';
    d.addEventListener('click', function (e) { if (e.target.tagName === 'A') return; d.style.opacity = '0'; setTimeout(function () { d.remove(); }, 300); });
    document.body.appendChild(d);
    setTimeout(function () { d.style.opacity = '0'; setTimeout(function () { d.remove(); }, 400); }, 10000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(ribbon, 1200); }); else setTimeout(ribbon, 1200);
  window.__astroDemo = { msgs: msgs, groups: groups, channels: channels };
})();
