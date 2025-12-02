/* scripts/dashboard.js
   - Fetches courses from Firebase
   - Handles Themes (Dark/Light)
   - Restores Watch & Preview Buttons
*/

document.addEventListener('DOMContentLoaded', () => {
    // ننتظر ثانية لضمان تحميل مكتبة الفايربيز
    setTimeout(() => initDashboard(), 1000);
});

function initDashboard() {
    // 1. التأكد من أن الفايربيز جاهز
    if (!window.firebaseAuth) {
        console.error("Firebase not loaded!");
        return;
    }

    const { db, collection, getDocs, auth, signOut } = window.firebaseAuth;

    // 2. تشغيل الثيمات (Theme Switcher) - [تصليح المشكلة الأولى]
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        // استرجاع الثيم المحفوظ
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.setAttribute('data-theme', savedTheme);
        themeSelect.value = savedTheme;

        // عند التغيير
        themeSelect.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // 3. تحميل الفيديوهات
    loadCourses(db, collection, getDocs);

    // 4. الأزرار العلوية (Logout / Profile)
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = '../index.html');
    });

    document.getElementById('profileBtn')?.addEventListener('click', () => {
        window.location.href = 'profile.html';
    });

    // 5. إعدادات المودال (النوافذ المنبثقة)
    setupModals();
}

async function loadCourses(db, collection, getDocs) {
    try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        
        if (querySnapshot.empty) {
            console.log("No courses found.");
            return;
        }

        const courses = [];
        querySnapshot.forEach((doc) => {
            courses.push({ id: doc.id, ...doc.data() });
        });

        // رسم الأقسام
        renderSection(courses, 'featured', 'featuredGrid');
        renderSection(courses, 'cybersecurity', 'cybersecurityGrid');
        renderSection(courses, 'programming', 'programmingGrid');
        renderSection(courses, 'ai', 'aiGrid');
        renderSection(courses, 'networking', 'networkingGrid');
        renderSection(courses, 'webdev', 'webdevGrid');
        renderSection(courses, 'datascience', 'datascienceGrid');

    } catch (e) {
        console.error("Error loading courses:", e);
    }
}

// دالة رسم الكروت في الشاشة
function renderSection(allCourses, category, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;

    const items = allCourses.filter(c => c.category === category);

    if (items.length === 0) {
        container.innerHTML = '<p style="color:#777; padding:10px;">لا توجد فيديوهات مضافة في هذا القسم.</p>';
        return;
    }

    container.innerHTML = ''; 
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'course-card';
        
        // [تصليح المشكلة الثانية]: إعادة رسم الأزرار
        card.innerHTML = `
            <div class="course-thumbnail">
                <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
                <div class="play-btn"><i class="bx bxs-play-circle"></i></div>
            </div>
            <div class="course-content">
                <div class="course-category"><i class="bx bxs-video"></i> VIDEO</div>
                <h3 class="course-title">${item.title}</h3>
                <p class="course-description">${item.description || ''}</p>
                <div class="course-meta">
                    <div class="course-duration"><i class='bx bx-time'></i> ${item.duration}</div>
                    <div class="course-level"><i class='bx bx-bar-chart'></i> ${item.level}</div>
                </div>
                
                <!-- أزرار المشاهدة والمعاينة (رجعت هنا) -->
                <div class="video-actions" style="margin-top:15px; display:flex; gap:10px;">
                    <button class="btn small accent-btn outline watch-btn" style="flex:1;">
                        <i class="bx bxs-show"></i> Watch
                    </button>
                    <button class="btn small accent-btn preview-btn" style="flex:1; background:#4b5563; border-color:#4b5563;">
                        <i class="bx bxs-pulse"></i> Preview
                    </button>
                </div>
            </div>
        `;

        // تعريف الأزرار داخل الكارت
        const thumb = card.querySelector('.course-thumbnail');
        const watchBtn = card.querySelector('.watch-btn');
        const previewBtn = card.querySelector('.preview-btn');

        const playAction = () => playVideo(item);
        
        // تشغيل الفيديو عند الضغط على الصورة أو زر Watch
        thumb.addEventListener('click', playAction);
        watchBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            playAction();
        });

        // زر البريفيو (يفتح مودال مختلف)
        previewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            previewVideo(item);
        });

        container.appendChild(card);
    });
}

// 1. تشغيل الفيديو الكامل
function playVideo(item) {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('videoFrame');
    const title = document.getElementById('videoTitle');
    
    if(modal && iframe) {
        title.textContent = item.title;
        iframe.src = `https://www.youtube.com/embed/${item.videoId}?autoplay=1`;
        modal.classList.add('show');
    }
}

// 2. تشغيل البريفيو (Preview - 15 ثانية)
function previewVideo(item) {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    const title = document.getElementById('previewTitle');

    if(modal && iframe) {
        title.textContent = "Preview: " + item.title;
        // ?start=0&end=15 بيشغل أول 15 ثانية بس
        iframe.src = `https://www.youtube.com/embed/${item.videoId}?autoplay=1&controls=0&start=0&end=15`; 
        modal.classList.add('show');
    }
}

// إعدادات الغلق لكل المودالز
function setupModals() {
    const closeVideo = () => {
        document.getElementById('videoModal').classList.remove('show');
        document.getElementById('videoFrame').src = '';
    };

    const closePreview = () => {
        document.getElementById('previewModal').classList.remove('show');
        document.getElementById('previewFrame').src = '';
    };

    // أزرار الغلق (X)
    document.getElementById('videoModalClose')?.addEventListener('click', closeVideo);
    document.getElementById('previewModalClose')?.addEventListener('click', closePreview);

    // الغلق عند الضغط في الخارج
    window.addEventListener('click', (e) => {
        if (e.target.id === 'videoModal') closeVideo();
        if (e.target.id === 'previewModal') closePreview();
    });
}
