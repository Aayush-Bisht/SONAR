/* ============================================================
   SONAR — Student Online Navigation And Routing
   ============================================================ */

/* ============================================================
   GLOBAL HELPERS
   ============================================================ */

function $(selector, root) {
  if (!root) root = document;
  return root.querySelector(selector);
}

function $$(selector, root) {
  if (!root) root = document;
  var nodeList = root.querySelectorAll(selector);
  var arr = [];
  for (var i = 0; i < nodeList.length; i++) arr.push(nodeList[i]);
  return arr;
}

function esc(str) {
  if (str == null) str = '';
  str = String(str);
  str = str.replace(/&/g, '&amp;');
  str = str.replace(/</g, '&lt;');
  str = str.replace(/>/g, '&gt;');
  str = str.replace(/"/g, '&quot;');
  str = str.replace(/'/g, '&#39;');
  return str;
}

function toast(msg, type) {
  var box = $('#toast');
  var el = document.createElement('div');
  el.className = 'toast ' + (type || '');

  var icon = 'ℹ';
  if (type === 'ok') icon = '✓';
  else if (type === 'err') icon = '⚠';
  else if (type === 'warn') icon = '!';

  el.innerHTML = '<span style="font-size:15px">' + icon + '</span><span>' + esc(msg) + '</span>';
  box.appendChild(el);

  setTimeout(function () {
    el.style.transition = '.3s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(40px)';
    setTimeout(function () { el.remove(); }, 300);
  }, 3200);
}

function initials(name) {
  if (!name) name = '?';
  var words = String(name).trim().split(/\s+/);
  var letters = '';
  for (var i = 0; i < words.length && i < 2; i++) {
    letters += words[i][0] || '';
  }
  return letters.toUpperCase();
}


/* ============================================================
   DATA — ROUTES & STOPS
   ============================================================ */

var ROUTES = [
  {
    id: 'R1',
    name: 'South Line',
    color: '#4f46e5',
    delay: 2,
    bus: { plate: 'KA-01-AB-1234', driver: 'R. Kumar', capacity: 52, occupancy: 38 },
    stops: [
      { name: 'Ghaziabad',      t: 30, x:  60, y: 430 },
      { name: 'Guldhar',     t: 38, x: 180, y: 400 },
      { name: 'Morta',    t: 47, x: 300, y: 370 },
      { name: 'Duhai',      t: 56, x: 450, y: 340 },
      { name: 'Hanuman Mandir',        t: 64, x: 600, y: 300 },
      { name: 'KIET', t: 72, x: 700, y: 250 }
    ]
  },
  {
    id: 'R2',
    name: 'North Line',
    color: '#0891b2',
    delay: 0,
    bus: { plate: 'KA-05-CD-7788', driver: 'S. Iyer', capacity: 48, occupancy: 41 },
    stops: [
      { name: 'Purkazi',  t: 20, x: 100, y:  60 },
      { name: 'Muzaffarnagar',      t: 29, x: 240, y: 100 },
      { name: 'Khatauli',         t: 38, x: 380, y: 150 },
      { name: 'Daurala',    t: 46, x: 500, y: 200 },
      { name: 'Meerut Cantt',     t: 54, x: 620, y: 225 },
      { name: 'KIET', t: 62, x: 700, y: 250 }
    ]
  },
  {
    id: 'R3',
    name: 'East Line',
    color: '#db2777',
    delay: 4,
    bus: { plate: 'KA-09-EF-2210', driver: 'M. Fernandes', capacity: 56, occupancy: 30 },
    stops: [
      { name: 'Partapur',     t: 24, x: 760, y: 440 },
      { name: 'Bhainsali',   t: 32, x: 660, y: 410 },
      { name: 'Shadabdi Nagar',      t: 40, x: 560, y: 370 },
      { name: 'Duhai',   t: 48, x: 470, y: 330 },
      { name: 'KIET', t: 60, x: 700, y: 250 }
    ]
  },
  {
    id: 'R4',
    name: 'West Line',
    color: '#059669',
    delay: 1,
    bus: { plate: 'KA-03-GH-4455', driver: 'A. Sharma', capacity: 50, occupancy: 22 },
    stops: [
      { name: 'Dasna',      t: 15, x:  40, y: 210 },
      { name: 'Shastri Nagar', t: 24, x: 130, y: 260 },
      { name: 'Govindpuram',        t: 32, x: 230, y: 310 },
      { name: 'Morta',     t: 41, x: 350, y: 380 },
      { name: 'Duhai',       t: 49, x: 450, y: 340 },
      { name: 'KIET',  t: 62, x: 700, y: 250 }
    ]
  }
];

var ALL_STOPS = [];
var stopSet = {};
for (var ri = 0; ri < ROUTES.length; ri++) {
  var routeStops = ROUTES[ri].stops;
  for (var si = 0; si < routeStops.length; si++) {
    if (routeStops[si].name !== 'College Campus') {
      stopSet[routeStops[si].name] = true;
    }
  }
}
ALL_STOPS = Object.keys(stopSet).sort();

var SIM_START_HOUR = 7;
var SIM_END_MINUTE = 95;
var TICK_MS = 100;
var SIM_SECONDS_PER_TICK = 3;


/* ============================================================
   STORAGE — localStorage wrapper
   ============================================================ */

var Store = {
  KEY_USERS: 'ct_users',
  KEY_SESSION: 'ct_session',

  getUsers: function () {
    var raw = localStorage.getItem(this.KEY_USERS);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
  },

  saveUsers: function (users) {
    try { localStorage.setItem(this.KEY_USERS, JSON.stringify(users)); } catch (e) {}
  },

  getSession: function () {
    var raw = localStorage.getItem(this.KEY_SESSION);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },

  setSession: function (session) {
    try {
      if (session) localStorage.setItem(this.KEY_SESSION, JSON.stringify(session));
      else localStorage.removeItem(this.KEY_SESSION);
    } catch (e) {}
    this.current = session;
  },

  register: function (data) {
    var users = this.getUsers();

    var duplicate = false;
    for (var i = 0; i < users.length; i++) {
      if (users[i].email.toLowerCase() === data.email.toLowerCase()) {
        duplicate = true;
        break;
      }
    }
    if (duplicate) {
      return { ok: false, error: 'An account with this email already exists.' };
    }

    var user = {
      id: 'u_' + Date.now(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      roll: data.roll,
      department: data.department,
      stop: data.stop,
      routeId: data.routeId,
      password: data.password,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    this.saveUsers(users);
    return { ok: true, user: user };
  },

  login: function (email, password) {
    var users = this.getUsers();
    var found = null;

    for (var i = 0; i < users.length; i++) {
      if (users[i].email.toLowerCase() === email.toLowerCase()) {
        found = users[i];
        break;
      }
    }

    if (!found) return { ok: false, error: 'No account found with this email.' };
    if (found.password !== password) return { ok: false, error: 'Incorrect password.' };
    return { ok: true, user: found };
  },

  update: function (id, patch) {
    var users = this.getUsers();

    for (var i = 0; i < users.length; i++) {
      if (users[i].id === id) {
        for (var key in patch) users[i][key] = patch[key];
        this.saveUsers(users);

        if (this.current && this.current.id === id) {
          this.current = users[i];
          this.setSession(users[i]);
        }
        return users[i];
      }
    }
    return null;
  }
};

Store.current = Store.getSession();


/* ============================================================
   BUS SIMULATION ENGINE
   ============================================================ */

var BusSim = {
  simMin: 0,
  speed: 1,
  paused: false,

  compute: function () {
    var results = [];
    for (var i = 0; i < ROUTES.length; i++) {
      var route = ROUTES[i];
      var t = this.simMin - route.delay;
      var st = this.stateAt(route, t);
      var campus = route.stops[route.stops.length - 1];
      var late = route.delay > 0 && st.status !== 'arrived';

      results.push({
        route: route,
        t: t,
        st: st,
        etaCampus: Math.max(0, campus.t - t),
        late: late
      });
    }
    return results;
  },

  stateAt: function (route, t) {
    var stops = route.stops;
    var last = stops.length - 1;

    if (t < stops[0].t) {
      return {
        status: 'idle',
        x: stops[0].x, y: stops[0].y,
        nextIdx: 0,
        etaNext: stops[0].t - t
      };
    }

    if (t >= stops[last].t) {
      return {
        status: 'arrived',
        x: stops[last].x, y: stops[last].y,
        nextIdx: null,
        etaNext: 0
      };
    }

    for (var i = 0; i < last; i++) {
      if (t >= stops[i].t && t < stops[i + 1].t) {
        var progress = (t - stops[i].t) / (stops[i + 1].t - stops[i].t);
        return {
          status: 'moving',
          x: stops[i].x + (stops[i + 1].x - stops[i].x) * progress,
          y: stops[i].y + (stops[i + 1].y - stops[i].y) * progress,
          nextIdx: i + 1,
          etaNext: stops[i + 1].t - t
        };
      }
    }

    return {
      status: 'idle',
      x: stops[0].x, y: stops[0].y,
      nextIdx: 0, etaNext: 0
    };
  }
};

function fmtClock(minutes) {
  var totalMinutes = SIM_START_HOUR * 60 + Math.floor(minutes);
  var h = Math.floor(totalMinutes / 60) % 24;
  var m = totalMinutes % 60;
  var hh = h < 10 ? '0' + h : '' + h;
  var mm = m < 10 ? '0' + m : '' + m;
  return hh + ':' + mm;
}

function fmtEta(mins) {
  if (mins == null) return '—';
  if (mins <= 0.4) return 'Now';
  if (mins < 1) return '&lt;1';
  return String(Math.round(mins));
}

function greeting() {
  var h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}


/* ============================================================
   NAVBAR
   ============================================================ */

function renderNav() {
  var navRight = $('#navRight');
  var navLinks = $('#navLinks');
  var user = Store.current;
  var path = currentPath();
  var html = '';

  if (user) {
    var firstName = user.name.split(' ')[0];
    html =
      '<div class="user-chip" id="userChip">' +
        '<div class="avatar">' + esc(initials(user.name)) + '</div>' +
        '<span class="un">' + esc(firstName) + '</span>' +
        '<span style="font-size:9px;color:var(--muted)">▼</span>' +
        '<div class="dropdown" id="userDropdown">' +
          '<div class="dd-head"><b>' + esc(user.name) + '</b>' +
          '<span>' + esc(user.email) + '</span></div>' +
          '<button data-go="/profile">👤 My Profile</button>' +
          '<button data-go="/track">📍 Track Bus</button>' +
          '<button data-go="/schedule">🕐 Timetable</button>' +
          '<button class="danger" id="logoutBtn">⎋ Sign Out</button>' +
        '</div>' +
      '</div>';
  } else {
    html =
      '<a class="btn btn-ghost" href="#/login">Sign In</a>' +
      '<a class="btn btn-primary" href="#/register">Get Started</a>';
  }

  navRight.innerHTML = html;

  var links = $$('.nav-link', navLinks);
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    var href = link.getAttribute('href').replace('#', '');
    var isActive = href === path;
    var isTrackProfile = href === '/track' && path === '/profile';
    if (isActive || isTrackProfile) link.classList.add('active');
    else link.classList.remove('active');
  }

  var chip = $('#userChip');
  if (chip) {
    chip.addEventListener('click', function (e) {
      var dd = $('#userDropdown');

      var goBtn = e.target.closest('[data-go]');
      if (goBtn) {
        dd.classList.remove('open');
        navigate(goBtn.getAttribute('data-go'));
        return;
      }

      if (e.target.closest('#logoutBtn')) {
        dd.classList.remove('open');
        Store.setSession(null);
        toast('Signed out.', 'ok');
        renderNav();
        navigate('/');
        return;
      }

      dd.classList.toggle('open');
      e.stopPropagation();
    });
  }
}

document.addEventListener('click', function (e) {
  var dd = $('#userDropdown');
  if (dd && !e.target.closest('#userChip')) dd.classList.remove('open');
});

$('#burger').addEventListener('click', function () {
  $('#navLinks').classList.toggle('open');
});


/* ============================================================
   ROUTER
   ============================================================ */

var PROTECTED = ['/track', '/schedule', '/profile'];

function currentPath() {
  var h = location.hash.replace(/^#/, '');
  if (!h) return '/';
  return h;
}

function navigate(path) {
  if (currentPath() === path) {
    router();
    return;
  }
  location.hash = '#' + path;
}

var appEl = $('#app');

function router() {
  var path = currentPath();

  if (PROTECTED.indexOf(path) !== -1 && !Store.current) {
    sessionStorage.setItem('ct_redirect', path);
    toast('Please sign in to access that page.', 'warn');
    location.hash = '#/login';
    return;
  }

  appEl.innerHTML = '';
  window.scrollTo(0, 0);

  var page;
  try {
    if (path === '/')               page = PageHome();
    else if (path === '/track')     page = PageTrack();
    else if (path === '/schedule')  page = PageSchedule();
    else if (path === '/about')     page = PageAbout();
    else if (path === '/register')  page = PageRegister();
    else if (path === '/login')     page = PageLogin();
    else if (path === '/profile')   page = PageProfile();
    else                            page = Page404();
  } catch (err) {
    console.error(err);
    page = {
      el: (function () {
        var d = document.createElement('div');
        d.style.cssText = 'padding:80px 20px;text-align:center;color:#dc2626;font-family:monospace';
        d.textContent = '⚠ Error: ' + (err.message || err);
        return d;
      })()
    };
  }

  appEl.appendChild(page.el);
  if (page.mount) page.mount();
  renderNav();
  $('#navLinks').classList.remove('open');
}

window.addEventListener('hashchange', router);


/* ============================================================
   PAGE: HOME
   ============================================================ */

function PageHome() {
  var el = document.createElement('div');
  el.className = 'page';
  var user = Store.current;

  var trackBtn = user
    ? '<a class="btn btn-primary btn-lg" href="#/track">🚌 Track My Bus</a>'
    : '<a class="btn btn-primary btn-lg" href="#/register">Create Free Account</a>';

  var ctaBtn = user
    ? '<a class="btn btn-primary btn-lg" href="#/track">Open Live Tracker →</a>'
    : '<a class="btn btn-primary btn-lg" href="#/register">Create Your Free Account →</a>';

  el.innerHTML =
  '<section class="hero"><div class="container hero-grid">' +
    '<div>' +
      '<div class="pill"><span class="dot"></span> Live GPS Tracking Active</div>' +
      '<h1>Never miss your <span class="grad">college bus</span> again.</h1>' +
      '<p class="lead">SONAR (Student Online Navigation And Routing) tracks every campus bus in real time, gives accurate arrival estimates for your stop, and sends smart alerts before your bus reaches you.</p>' +
      '<div class="hero-cta">' +
        trackBtn +
        '<a class="btn btn-ghost btn-lg" href="#/schedule">View Timetable</a>' +
      '</div>' +
      '<div class="hero-stats">' +
        '<div class="hero-stat"><b>4</b><span>ACTIVE ROUTES</span></div>' +
        '<div class="hero-stat"><b>18</b><span>BUS STOPS</span></div>' +
        '<div class="hero-stat"><b>96%</b><span>ON-TIME RATE</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="preview">' +
      '<div class="preview-bar"><i style="background:#ef4444"></i><i style="background:#f59e0b"></i><i style="background:#10b981"></i><span class="url">sonar.edu/track</span></div>' +
      '<div class="preview-body">' +
        '<div class="pv-mini-map">' +
          '<div class="road" style="width:70%;left:8%;top:74%;transform:rotate(-8deg)"></div>' +
          '<div class="road" style="width:55%;left:30%;top:48%;transform:rotate(-14deg)"></div>' +
          '<div class="road" style="width:45%;left:52%;top:32%;transform:rotate(6deg)"></div>' +
          '<div class="pv-bus">🚌</div>' +
        '</div>' +
        '<div class="pv-row"><span class="pv-dot" style="background:#4f46e5"></span><span class="nm">R1 · Ghaziabad</span><span class="et" style="color:#059669">3 min</span></div>' +
        '<div class="pv-row"><span class="pv-dot" style="background:#0891b2"></span><span class="nm">R2 · Purkazi</span><span class="et" style="color:#d97706">12 min</span></div>' +
        '<div class="pv-row"><span class="pv-dot" style="background:#059669"></span><span class="nm">R4 · Loni </span><span class="et" style="color:#0f172a">24 min</span></div>' +
      '</div>' +
    '</div>' +
  '</div></section>' +

  '<section class="section container">' +
    '<div class="sec-head"><div class="kicker">Why SONAR</div>' +
    '<h2>Built for students who hate waiting</h2>' +
    '<p>Everything you need to plan your commute with confidence — from live positions to minute-accurate ETAs.</p></div>' +
    '<div class="grid-3">' +
      feat('📡', 'Live GPS Positions', 'Watch every bus move on an interactive map, updated continuously throughout the morning schedule.') +
      feat('⏱️', 'Accurate ETA Countdown', 'See exactly how many minutes remain until your bus reaches your boarding stop.') +
      feat('🔔', 'Smart Boarding Alerts', 'Get notified automatically when your bus is within 5 minutes of your stop.') +
      feat('🗓️', 'Full Route Timetable', 'Browse scheduled arrival times for every stop across all routes.') +
      feat('🎯', 'Pick Your Stop', 'Save your regular boarding point and get personalised arrival estimates every day.') +
      feat('🚌', 'Multi-Route Support', 'Four major lines converge on campus — switch between them instantly.') +
    '</div>' +
  '</section>' +

  '<section class="section container">' +
    '<div class="sec-head"><div class="kicker">How it works</div><h2>Three steps to a stress-free commute</h2></div>' +
    '<div class="steps">' +
      '<div class="step"><div class="num">1</div><h3>Create your account</h3><p>Sign up with your college email and register your roll number, department, and boarding stop.</p></div>' +
      '<div class="step"><div class="num">2</div><h3>Pick your stop</h3><p>Select the stop you board from. SONAR remembers it and shows personalised ETAs every morning.</p></div>' +
      '<div class="step"><div class="num">3</div><h3>Track &amp; catch your bus</h3><p>Open the live map, watch the countdown, and leave home at exactly the right moment.</p></div>' +
    '</div>' +
  '</section>' +

  '<section class="section container"><div class="grid-4">' +
    statCard('18', 'Stops covered') +
    statCard('4', 'Active routes') +
    statCard('210+', 'Daily riders') +
    statCard('96%', 'On-time arrivals') +
  '</div></section>' +

  '<section class="section container"><div class="cta-band">' +
    '<h2>Ready to stop waiting at the bus stop?</h2>' +
    '<p>Join hundreds of students already using SONAR to plan their daily commute.</p>' +
    ctaBtn +
  '</div></section>';

  return { el: el };
}

function feat(icon, title, body) {
  return '<div class="feat"><div class="ico">' + icon + '</div>' +
         '<h3>' + esc(title) + '</h3><p>' + esc(body) + '</p></div>';
}

function statCard(n, label) {
  return '<div class="stat-card"><b>' + esc(n) + '</b><span>' + esc(label) + '</span></div>';
}


/* ============================================================
   PAGE: REGISTER
   ============================================================ */

function PageRegister() {
  var el = document.createElement('div');
  el.className = 'page';

  var stopOpts = '';
  for (var i = 0; i < ALL_STOPS.length; i++) {
    stopOpts += '<option value="' + esc(ALL_STOPS[i]) + '">' + esc(ALL_STOPS[i]) + '</option>';
  }

  var routeOpts = '';
  for (var j = 0; j < ROUTES.length; j++) {
    var r = ROUTES[j];
    routeOpts += '<option value="' + r.id + '">' + r.id + ' — ' + esc(r.name) + '</option>';
  }

  el.innerHTML =
  '<div class="auth-wrap">' +
    '<div class="auth-side">' +
      '<h2>Join SONAR and never wait in the rain again.</h2>' +
      '<p>Create your free account to unlock personalised ETAs, boarding alerts, and your daily route timetable. SONAR stands for Student Online Navigation And Routing.</p>' +
      '<div class="auth-perks">' +
        '<div class="auth-perk"><div class="ck">✓</div><div><b>Live bus positions on an interactive map</b></div></div>' +
        '<div class="auth-perk"><div class="ck">✓</div><div><b>Minute-accurate ETA for your saved stop</b></div></div>' +
        '<div class="auth-perk"><div class="ck">✓</div><div><b>Automatic alerts 5 minutes before arrival</b></div></div>' +
        '<div class="auth-perk"><div class="ck">✓</div><div><b>Full timetable for every route on campus</b></div></div>' +
      '</div>' +
    '</div>' +
    '<div class="auth-main"><div class="auth-card wide">' +
      '<div class="auth-head"><h1>Create your account</h1>' +
      '<p>Already registered? <a href="#/login">Sign in instead</a></p></div>' +
      '<div class="form-error" id="regError"></div>' +
      '<form id="regForm" novalidate>' +
        '<div class="row-2">' +
          field('name', 'Full Name', 'text', 'e.g. Akash') +
          field('roll', 'Roll Number', 'text', 'e.g. 21CS1043') +
        '</div>' +
        '<div class="row-2">' +
          field('email', 'College Email', 'email', 'you@college.edu') +
          field('phone', 'Mobile Number', 'tel', '10-digit number') +
        '</div>' +
        '<div class="field" data-f="department">' +
          '<label>Department</label>' +
          '<select name="department"><option value="">Select your department</option>' +
            '<option>Computer Science</option>' +
            '<option>Information Technology</option>' +
            '<option>Electronics &amp; Communication</option>' +
            '<option>Mechanical Engineering</option>' +
            '<option>Civil Engineering</option>' +
            '<option>Business Administration</option>' +
          '</select><div class="msg"></div>' +
        '</div>' +
        '<div class="row-2">' +
          '<div class="field" data-f="stop"><label>Boarding Stop</label>' +
            '<select name="stop"><option value="">Select your stop</option>' + stopOpts + '</select><div class="msg"></div></div>' +
          '<div class="field" data-f="routeId"><label>Primary Route</label>' +
            '<select name="routeId"><option value="">Select your route</option>' + routeOpts + '</select><div class="msg"></div></div>' +
        '</div>' +
        '<div class="row-2">' +
          field('password', 'Password', 'password', 'Min. 6 characters') +
          field('confirm', 'Confirm Password', 'password', 'Re-enter password') +
        '</div>' +
        '<label class="check" id="termsWrap">' +
          '<input type="checkbox" name="terms" id="termsBox">' +
          '<span>I agree to the Terms of Service and Privacy Policy, and consent to receiving bus arrival notifications.</span>' +
        '</label>' +
        '<button type="submit" class="btn btn-primary btn-lg btn-block">Create Account</button>' +
      '</form>' +
      '<div class="divider">OR</div>' +
      '<p style="text-align:center;font-size:13.5px;color:var(--muted)">' +
        'Already have an account? <a href="#/login" style="color:var(--primary);font-weight:700">Sign in →</a>' +
      '</p>' +
    '</div></div>' +
  '</div>';

  var form = $('#regForm', el);
  var errorBox = $('#regError', el);

  function setErr(name, msg) {
    var wrap = form.querySelector('[data-f="' + name + '"]');
    if (!wrap) return;
    if (msg) wrap.classList.add('err');
    else wrap.classList.remove('err');
    var m = wrap.querySelector('.msg');
    if (m && msg) m.textContent = msg;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var allFields = $$('.field', form);
    for (var i = 0; i < allFields.length; i++) allFields[i].classList.remove('err');
    $('#termsWrap', form).classList.remove('err');
    errorBox.classList.remove('show');

    var data = {
      name: form.name.value.trim(),
      roll: form.roll.value.trim().toUpperCase(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      department: form.department.value,
      stop: form.stop.value,
      routeId: form.routeId.value,
      password: form.password.value,
      confirm: form.confirm.value
    };
    var terms = $('#termsBox', form).checked;

    var hasError = false;
    var firstBad = null;

    function fail(fieldName, msg) {
      setErr(fieldName, msg);
      hasError = true;
      if (!firstBad) firstBad = fieldName;
    }

    if (!data.name || data.name.length < 3) fail('name', 'Please enter your full name (min. 3 characters).');
    if (!data.roll || data.roll.length < 3) fail('roll', 'Please enter a valid roll number.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) fail('email', 'Please enter a valid email address.');
    if (!/^\d{10}$/.test(data.phone.replace(/\D/g, ''))) fail('phone', 'Enter a valid 10-digit mobile number.');
    if (!data.department) fail('department', 'Please choose your department.');
    if (!data.stop) fail('stop', 'Please choose your boarding stop.');
    if (!data.routeId) fail('routeId', 'Please choose your route.');
    if (data.password.length < 6) fail('password', 'Password must be at least 6 characters.');
    if (data.password !== data.confirm) fail('confirm', 'Passwords do not match.');
    if (!terms) {
      $('#termsWrap', form).classList.add('err');
      hasError = true;
      if (!firstBad) firstBad = 'terms';
    }

    if (hasError) {
      errorBox.textContent = '⚠ Please fix the highlighted fields below.';
      errorBox.classList.add('show');
      var focusEl = form.querySelector('[data-f="' + firstBad + '"] input, [data-f="' + firstBad + '"] select');
      if (focusEl) focusEl.focus();
      return;
    }

    var res = Store.register(data);
    if (!res.ok) {
      errorBox.textContent = '⚠ ' + res.error;
      errorBox.classList.add('show');
      setErr('email', res.error);
      return;
    }

    Store.setSession(res.user);
    toast('Welcome to SONAR, ' + res.user.name.split(' ')[0] + '!', 'ok');

    var redirect = sessionStorage.getItem('ct_redirect');
    sessionStorage.removeItem('ct_redirect');
    navigate(redirect || '/track');
  });

  form.addEventListener('input', function (e) {
    var wrap = e.target.closest('.field');
    if (wrap) wrap.classList.remove('err');
  });

  $('#termsBox', form).addEventListener('change', function () {
    $('#termsWrap', form).classList.remove('err');
  });

  return { el: el };
}

function field(name, label, type, placeholder) {
  return '<div class="field" data-f="' + name + '"><label>' + esc(label) + ' *</label>' +
    '<input type="' + type + '" name="' + name + '" placeholder="' + esc(placeholder) + '" />' +
    '<div class="msg"></div></div>';
}


/* ============================================================
   PAGE: LOGIN
   ============================================================ */

function PageLogin() {
  var el = document.createElement('div');
  el.className = 'page';

  el.innerHTML =
  '<div class="auth-wrap">' +
    '<div class="auth-side">' +
      '<h2>Welcome back to SONAR.</h2>' +
      '<p>Sign in to see live bus positions, your personalised ETA, and today\'s timetable. SONAR — Student Online Navigation And Routing.</p>' +
      '<div class="auth-perks">' +
        '<div class="auth-perk"><div class="ck">✓</div><div><b>Your saved boarding stop, ready instantly</b></div></div>' +
        '<div class="auth-perk"><div class="ck">✓</div><div><b>Live map with all four campus routes</b></div></div>' +
        '<div class="auth-perk"><div class="ck">✓</div><div><b>Delay alerts pushed before you leave</b></div></div>' +
      '</div>' +
    '</div>' +
    '<div class="auth-main"><div class="auth-card">' +
      '<div class="auth-head"><h1>Sign in</h1>' +
      '<p>New here? <a href="#/register">Create an account</a></p></div>' +
      '<div class="form-error" id="logError"></div>' +
      '<form id="logForm" novalidate>' +
        field('email', 'Email Address', 'email', 'you@college.edu') +
        field('password', 'Password', 'password', 'Your password') +
        '<div style="display:flex;justify-content:flex-end;margin:-6px 0 18px">' +
          '<a href="#/about" style="font-size:12.5px;color:var(--primary);font-weight:600">Forgot password?</a>' +
        '</div>' +
        '<button type="submit" class="btn btn-primary btn-lg btn-block">Sign In</button>' +
      '</form>' +
      '<div class="divider">DEMO</div>' +
      '<div style="padding:13px 16px;border-radius:12px;font-size:12px;line-height:1.6;color:#0f766e;background:#ecfdf5;border:1px solid #a7f3d0">' +
        '<b style="color:#047857">No account yet?</b> Registering takes 20 seconds — your details are stored locally in this browser only.' +
      '</div>' +
    '</div></div>' +
  '</div>';

  var form = $('#logForm', el);
  var errorBox = $('#logError', el);

  function setErr(name, msg) {
    var wrap = form.querySelector('[data-f="' + name + '"]');
    if (!wrap) return;
    if (msg) wrap.classList.add('err');
    else wrap.classList.remove('err');
    var m = wrap.querySelector('.msg');
    if (m && msg) m.textContent = msg;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var allFields = $$('.field', form);
    for (var i = 0; i < allFields.length; i++) allFields[i].classList.remove('err');
    errorBox.classList.remove('show');

    var email = form.email.value.trim();
    var password = form.password.value;
    var hasError = false;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setErr('email', 'Enter a valid email address.');
      hasError = true;
    }
    if (!password) {
      setErr('password', 'Please enter your password.');
      hasError = true;
    }
    if (hasError) return;

    var res = Store.login(email, password);
    if (!res.ok) {
      errorBox.textContent = '⚠ ' + res.error;
      errorBox.classList.add('show');
      return;
    }

    Store.setSession(res.user);
    toast('Signed in as ' + res.user.name, 'ok');

    var redirect = sessionStorage.getItem('ct_redirect');
    sessionStorage.removeItem('ct_redirect');
    navigate(redirect || '/track');
  });

  form.addEventListener('input', function (e) {
    var wrap = e.target.closest('.field');
    if (wrap) wrap.classList.remove('err');
  });

  return { el: el };
}


/* ============================================================
   PAGE: TRACK — live dashboard
   ============================================================ */

var SVG_NS = 'http://www.w3.org/2000/svg';

function mk(tag, attrs, text) {
  var n = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (var key in attrs) n.setAttribute(key, attrs[key]);
  }
  if (text != null) n.textContent = text;
  return n;
}

function PageTrack() {
  var user = Store.current;
  var el = document.createElement('div');
  el.className = 'page';
  var myStop = (user && user.stop) || 'City Center';

  el.innerHTML =
  '<div class="container">' +
    '<div class="page-head">' +
      '<div><h1>' + esc(greeting()) + ', ' + esc(user.name.split(' ')[0]) + ' 👋</h1>' +
      '<p>Live positions of all campus buses · updates every 100 ms</p></div>' +
      '<div class="right">' +
        '<div class="clockbox"><span class="live"><span class="dot"></span>LIVE</span>' +
          '<span class="t" id="liveClock">07:00</span></div>' +
        '<div class="speeds" id="speedsBox">' +
          '<button data-speed="1" class="on">1×</button>' +
          '<button data-speed="2">2×</button>' +
          '<button data-speed="4">4×</button>' +
          '<button id="pauseBtn">❚❚</button></div>' +
      '</div>' +
    '</div>' +
    '<div class="layout">' +
      '<section class="card">' +
        '<div class="card-h">🗺️ Live Route Map <span class="sub">Simulated GPS telemetry</span></div>' +
        '<svg id="mapSvg" class="map-svg" viewBox="0 0 800 500"></svg>' +
        '<div class="legend" id="legendBox"></div>' +
      '</section>' +
      '<aside class="side">' +
        '<div class="card">' +
          '<div class="card-h">📍 My Boarding Stop</div>' +
          '<div id="alertBox"></div>' +
          '<div class="stop-select"><select id="stopSel"></select></div>' +
          '<div id="etaList"></div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-h">🚌 All Buses <span class="sub" id="busCount"></span></div>' +
          '<div id="busList"></div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-h">🎓 Campus Arrival</div>' +
          '<div id="campusList"></div>' +
        '</div>' +
      '</aside>' +
    '</div>' +
    '<section class="card schedule">' +
      '<div class="card-h" id="schedHead">🕐 Timetable</div>' +
      '<div style="overflow-x:auto"><table>' +
        '<thead><tr><th>Stop</th><th>Scheduled</th><th>ETA</th><th>Status</th></tr></thead>' +
        '<tbody id="schedBody"></tbody></table></div>' +
    '</section>' +
  '</div>';

  var activeId = 'R1';
  var stop = myStop;
  var lastKey = '';

  var mapSvg = $('#mapSvg', el);
  var busEls = {};
  var routeEls = {};
  var legendRefs = {};
  var stopEls = [];

  function buildMap() {
    var defs = mk('defs');
    var pat = mk('pattern', { id: 'grid', width: 40, height: 40, patternUnits: 'userSpaceOnUse' });
    pat.appendChild(mk('path', { d: 'M40 0H0V40', fill: 'none', stroke: 'rgba(15,23,42,.05)', 'stroke-width': 1 }));
    defs.appendChild(pat);
    mapSvg.appendChild(defs);
    mapSvg.appendChild(mk('rect', { width: 800, height: 500, fill: 'url(#grid)' }));

    for (var i = 0; i < ROUTES.length; i++) {
      var r = ROUTES[i];
      var pointParts = [];
      for (var j = 0; j < r.stops.length; j++) {
        pointParts.push(r.stops[j].x + ',' + r.stops[j].y);
      }
      var pl = mk('polyline', {
        points: pointParts.join(' '),
        fill: 'none',
        stroke: r.color,
        'stroke-width': 3,
        'stroke-opacity': 0.28,
        'stroke-dasharray': '6 8',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'class': 'route-line'
      });
      mapSvg.appendChild(pl);
      routeEls[r.id] = pl;
    }

    for (var i2 = 0; i2 < ROUTES.length; i2++) {
      var r2 = ROUTES[i2];
      for (var j2 = 0; j2 < r2.stops.length; j2++) {
        var s = r2.stops[j2];
        if (s.name === 'College Campus') continue;

        var g = mk('g');
        var c = mk('circle', {
          cx: s.x, cy: s.y, r: 4.5,
          fill: '#ffffff', stroke: r2.color, 'stroke-width': 2.5, opacity: 0.5
        });
        var t = mk('text', { x: s.x + 11, y: s.y + 4, 'class': 'stop-label' }, s.name);
        t.style.opacity = 0;
        g.appendChild(c);
        g.appendChild(t);
        mapSvg.appendChild(g);
        stopEls.push({ routeId: r2.id, circle: c, text: t });
      }
    }

    var cg = mk('g', { transform: 'translate(700,250)' });
    cg.appendChild(mk('circle', { r: 26, fill: 'rgba(5,150,105,.1)' }));
    cg.appendChild(mk('circle', { r: 17, fill: '#ffffff', stroke: '#059669', 'stroke-width': 3 }));
    cg.appendChild(mk('text', { y: 5.5, 'text-anchor': 'middle', 'font-size': 15 }, '🏫'));
    var cl = mk('text', { x: 0, y: 40, 'text-anchor': 'middle', 'class': 'stop-label' }, 'COLLEGE CAMPUS');
    cl.style.fontSize = '12px';
    cl.style.fontWeight = '800';
    cl.style.fill = '#047857';
    cg.appendChild(cl);
    mapSvg.appendChild(cg);

    for (var i3 = 0; i3 < ROUTES.length; i3++) {
      var r3 = ROUTES[i3];
      var gBus = mk('g');
      gBus.appendChild(mk('circle', { r: 13, fill: r3.color, 'class': 'pulse', opacity: 0.35 }));
      gBus.appendChild(mk('circle', { r: 13, fill: '#ffffff', stroke: r3.color, 'stroke-width': 3 }));
      gBus.appendChild(mk('text', { y: 4.5, 'text-anchor': 'middle', 'font-size': 13 }, '🚌'));

      var lg = mk('g', { transform: 'translate(0,-22)' });
      lg.appendChild(mk('rect', { x: -17, y: -11, width: 34, height: 17, rx: 8.5, fill: r3.color }));
      lg.appendChild(mk('text', { y: 2.5, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 800, fill: '#ffffff' }, r3.id));
      gBus.appendChild(lg);

      mapSvg.appendChild(gBus);
      busEls[r3.id] = gBus;
    }
  }
  buildMap();

  var legendBox = $('#legendBox', el);
  for (var li = 0; li < ROUTES.length; li++) {
    var lr = ROUTES[li];
    var d = document.createElement('div');
    d.className = 'item';
    d.setAttribute('data-id', lr.id);

    var sw = document.createElement('span');
    sw.className = 'swatch';
    sw.style.background = lr.color;

    var txt = document.createElement('span');

    d.appendChild(sw);
    d.appendChild(txt);
    legendBox.appendChild(d);
    legendRefs[lr.id] = { el: d, txt: txt };
  }

  legendBox.addEventListener('click', function (e) {
    var item = e.target.closest('.item');
    if (!item) return;
    activeId = item.getAttribute('data-id');
    lastKey = '';
    renderAll();
  });

  var stopSel = $('#stopSel', el);
  for (var si = 0; si < ALL_STOPS.length; si++) {
    var opt = document.createElement('option');
    opt.value = ALL_STOPS[si];
    opt.textContent = ALL_STOPS[si];
    stopSel.appendChild(opt);
  }
  stopSel.value = stop;

  stopSel.addEventListener('change', function (e) {
    stop = e.target.value;
    lastKey = '';
    if (Store.current) Store.update(Store.current.id, { stop: stop });
    renderAll();
  });

  var speedsBox = $('#speedsBox', el);
  var pauseBtn = $('#pauseBtn', el);

  speedsBox.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;

    if (btn === pauseBtn) {
      BusSim.paused = !BusSim.paused;
      pauseBtn.textContent = BusSim.paused ? '▶' : '❚❚';
      pauseBtn.classList.toggle('on', BusSim.paused);
      return;
    }

    var speedVal = btn.getAttribute('data-speed');
    if (speedVal) {
      BusSim.speed = parseInt(speedVal, 10);
      BusSim.paused = false;
      pauseBtn.textContent = '❚❚';
      pauseBtn.classList.remove('on');

      var speedBtns = $$('button[data-speed]', speedsBox);
      for (var i = 0; i < speedBtns.length; i++) {
        var sVal = parseInt(speedBtns[i].getAttribute('data-speed'), 10);
        if (sVal === BusSim.speed) speedBtns[i].classList.add('on');
        else speedBtns[i].classList.remove('on');
      }
    }
  });

  pauseBtn.textContent = BusSim.paused ? '▶' : '❚❚';
  pauseBtn.classList.toggle('on', BusSim.paused);

  var clockEl    = $('#liveClock', el);
  var alertBox   = $('#alertBox', el);
  var etaList    = $('#etaList', el);
  var busList    = $('#busList', el);
  var busCount   = $('#busCount', el);
  var campusList = $('#campusList', el);
  var schedHead  = $('#schedHead', el);
  var schedBody  = $('#schedBody', el);

  function updateMap(buses) {
    for (var i = 0; i < ROUTES.length; i++) {
      var r = ROUTES[i];
      var pl = routeEls[r.id];
      var on = r.id === activeId;

      pl.setAttribute('stroke-width', on ? 5 : 3);
      pl.setAttribute('stroke-opacity', on ? 0.95 : 0.28);
      pl.setAttribute('stroke-dasharray', on ? 'none' : '6 8');
    }

    for (var j = 0; j < stopEls.length; j++) {
      var s = stopEls[j];
      var on2 = s.routeId === activeId;
      s.circle.setAttribute('r', on2 ? 6 : 4.5);
      s.circle.setAttribute('stroke-width', on2 ? 3.5 : 2.5);
      s.circle.setAttribute('opacity', on2 ? 1 : 0.5);
      s.text.style.opacity = on2 ? 1 : 0;
    }

    for (var k = 0; k < buses.length; k++) {
      var b = buses[k];
      var g = busEls[b.route.id];
      g.setAttribute('transform', 'translate(' + b.st.x.toFixed(1) + ',' + b.st.y.toFixed(1) + ')');
      g.style.opacity = b.route.id === activeId ? 1 : 0.55;
    }
  }

  function updateLegend(buses) {
    for (var i = 0; i < buses.length; i++) {
      var b = buses[i];
      var ref = legendRefs[b.route.id];
      if (!ref) continue;

      var tag;
      if (b.st.status === 'moving') tag = b.late ? '+' + b.route.delay + ' min late' : 'On time';
      else if (b.st.status === 'idle') tag = 'At depot';
      else tag = 'Arrived';

      ref.txt.textContent = b.route.id + ' · ' + b.route.name + ' — ' + tag;

      if (b.route.id === activeId) {
        ref.el.classList.add('on');
        ref.el.style.color = b.route.color;
        ref.el.style.borderColor = b.route.color;
      } else {
        ref.el.classList.remove('on');
        ref.el.style.color = '';
        ref.el.style.borderColor = '';
      }
    }
  }

  function myStopEtas() {
    var list = [];

    for (var i = 0; i < ROUTES.length; i++) {
      var route = ROUTES[i];
      for (var j = 0; j < route.stops.length; j++) {
        var s = route.stops[j];
        if (s.name !== stop) continue;

        var t = BusSim.simMin - route.delay;
        if (t >= s.t) continue;

        list.push({
          routeId: route.id,
          routeName: route.name,
          color: route.color,
          plate: route.bus.plate,
          eta: s.t - t,
          clock: fmtClock(s.t),
          delay: route.delay
        });
      }
    }

    list.sort(function (a, b) { return a.eta - b.eta; });
    return list;
  }

  function renderSidebar(buses) {
    var etas = myStopEtas();

    if (etas.length && etas[0].eta <= 5) {
      alertBox.innerHTML =
        '<div class="alert">🔔 Your bus <b>' + etas[0].routeId +
        '</b> reaches <b>' + esc(stop) + '</b> in about <b>' +
        fmtEta(etas[0].eta) + ' min</b>!</div>';
    } else {
      alertBox.innerHTML = '';
    }

    if (!etas.length) {
      etaList.innerHTML = '<div class="empty">All buses have already passed this stop today. 🚏</div>';
    } else {
      var html = '';
      for (var i = 0; i < etas.length; i++) {
        var e = etas[i];
        var cls = '';
        if (e.eta <= 5) cls = 'soon';
        else if (e.eta <= 12) cls = 'now';

        var lateTxt = e.delay > 0 ? ' · +' + e.delay + ' min late' : ' · on time';

        html +=
          '<div class="eta-row">' +
            '<div class="eta-badge" style="background:' + e.color + '">' + e.routeId + '</div>' +
            '<div class="info"><b>' + esc(e.routeName) + '</b>' +
            '<span>' + esc(e.plate) + ' · scheduled ' + e.clock + lateTxt + '</span></div>' +
            '<div class="eta-time"><b class="' + cls + '">' + fmtEta(e.eta) + '</b><span>min away</span></div>' +
          '</div>';
      }
      etaList.innerHTML = html;
    }

    busCount.textContent = buses.length + ' active';

    var busHtml = '';
    for (var j = 0; j < buses.length; j++) {
      var b = buses[j];
      var st = b.st.status;
      var tagCls, tagTxt;

      if (st === 'moving') {
        tagCls = b.late ? 'late' : 'on';
        tagTxt = b.late ? '+' + b.route.delay + 'm late' : 'On time';
      } else if (st === 'arrived') {
        tagCls = 'done';
        tagTxt = 'Arrived';
      } else {
        tagCls = 'idle';
        tagTxt = 'At depot';
      }

      var selClass = b.route.id === activeId ? ' sel' : '';

      busHtml +=
        '<div class="bus-item' + selClass + '" data-id="' + b.route.id + '">' +
          '<div class="bus-icon" style="background:' + b.route.color + '18;border:1px solid ' + b.route.color + '40">🚌</div>' +
          '<div class="m"><b>' + b.route.id + ' · ' + esc(b.route.name) + '</b>' +
          '<span>' + esc(b.route.bus.plate) + '</span></div>' +
          '<span class="tag ' + tagCls + '">' + tagTxt + '</span>' +
        '</div>';
    }
    busList.innerHTML = busHtml;

    var campusHtml = '';
    for (var k = 0; k < buses.length; k++) {
      var cb = buses[k];
      var val, lbl;
      if (cb.etaCampus <= 0) { val = '✓'; lbl = 'arrived'; }
      else { val = String(Math.round(cb.etaCampus)); lbl = 'min to campus'; }

      campusHtml +=
        '<div class="eta-row">' +
          '<div class="eta-badge" style="background:' + cb.route.color + '">' + cb.route.id + '</div>' +
          '<div class="info"><b>' + esc(cb.route.bus.driver) + '</b>' +
          '<span>' + cb.route.bus.occupancy + '/' + cb.route.bus.capacity + ' seats filled</span></div>' +
          '<div class="eta-time"><b>' + val + '</b><span>' + lbl + '</span></div>' +
        '</div>';
    }
    campusList.innerHTML = campusHtml;
  }

  function renderSchedule(buses) {
    var active = buses[0];
    for (var i = 0; i < buses.length; i++) {
      if (buses[i].route.id === activeId) active = buses[i];
    }

    var r = active.route;
    var t = active.t;
    var lateText = r.delay > 0 ? ' · ' + r.delay + ' min late' : ' · on schedule';

    schedHead.innerHTML =
      '🕐 ' + r.id + ' · ' + esc(r.name) + ' — Timetable ' +
      '<span class="sub">' + esc(r.bus.driver) + ' · ' + esc(r.bus.plate) + lateText + '</span>';

    var rows = '';
    for (var j = 0; j < r.stops.length; j++) {
      var s = r.stops[j];
      var passed = t >= s.t;
      var isNext = active.st.nextIdx === j;
      var eta = s.t - t;

      var rowCls = '';
      if (passed) rowCls = 'passed';
      else if (isNext) rowCls = 'next';

      var statusTag;
      if (passed) statusTag = '<span class="tag done">Departed</span>';
      else if (isNext) statusTag = '<span class="tag on">Arriving next</span>';
      else statusTag = '<span class="tag idle">Upcoming</span>';

      var dotColor = passed ? '#cbd5e1' : r.color;

      rows +=
        '<tr class="' + rowCls + '">' +
          '<td><div class="st-name"><i style="background:' + dotColor + '"></i>' + esc(s.name) + '</div></td>' +
          '<td class="mono">' + fmtClock(s.t) + '</td>' +
          '<td class="mono">' + (passed ? '—' : fmtEta(eta) + ' min') + '</td>' +
          '<td>' + statusTag + '</td>' +
        '</tr>';
    }
    schedBody.innerHTML = rows;
  }

  busList.addEventListener('click', function (e) {
    var item = e.target.closest('.bus-item');
    if (!item) return;
    activeId = item.getAttribute('data-id');
    lastKey = '';
    renderAll();
  });

  function renderAll() {
    var buses = BusSim.compute();
    updateMap(buses);
    updateLegend(buses);
    clockEl.textContent = fmtClock(BusSim.simMin);
    renderSidebar(buses);
    renderSchedule(buses);
    lastKey = activeId + '|' + stop + '|' + Math.round(BusSim.simMin * 10);
  }

  function tick() {
    if (!BusSim.paused) {
      BusSim.simMin += (TICK_MS / 1000) * SIM_SECONDS_PER_TICK * BusSim.speed / 60;
      if (BusSim.simMin >= SIM_END_MINUTE) BusSim.simMin = 0;
    }

    var buses = BusSim.compute();
    updateMap(buses);
    updateLegend(buses);
    clockEl.textContent = fmtClock(BusSim.simMin);

    var key = activeId + '|' + stop + '|' + Math.round(BusSim.simMin * 10);
    if (key !== lastKey) {
      lastKey = key;
      renderSidebar(buses);
      renderSchedule(buses);
    }
  }

  renderAll();
  var timer = setInterval(tick, TICK_MS);

  return {
    el: el,
    _cleanup: function () { clearInterval(timer); }
  };
}


