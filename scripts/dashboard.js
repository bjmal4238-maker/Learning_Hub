/* scripts/dashboard.js
   Fetches courses directly from Firebase
*/

document.addEventListener('DOMContentLoaded', () => {
    // ننتظر ثانية لضمان تحميل مكتبة الفايربيز
    setTimeout(() => initDashboard(), 1000);
});

function initDashboard() {
    // التأكد من أن الفايربيز جاهز
    if (!window.firebaseAuth) {
        console.error("Firebase not loaded!");
        return;
    }

    const { db, collection, getDocs, auth, signOut } = window.firebaseAuth;

    // 1. تحميل الفيديوهات
    loadCourses(db, collection, getDocs);

    // 2. تفعيل زر الخروج
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = '../index.html');
    });

    // 3. تفعيل زر البروفايل
    document.getElementById('profileBtn')?.addEventListener('click', () => {
        window.location.href = 'profile.html';
    });

    // 4. تفعيل زر إغلاق الفيديو
    setupModal();
}

async function loadCourses(db, collection, getDocs) {
    try {
        // جلب البيانات من مجموعة "courses" في الفايربيز
        const querySnapshot = await getDocs(collection(db, "courses"));
        
        if (querySnapshot.empty) {
            console.log("No courses found in database.");
            return;
        }

        const courses = [];
        querySnapshot.forEach((doc) => {
            courses.push({ id: doc.id, ...doc.data() });
        });

        // توزيع الفيديوهات على الأقسام
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

    // تصفية الفيديوهات حسب القسم
    const items = allCourses.filter(c => c.category === category);

    if (items.length === 0) {
        container.innerHTML = '<p style="color:#777; padding:10px;">لا توجد فيديوهات مضافة حالياً.</p>';
        return;
    }

    container.innerHTML = ''; // مسح المحتوى القديم
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'course-card';
        
        // عند الضغط على الكارت، يفتح الفيديو
        card.onclick = () => playVideo(item);

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
            </div>
        `;
        container.appendChild(card);
    });
}

// دالة تشغيل الفيديو في النافذة المنبثقة
function playVideo(item) {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('videoFrame');
    const title = document.getElementById('videoTitle');
    const desc = document.getElementById('videoDescription');

    if(modal && iframe) {
        title.textContent = item.title;
        if(desc) desc.textContent = item.description;
        // وضع رابط الفيديو مع تشغيل تلقائي
        iframe.src = `https://www.youtube.com/embed/${item.videoId}?autoplay=1`;
        modal.classList.add('show');
    }
}

// إعدادات غلق النافذة
function setupModal() {
    const modal = document.getElementById('videoModal');
    const closeBtn = document.getElementById('videoModalClose');
    const iframe = document.getElementById('videoFrame');

    const closeModal = () => {
        iframe.src = ''; // إيقاف الفيديو
        modal.classList.remove('show');
    };

    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    
    // الغلق عند الضغط خارج الفيديو
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}
