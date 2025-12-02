/* scripts/auth.js
   Firebase Authentication Logic
   Handles Login & Register with proper redirects
*/

// التأكد من تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    
    // ننتظر ثانية للتأكد من تحميل ملف الكونفيج
    setTimeout(() => initAuth(), 500);

    // تفعيل التبديل بين الفورم (Login / Register)
    setupFormToggles();
});

function initAuth() {
    // التأكد من أن مكتبة الفايربيز موجودة
    if (!window.firebaseAuth) {
        console.error("Firebase not loaded yet.");
        return;
    }

    const { 
        auth, 
        signInWithEmailAndPassword, 
        createUserWithEmailAndPassword, 
        ADMIN_EMAIL 
    } = window.firebaseAuth;

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // -----------------------------------------
    // 1. منطق تسجيل الدخول (Login)
    // -----------------------------------------
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginUsername').value.trim(); // المستخدم قد يكتب ايميل هنا
            const pass = document.getElementById('loginPassword').value;
            const btn = loginForm.querySelector('button');

            if (!email || !pass) {
                alert("الرجاء إدخال الإيميل وكلمة المرور");
                return;
            }

            // تغيير الزر لـ "جار التحميل"
            const originalBtnText = btn.textContent;
            btn.textContent = "Checking...";
            btn.disabled = true;

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, pass);
                const user = userCredential.user;

                // التوجيه حسب نوع المستخدم
                if (user.email === ADMIN_EMAIL) {
                    window.location.href = './pages/admin.html';
                } else {
                    window.location.href = './pages/dashboard.html';
                }

            } catch (error) {
                console.error(error);
                let msg = "خطأ في تسجيل الدخول.";
                if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
                    msg = "الإيميل أو كلمة المرور غير صحيحة.";
                } else if (error.code === 'auth/wrong-password') {
                    msg = "كلمة المرور غير صحيحة.";
                }
                alert(msg);
                btn.textContent = originalBtnText;
                btn.disabled = false;
            }
        });
    }

    // -----------------------------------------
    // 2. منطق إنشاء حساب جديد (Register)
    // -----------------------------------------
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('regEmail').value.trim();
            const pass = document.getElementById('regPassword').value;
            // const name = document.getElementById('regUsername').value; // يمكن حفظ الاسم لاحقاً في البروفايل
            const btn = registerForm.querySelector('button');

            if (!email || !pass) {
                alert("الرجاء ملء جميع البيانات");
                return;
            }

            if (pass.length < 6) {
                alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
                return;
            }

            btn.textContent = "Creating...";
            btn.disabled = true;

            try {
                // إنشاء الحساب في فايربيز
                await createUserWithEmailAndPassword(auth, email, pass);
                
                alert("تم إنشاء الحساب بنجاح! 🎉");
                
                // === هنا التعديل اللي طلبته ===
                // التوجيه للداش بورد مباشرة بدل البروفايل
                window.location.href = './pages/dashboard.html'; 

            } catch (error) {
                console.error(error);
                let msg = "حدث خطأ أثناء الإنشاء.";
                if (error.code === 'auth/email-already-in-use') {
                    msg = "هذا الإيميل مستخدم بالفعل.";
                } else if (error.code === 'auth/weak-password') {
                    msg = "كلمة المرور ضعيفة جداً.";
                }
                alert(msg);
                btn.textContent = "Create Account";
                btn.disabled = false;
            }
        });
    }
}

// دالة بسيطة للتبديل بين تسجيل الدخول وإنشاء الحساب
function setupFormToggles() {
    const toggles = document.querySelectorAll('.toggle-form-link');
    toggles.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetForm = link.getAttribute('data-form'); // 'login' or 'register'
            
            document.querySelectorAll('.form-section').forEach(sec => {
                sec.classList.remove('active');
                sec.style.position = 'absolute';
                sec.style.opacity = '0';
                sec.style.visibility = 'hidden';
            });

            const activeSec = document.querySelector(`.${targetForm}-section`);
            if (activeSec) {
                activeSec.classList.add('active');
                activeSec.style.position = 'relative';
                activeSec.style.opacity = '1';
                activeSec.style.visibility = 'visible';
            }
        });
    });
}
