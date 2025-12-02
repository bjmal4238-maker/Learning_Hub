/* scripts/profile.js
   Firebase-based profile editor
   - Uses Firebase Auth for user info
   - Stores profile data in Firestore (profiles collection)
*/

(async function() {

    // Wait for Firebase to be ready
    while (!window.firebaseAuth) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const {
        auth,
        db,
        collection,
        addDoc,
        getDocs,
        updateDoc,
        doc,
        query,
        orderBy,
        onAuthStateChanged,
        signOut
    } = window.firebaseAuth;

    const PLACEHOLDER = 'https://via.placeholder.com/160';
    const KEY_AVATAR = 'lh_profile_avatar';
    const KEY_NAME = 'lh_profile_name';
    const KEY_BIO = 'lh_profile_bio';

    let currentUser = null;
    let userProfile = null;

    // Check authentication
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = '../index.html';
            return;
        }
        currentUser = user;
        const userEmail = user.email;
        localStorage.setItem('userEmail', userEmail);
        localStorage.setItem('userId', user.uid);
        loadProfile();
    });

    // DOM helpers
    const $ = id => document.getElementById(id);
    const profileForm = $('profileForm');
    const displayNameInput = $('displayName');
    const avatarUrlInput = $('avatarUrl');
    const bioInput = $('bio');
    const profileAvatarLarge = $('profileAvatarLarge');
    const profileAvatarLargeSmall = $('profileAvatarLargeSmall');
    const displayNameHeading = $('displayNameHeading');
    const usernameLabel = $('usernameLabel');
    const clearProfileBtn = $('clearProfile');
    const profileBtn = $('profileBtn');
    const logoutBtn = $('logoutBtn');
    const userAvatarHeader = $('userAvatar');
    const avatarFileInput = $('avatarFile');
    const avatarPreviewWrap = $('avatarPreviewWrap');
    const themeSelect = $('themeSelect');

    // Safe image setter
    function safeSet(el, url) {
        if (!el) return;
        el.onerror = null;
        el.src = url || PLACEHOLDER;
        el.onerror = () => { el.onerror = null;
            el.src = PLACEHOLDER; };
    }

    // Fetch user profile from Firestore
    async function fetchProfileFromFirestore() {
        if (!currentUser) return null;
        try {
            const q = query(collection(db, `users/${currentUser.uid}/profiles`));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { docId: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    }

    // Read profile (localStorage + Firebase)
    function readLocal() {
        return {
            name: localStorage.getItem(KEY_NAME) || (currentUser ? .displayName || 'User'),
            avatar: localStorage.getItem(KEY_AVATAR) || PLACEHOLDER,
            bio: localStorage.getItem(KEY_BIO) || ''
        };
    }

    // Apply profile to UI
    function applyUI(name, avatar, bio) {
        const displayName = name || (currentUser ? .email || 'guest');
        if (displayNameHeading) displayNameHeading.textContent = displayName;
        if (usernameLabel) usernameLabel.textContent = `@${currentUser?.email?.split('@')[0] || 'user'}`;
        safeSet(profileAvatarLarge, avatar);
        safeSet(profileAvatarLargeSmall, avatar);
        if (userAvatarHeader) safeSet(userAvatarHeader, avatar);
    }

    // Load profile from localStorage initially
    function loadProfile() {
        const local = readLocal();
        if (displayNameInput) displayNameInput.value = local.name;
        if (avatarUrlInput) avatarUrlInput.value = local.avatar;
        if (bioInput) bioInput.value = local.bio;
        applyUI(local.name, local.avatar, local.bio);
    }

    // Handle file upload
    function handleFileUpload(file) {
        if (!file) return;
        if (!file.type || !file.type.startsWith('image/')) {
            Swal.fire({ icon: 'error', title: 'Please upload an image file.' });
            return;
        }
        const r = new FileReader();
        r.onload = e => {
            const url = e.target.result;
            if (avatarUrlInput) avatarUrlInput.value = url;
            applyUI((displayNameInput && displayNameInput.value) || 'User', url, (bioInput && bioInput.value) || '');
        };
        r.readAsDataURL(file);
    }

    // Save profile to localStorage + Firestore
    async function saveProfile(e) {
        if (e && e.preventDefault) e.preventDefault();

        const name = (displayNameInput && displayNameInput.value.trim()) || 'User';
        const avatar = (avatarUrlInput && avatarUrlInput.value.trim()) || PLACEHOLDER;
        const bio = (bioInput && bioInput.value.trim()) || '';

        try {
            // Save to localStorage
            localStorage.setItem(KEY_NAME, name);
            localStorage.setItem(KEY_AVATAR, avatar);
            localStorage.setItem(KEY_BIO, bio);

            // Save to Firestore (optional - for persistence across devices)
            if (currentUser) {
                try {
                    const profileRef = collection(db, `users/${currentUser.uid}/profiles`);
                    const existingProfiles = await getDocs(profileRef);

                    const profileData = {
                        displayName: name,
                        avatar,
                        bio,
                        email: currentUser.email,
                        updatedAt: new Date()
                    };

                    if (!existingProfiles.empty) {
                        // Update existing profile
                        const docId = existingProfiles.docs[0].id;
                        await updateDoc(doc(db, `users/${currentUser.uid}/profiles`, docId), profileData);
                    } else {
                        // Create new profile
                        await addDoc(profileRef, profileData);
                    }
                } catch (firestoreError) {
                    console.warn('Firestore profile save failed (non-critical):', firestoreError);
                }
            }

            applyUI(name, avatar, bio);
            Swal.fire({
                toast: true,
                position: 'bottom-end',
                icon: 'success',
                title: 'Saved locally',
                showConfirmButton: false,
                timer: 1200
            });
            window.dispatchEvent(new CustomEvent('avatarChanged', { detail: { avatarUrl: avatar } }));
        } catch (e) {
            console.error('Save error:', e);
            Swal.fire({ icon: 'error', title: 'Error saving profile' });
        }
    }

    // Clear profile
    function clearProfile() {
        try {
            localStorage.removeItem(KEY_NAME);
            localStorage.removeItem(KEY_AVATAR);
            localStorage.removeItem(KEY_BIO);
        } catch (e) {}
        loadProfile();
        Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: 'success',
            title: 'Profile reset',
            showConfirmButton: false,
            timer: 1200
        });
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        loadProfile();

        if (avatarPreviewWrap && avatarFileInput) {
            avatarPreviewWrap.addEventListener('click', () => avatarFileInput.click());
        }
        if (avatarFileInput) {
            avatarFileInput.addEventListener('change', ev => {
                const f = ev.target.files && ev.target.files[0];
                if (f) handleFileUpload(f);
            });
        }
        if (avatarUrlInput) {
            avatarUrlInput.addEventListener('input', e => {
                applyUI(
                    (displayNameInput && displayNameInput.value) || 'User',
                    e.target.value.trim() || PLACEHOLDER,
                    (bioInput && bioInput.value) || ''
                );
            });
        }
        if (profileForm) profileForm.addEventListener('submit', saveProfile);
        if (clearProfileBtn) clearProfileBtn.addEventListener('click', clearProfile);
        if (profileBtn) profileBtn.addEventListener('click', () => {
            window.location.href = './dashboard.html';
        });
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async() => {
                try {
                    await signOut(auth);
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('userId');
                    window.location.href = '../index.html';
                } catch (error) {
                    console.error('Logout error:', error);
                }
            });
        }

        if (themeSelect) {
            const t = localStorage.getItem('theme') || 'dark';
            document.body.setAttribute('data-theme', t);
            themeSelect.value = t;
            themeSelect.addEventListener('change', e => {
                const v = e.target.value;
                localStorage.setItem('theme', v);
                document.body.setAttribute('data-theme', v);
            });
        }

        window.addEventListener('storage', (e) => {
            if ([KEY_AVATAR, KEY_NAME, KEY_BIO].includes(e.key)) {
                const local = readLocal();
                if (displayNameInput) displayNameInput.value = local.name;
                if (avatarUrlInput) avatarUrlInput.value = local.avatar;
                if (bioInput) bioInput.value = local.bio;
                applyUI(local.name, local.avatar, local.bio);
            }
        });

        window.addEventListener('avatarChanged', ev => {
            const url = ev ? .detail ? .avatarUrl || localStorage.getItem(KEY_AVATAR) || PLACEHOLDER;
            safeSet(profileAvatarLarge, url);
            safeSet(profileAvatarLargeSmall, url);
            if (userAvatarHeader) safeSet(userAvatarHeader, url);
        });
    });

})();