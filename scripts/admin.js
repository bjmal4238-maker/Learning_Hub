/* scripts/admin.js
   Firebase Admin Script - Clean Version
*/

document.addEventListener('DOMContentLoaded', () => {
    // ننتظر قليلاً للتأكد من تحميل الفايربيز
    setTimeout(() => {
        initAdminPanel();
    }, 1000);
});

function initAdminPanel() {
    // التأكد من أن المكتبة تم تحميلها
    if (!window.firebaseAuth) {
        console.error("Firebase not loaded!");
        alert("حدث خطأ في تحميل النظام. الرجاء تحديث الصفحة.");
        return;
    }

    // استدعاء الأدوات من الملف السابق
    const { 
        db, 
        auth, 
        ADMIN_EMAIL, 
        collection, 
        addDoc, 
        getDocs, 
        deleteDoc, 
        doc, 
        onAuthStateChanged 
    } = window.firebaseAuth;

    const logoutBtn = document.getElementById('logoutAdmin');
    const addBtn = document.getElementById('addCourseBtn');
    const listDiv = document.getElementById('coursesList');

    // 1. التحقق من هوية الأدمن
    onAuthStateChanged(auth, (user) => {
        if (user && user.email === ADMIN_EMAIL) {
            console.log("Welcome Admin: " + user.email);
            loadVideos(db, collection, getDocs, listDiv); // تحميل الفيديوهات
        } else {
            // لو مش أدمن، اطرده للصفحة الرئيسية
            window.location.href = '../index.html';
        }
    });

    // 2. زر تسجيل الخروج
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => window.location.href = '../index.html');
        });
    }

    // 3. زر إضافة فيديو جديد
    if (addBtn) {
        addBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            addBtn.textContent = "جارِ الحفظ...";
            addBtn.disabled = true;

            // جمع البيانات من الحقول
            const title = document.getElementById('courseTitle').value;
            const videoUrl = document.getElementById('courseVid').value;
            const desc = document.getElementById('courseDesc').value;
            const duration = document.getElementById('courseDuration').value;
            const level = document.getElementById('courseLevel').value;
            const category = document.getElementById('courseCategory').value;

            if (!title || !videoUrl) {
                alert("الرجاء كتابة العنوان ورابط الفيديو");
                addBtn.textContent = "حفظ";
                addBtn.disabled = false;
                return;
            }

            // استخراج ID اليوتيوب
            let videoId = videoUrl;
            if (videoUrl.includes('v=')) videoId = videoUrl.split('v=')[1].split('&')[0];
            else if (videoUrl.includes('youtu.be/')) videoId = videoUrl.split('youtu.be/')[1];

            try {
                // إرسال البيانات إلى Firebase
                await addDoc(collection(db, "courses"), {
                    title: title,
                    description: desc,
                    videoId: videoId,
                    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    duration: duration,
                    level: level,
                    category: category,
                    createdAt: new Date()
                });

                alert("تمت إضافة الفيديو بنجاح! ✅");
                // تفريغ الحقول
                document.getElementById('courseTitle').value = '';
                document.getElementById('courseVid').value = '';
                
                // إعادة تحميل القائمة
                loadVideos(db, collection, getDocs, listDiv);

            } catch (error) {
                console.error("Error adding document: ", error);
                alert("حدث خطأ أثناء الحفظ: " + error.message);
            } finally {
                addBtn.textContent = "حفظ";
                addBtn.disabled = false;
            }
        });
    }
}

// دالة تحميل الفيديوهات وعرضها في القائمة
async function loadVideos(db, collection, getDocs, container) {
    if (!container) return;
    container.innerHTML = "جارِ التحميل...";
    
    try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        container.innerHTML = ""; // مسح رسالة التحميل
        
        if (querySnapshot.empty) {
            container.innerHTML = "<p>لا توجد فيديوهات حالياً.</p>";
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const div = document.createElement('div');
            div.className = "course-row";
            div.style = "border-bottom:1px solid #333; padding:10px; margin-bottom:5px; display:flex; justify-content:space-between; align-items:center;";
            
            div.innerHTML = `
                <div>
                    <strong>${data.title}</strong> <br>
                    <small style="color:#aaa">${data.category} | ${data.level}</small>
                </div>
                <button onclick="deleteVideo('${docSnap.id}')" style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px;">حذف</button>
            `;
            container.appendChild(div);
        });

    } catch (e) {
        console.error("Error loading videos:", e);
        container.innerHTML = "فشل تحميل الفيديوهات.";
    }
}

// دالة الحذف (توضع في Window عشان زرار الـ HTML يشوفها)
window.deleteVideo = async function(id) {
    if(!confirm("هل أنت متأكد من حذف هذا الفيديو؟")) return;
    
    const { db, deleteDoc, doc } = window.firebaseAuth;
    try {
        await deleteDoc(doc(db, "courses", id));
        alert("تم الحذف");
        location.reload(); // تحديث الصفحة لرؤية النتيجة
    } catch (e) {
        alert("خطأ في الحذف: " + e.message);
    }
};