/* ============================================================
   PAGE: SCHEDULE
   ============================================================ */

function PageSchedule() {
  var el = document.createElement('div');
  el.className = 'page';
  var activeId = 'R1';

  el.innerHTML =
  '<div class="container">' +
    '<div class="page-head"><div><h1>Route Timetable</h1>' +
    '<p>Scheduled arrival times for every stop on every campus route.</p></div></div>' +
    '<div class="tabs" id="tabsBox"></div>' +
    '<div class="route-meta" id="metaBox"></div>' +
    '<section class="card">' +
      '<div class="card-h" id="schHead">🕐 Timetable</div>' +
      '<div style="overflow-x:auto"><table>' +
        '<thead><tr><th>#</th><th>Stop</th><th>Scheduled</th><th>Departure</th><th>Status</th></tr></thead>' +
        '<tbody id="schBody"></tbody></table></div>' +
    '</section>' +
  '</div>';

  var tabsBox = $('#tabsBox', el);
  for (var i = 0; i < ROUTES.length; i++) {
    var r = ROUTES[i];
    var btn = document.createElement('button');
    btn.className = 'tab' + (r.id === activeId ? ' on' : '');
    btn.setAttribute('data-id', r.id);
    btn.innerHTML = '<span class="sw" style="background:' + r.color + '"></span>' + r.id + ' · ' + esc(r.name);
    tabsBox.appendChild(btn);
  }

  tabsBox.addEventListener('click', function (e) {
    var t = e.target.closest('.tab');
    if (!t) return;
    activeId = t.getAttribute('data-id');

    var tabs = $$('.tab', tabsBox);
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('data-id') === activeId) tabs[i].classList.add('on');
      else tabs[i].classList.remove('on');
    }
    render();
  });

  function meta(k, v) {
    return '<div class="meta-box"><span>' + esc(k) + '</span><b>' + esc(v) + '</b></div>';
  }

  function render() {
    var r = ROUTES[0];
    for (var i = 0; i < ROUTES.length; i++) {
      if (ROUTES[i].id === activeId) { r = ROUTES[i]; break; }
    }

    var t = BusSim.simMin - r.delay;
    var statusText = r.delay > 0 ? '+' + r.delay + ' min late' : 'On schedule';

    $('#metaBox', el).innerHTML =
      meta('Route', r.id + ' · ' + r.name) +
      meta('Driver', r.bus.driver) +
      meta('Vehicle', r.bus.plate) +
      meta('Status', statusText);

    $('#schHead', el).innerHTML =
      '🕐 ' + r.id + ' · ' + esc(r.name) +
      ' <span class="sub">' + r.stops.length + ' stops · campus arrival ' +
      fmtClock(r.stops[r.stops.length - 1].t) + '</span>';

    var rows = '';
    for (var j = 0; j < r.stops.length; j++) {
      var s = r.stops[j];
      var passed = t >= s.t;

      var statusTag;
      if (passed) statusTag = '<span class="tag done">Departed</span>';
      else if (j > 0 && t >= r.stops[j - 1].t) statusTag = '<span class="tag on">Bus en route</span>';
      else statusTag = '<span class="tag idle">Scheduled</span>';

      var dep = j < r.stops.length - 1 ? r.stops[j + 1].t : s.t + 2;
      var dotColor = passed ? '#cbd5e1' : r.color;
      var rowCls = passed ? 'passed' : '';

      rows +=
        '<tr class="' + rowCls + '">' +
          '<td class="mono" style="color:var(--muted)">' + (j + 1) + '</td>' +
          '<td><div class="st-name"><i style="background:' + dotColor + '"></i>' + esc(s.name) + '</div></td>' +
          '<td class="mono">' + fmtClock(s.t) + '</td>' +
          '<td class="mono" style="color:var(--muted)">' + fmtClock(dep) + '</td>' +
          '<td>' + statusTag + '</td>' +
        '</tr>';
    }
    $('#schBody', el).innerHTML = rows;
  }

  render();
  var timer = setInterval(render, 500);

  return {
    el: el,
    _cleanup: function () { clearInterval(timer); }
  };
}


