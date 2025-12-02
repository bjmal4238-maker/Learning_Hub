/* 
 * scripts/auth.js
 * Firebase Authentication with Email/Password
 * Replaces localStorage authentication
 */

(async function() {

    // Wait for Firebase to be ready
    while (!window.firebaseAuth) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const {
        auth,
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword
    } = window.firebaseAuth;

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const themeSelect = document.getElementById('themeSelect');

    // --- image-grid behavior (populate overlays & hover blur) ---
    function initImageGrid() {
        const grid = document.querySelector('.brand-features .image-grid');
        if (!grid) return;

        const cards = Array.from(grid.querySelectorAll('.img-card'));

        // populate overlay from data- attributes
        cards.forEach(card => {
            const name = card.dataset.name || '';
            const id = card.dataset.id || '';
            const titleEl = card.querySelector('.overlay .title');
            const idEl = card.querySelector('.overlay .id');
            if (titleEl) titleEl.textContent = name;
            if (idEl) idEl.textContent = id;

            // mouseenter/mouseleave
            card.addEventListener('mouseenter', () => setActiveCard(card, cards));
            card.addEventListener('mouseleave', () => clearActive(cards));

            // focus/blur for keyboard
            card.addEventListener('focus', () => setActiveCard(card, cards));
            card.addEventListener('blur', () => clearActive(cards));

            // click: for accessibility - toggle (optional)
            card.addEventListener('click', (e) => {
                e.preventDefault();
                setActiveCard(card, cards);
                setTimeout(() => clearActive(cards), 2000);
            });
        });

        function setActiveCard(active, all) {
            all.forEach(c => {
                if (c === active) {
                    c.classList.add('is-active');
                    c.classList.remove('blurred');
                } else {
                    c.classList.add('blurred');
                    c.classList.remove('is-active');
                }
            });
        }

        function clearActive(all) {
            all.forEach(c => { c.classList.remove('is-active', 'blurred'); });
        }
    }

    // Small UI helpers (modals)
    function showSuccess(text) {
        const el = document.getElementById('successMessage');
        const modal = document.getElementById('successModal');
        if (el && modal) {
            el.textContent = text;
            modal.classList.add('show');
            setTimeout(() => modal.classList.remove('show'), 1800);
        } else alert(text);
    }

    function showError(text) {
        const el = document.getElementById('errorMessage');
        const modal = document.getElementById('errorModal');
        if (el && modal) {
            el.textContent = text;
            modal.classList.add('show');
            setTimeout(() => modal.classList.remove('show'), 2500);
        } else alert(text);
    }

    // Theme toggle
    (function initTheme() {
        const saved = localStorage.getItem('theme') || 'dark';
        document.body.setAttribute('data-theme', saved);
        if (themeSelect) themeSelect.value = saved;
        themeSelect.addEventListener('change', (e) => {
            const v = e.target.value;
            localStorage.setItem('theme', v);
            document.body.setAttribute('data-theme', v);
        })
    })();

    // Toggle forms links
    document.querySelectorAll('.toggle-form-link').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const form = a.dataset.form;
            document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
            document.querySelector(`.${form}-section`).classList.add('active');
        });
    });

    // Register handler - Firebase Authentication
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;

        if (!username || !email || !password) {
            showError('من فضلك املأ كل الحقول');
            return;
        }
        if (password.length < 6) {
            showError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        try {
            // Create user with Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store user display name and other info in localStorage temporarily
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userName', username);
            localStorage.setItem('userId', user.uid);
            localStorage.setItem('theme', localStorage.getItem('theme') || 'dark');

            showSuccess('تم إنشاء الحساب بنجاح! جارٍ التحويل...');
            registerForm.reset();

            setTimeout(() => {
                // Redirect to profile page after registration
                window.location.href = './pages/profile.html';
            }, 1500);

        } catch (error) {
            console.error('Registration error:', error);
            let errorMsg = 'حدث خطأ أثناء الإنشاء';

            if (error.code === 'auth/email-already-in-use') {
                errorMsg = 'هذا البريد الإلكتروني مسجل بالفعل';
            } else if (error.code === 'auth/invalid-email') {
                errorMsg = 'البريد الإلكتروني غير صحيح';
            } else if (error.code === 'auth/weak-password') {
                errorMsg = 'كلمة المرور ضعيفة جداً';
            } else if (error.message) {
                errorMsg = error.message;
            }

            showError(errorMsg);
        }
    });

    // Login handler - Firebase Authentication
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            showError('أدخل البريد الإلكتروني وكلمة المرور');
            return;
        }

        try {
            // Sign in with Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store user info in localStorage
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userId', user.uid);
            localStorage.setItem('theme', localStorage.getItem('theme') || 'dark');

            showSuccess('مرحباً! جارٍ التحويل إلى لوحة التحكم...');
            loginForm.reset();

            setTimeout(() => {
                window.location.href = './pages/dashboard.html';
            }, 1000);

        } catch (error) {
            console.error('Login error:', error);
            let errorMsg = 'خطأ في البريد الإلكتروني أو كلمة المرور';

            if (error.code === 'auth/user-not-found') {
                errorMsg = 'المستخدم غير موجود';
            } else if (error.code === 'auth/wrong-password') {
                errorMsg = 'كلمة المرور خاطئة';
            } else if (error.code === 'auth/invalid-email') {
                errorMsg = 'البريد الإلكتروني غير صحيح';
            } else if (error.message) {
                errorMsg = error.message;
            }

            showError(errorMsg);
        }
    });

    // Close modals on click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('show');
        });
    });

    // Initialize after DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        initImageGrid();
    });

})();