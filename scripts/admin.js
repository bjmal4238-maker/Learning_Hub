/* scripts/admin.js — Updated with Subscription Codes Generator */

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => initAdminPanel(), 1000);
});

function initAdminPanel() {
    if (!window.firebaseAuth) {
        console.error("Firebase not loaded!");
        setTimeout(() => initAdminPanel(), 500);
        return;
    }

    const { db, auth, ADMIN_EMAIL, collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc, onAuthStateChanged, where, query } = window.firebaseAuth;
    
    const logoutBtn = document.getElementById('logoutAdmin');
    const addBtn = document.getElementById('addCourseBtn');
    const clearBtn = document.getElementById('clearCourseForm');
    const listDiv = document.getElementById('coursesList');

    // التحقق من الأدمن
    onAuthStateChanged(auth, (user) => {
        if (user && user.email === ADMIN_EMAIL) {
            loadVideos(db, collection, getDocs, listDiv);
            loadCodesStats(db, collection, getDocs);
        } else {
            window.location.href = '../index.html';
        }
    });

    // خروج
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => window.location.href = '../index.html');
        });
    }

    // مسح الحقول
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            ['courseTitle','courseVid','courseDesc','courseDuration','courseLevel'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        });
    }

    // حفظ فيديو
    if (addBtn) {
        addBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('courseTitle').value.trim();
            const videoUrl = document.getElementById('courseVid').value.trim();
            const desc = document.getElementById('courseDesc').value.trim();
            const duration = document.getElementById('courseDuration').value.trim();
            const level = document.getElementById('courseLevel').value.trim();
            const category = document.getElementById('courseCategory').value;
            const requiredCode = document.getElementById('courseRequiresCode')?.checked || false;

            const videoId = extractVideoID(videoUrl);

            if (!title || !videoId) {
                Swal.fire({ icon:'warning', title:'تنبيه', text:'الرابط غير صحيح! تأكد من نسخ رابط يوتيوب.' });
                return;
            }

            addBtn.textContent = "جارِ الحفظ...";
            addBtn.disabled = true;

            try {
                await addDoc(collection(db, "courses"), {
                    title,
                    description: desc,
                    videoId,
                    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    duration,
                    level,
                    category,
                    requiresCode: requiredCode,
                    createdAt: new Date()
                });

                Swal.fire({ icon:'success', title:'تم!', text:'تم حفظ الفيديو بنجاح ✅', timer:1500, showConfirmButton:false });
                ['courseTitle','courseVid','courseDesc','courseDuration','courseLevel'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
                loadVideos(db, collection, getDocs, listDiv);

            } catch (error) {
                console.error("Error:", error);
                Swal.fire({ icon:'error', title:'خطأ', text: error.message });
            } finally {
                addBtn.textContent = "حفظ الفيديو";
                addBtn.disabled = false;
            }
        });
    }

    // توليد الأكواد
    document.getElementById('generateCodesBtn')?.addEventListener('click', () => generateCodes(db, collection, getDocs, setDoc, doc));

    // نسخ الأكواد
    document.getElementById('copyCodesBtn')?.addEventListener('click', () => {
        const codesText = document.getElementById('generatedCodesList')?.textContent;
        if (codesText && codesText.trim()) {
            navigator.clipboard.writeText(codesText).then(() => {
                Swal.fire({ icon:'success', title:'تم النسخ!', text:'تم نسخ الأكواد للحافظة', timer:1500, showConfirmButton:false });
            });
        }
    });
}

