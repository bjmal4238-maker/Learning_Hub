/* scripts/admin.js
   Firestore-based admin CRUD for courses
   - Admin email validation against Firebase Auth
   - All data saved to Firestore "courses" collection
*/

(async function() {

    // Wait for Firebase to be ready
    while (!window.firebaseAuth) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const {
        db,
        auth,
        collection,
        addDoc,
        getDocs,
        updateDoc,
        deleteDoc,
        doc,
        query,
        orderBy,
        onAuthStateChanged,
        signOut,
        ADMIN_EMAIL
    } = window.firebaseAuth;

    let currentUser = null;
    let allCourses = [];

    // Check admin authorization
    onAuthStateChanged(auth, async(user) => {
        if (!user) {
            window.location.href = '../index.html';
            return;
        }

        currentUser = user;
        const userEmail = user.email;
        localStorage.setItem('userEmail', userEmail);

        // Check if user is admin
        if (userEmail !== ADMIN_EMAIL) {
            Swal.fire({
                icon: 'error',
                title: 'Unauthorized',
                text: `Only ${ADMIN_EMAIL} can access the admin panel.`,
                confirmButtonText: 'Back to Dashboard'
            }).then(() => {
                window.location.href = '../pages/dashboard.html';
            });
        }
    });

    // UI Helpers
    function uid() { return 'c_' + Math.random().toString(36).slice(2, 12); }

    function isValidYouTubeId(id) { return typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id); }

    function extractVideoId(val) {
        if (!val) return '';
        val = String(val).trim();
        if (/^[A-Za-z0-9_-]{11}$/.test(val)) return val;
        const m = val.match(/(?:v=|\/)([A-Za-z0-9_-]{11})/);
        return m ? m[1] : '';
    }

    function thumbnailFromId(id) { return id ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg` : ''; }

    function flash(msg, type = 'success') {
        const el = document.getElementById('courseMsg');
        if (el) {
            el.textContent = msg;
            el.style.color = type === 'success' ? '#8bd48b' : '#f88';
            setTimeout(() => el.textContent = '', 3500);
        }
    }

    // DOM Helpers
    const idInput = () => document.getElementById('courseId');
    const titleInput = () => document.getElementById('courseTitle');
    const descInput = () => document.getElementById('courseDesc');
    const vidInput = () => document.getElementById('courseVid');
    const durationInput = () => document.getElementById('courseDuration');
    const levelInput = () => document.getElementById('courseLevel');
    const categorySelect = () => document.getElementById('courseCategory');
    const coursesList = () => document.getElementById('coursesList');

    // Fetch all courses from Firestore
    async function fetchCoursesFromFirestore() {
        try {
            const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            allCourses = [];
            querySnapshot.forEach((docSnap) => {
                allCourses.push({
                    docId: docSnap.id,
                    ...docSnap.data()
                });
            });
            return allCourses;
        } catch (error) {
            console.error('Error fetching courses:', error);
            flash('Error loading courses', 'error');
            return [];
        }
    }

    // Render courses list
    async function renderCoursesList() {
        await fetchCoursesFromFirestore();
        const out = coursesList();
        if (!out) return;

        if (allCourses.length === 0) {
            out.innerHTML = '<div>لا توجد فيديوهات بعد.</div>';
            return;
        }

        out.innerHTML = '';
        allCourses.forEach(item => {
            const row = document.createElement('div');
            row.className = 'course-row';
            row.innerHTML = `
        <div style="display:flex;gap:12px;align-items:center">
          <img src="${item.thumbnail || thumbnailFromId(item.videoId || '')}" style="width:160px;height:90px;object-fit:cover;border-radius:8px" onerror="this.src='https://via.placeholder.com/160x90?text=No+Image'"/>
          <div style="flex:1">
            <div style="font-weight:600">${item.title}</div>
            <div style="font-size:13px;color:#aaa">${item.description || ''}</div>
            <div style="font-size:12px;color:#999;margin-top:6px">القسم: ${item.category || '-'} • المدة: ${item.duration || '-'} • المستوى: ${item.level || '-'}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="contact-btn" data-action="edit" data-id="${item.docId}" style="background:#f59e0b">تعديل</button>
          <button class="contact-btn" data-action="delete" data-id="${item.docId}" style="background:#ef4444">حذف</button>
        </div>
      `;
            out.appendChild(row);
        });

        out.querySelectorAll('button[data-action]').forEach(btn => {
            const action = btn.dataset.action;
            const docId = btn.dataset.id;
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (action === 'edit') startEditCourse(docId);
                if (action === 'delete') confirmDelete(docId);
            });
        });
    }

    // Load course for editing
    function startEditCourse(docId) {
        const item = allCourses.find(x => x.docId === docId);
        if (!item) {
            Swal.fire('خطأ', 'لم أجد هذا الكورس', 'error');
            return;
        }

        idInput().value = docId;
        titleInput().value = item.title || '';
        descInput().value = item.description || '';
        vidInput().value = item.videoId || '';
        durationInput().value = item.duration || '';
        levelInput().value = item.level || '';
        categorySelect().value = item.category || 'featured';
        flash('تم تحميل بيانات للتعديل', 'success');
    }

    // Confirm deletion
    function confirmDelete(docId) {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'هذا الإجراء سيحذف الكورس نهائياً.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم احذف',
            cancelButtonText: 'إلغاء'
        }).then(res => {
            if (res.isConfirmed) deleteCourse(docId);
        });
    }

    // Delete course from Firestore
    async function deleteCourse(docId) {
        try {
            await deleteDoc(doc(db, 'courses', docId));
            flash('تم الحذف', 'success');
            await renderCoursesList();
        } catch (error) {
            console.error('Delete error:', error);
            flash('خطأ في الحذف', 'error');
        }
    }

    // Save/Update course
    async function saveCourse() {
        const docId = idInput() ? .value || '';
        const title = titleInput() ? .value.trim() || '';

        if (!title) {
            flash('اكتب عنوان الفيديو', 'error');
            return;
        }

        let videoId = extractVideoId(vidInput() ? .value || '');
        let thumbnail = vidInput() ? .value.trim() ? (videoId ? thumbnailFromId(videoId) : '') : '';

        const payload = {
            title,
            description: descInput() ? .value.trim() || '',
            thumbnail,
            videoId,
            duration: durationInput() ? .value ? .trim() || '',
            level: levelInput() ? .value ? .trim() || '',
            category: categorySelect() ? .value || 'featured',
            createdAt: new Date(),
            updatedBy: currentUser ? .email
        };

        try {
            if (docId) {
                // Update existing document
                const courseDoc = doc(db, 'courses', docId);
                await updateDoc(courseDoc, {
                    ...payload,
                    updatedAt: new Date()
                });
                flash('تم التعديل', 'success');
            } else {
                // Add new document
                await addDoc(collection(db, 'courses'), payload);
                flash('تم الإضافة', 'success');
            }

            clearForm();
            await renderCoursesList();
        } catch (error) {
            console.error('Save error:', error);
            flash('خطأ في الحفظ', 'error');
        }
    }

    // Clear form
    function clearForm() {
        if (idInput()) idInput().value = '';
        if (titleInput()) titleInput().value = '';
        if (descInput()) descInput().value = '';
        if (vidInput()) vidInput().value = '';
        if (durationInput()) durationInput().value = '';
        if (levelInput()) levelInput().value = '';
        if (categorySelect()) categorySelect().value = 'featured';
    }

    // Initialize admin panel
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('addCourseBtn') ? .addEventListener('click', (e) => {
            e.preventDefault();
            saveCourse();
        });

        document.getElementById('clearCourseForm') ? .addEventListener('click', (e) => {
            e.preventDefault();
            clearForm();
            flash('تم التفريغ', 'success');
        });

        document.getElementById('logoutAdmin') ? .addEventListener('click', async() => {
            try {
                await signOut(auth);
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userId');
                window.location.href = '../index.html';
            } catch (error) {
                console.error('Logout error:', error);
            }
        });

        renderCoursesList();
    });

})();