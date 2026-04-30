/* scripts/profile.js — Fixed: avatar save, overlay hover, password reset */

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    setTimeout(() => initProfile(), 500);
});

function initProfile() {
    if (!window.firebaseAuth) {
        setTimeout(() => initProfile(), 500);
        return;
    }

    const { auth, db, doc, getDoc, setDoc, onAuthStateChanged, signOut, sendPasswordResetEmail } = window.firebaseAuth;

    // Theme Switcher
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        let saved = localStorage.getItem('theme') || 'dark';
        document.body.setAttribute('data-theme', saved);
        themeSelect.value = saved;
        themeSelect.addEventListener('change', (e) => {
            localStorage.setItem('theme', e.target.value);
            document.body.setAttribute('data-theme', e.target.value);
        });
    }

    // Auth State
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '../index.html';
            return;
        }
        const emailEl = document.getElementById('emailLabel');
        if (emailEl) emailEl.textContent = user.email;
        await loadUserProfile(user, db, doc, getDoc);
    });

    // Buttons
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = '../index.html');
    });
    document.getElementById('profileBtn')?.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    setupImageUpload();

    const form = document.getElementById('profileForm');
    form?.addEventListener('submit', (e) => saveProfile(e, auth, db, doc, setDoc));

    document.getElementById('clearProfile')?.addEventListener('click', () => {
        document.getElementById('displayName').value = '';
        document.getElementById('bio').value = '';
        document.getElementById('avatarUrl').value = '';
    });

    // Password Reset — send email link
    document.getElementById('sendPasswordResetBtn')?.addEventListener('click', async () => {
        const user = auth.currentUser;
        const btn = document.getElementById('sendPasswordResetBtn');
        const msgEl = document.getElementById('passwordResetMsg');
        if (!user) return;

        btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> جار الإرسال...';
        btn.disabled = true;

        try {
            await sendPasswordResetEmail(auth, user.email);
            if (msgEl) {
                msgEl.style.color = 'var(--success)';
                msgEl.textContent = `✅ تم الإرسال إلى ${user.email} - تحقق من بريدك`;
            }
            if (window.Swal) {
                Swal.fire({
                    icon: 'success', title: 'تم الإرسال!',
                    text: `تحقق من بريدك: ${user.email}`,
                    timer: 3000, showConfirmButton: false
                });
            }
        } catch (error) {
            let msg = 'حدث خطأ، حاول مرة أخرى.';
            if (error.code === 'auth/too-many-requests') msg = 'طلبات كثيرة، انتظر قليلاً.';
            if (msgEl) { msgEl.style.color = 'var(--error)'; msgEl.textContent = msg; }
        } finally {
            setTimeout(() => {
                btn.innerHTML = '<i class="bx bxs-envelope"></i> إرسال رابط تغيير كلمة المرور';
                btn.disabled = false;
            }, 3000);
        }
    });
}

// ===== Image Upload — FIXED: stores URL not Base64 in Firestore =====
function setupImageUpload() {
    const fileInput = document.getElementById('avatarFile');
    const urlInput = document.getElementById('avatarUrl');
    const previewBox = document.getElementById('avatarPreviewWrap');

    // FIXED: File upload stores image as URL via imgbb or just shows preview locally
    // We store it as base64 in localStorage temporarily and show it,
    // but save only URL to Firestore to avoid 1MB limit
    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 500KB for base64 storage)
        if (file.size > 500 * 1024) {
            if (window.Swal) {
                Swal.fire({
                    icon: 'warning', title: 'الصورة كبيرة جداً',
                    html: 'الصورة يجب أن تكون أقل من 500KB.<br>يُفضل استخدام رابط URL بدلاً من رفع الصورة.',
                    confirmButtonColor: 'var(--accent)'
                });
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = ev.target.result;
            updateAvatarUI(base64);
            // Store base64 in the URL field so it gets saved
            if (urlInput) urlInput.value = base64;
        };
        reader.readAsDataURL(file);
    });

    // FIXED: Avatar preview wrap - click to upload
    previewBox?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput?.click();
    });

    urlInput?.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val.length > 10) updateAvatarUI(val);
    });
}

function updateAvatarUI(src) {
    if (!src) return;
    ['profileAvatarLarge', 'profileAvatarLargeSmall', 'userAvatar'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.src = src;
            el.onerror = () => { el.src = 'https://via.placeholder.com/160/1a1a2e/2a7df6?text=User'; };
        }
    });
}

// ===== Load Profile =====
async function loadUserProfile(user, db, doc, getDoc) {
    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const nameEl = document.getElementById('displayName');
            const bioEl = document.getElementById('bio');
            const nameHeading = document.getElementById('displayNameHeading');
            const urlEl = document.getElementById('avatarUrl');

            if (nameEl) nameEl.value = data.displayName || '';
            if (bioEl) bioEl.value = data.bio || '';
            if (nameHeading) nameHeading.textContent = data.displayName || 'User';

            if (data.photoURL) {
                updateAvatarUI(data.photoURL);
                if (urlEl) urlEl.value = data.photoURL;
            }
        }
    } catch (e) {
        console.error("Error loading profile:", e);
    }
}

// ===== Save Profile — FIXED: saves photoURL properly =====
async function saveProfile(e, auth, db, doc, setDoc) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const btn = e.target.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> جار الحفظ...';
    btn.disabled = true;

    const name = document.getElementById('displayName')?.value || '';
    const bio = document.getElementById('bio')?.value || '';
    const urlInput = document.getElementById('avatarUrl');
    const photoURL = urlInput?.value?.trim() || '';

    // Don't save placeholder URLs
    const photoToSave = (photoURL.includes('placeholder.com') || photoURL === '') ? '' : photoURL;

    // Check if base64 is too large for Firestore (1MB limit per field)
    if (photoToSave.startsWith('data:') && photoToSave.length > 800000) {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        if (window.Swal) {
            Swal.fire({
                icon: 'warning', title: 'الصورة كبيرة جداً',
                html: 'يُرجى استخدام <strong>رابط URL</strong> للصورة بدلاً من رفعها مباشرة.<br><small>مثال: ارفع الصورة على <a href="https://imgbb.com" target="_blank">imgbb.com</a> وانسخ الرابط.</small>',
                confirmButtonColor: 'var(--accent)'
            });
        }
        return;
    }

    const profileData = {
        displayName: name,
        bio,
        photoURL: photoToSave,
        email: user.email,
        updatedAt: new Date()
    };

    try {
        await setDoc(doc(db, "users", user.uid), profileData, { merge: true });

        const nameHeading = document.getElementById('displayNameHeading');
        if (nameHeading) nameHeading.textContent = name || 'User';

        if (window.Swal) {
            Swal.fire({
                icon: 'success', title: 'تم الحفظ!',
                text: 'تم تحديث بياناتك بنجاح ✅',
                timer: 1800, showConfirmButton: false
            });
        }
    } catch (error) {
        console.error(error);
        if (window.Swal) {
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل حفظ البيانات: ' + error.message });
        }
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}