/* ============================================================
   PAGE: ABOUT
   ============================================================ */

function PageAbout() {
  var el = document.createElement('div');
  el.className = 'page';

  el.innerHTML =
  '<div class="container">' +
    '<div class="about-hero">' +
      '<div style="font-size:11.5px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--primary);margin-bottom:12px">About SONAR</div>' +
      '<h1>Making campus commutes predictable.</h1>' +
      '<p>SONAR stands for <b>Student Online Navigation And Routing</b>. We built it because waiting 25 minutes at a bus stop with no information is a solved problem. Our platform gives every student live visibility into where their bus is and exactly when it will arrive.</p>' +
    '</div>' +
    '<section class="section" style="padding-top:20px"><div class="grid-3">' +
      '<div class="feat"><div class="ico">🎯</div><h3>Our Mission</h3><p>Eliminate uncertainty from daily campus travel by giving every commuter real-time, accurate information.</p></div>' +
      '<div class="feat"><div class="ico">🔬</div><h3>Our Approach</h3><p>We combine GPS telemetry with historical route data to produce ETAs that stay accurate.</p></div>' +
      '<div class="feat"><div class="ico">🤝</div><h3>Our Community</h3><p>Built with the college transport office and tested daily by over 200 student commuters.</p></div>' +
    '</div></section>' +
    '<section class="section" style="padding-top:10px">' +
      '<div class="sec-head"><div class="kicker">The Team</div><h2>People behind SONAR</h2></div>' +
      '<div class="grid-4">' +
        teamMember('AK', 'Akash Kumar') +
        teamMember('AA', 'Aayush Bisht') +
        teamMember('AR', 'Arjun Rana') +
        teamMember('MT', 'Mahima Tayal', 'Program Coordinator') +
      '</div>' +
    '</section>' +
    '<section class="section" style="padding-top:10px">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px" class="about-bottom">' +
        '<div class="contact-box">' +
          '<h3 style="font-size:18px;font-weight:800;margin-bottom:8px;color:var(--text)">Get in touch</h3>' +
          '<p style="font-size:13px;color:var(--muted);margin-bottom:16px;line-height:1.7">Questions, feedback, or want SONAR at your campus? Reach out any time.</p>' +
          contactRow('✉', 'Email', 'support@sonar.edu') +
          contactRow('☎', 'Phone', '+91 80 4123 5678') +
          contactRow('📍', 'Office', 'Transport Block, College Campus') +
          contactRow('🕐', 'Hours', 'Mon–Fri, 8:00 AM – 6:00 PM') +
        '</div>' +
        '<div class="card" style="padding:30px">' +
          '<h3 style="font-size:18px;font-weight:800;margin-bottom:8px;color:var(--text)">Frequently asked</h3>' +
          faq('What does SONAR stand for?', 'SONAR stands for Student Online Navigation And Routing — the full name behind the platform.') +
          faq('How accurate are the ETAs?', 'Our ETAs are recalculated every second from live bus positions and historical segment speeds.') +
          faq('Do I need an account to track?', 'Yes — signing in lets us save your boarding stop and send you alerts.') +
          faq('Which routes are supported?', 'Four major lines: South, North, East, and West — covering 18 stops across the city.') +
        '</div>' +
      '</div>' +
    '</section>' +
  '</div>';

  return { el: el };
}

