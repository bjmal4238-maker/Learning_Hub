/* scripts/dashboard.js — Fixed Version */

document.addEventListener('DOMContentLoaded', () => {
    // Apply saved theme immediately
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);

    setTimeout(() => initDashboard(), 1000);
});

function initDashboard() {
    if (!window.firebaseAuth) {
        console.error("Firebase not loaded!");
        setTimeout(() => initDashboard(), 500);
        return;
    }

    const { db, collection, getDocs, auth, signOut, onAuthStateChanged, doc, getDoc } = window.firebaseAuth;

    // Theme Switcher
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.setAttribute('data-theme', savedTheme);
        themeSelect.value = savedTheme;
        themeSelect.addEventListener('change', (e) => {
            document.body.setAttribute('data-theme', e.target.value);
            localStorage.setItem('theme', e.target.value);
        });
    }

    // Load user avatar
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '../index.html';
            return;
        }
        try {
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists()) {
                const data = snap.data();
                const avatarEl = document.getElementById('userAvatar');
                if (avatarEl && data.photoURL) avatarEl.src = data.photoURL;
            }
        } catch(e) { /* no problem */ }
    });

    // Load courses
    loadCourses(db, collection, getDocs, auth, doc, getDoc);

    // Logout & Profile buttons
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = '../index.html');
    });
    document.getElementById('profileBtn')?.addEventListener('click', () => {
        window.location.href = 'profile.html';
    });

    // Hero buttons — FIX: were broken
    document.getElementById('exploreCourses')?.addEventListener('click', () => {
        const target = document.getElementById('featured');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('aboutBtn')?.addEventListener('click', () => {
        Swal.fire({
            title: '🎓 About Learning Hub',
            html: `
                <div style="text-align:left;line-height:1.7;color:#888;">
                    <p><strong style="color:#2a7df6;">Learning Hub</strong> is a professional e-learning platform built to deliver high-quality technical education.</p>
                    <br>
                    <p>📚 <strong>500+</strong> curated video courses</p>
                    <p>🛡️ Cybersecurity, Programming, AI, Networking & more</p>
                    <p>⚡ Project-based, expert-led learning</p>
                    <p>🌍 Available globally, in Arabic & English</p>
                    <br>
                    <p style="font-size:13px;color:#aaa;">Built with ❤️ for serious learners.</p>
                </div>
            `,
            confirmButtonText: 'Got it!',
            confirmButtonColor: '#2a7df6',
            background: 'var(--card)',
            color: 'var(--text)'
        });
    });

    // Nav active state on scroll
    setupNavScroll();
    setupModals();
}

// ===== Nav Scroll Active =====
function setupNavScroll() {
    const header = document.querySelector('.site-header');
    window.addEventListener('scroll', () => {
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 10);
        }
    });

    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.dataset.section === entry.target.id);
                });
            }
        });
    }, { rootMargin: '-40% 0px -40% 0px' });

    sections.forEach(s => observer.observe(s));
}

// ===== Load Courses =====
async function loadCourses(db, collection, getDocs, auth, docFn, getDoc) {
    try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        if (querySnapshot.empty) return;

        const courses = [];
        querySnapshot.forEach((d) => courses.push({ id: d.id, ...d.data() }));

        // Check user subscription
        const user = auth.currentUser;
        let isSubscribed = false;
        if (user) {
            try {
                const snap = await getDoc(docFn(db, "users", user.uid));
                if (snap.exists()) {
                    const data = snap.data();
                    isSubscribed = data.subscribed === true || data.subscriptionCode != null;
                }
            } catch(e) {}
        }

        renderSection(courses, 'featured', 'featuredGrid', isSubscribed);
        renderSection(courses, 'cybersecurity', 'cybersecurityGrid', isSubscribed);
        renderSection(courses, 'programming', 'programmingGrid', isSubscribed);
        renderSection(courses, 'ai', 'aiGrid', isSubscribed);
        renderSection(courses, 'networking', 'networkingGrid', isSubscribed);
        renderSection(courses, 'webdev', 'webdevGrid', isSubscribed);
        renderSection(courses, 'datascience', 'datascienceGrid', isSubscribed);

    } catch (e) {
        console.error("Error loading courses:", e);
    }
}

