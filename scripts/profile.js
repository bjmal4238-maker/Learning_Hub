/* scripts/profile.js
   Handles Profile UI, Image Upload, and Firebase Sync
*/

document.addEventListener('DOMContentLoaded', () => {
    // انتظار تحميل مكتبة الفايربيز
    setTimeout(() => initProfile(), 500);
});

function initProfile() {
    // 1. التأكد من الفايربيز
    if (!window.firebaseAuth) {
        console.error("Firebase not loaded!");
        return;
    }

    const { auth, db, doc, getDoc, setDoc, onAuthStateChanged, signOut } = window.firebaseAuth;
    const PLACEHOLDER = 'https://via.placeholder.com/160';

    // 2. إعدادات الثيم (أسود / بيج فقط)
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        // إزالة الأبيض إن وجد
        const lightOpt = themeSelect.querySelector('option[value="light"]');
        if(lightOpt) lightOpt.remove();

        let savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') savedTheme = 'dark'; // تصحيح الخطأ القديم

        document.body.setAttribute('data-theme', savedTheme);
        themeSelect.value = savedTheme;

        themeSelect.addEventListener('change', (e) => {
            const v = e.target.value;
            localStorage.setItem('theme', v);
            document.body.setAttribute('data-theme', v);
        });
    }

    // 3. مراقبة المستخدم الحالي
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '../index.html'; // لو مش مسجل، اطرده
            return;
        }

        // عرض الايميل فوراً
        document.getElementById('emailLabel').textContent = user.email;
        
        // محاولة جلب بيانات البروفايل من الفايربيز
        await loadUserProfile(user, db);
    });

    // 4. أزرار الخروج والعودة
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = '../index.html');
    });
    document.getElementById('profileBtn')?.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    // 5. منطق رفع الصورة والمعاينة
    setupImageUpload();

    // 6. زر الحفظ
    const form = document.getElementById('profileForm');
    form?.addEventListener('submit', (e) => saveProfile(e, auth, db));
}

// دالة رفع ومعاينة الصورة
function setupImageUpload() {
    const fileInput = document.getElementById('avatarFile');
    const urlInput = document.getElementById('avatarUrl');
    const previewBox = document.getElementById('avatarPreviewWrap');
    
    // عند اختيار ملف
    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                updateAvatarUI(ev.target.result); // تحديث الصور فوراً
                // تفريغ حقل الرابط لأنه اختار ملف
                if(urlInput) urlInput.value = ''; 
            };
            reader.readAsDataURL(file);
        }
    });

    // عند الضغط على مربع الصورة -> فتح اختيار الملفات
    previewBox?.addEventListener('click', () => fileInput.click());

    // عند كتابة رابط صورة
    urlInput?.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.length > 5) updateAvatarUI(val);
    });
}

// تحديث كل صور الصفحة (الكبيرة والصغيرة وفي الهيدر)
function updateAvatarUI(src) {
    if (!src) return;
    document.getElementById('profileAvatarLarge').src = src;
    document.getElementById('profileAvatarLargeSmall').src = src;
    document.getElementById('userAvatar').src = src;
}

// جلب البيانات من الداتابيز
async function loadUserProfile(user, db) {
    try {
        const docRef = window.firebaseAuth.doc(db, "users", user.uid);
        const docSnap = await window.firebaseAuth.getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // ملء الحقول
            document.getElementById('displayName').value = data.displayName || '';
            document.getElementById('bio').value = data.bio || '';
            document.getElementById('displayNameHeading').textContent = data.displayName || 'User';
            
            if (data.photoURL) {
                updateAvatarUI(data.photoURL);
                document.getElementById('avatarUrl').value = data.photoURL; // لو رابط
            }
        }
    } catch (e) {
        console.error("Error loading profile:", e);
    }
}

// حفظ البيانات
async function saveProfile(e, auth, db) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const btn = e.target.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = "Saving...";
    btn.disabled = true;

    // الصورة الحالية المعروضة
    const currentPhoto = document.getElementById('profileAvatarLarge').src;
    const name = document.getElementById('displayName').value;
    const bio = document.getElementById('bio').value;

    const profileData = {
        displayName: name,
        bio: bio,
        photoURL: currentPhoto, // ملاحظة: هنا بنحفظ الرابط أو الـ Base64
        email: user.email
    };

    try {
        // الحفظ في كوليكشن users برقم المستخدم
        await window.firebaseAuth.setDoc(window.firebaseAuth.doc(db, "users", user.uid), profileData);
        
        document.getElementById('displayNameHeading').textContent = name || 'User';
        
        Swal.fire({
            icon: 'success',
            title: 'Saved!',
            text: 'Profile updated successfully',
            timer: 1500,
            showConfirmButton: false
        });

    } catch (error) {
        console.error(error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save profile' });
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}