function teamMember(ini, name, role) {
  return '<div class="card team-card"><div class="team-av">' + esc(ini) + '</div>' +
         '<b>' + esc(name) + '</b><span>' + esc(role) + '</span></div>';
}

function contactRow(icon, label, val) {
  return '<div class="ci"><div class="ic">' + icon + '</div>' +
         '<div><b>' + esc(label) + '</b><span>' + esc(val) + '</span></div></div>';
}

function faq(q, a) {
  return '<div style="padding:14px 0;border-bottom:1px solid #f1f5f9">' +
    '<b style="display:block;font-size:13.5px;margin-bottom:6px;color:var(--text)">' + esc(q) + '</b>' +
    '<span style="font-size:12.5px;color:var(--muted);line-height:1.65">' + esc(a) + '</span></div>';
}


/* ============================================================
   PAGE: PROFILE
   ============================================================ */

function PageProfile() {
  var user = Store.current;
  var el = document.createElement('div');
  el.className = 'page';

  var stopOpts = '';
  for (var i = 0; i < ALL_STOPS.length; i++) {
    var selected = ALL_STOPS[i] === user.stop ? ' selected' : '';
    stopOpts += '<option' + selected + '>' + esc(ALL_STOPS[i]) + '</option>';
  }

  var routeOpts = '';
  for (var j = 0; j < ROUTES.length; j++) {
    var r = ROUTES[j];
    var sel = r.id === user.routeId ? ' selected' : '';
    routeOpts += '<option value="' + r.id + '"' + sel + '>' + r.id + ' — ' + esc(r.name) + '</option>';
  }

  var memberDate = new Date(user.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  el.innerHTML =
  '<div class="container">' +
    '<div class="page-head"><div><h1>My Profile</h1>' +
    '<p>Manage your account details and boarding preferences.</p></div></div>' +
    '<div class="layout" style="grid-template-columns:1fr 1fr">' +
      '<section class="card">' +
        '<div class="card-h">👤 Account Details</div>' +
        '<div style="padding:22px">' +
          '<div style="display:flex;align-items:center;gap:16px;margin-bottom:22px">' +
            '<div class="avatar" style="width:64px;height:64px;font-size:24px;border-radius:20px">' + esc(initials(user.name)) + '</div>' +
            '<div><b style="font-size:17px;display:block;margin-bottom:4px;color:var(--text)">' + esc(user.name) + '</b>' +
            '<span style="font-size:12.5px;color:var(--muted)">' + esc(user.email) + '</span></div>' +
          '</div>' +
          detailRow('Roll Number', user.roll) +
          detailRow('Mobile', user.phone) +
          detailRow('Department', user.department) +
          detailRow('Member Since', memberDate) +
        '</div>' +
      '</section>' +
      '<section class="card">' +
        '<div class="card-h">📍 Commute Preferences</div>' +
        '<div style="padding:22px">' +
          '<div class="field"><label>Boarding Stop</label>' +
            '<select id="profStop">' + stopOpts + '</select></div>' +
          '<div class="field"><label>Primary Route</label>' +
            '<select id="profRoute">' + routeOpts + '</select></div>' +
          '<button class="btn btn-primary btn-block" id="saveProf" style="margin-top:8px">Save Preferences</button>' +
          '<div class="divider">DANGER ZONE</div>' +
          '<button class="btn btn-danger btn-block" id="delAcct">Delete My Account</button>' +
        '</div>' +
      '</section>' +
    '</div>' +
  '</div>';

  function detailRow(k, v) {
    return '<div style="display:flex;justify-content:space-between;gap:16px;padding:11px 0;border-bottom:1px solid #f1f5f9">' +
      '<span style="font-size:12.5px;color:var(--muted);font-weight:600">' + esc(k) + '</span>' +
      '<span style="font-size:13px;font-weight:700;text-align:right;color:var(--text)">' + esc(v) + '</span></div>';
  }

  $('#saveProf', el).addEventListener('click', function () {
    Store.update(user.id, {
      stop: $('#profStop', el).value,
      routeId: $('#profRoute', el).value
    });
    toast('Preferences saved successfully.', 'ok');
  });

  $('#delAcct', el).addEventListener('click', function () {
    var ok = confirm('Delete your SONAR account? This cannot be undone.');
    if (!ok) return;

    var users = Store.getUsers();
    var remaining = [];
    for (var i = 0; i < users.length; i++) {
      if (users[i].id !== user.id) remaining.push(users[i]);
    }
    Store.saveUsers(remaining);
    Store.setSession(null);
    toast('Your account has been deleted.', 'warn');
    navigate('/');
  });

  return { el: el };
}


/* ============================================================
   PAGE: 404
   ============================================================ */

function Page404() {
  var el = document.createElement('div');
  el.className = 'page';
  el.innerHTML =
    '<div class="container" style="text-align:center;padding:100px 20px">' +
      '<div style="font-size:64px;margin-bottom:16px">🚏</div>' +
      '<h1 style="font-size:38px;font-weight:800;letter-spacing:-1.2px;margin-bottom:12px;color:var(--text)">Wrong stop!</h1>' +
      '<p style="color:var(--muted);font-size:15px;margin-bottom:28px">This page doesn\'t exist on our route.</p>' +
      '<a class="btn btn-primary btn-lg" href="#/">Back to Home</a>' +
    '</div>';
  return { el: el };
}


/* ============================================================
   BOOT
   ============================================================ */

try {
  renderNav();
  router();
} catch (err) {
  console.error(err);
  var msg = err && err.stack ? err.stack : err;
  document.body.innerHTML =
    '<div style="padding:80px 20px;text-align:center;color:#dc2626;font-family:monospace;font-size:13px">' +
    '⚠ Startup error: ' + esc(msg) + '</div>';
}