function renderSection(allCourses, category, elementId, isSubscribed) {
    const container = document.getElementById(elementId);
    if (!container) return;

    const items = allCourses.filter(c => c.category === category);
    if (items.length === 0) {
        container.innerHTML = '<p style="color:#777;padding:10px;">لا توجد فيديوهات مضافة في هذا القسم.</p>';
        return;
    }

    container.innerHTML = '';
    items.forEach(item => {
        const isFree = item.free === true;
        const canWatch = isFree || isSubscribed;

        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="course-thumbnail">
                <img src="${item.thumbnail || 'https://via.placeholder.com/400x225/1a1a2e/2a7df6?text=Course'}" alt="${item.title}" loading="lazy">
                <div class="play-btn"><i class="bx bxs-play-circle"></i></div>
                                ${!isFree && !isSubscribed ? '<div class="unavailable-badge"><i class="bx bxs-lock-alt"></i> Premium</div>' : ""}
            </div>
            <div class="course-content">
                <div class="course-category"><i class="bx bxs-video"></i> VIDEO</div>
                <h3 class="course-title">${item.title}</h3>
                <p class="course-description">${item.description || ''}</p>
                <div class="course-meta">
                    <div class="course-duration"><i class='bx bx-time'></i> ${item.duration || 'N/A'}</div>
                    <div class="course-level"><i class='bx bx-bar-chart'></i> ${item.level || 'All Levels'}</div>
                </div>
            </div>
            <div class="video-actions">
                <button class="btn accent-btn watch-btn" title="Watch">
                    <i class="bx bxs-show"></i> Watch
                </button>
                <button class="btn accent-btn outline preview-btn" title="Preview">
                    <i class="bx bxs-pulse"></i> Preview
                </button>
            </div>
        `;

        const thumb = card.querySelector('.course-thumbnail');
        const watchBtn = card.querySelector('.watch-btn');
        const previewBtn = card.querySelector('.preview-btn');

        const handleWatch = (e) => {
            if (e) e.stopPropagation();
            if (!canWatch) {
                // طلب كود الاشتراك
                showSubscriptionModal(item);
            } else {
                playVideo(item);
            }
        };

        thumb.addEventListener('click', handleWatch);
        watchBtn.addEventListener('click', handleWatch);
        previewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            previewVideo(item);
        });

        container.appendChild(card);
    });
}

// ===== Subscription Modal =====
function showSubscriptionModal(item) {
    Swal.fire({
        title: '<i class="bx bxs-lock-alt" style="color:#f59e0b"></i> محتوى مدفوع',
        html: `
            <p style="color:#888;margin-bottom:16px;">هذا الفيديو للمشتركين فقط.<br>ادخل كود الاشتراك للوصول إلى المحتوى.</p>
            <input id="subCodeInput" type="text" class="swal2-input" 
                placeholder="ادخل كود الاشتراك هنا"
                style="font-size:16px;text-align:center;letter-spacing:2px;">
        `,
        confirmButtonText: '<i class="bx bxs-key"></i> تفعيل الكود',
        showCancelButton: true,
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#f59e0b',
        focusConfirm: false,
        preConfirm: async () => {
            const code = document.getElementById('subCodeInput').value.trim();
            if (!code) {
                Swal.showValidationMessage('الرجاء إدخال الكود');
                return false;
            }
            Swal.showValidationMessage('<i class="bx bx-loader-alt bx-spin"></i> جار التحقق...');
            
            try {
                const { db, doc, getDoc, updateDoc, auth } = window.firebaseAuth;
                const codeRef = doc(db, "subscriptionCodes", code);
                const snap = await getDoc(codeRef);
                
                if (!snap.exists() || snap.data().active !== true || snap.data().usedBy) {
                    Swal.showValidationMessage('❌ الكود غير صحيح أو مستخدم من قبل');
                    return false;
                }
                
                // تعليم الكود كمستخدم
                const user = auth.currentUser;
                await updateDoc(codeRef, {
                    usedBy: user?.email || 'unknown',
                    usedAt: new Date(),
                    active: false
                });
                
                // تحديث بيانات المستخدم
                if (user) {
                    const { setDoc } = window.firebaseAuth;
                    await setDoc(doc(db, "users", user.uid), {
                        subscribed: true,
                        subscriptionCode: code,
                        subscribedAt: new Date()
                    }, { merge: true });
                }
                
                return true;
            } catch(e) {
                Swal.showValidationMessage('حدث خطأ، حاول مرة أخرى.');
                return false;
            }
        }
    }).then(result => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: '🎉 تم التفعيل!',
                text: 'يمكنك الآن مشاهدة جميع المحتوى المدفوع',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                playVideo(item);
                // Reload to update all cards
                setTimeout(() => location.reload(), 500);
            });
        }
    });
}

// ===== Video Player =====
function playVideo(item) {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('videoFrame');
    const title = document.getElementById('videoTitle');
    if (modal && iframe) {
        title.textContent = item.title;
        iframe.src = `https://www.youtube.com/embed/${item.videoId}?autoplay=1`;
        modal.classList.add('show');
    }
}

function previewVideo(item) {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    const title = document.getElementById('previewTitle');
    if (modal && iframe) {
        title.textContent = "Preview: " + item.title;
        iframe.src = `https://www.youtube.com/embed/${item.videoId}?autoplay=1&controls=0&start=0&end=15`;
        modal.classList.add('show');
    }
}

function setupModals() {
    const closeVideo = () => {
        document.getElementById('videoModal').classList.remove('show');
        document.getElementById('videoFrame').src = '';
    };
    const closePreview = () => {
        document.getElementById('previewModal').classList.remove('show');
        document.getElementById('previewFrame').src = '';
    };

    document.getElementById('videoModalClose')?.addEventListener('click', closeVideo);
    document.getElementById('previewModalClose')?.addEventListener('click', closePreview);

    window.addEventListener('click', (e) => {
        if (e.target.id === 'videoModal') closeVideo();
        if (e.target.id === 'previewModal') closePreview();
    });
}