// ===== توليد أكواد الاشتراك =====
async function generateCodes(db, collection, getDocs, setDoc, doc) {
    const countEl = document.getElementById('codesCount');
    const prefixEl = document.getElementById('codesPrefix');
    const listEl = document.getElementById('generatedCodesList');
    const btn = document.getElementById('generateCodesBtn');

    const count = parseInt(countEl?.value) || 10;
    const prefix = prefixEl?.value.trim() || 'LH';

    if (count < 1 || count > 200) {
        Swal.fire({ icon:'warning', title:'', text:'العدد يجب أن يكون بين 1 و 200' });
        return;
    }

    btn.textContent = "جارِ التوليد...";
    btn.disabled = true;

    try {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const random = Math.random().toString(36).substr(2,6).toUpperCase();
            const ts = Date.now().toString(36).toUpperCase().substr(-4);
            const code = `${prefix}-${random}${ts}`;
            codes.push(code);
        }

        // حفظ الأكواد في Firestore
        const savePromises = codes.map(code => 
            setDoc(doc(db, "subscriptionCodes", code), {
                code,
                active: true,
                createdAt: new Date(),
                usedBy: null,
                usedAt: null
            })
        );
        await Promise.all(savePromises);

        // عرض الأكواد
        if (listEl) {
            listEl.textContent = codes.join('\n');
            listEl.style.display = 'block';
        }
        document.getElementById('copyCodesBtn').style.display = 'inline-block';

        // تحديث الإحصائية
        loadCodesStats(db, collection, getDocs);

        Swal.fire({ 
            icon:'success', 
            title:`تم توليد ${count} كود!`, 
            text:'الأكواد محفوظة في Firestore ✅',
            timer:2000, showConfirmButton:false 
        });

    } catch (error) {
        console.error("Generate codes error:", error);
        Swal.fire({ icon:'error', title:'خطأ', text: error.message });
    } finally {
        btn.textContent = "توليد الأكواد";
        btn.disabled = false;
    }
}

// عرض إحصائيات الأكواد
async function loadCodesStats(db, collection, getDocs) {
    try {
        const snap = await getDocs(collection(db, "subscriptionCodes"));
        let total = 0, active = 0, used = 0;
        snap.forEach(d => {
            total++;
            if (d.data().active) active++; else used++;
        });
        const el = document.getElementById('codesStats');
        if (el) el.innerHTML = `
            <span style="color:#3fb950">✔ نشط: ${active}</span> | 
            <span style="color:#ef4444">✗ مستخدم: ${used}</span> | 
            <span>المجموع: ${total}</span>
        `;
    } catch(e) { /* silent */ }
}

// استخراج YouTube ID
function extractVideoID(url) {
    if (!url) return null;
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    var match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// عرض الفيديوهات
async function loadVideos(db, collection, getDocs, container) {
    if (!container) return;
    container.innerHTML = '<p style="color:#888">جارِ التحميل...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        container.innerHTML = "";

        if (querySnapshot.empty) {
            container.innerHTML = "<p style='color:#888'>لا توجد فيديوهات.</p>";
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const div = document.createElement('div');
            div.className = "course-row";
            div.innerHTML = `
                <div style="display:flex;gap:10px;align-items:center;flex:1;">
                    <img src="${data.thumbnail}" style="width:80px;height:45px;object-fit:cover;border-radius:6px;flex-shrink:0;">
                    <div>
                        <strong style="display:block;">${data.title}</strong>
                        <small style="color:#888;">${data.category || ''} ${data.requiresCode ? '🔒 يحتاج كود' : ''}</small>
                    </div>
                </div>
                <button onclick="deleteVideo('${docSnap.id}')" style="background:#ef4444;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;flex-shrink:0;">حذف</button>
            `;
            container.appendChild(div);
        });
    } catch(e) {
        container.innerHTML = `<p style="color:#ef4444">خطأ في التحميل: ${e.message}</p>`;
    }
}

window.deleteVideo = async function(id) {
    const result = await Swal.fire({
        title:'تأكيد الحذف', text:'هل تريد حذف هذا الفيديو؟',
        icon:'warning', showCancelButton:true,
        confirmButtonText:'حذف', cancelButtonText:'إلغاء',
        confirmButtonColor:'#ef4444'
    });
    if (!result.isConfirmed) return;
    const { db, deleteDoc, doc, collection, getDocs } = window.firebaseAuth;
    await deleteDoc(doc(db, "courses", id));
    const listDiv = document.getElementById('coursesList');
    loadVideos(db, collection, getDocs, listDiv);
};
