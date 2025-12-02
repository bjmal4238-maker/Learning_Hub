/* scripts/dashboard.js
   Firestore-based dashboard viewer
   - Fetches courses from Firestore in real-time
   - All redirects are relative
*/

(async function() {

        // Wait for Firebase to be ready
        while (!window.firebaseAuth) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const { db, collection, getDocs, query, orderBy, auth, onAuthStateChanged, signOut } = window.firebaseAuth;

        let previewTimeout = null;

        // Check if user is authenticated
        let currentUser = null;
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                // User not logged in, redirect to login
                window.location.href = '../index.html';
            } else {
                currentUser = user;
                const userEmail = localStorage.getItem('userEmail') || user.email;
                localStorage.setItem('userEmail', userEmail);
            }
        });

        // Fetch courses from Firestore
        async function fetchCoursesFromFirestore() {
            try {
                const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const courses = [];
                querySnapshot.forEach((doc) => {
                    courses.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                return courses;
            } catch (error) {
                console.error('Error fetching courses:', error);
                return [];
            }
        }

        // Validate YouTube Video ID
        const isValidYouTubeId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id);

        // Extract video ID from various formats
        const extractVideoIdFromAny = s => {
            if (!s) return '';
            const m = String(s).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
            if (m && m[1]) return m[1];
            const m2 = String(s).match(/\/([A-Za-z0-9_-]{11})(?:\/|$)/);
            return m2 ? m2[1] : '';
        };

        /* --- rendering courses --- */
        function renderCourseGrid(containerId, items) {
            const el = document.getElementById(containerId);
            if (!el) return;
            el.innerHTML = '';
            if (!items || items.length === 0) {
                el.innerHTML = '<div class="empty-section">لا توجد فيديوهات في هذا القسم.</div>';
                return;
            }

            items.forEach(item => {
                        const card = document.createElement('div');
                        card.className = 'course-card';
                        const valid = isValidYouTubeId(item.videoId);

                        card.innerHTML = `
        <div class="course-thumbnail">
          <img src="${item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/maxresdefault.jpg`}" alt="${item.title}">
          <div class="play-btn"><i class="bx bxs-play-circle"></i></div>
          ${valid ? '' : '<div class="unavailable-badge">Unavailable</div>'}
        </div>
        <div class="course-content">
          <div class="course-category"><i class="bx bxs-video"></i> VIDEO</div>
          <h3 class="course-title">${item.title}</h3>
          <p class="course-description">${item.description}</p>
          <div class="course-meta">
            <div class="course-duration">${item.duration}</div>
            <div class="course-level">${item.level}</div>
          </div>
          <div class="video-actions">
            <button class="btn small accent-btn preview-btn" title="Preview 15s"><i class="bx bxs-pulse"></i> Preview 15s</button>
            <button class="btn small accent-btn outline watch-btn" title="Watch"><i class="bx bxs-show"></i> Watch</button>
          </div>
        </div>
      `;

      card.style.position = 'relative';

      // click whole card => full player
      card.addEventListener('click', () => valid ? playVideo(item.videoId, item.title) : showUnavailable(item.title));

      // buttons
      const previewBtn = card.querySelector('.preview-btn');
      const watchBtn = card.querySelector('.watch-btn');
      const playBtn = card.querySelector('.play-btn');

      previewBtn?.addEventListener('click', e => { e.stopPropagation(); if (!valid) return showUnavailable(item.title); previewVideo(item.videoId, item.title); });
      watchBtn?.addEventListener('click', e => { e.stopPropagation(); if (!valid) return showUnavailable(item.title); playVideo(item.videoId, item.title); });
      playBtn?.addEventListener('click', e => { e.stopPropagation(); if (!valid) return showUnavailable(item.title); playVideo(item.videoId, item.title); });

      el.appendChild(card);
    });
  }

  /* --- video modals --- */
  function playVideo(id, title) {
    const titleEl = document.getElementById('videoTitle'); if (titleEl) titleEl.textContent = title || 'Video';
    const frame = document.getElementById('videoFrame'); if (frame) frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    document.getElementById('videoModal')?.classList.add('show');
  }
  function previewVideo(id, title) {
    clearPreviewTimer();
    const titleEl = document.getElementById('previewTitle'); if (titleEl) titleEl.textContent = title || 'Preview';
    const frame = document.getElementById('previewFrame'); if (frame) frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    document.getElementById('previewModal')?.classList.add('show');
    previewTimeout = setTimeout(closePreviewModal, 15000);
  }
  function closePreviewModal() { clearPreviewTimer(); const f = document.getElementById('previewFrame'); if (f) f.src = ''; document.getElementById('previewModal')?.classList.remove('show'); }
  function clearPreviewTimer() { if (previewTimeout) { clearTimeout(previewTimeout); previewTimeout = null; } }
  function closeVideoModal() { const f = document.getElementById('videoFrame'); if (f) f.src = ''; document.getElementById('videoModal')?.classList.remove('show'); }
  function showUnavailable(title) { const em = document.getElementById('errorMessage'); if (em) em.textContent = `Video unavailable for "${title}"`; document.getElementById('errorModal')?.classList.add('show'); setTimeout(()=>document.getElementById('errorModal')?.classList.remove('show'), 3000); }

  /* --- header & misc bindings (relative URLs) --- */
  function bindHeaderButtons() {
    document.getElementById('profileBtn')?.addEventListener('click', () => window.location.href = './profile.html');
    document.getElementById('logoutBtn')?.addEventListener('click', () => { 
      signOut(auth).then(() => {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
        window.location.href = '../index.html'; 
      }).catch(err => console.error('Logout error:', err));
    });

    const theme = document.getElementById('themeSelect');
    theme?.addEventListener('change', e => { document.body.setAttribute('data-theme', e.target.value); localStorage.setItem('theme', e.target.value); });

    document.getElementById('adminLoginBtn')?.addEventListener('click', () => {
      const userEmail = localStorage.getItem('userEmail');
      const adminEmail = window.firebaseAuth.ADMIN_EMAIL;
      
      if (userEmail === adminEmail) {
        window.location.href = './admin.html';
      } else {
        alert('Only admin users can access the admin panel');
      }
    });

    document.getElementById('videoModalClose')?.addEventListener('click', closeVideoModal);
    document.getElementById('videoModal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeVideoModal(); });

    document.getElementById('previewModalClose')?.addEventListener('click', closePreviewModal);
    document.getElementById('previewModal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closePreviewModal(); });
  }

  /* --- smooth scroll + nav behavior --- */
  (function () {
    const ensureNotice = () => {
      let n = document.getElementById('sectionNotice');
      if (!n) { n = document.createElement('div'); n.id = 'sectionNotice'; n.className = 'section-notice'; document.body.appendChild(n); }
      return n;
    };
    const getHeaderOffset = () => { const h = document.querySelector('.site-header'); return h ? h.offsetHeight + 8 : 72; };
    const showSectionNotice = (text, duration=1400) => {
      const n = ensureNotice(); n.textContent = text;
      n.style.top = `${getHeaderOffset()}px`; n.classList.add('show');
      clearTimeout(n.__hideTimeout); n.__hideTimeout = setTimeout(()=> n.classList.remove('show'), duration);
    };
    const flashSectionTitle = (sectionEl, duration=1000) => {
      if (!sectionEl) return; const title = sectionEl.querySelector('.section-title'); if (!title) return;
      title.classList.add('highlight'); setTimeout(()=> title.classList.remove('highlight'), duration);
    };

    const handleNavClick = (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const link = e.currentTarget;
      const targetId = link.getAttribute('data-section') || (link.getAttribute('href') || '').replace('#','');
      if (!targetId) return;
      const target = document.getElementById(targetId); if (!target) return;
      const headerOffset = getHeaderOffset();
      const rect = target.getBoundingClientRect();
      const targetY = Math.max(0, Math.floor(window.scrollY + rect.top - headerOffset));
      window.scrollTo({ top: targetY, behavior: 'smooth' });
      const label = (link.textContent || link.innerText || targetId).trim();
      showSectionNotice(label);
      setTimeout(()=> flashSectionTitle(target), 350);
    };

    const bindNavLinks = () => {
      document.querySelectorAll('.nav-main .nav-link').forEach(a => {
        if (a.__boundToSection) return;
        a.addEventListener('click', handleNavClick);
        a.__boundToSection = true;
      });
    };

    document.addEventListener('DOMContentLoaded', () => {
      bindNavLinks();
      const nav = document.querySelector('.nav-main');
      if (nav && window.MutationObserver) {
        new MutationObserver(() => bindNavLinks()).observe(nav, { childList: true, subtree: true });
      }

      if (location.hash) {
        const id = location.hash.replace('#','');
        const el = document.getElementById(id);
        if (el) setTimeout(() => {
          const headerOffset = getHeaderOffset();
          const rect = el.getBoundingClientRect();
          const targetY = Math.max(0, Math.floor(window.scrollY + rect.top - headerOffset));
          window.scrollTo({ top: targetY, behavior: 'smooth' });
          const navLink = document.querySelector(`.nav-main .nav-link[data-section="${id}"]`);
          const label = navLink ? (navLink.textContent || navLink.innerText).trim() : (el.querySelector('.section-title')?.textContent || id);
          showSectionNotice(label, 1600);
          flashSectionTitle(el, 1000);
        }, 240);
      }
    });
  })();

  /* --- init dashboard --- */
  async function initDashboard(){
    bindHeaderButtons();
    const arr = await fetchCoursesFromFirestore();
    const cats = {};
    arr.forEach(it => (cats[it.category] ||= []).push(it));
    renderCourseGrid('featuredGrid', cats.featured || []);
    renderCourseGrid('cybersecurityGrid', cats.cybersecurity || []);
    renderCourseGrid('programmingGrid', cats.programming || []);
    renderCourseGrid('aiGrid', cats.ai || []);
    renderCourseGrid('networkingGrid', cats.networking || []);
    renderCourseGrid('webdevGrid', cats.webdev || []);
    renderCourseGrid('datascienceGrid', cats.datascience || []);
  }

  document.addEventListener('DOMContentLoaded', initDashboard);
  document.getElementById('exploreCourses')?.addEventListener('click', () => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' }));

})();

  /* --- smooth scroll + nav behavior --- */
  (function () {
    const ensureNotice = () => {
      let n = document.getElementById('sectionNotice');
      if (!n) { n = document.createElement('div'); n.id = 'sectionNotice'; n.className = 'section-notice'; document.body.appendChild(n); }
      return n;
    };
    const getHeaderOffset = () => { const h = document.querySelector('.site-header'); return h ? h.offsetHeight + 8 : 72; };
    const showSectionNotice = (text, duration=1400) => {
      const n = ensureNotice(); n.textContent = text;
      n.style.top = `${getHeaderOffset()}px`; n.classList.add('show');
      clearTimeout(n.__hideTimeout); n.__hideTimeout = setTimeout(()=> n.classList.remove('show'), duration);
    };
    const flashSectionTitle = (sectionEl, duration=1000) => {
      if (!sectionEl) return; const title = sectionEl.querySelector('.section-title'); if (!title) return;
      title.classList.add('highlight'); setTimeout(()=> title.classList.remove('highlight'), duration);
    };

    const handleNavClick = (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const link = e.currentTarget;
      const targetId = link.getAttribute('data-section') || (link.getAttribute('href') || '').replace('#','');
      if (!targetId) return;
      const target = document.getElementById(targetId); if (!target) return;
      const headerOffset = getHeaderOffset();
      const rect = target.getBoundingClientRect();
      const targetY = Math.max(0, Math.floor(window.scrollY + rect.top - headerOffset));
      window.scrollTo({ top: targetY, behavior: 'smooth' });
      const label = (link.textContent || link.innerText || targetId).trim();
      showSectionNotice(label);
      setTimeout(()=> flashSectionTitle(target), 350);
    };

    const bindNavLinks = () => {
      document.querySelectorAll('.nav-main .nav-link').forEach(a => {
        if (a.__boundToSection) return;
        a.addEventListener('click', handleNavClick);
        a.__boundToSection = true;
      });
    };

    document.addEventListener('DOMContentLoaded', () => {
      bindNavLinks();
      const nav = document.querySelector('.nav-main');
      if (nav && window.MutationObserver) {
        new MutationObserver(() => bindNavLinks()).observe(nav, { childList: true, subtree: true });
      }

      if (location.hash) {
        const id = location.hash.replace('#','');
        const el = document.getElementById(id);
        if (el) setTimeout(() => {
          const headerOffset = getHeaderOffset();
          const rect = el.getBoundingClientRect();
          const targetY = Math.max(0, Math.floor(window.scrollY + rect.top - headerOffset));
          window.scrollTo({ top: targetY, behavior: 'smooth' });
          const navLink = document.querySelector(`.nav-main .nav-link[data-section="${id}"]`);
          const label = navLink ? (navLink.textContent || navLink.innerText).trim() : (el.querySelector('.section-title')?.textContent || id);
          showSectionNotice(label, 1600);
          flashSectionTitle(el, 1000);
        }, 240);
      }
    });
  })();

  /* --- init --- */
  function initDashboard(){
    bindHeaderButtons();
    const arr = readVideos();
    const cats = {};
    arr.forEach(it => (cats[it.category] ||= []).push(it));
    renderCourseGrid('featuredGrid', cats.featured || []);
    renderCourseGrid('cybersecurityGrid', cats.cybersecurity || []);
    renderCourseGrid('programmingGrid', cats.programming || []);
    renderCourseGrid('aiGrid', cats.ai || []);
    renderCourseGrid('networkingGrid', cats.networking || []);
    renderCourseGrid('webdevGrid', cats.webdev || []);
    renderCourseGrid('datascienceGrid', cats.datascience || []);
    window.addEventListener('storage', (e) => { if (e.key === STORAGE_KEY || e.key === 'encrypted_videos_updated_at') setTimeout(initDashboard, 200); });
  }
  document.addEventListener('DOMContentLoaded', initDashboard);
  document.getElementById('exploreCourses')?.addEventListener('click', () => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' }));