/* scripts/admin.js
   Firebase Admin Script - Smart Link Fix
*/

document.addEventListener('DOMContentLoaded', () => {
    // ننتظر ثانية لضمان تحميل الفايربيز
    setTimeout(() => initAdminPanel(), 1000);
});

function initAdminPanel() {
    if (!window.firebaseAuth) {
        console.error("Firebase not loaded!");
        return;
    }

    // استدعاء الأدوات
    const { db, auth, ADMIN_EMAIL, collection, addDoc, getDocs, deleteDoc, doc, onAuthStateChanged } = window.firebaseAuth;
    
    const logoutBtn = document.getElementById('logoutAdmin');
    const addBtn = document.getElementById('addCourseBtn');
    const listDiv = document.getElementById('coursesList');

    // 1. التحقق من الأدمن
    onAuthStateChanged(auth, (user) => {
        if (user && user.email === ADMIN_EMAIL) {
            loadVideos(db, collection, getDocs, listDiv);
        } else {
            window.location.href = '../index.html';
        }
    });

    // 2. خروج
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => window.location.href = '../index.html');
        });
    }

    // 3. إضافة فيديو (الكود الذكي)
    if (addBtn) {
        addBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('courseTitle').value;
            const videoUrl = document.getElementById('courseVid').value;
            // باقي الحقول
            const desc = document.getElementById('courseDesc').value;
            const duration = document.getElementById('courseDuration').value;
            const level = document.getElementById('courseLevel').value;
            const category = document.getElementById('courseCategory').value;

            // ---- استخراج الـ ID فقط (تنظيف الرابط) ----
            const videoId = extractVideoID(videoUrl);

            if (!title || !videoId) {
                alert("الرابط غير صحيح! تأكد من نسخ رابط يوتيوب.");
                return;
            }

            addBtn.textContent = "جارِ الحفظ...";
            addBtn.disabled = true;

            try {
                // الحفظ في قاعدة البيانات
                await addDoc(collection(db, "courses"), {
                    title: title,
                    description: desc,
                    videoId: videoId, // الـ ID النظيف
                    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    duration: duration,
                    level: level,
                    category: category,
                    createdAt: new Date()
                });

                alert("✅ تم الحفظ بنجاح!");
                // تفريغ الحقول
                document.getElementById('courseTitle').value = '';
                document.getElementById('courseVid').value = '';
                
                // تحديث القائمة فوراً
                loadVideos(db, collection, getDocs, listDiv);

            } catch (error) {
                console.error("Error:", error);
                alert("حدث خطأ: " + error.message);
            } finally {
                addBtn.textContent = "حفظ";
                addBtn.disabled = false;
            }
        });
    }
}

// دالة سحرية بتطلع الـ ID من أي شكل للرابط
function extractVideoID(url) {
    if (!url) return null;
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    var match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// عرض الفيديوهات
async function loadVideos(db, collection, getDocs, container) {
    if (!container) return;
    container.innerHTML = "جارِ التحميل...";
    
    const querySnapshot = await getDocs(collection(db, "courses"));
    container.innerHTML = ""; 
    
    if (querySnapshot.empty) {
        container.innerHTML = "<p>لا توجد فيديوهات.</p>";
        return;
    }

    querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const div = document.createElement('div');
        div.className = "course-row";
        div.style = "border-bottom:1px solid #333; padding:10px; display:flex; justify-content:space-between; align-items:center;";
        
        // عرض الصورة المصغرة للتأكد
        div.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center;">
                <img src="${data.thumbnail}" style="width:80px; height:45px; object-fit:cover; border-radius:4px;">
                <div>
                    <strong>${data.title}</strong>
                </div>
            </div>
            <button onclick="deleteVideo('${docSnap.id}')" style="background:red; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">حذف</button>
        `;
        container.appendChild(div);
    });
}

// دالة الحذف
window.deleteVideo = async function(id) {
    if(!confirm("حذف الفيديو؟")) return;
    const { db, deleteDoc, doc } = window.firebaseAuth;
    await deleteDoc(doc(db, "courses", id));
    location.reload();
};
