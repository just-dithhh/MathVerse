/* script.js - Interactive Engine for MathVerse */

// ==========================================
// 1. FIREBASE CONFIGURATION & INITIALIZATION
// Connected to: MathVerse Education (mathverse-edu-2026)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBfP5D3Z-Jom4RJjgymGZ_9pxhQQoHdQR8",
  authDomain: "mathverse-edu-2026.firebaseapp.com",
  projectId: "mathverse-edu-2026",
  storageBucket: "mathverse-edu-2026.firebasestorage.app",
  messagingSenderId: "677484632336",
  appId: "1:677484632336:web:0690bd43236be86ff86d95"
};

let isFirebaseReady = false;
let auth = null;
let db = null;

try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    try {
      db = firebase.firestore();
    } catch (fsErr) {
      console.warn("Firestore initialization fallback:", fsErr);
    }
    isFirebaseReady = true;
    console.log("Firebase initialized successfully with project MathVerse Education (mathverse-edu-2026).");
  }
} catch (e) {
  console.warn("Firebase initialization fallback mode active.", e);
  isFirebaseReady = false;
}


// ==========================================
// 2. SLIDE NAVIGATION SYSTEM (SPA VIEWS)
// ==========================================
const navSlideLinks = document.querySelectorAll(".nav-slide-link");
const viewSections = document.querySelectorAll(".view-section");

const SLIDE_ORDER = ["slideHome", "slideMateri", "slideLatihan", "slideRiwayat", "slideMinigame", "slideAbout"];

let currentSlideId = "slideHome";
let isSlideTransitioning = false;

function switchSectionSlide(targetSlideId) {
  if (!targetSlideId || isSlideTransitioning) return;
  if (targetSlideId === currentSlideId && document.getElementById(targetSlideId)?.classList.contains("active-slide")) return;

  const currentIndex = SLIDE_ORDER.indexOf(currentSlideId);
  const targetIndex = SLIDE_ORDER.indexOf(targetSlideId);

  const direction = (targetIndex >= currentIndex) ? "forward" : "backward";
  const currentSection = document.getElementById(currentSlideId);
  const targetSection = document.getElementById(targetSlideId);

  isSlideTransitioning = true;

  const updateDOM = () => {
    viewSections.forEach(section => {
      section.classList.remove("active-slide");
      section.classList.add("hidden-slide");
    });

    if (targetSection) {
      targetSection.classList.remove("hidden-slide");
      targetSection.classList.add("active-slide");
    }

    navSlideLinks.forEach(link => {
      if (link.getAttribute("data-target-slide") === targetSlideId) {
        link.classList.add("active-nav");
      } else {
        link.classList.remove("active-nav");
      }
    });

    if (typeof closeMobileMenu === "function") closeMobileMenu();

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (window.MathJax && MathJax.typesetPromise && targetSection) {
      MathJax.typesetPromise([targetSection]).catch(err => console.log(err));
    }

    // Trigger hooks for specific slides
    if (targetSlideId === "slideRiwayat") {
      loadHistoryFromFirestore();
    } else if (targetSlideId === "slideMinigame") {
      initPlatformerCanvas();
    }

    currentSlideId = targetSlideId;
    isSlideTransitioning = false;
  };

  updateDOM();
}

navSlideLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const slideId = link.getAttribute("data-target-slide");
    if (slideId) switchSectionSlide(slideId);
  });
});

const brandLogoBtn = document.getElementById("brandLogoBtn");
if (brandLogoBtn) {
  brandLogoBtn.addEventListener("click", (e) => {
    e.preventDefault();
    switchSectionSlide("slideHome");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("keydown", (e) => {
    const activeEl = document.activeElement;
    const isTyping = activeEl && (
      activeEl.tagName === "INPUT" ||
      activeEl.tagName === "TEXTAREA" ||
      activeEl.tagName === "SELECT" ||
      activeEl.isContentEditable
    );

    const openModals = document.querySelectorAll(".fixed.inset-0:not(.hidden)");
    if (isTyping || openModals.length > 0) return;

    if (e.key === "ArrowRight") {
      const idx = SLIDE_ORDER.indexOf(currentSlideId);
      if (idx < SLIDE_ORDER.length - 1) {
        e.preventDefault();
        switchSectionSlide(SLIDE_ORDER[idx + 1]);
      }
    } else if (e.key === "ArrowLeft") {
      const idx = SLIDE_ORDER.indexOf(currentSlideId);
      if (idx > 0) {
        e.preventDefault();
        switchSectionSlide(SLIDE_ORDER[idx - 1]);
      }
    }
  });
});


// ==========================================
// 3. THEME & DARK/LIGHT MODE TOGGLE
// ==========================================
const darkModeToggleBtn = document.getElementById("darkModeToggle");
const themeIcon = document.getElementById("themeIcon");

function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add("dark");
    if (themeIcon) themeIcon.className = "fa-solid fa-sun text-base";
  } else {
    document.documentElement.classList.remove("dark");
    if (themeIcon) themeIcon.className = "fa-solid fa-moon text-base";
  }
}

if (darkModeToggleBtn) {
  darkModeToggleBtn.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    if (isDark) {
      if (themeIcon) themeIcon.className = "fa-solid fa-sun text-base";
      localStorage.setItem("theme", "dark");
    } else {
      if (themeIcon) themeIcon.className = "fa-solid fa-moon text-base";
      localStorage.setItem("theme", "light");
    }
  });
}
initTheme();


// ==========================================
// 4. MOBILE MENU HAMBURGER DRAWER
// ==========================================
const btnMobileMenu = document.getElementById("btnMobileMenu");
const btnCloseMobileMenu = document.getElementById("btnCloseMobileMenu");
const mobileBackdrop = document.getElementById("mobileBackdrop");
const mobileDrawer = document.getElementById("mobileDrawer");

function openMobileMenu() {
  if (!mobileBackdrop || !mobileDrawer) return;
  mobileBackdrop.classList.remove("hidden");
  setTimeout(() => {
    mobileBackdrop.classList.remove("opacity-0");
    mobileDrawer.classList.remove("translate-x-full");
  }, 10);
}

function closeMobileMenu() {
  if (!mobileBackdrop || !mobileDrawer) return;
  mobileDrawer.classList.add("translate-x-full");
  mobileBackdrop.classList.add("opacity-0");
  setTimeout(() => {
    mobileBackdrop.classList.add("hidden");
  }, 300);
}

if (btnMobileMenu) btnMobileMenu.addEventListener("click", openMobileMenu);
const btnBottomNavMenu = document.getElementById("btnBottomNavMenu");
if (btnBottomNavMenu) btnBottomNavMenu.addEventListener("click", openMobileMenu);
if (btnCloseMobileMenu) btnCloseMobileMenu.addEventListener("click", closeMobileMenu);
if (mobileBackdrop) {
  mobileBackdrop.addEventListener("click", (e) => {
    if (e.target === mobileBackdrop) closeMobileMenu();
  });
}


// ==========================================
// 5. AUTH MODAL & USER STATE MANAGEMENT
// ==========================================
const btnOpenAuth = document.getElementById("btnOpenAuth");
const btnCloseAuthModal = document.getElementById("btnCloseAuthModal");
const authModal = document.getElementById("authModal");

const tabAuthLogin = document.getElementById("tabAuthLogin");
const tabAuthRegister = document.getElementById("tabAuthRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const btnLoginSubmit = document.getElementById("btnLoginSubmit");
const btnRegSubmit = document.getElementById("btnRegSubmit");

const authErrorMessage = document.getElementById("authErrorMessage");
const authErrorText = document.getElementById("authErrorText");
const authNoticeMessage = document.getElementById("authNoticeMessage");
const authNoticeText = document.getElementById("authNoticeText");
const authSuccessMessage = document.getElementById("authSuccessMessage");
const authSuccessText = document.getElementById("authSuccessText");

const loggedOutView = document.getElementById("loggedOutView");
const loggedInView = document.getElementById("loggedInView");
const userDisplayName = document.getElementById("userDisplayName");
const btnLogout = document.getElementById("btnLogout");
const heroUserGreeting = document.getElementById("heroUserGreeting");

const latihanAuthBanner = document.getElementById("latihanAuthBanner");
const btnLatihanLoginPrompt = document.getElementById("btnLatihanLoginPrompt");

function clearAuthMessages() {
  if (authErrorMessage) authErrorMessage.classList.add("hidden");
  if (authNoticeMessage) authNoticeMessage.classList.add("hidden");
  if (authSuccessMessage) authSuccessMessage.classList.add("hidden");
}

function showAuthError(message) {
  clearAuthMessages();
  if (authErrorMessage && authErrorText) {
    authErrorText.textContent = message;
    authErrorMessage.classList.remove("hidden");
  }
}

function showAuthNotice(message) {
  clearAuthMessages();
  if (authNoticeMessage && authNoticeText) {
    authNoticeText.textContent = message;
    authNoticeMessage.classList.remove("hidden");
  }
}

function showAuthSuccess(message) {
  clearAuthMessages();
  if (authSuccessMessage && authSuccessText) {
    authSuccessText.textContent = message;
    authSuccessMessage.classList.remove("hidden");
  }
}

function getAuthErrorMessage(err) {
  if (!err) return "Terjadi kesalahan tidak terduga. Silakan coba kembali.";
  const code = err.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "Format alamat email tidak valid.";
    case "auth/user-disabled":
      return "Akun pengguna ini telah dinonaktifkan oleh administrator.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email atau password yang Anda masukkan salah. Silakan coba lagi.";
    case "auth/email-already-in-use":
      return "Alamat email ini sudah terdaftar. Silakan beralih ke tab 'Masuk Akun'.";
    case "auth/weak-password":
      return "Password terlalu sederhana. Gunakan minimal 6 karakter kombinasi.";
    case "auth/operation-not-allowed":
      return "Layanan pendaftaran akun saat ini belum dibuka.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan gagal. Silakan tunggu beberapa menit sebelum mencoba lagi.";
    case "auth/network-request-failed":
      return "Koneksi terputus. Pastikan perangkat Anda terhubung ke internet.";
    default:
      return err.message || "Gagal memproses autentikasi. Silakan periksa kembali formulir Anda.";
  }
}

function openAuthModal(noticeMessage = null) {
  if (!authModal) return;
  clearAuthMessages();
  if (noticeMessage) {
    showAuthNotice(noticeMessage);
  }
  authModal.classList.remove("hidden");
  setTimeout(() => authModal.classList.remove("opacity-0"), 10);
}

function closeAuthModal() {
  if (!authModal) return;
  authModal.classList.add("opacity-0");
  setTimeout(() => {
    authModal.classList.add("hidden");
    clearAuthMessages();
  }, 250);
}

if (btnOpenAuth) btnOpenAuth.addEventListener("click", () => openAuthModal());
if (btnCloseAuthModal) btnCloseAuthModal.addEventListener("click", closeAuthModal);

// Close modal when clicking on outer backdrop
if (authModal) {
  authModal.addEventListener("click", (e) => {
    if (e.target === authModal) closeAuthModal();
  });
}

if (tabAuthLogin && tabAuthRegister) {
  tabAuthLogin.addEventListener("click", () => {
    tabAuthLogin.className = "flex-1 py-3 font-black text-sm text-[#7C3AED] border-b-2 border-[#7C3AED] font-heading min-h-[44px]";
    tabAuthRegister.className = "flex-1 py-3 font-black text-sm text-slate-400 border-b-2 border-transparent hover:text-slate-600 font-heading min-h-[44px]";
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    clearAuthMessages();
  });

  tabAuthRegister.addEventListener("click", () => {
    tabAuthRegister.className = "flex-1 py-3 font-black text-sm text-[#7C3AED] border-b-2 border-[#7C3AED] font-heading min-h-[44px]";
    tabAuthLogin.className = "flex-1 py-3 font-black text-sm text-slate-400 border-b-2 border-transparent hover:text-slate-600 font-heading min-h-[44px]";
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    clearAuthMessages();
  });
}

function updateAuthUI(user) {
  if (user) {
    const name = user.displayName || (user.email ? user.email.split("@")[0] : "Siswa");
    if (loggedOutView) loggedOutView.classList.add("hidden");
    if (loggedInView) loggedInView.classList.remove("hidden");
    if (userDisplayName) userDisplayName.textContent = name;
    if (heroUserGreeting) {
      heroUserGreeting.innerHTML = `Selamat datang kembali, <strong class="text-[#7C3AED] font-bold">${name}</strong>! Siapkan dirimu untuk belajar matematika secara menyenangkan.`;
    }
    // Sembunyikan banner peringatan login di tab Latihan Soal
    if (latihanAuthBanner) latihanAuthBanner.classList.add("hidden");
  } else {
    if (loggedOutView) loggedOutView.classList.remove("hidden");
    if (loggedInView) loggedInView.classList.add("hidden");
    if (userDisplayName) userDisplayName.textContent = "Siswa";
    if (heroUserGreeting) {
      heroUserGreeting.innerHTML = `Jelajahi rangkuman materi lengkap, kerjakan latihan soal berkonfigurasi tingkat kesulitan, dan nikmati game platformer healing interaktif.`;
    }
    // Tampilkan banner peringatan login di tab Latihan Soal
    if (latihanAuthBanner) latihanAuthBanner.classList.remove("hidden");
  }
  updateRetakeAttemptUI();
}

// Handler Submit Form Login
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAuthMessages();

    const email = document.getElementById("loginEmail").value.trim();
    const pass = document.getElementById("loginPassword").value;

    if (!email || !pass) {
      showAuthError("Email dan password wajib diisi.");
      return;
    }

    const submitBtn = btnLoginSubmit || loginForm.querySelector("button[type='submit']");
    const originalText = submitBtn ? submitBtn.innerHTML : "Masuk Ke MathVerse";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Memverifikasi...</span>`;
    }

    if (isFirebaseReady && auth) {
      auth.signInWithEmailAndPassword(email, pass)
        .then((cred) => {
          showAuthSuccess("Berhasil masuk! Menyiapkan dashboard belajar...");
          loginForm.reset();
          setTimeout(() => {
            closeAuthModal();
            updateAuthUI(cred.user);
          }, 450);
        })
        .catch(err => {
          console.warn("Firebase login failed:", err);
          showAuthError(getAuthErrorMessage(err));
        })
        .finally(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }
        });
    } else {
      // Fallback jika Firebase offline
      showAuthNotice("Mode offline aktif. Menggunakan sesi simulasi lokal.");
      setTimeout(() => {
        updateAuthUI({ displayName: email.split("@")[0], email: email });
        closeAuthModal();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }, 500);
    }
  });
}

// Handler Submit Form Register
if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAuthMessages();

    const fullName = document.getElementById("regFullName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const pass = document.getElementById("regPassword").value;

    if (!fullName || fullName.length < 2) {
      showAuthError("Nama lengkap minimal 2 karakter.");
      return;
    }

    if (!email) {
      showAuthError("Alamat email wajib diisi.");
      return;
    }

    if (!pass || pass.length < 6) {
      showAuthError("Password minimal harus 6 karakter.");
      return;
    }

    const submitBtn = btnRegSubmit || registerForm.querySelector("button[type='submit']");
    const originalText = submitBtn ? submitBtn.innerHTML : "Daftar Akun Siswa";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Mendaftarkan Akun...</span>`;
    }

    if (isFirebaseReady && auth) {
      auth.createUserWithEmailAndPassword(email, pass)
        .then((cred) => {
          return cred.user.updateProfile({ displayName: fullName }).then(() => cred.user);
        })
        .then((user) => {
          showAuthSuccess("Pendaftaran berhasil! Selamat datang di MathVerse.");
          registerForm.reset();
          setTimeout(() => {
            closeAuthModal();
            updateAuthUI(user);
          }, 500);
        })
        .catch(err => {
          console.warn("Firebase registration failed:", err);
          showAuthError(getAuthErrorMessage(err));
        })
        .finally(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }
        });
    } else {
      // Fallback jika Firebase offline
      showAuthNotice("Mode offline aktif. Mendaftarkan sesi simulasi lokal.");
      setTimeout(() => {
        updateAuthUI({ displayName: fullName, email: email });
        closeAuthModal();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }, 500);
    }
  });
}

// Handler Tombol Logout
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    if (isFirebaseReady && auth) {
      auth.signOut()
        .then(() => updateAuthUI(null))
        .catch(err => {
          console.warn("Logout error:", err);
          updateAuthUI(null);
        });
    } else {
      updateAuthUI(null);
    }
  });
}

// Hubungkan tombol trigger prompt login di banner Latihan Soal
if (btnLatihanLoginPrompt) {
  btnLatihanLoginPrompt.addEventListener("click", () => {
    openAuthModal("Silakan masuk atau daftar akun baru untuk memulai pengerjaan latihan soal.");
  });
}

// Initial Default Auth State setup
updateAuthUI(null);

// Firebase Auth State Observer
if (isFirebaseReady && auth) {
  auth.onAuthStateChanged(user => {
    updateAuthUI(user);
  });
}


// ==========================================
// 6. CURRICULUM DATA STRUCTURE (SD, SMP, SMA)
// ==========================================
const curriculumData = {
  SD: {
    1: [
      {
        id: "sd-1-bilangan",
        title: "Bilangan Cacah & Operasi",
        description: "Mengenal konsep bilangan bulat non-negatif, lambang bilangan, nilai tempat, serta operasi penjumlahan dan pengurangan dasar.",
        icon: "fa-solid fa-list-ol",
        fase: "Fase A",
        conceptText: "<strong>Pengertian Bilangan Cacah:</strong><br>Bilangan cacah adalah himpunan bilangan bulat yang tidak negatif, yaitu dimulai dari angka \\(0\\) dan bertambah satu demi satu secara berurutan tanpa batas:<br>$$\\mathbb{W} = \\{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, \\dots\\}$$<br>Bilangan cacah digunakan untuk menyatakan kuantitas atau membilang banyak benda nyata serta menentukan urutan peringkat. Lambang bilangan ditulis menggunakan angka arab (contoh: 15), sedangkan nama bilangan diucapkan dengan kata-kata (contoh: \"lima belas\").",
        properties: [
          { title: "Penjumlahan Cacah", desc: "Operasi menggabungkan dua kelompok objek menjadi satu kesatuan: \\(a + b = c\\). Berlaku sifat komutatif \\(a + b = b + a\\), asosiatif \\((a+b)+c = a+(b+c)\\), serta identitas penjumlahan \\(a + 0 = a\\)." },
          { title: "Pengurangan Cacah", desc: "Operasi mengambil sejumlah objek dari himpunan semula atau mencari selisih dua nilai: \\(a - b = c \\iff c + b = a\\). Pada bilangan cacah, hasil pengurangan terdefinisi jika \\(a \\ge b\\)." },
          { title: "Nilai Tempat Bilangan", desc: "Posisi angka menentukan nilainya. Pada bilangan dua digit, posisi kiri menyatakan puluhan dan posisi kanan menyatakan satuan. Contoh: \\(27 = 2\\text{ puluhan} + 7\\text{ satuan} = 20 + 7\\)." },
          { title: "Sifat Keterurutan", desc: "Dua bilangan cacah dapat dibandingkan menggunakan relasi lebih besar (\\(>\\)), lebih kecil (\\(<\\)), atau sama dengan (\\(=\\)). Contoh: \\(8 < 12\\) dan \\(19 > 14\\)." }
        ],
        visualSvg: "",
        exampleProblems: [
          {
            problem: "Budi memiliki 14 buah jeruk di keranjang. Ibu memberikan lagi 8 buah jeruk. Berapakah jumlah total jeruk yang dimiliki Budi sekarang?",
            options: ["20 Buah", "21 Buah", "22 Buah", "24 Buah"],
            answerIndex: 2,
            solutionSteps: "1. Jeruk mula-mula = \\(14\\)<br>2. Tambahan dari Ibu = \\(8\\)<br>3. Total jeruk = \\(14 + 8 = 22\\) Buah."
          },
          {
            problem: "Siti mempunyai 19 pensil warna. Sebanyak 7 pensil warna dipinjam oleh temannya. Berapa sisa pensil warna milik Siti?",
            options: ["11 Pensil", "12 Pensil", "13 Pensil", "14 Pensil"],
            answerIndex: 1,
            solutionSteps: "1. Pensil awal = \\(19\\)<br>2. Pensil dipinjam = \\(7\\)<br>3. Sisa pensil = \\(19 - 7 = 12\\) Pensil."
          }
        ]
      },
      {
        id: "sd-1-geometri",
        title: "Bentuk Bangun Datar Dasar",
        description: "Mengenal segitiga, segi empat, dan lingkaran dalam benda sekitar.",
        icon: "fa-solid fa-shapes",
        fase: "Fase A",
        conceptText: "Bangun datar adalah bentuk dua dimensi yang dibatasi oleh garis lurus atau kurva melengkung.",
        properties: [
          { title: "Segitiga", desc: "Memiliki 3 sisi lurus dan 3 sudut." },
          { title: "Segi Empat", desc: "Memiliki 4 sisi lurus dan 4 sudut." },
          { title: "Lingkaran", desc: "Dibatasi oleh satu garis lengkung menerus." }
        ],
        visualSvg: `<svg viewBox="0 0 300 120" class="w-full h-auto">
          <polygon points="50,20 20,90 80,90" fill="#00A5EC" />
          <rect x="120" y="30" width="60" height="60" fill="#F59E0B" rx="4" />
          <circle cx="240" cy="60" r="30" fill="#10B981" />
        </svg>`,
        exampleProblems: [
          {
            problem: "Bentuk Roda Sepeda tergolong sebagai contoh dari bangun...",
            options: ["Segitiga", "Segi Empat", "Lingkaran", "Trapesium"],
            answerIndex: 2,
            solutionSteps: "Roda sepeda berbentuk bulat sempurna dibatasi kurva lengkung, yaitu Lingkaran."
          }
        ]
      }
    ],
    2: [
      {
        id: "sd-2-perkalian",
        title: "Konsep Perkalian & Pembagian Dasar",
        description: "Memahami perkalian sebagai penjumlahan berulang.",
        icon: "fa-solid fa-xmark",
        fase: "Fase A",
        conceptText: "Perkalian bilangan asli didefinisikan sebagai penjumlahan berulang dari bilangan tersebut.<br>$$a \\times b = b + b + \\dots + b \\quad (\\text{sebanyak } a \\text{ kali})$$",
        properties: [
          { title: "Sifat Komutatif", desc: "\\(a \\times b = b \\times a\\)" },
          { title: "Perkalian Nol", desc: "\\(a \\times 0 = 0\\)" }
        ],
        visualSvg: `<svg viewBox="0 0 300 100" class="w-full h-auto">
          <rect x="20" y="20" width="70" height="60" rx="8" fill="#e6f6fe" stroke="#00A5EC" stroke-width="2"/>
          <text x="55" y="55" font-size="14" font-weight="bold" fill="#00A5EC" text-anchor="middle">3 + 3</text>
          <text x="120" y="55" font-size="20" font-weight="bold" fill="#F59E0B">=</text>
          <text x="180" y="55" font-size="16" font-weight="bold" fill="#10B981">2 × 3 = 6</text>
        </svg>`,
        exampleProblems: [
          {
            problem: "Bentuk penjumlahan berulang dari \\(4 \\times 3\\) adalah...",
            options: ["\\(4 + 4 + 4\\)", "\\(3 + 3 + 3 + 3\\)", "\\(4 + 3\\)", "\\(3 \\times 3 \\times 3\\)"],
            answerIndex: 1,
            solutionSteps: "\\(4 \\times 3\\) berarti menambahkan angka 3 sebanyak 4 kali: \\(3 + 3 + 3 + 3\\)."
          }
        ]
      }
    ],
    3: [
      {
        id: "sd-3-pecahan",
        title: "Pecahan Sederhana",
        description: "Mengenal konsep pecahan sebagai bagian dari keseluruhan, pembilang, penyebut, pecahan senilai, dan perbandingan pecahan.",
        icon: "fa-solid fa-pie-chart",
        fase: "Fase B",
        conceptText: "<strong>Pengertian Pecahan:</strong><br>Pecahan menyatakan satu atau beberapa bagian dari keseluruhan objek yang telah dibagi menjadi bagian-bagian yang sama besar (ekuivalen). Bentuk umum pecahan biasa dituliskan sebagai:<br>$$\\frac{a}{b} \\quad (b \\neq 0)$$<br>di mana \\(a\\) adalah <strong>pembilang</strong> (menyatakan banyaknya bagian yang diambil atau diamati) dan \\(b\\) adalah <strong>penyebut</strong> (menyatakan total seluruh bagian sama besar yang membagi objek utuh).",
        properties: [
          { title: "Pembilang & Penyebut", desc: "Pada pecahan \\(\\frac{3}{4}\\), bilangan 3 di atas adalah pembilang dan bilangan 4 di bawah adalah penyebut. Nilai penyebut tidak boleh sama dengan nol (\\(b \\neq 0\\))." },
          { title: "Pecahan Senilai", desc: "Dua pecahan atau lebih dikatakan senilai jika memiliki nilai rasio perbandingan yang sama, diperoleh dengan mengalikan atau membagi pembilang dan penyebut dengan angka yang sama: \\(\\frac{a}{b} = \\frac{a \\times k}{b \\times k}\\). Contoh: \\(\\frac{1}{2} = \\frac{2}{4} = \\frac{4}{8}\\)." },
          { title: "Menyederhanakan Pecahan", desc: "Membagi pembilang dan penyebut dengan FPB keduanya hingga menghasilkan pecahan paling sederhana yang tidak bisa dibagi lagi. Contoh: \\(\\frac{6}{8} = \\frac{6 : 2}{8 : 2} = \\frac{3}{4}\\)." },
          { title: "Membandingkan Pecahan", desc: "Jika berpenyebut sama, bandingkan nilai pembilangnya (\\(\\frac{2}{5} < \\frac{4}{5}\\)). Jika berpenyebut beda, samakan penyebut menggunakan KPK atau gunakan perkalian silang: \\(\\frac{a}{b}\\) vs \\(\\frac{c}{d} \\implies a \\cdot d\\) vs \\(b \\cdot c\\)." }
        ],
        visualSvg: "",
        exampleProblems: [
          {
            problem: "Sebuah loyang pizza dipotong menjadi 8 bagian sama besar. Doni memakan 3 potong di antaranya. Berapakah bagian pizza yang dimakan Doni?",
            options: ["\\(\\frac{1}{8}\\)", "\\(\\frac{3}{8}\\)", "\\(\\frac{5}{8}\\)", "\\(\\frac{3}{4}\\)"],
            answerIndex: 1,
            solutionSteps: "Doni memakan 3 potong dari total 8 potong bagian sama besar, sehingga bentuk pecahannya adalah \\(\\frac{3}{8}\\)."
          },
          {
            problem: "Bentuk paling sederhana dari pecahan \\(\\frac{12}{18}\\) adalah...",
            options: ["\\(\\frac{6}{9}\\)", "\\(\\frac{3}{4}\\)", "\\(\\frac{2}{3}\\)", "\\(\\frac{4}{6}\\)"],
            answerIndex: 2,
            solutionSteps: "FPB dari 12 dan 18 adalah 6.<br>Bagi pembilang dan penyebut dengan 6:<br>\\(\\frac{12 : 6}{18 : 6} = \\frac{2}{3}\\)."
          }
        ]
      }
    ],
    4: [
      {
        id: "sd-4-fpbkpk",
        title: "FPB & KPK Bilangan",
        description: "Konsep kelipatan dan faktor, faktorisasi prima, pembagian bersusun, serta penyelesaian soal cerita waktu bertemu dan pembagian sama rata.",
        icon: "fa-solid fa-calculator",
        fase: "Fase B",
        conceptText: "<strong>Definisi Kelipatan & Faktor:</strong><br>• <strong>Kelipatan</strong> suatu bilangan adalah hasil perkalian bilangan tersebut dengan bilangan asli berturut-turut (\\(1, 2, 3, \\dots\\)). Contoh: Kelipatan 6 adalah \\(6, 12, 18, 24, 30, \\dots\\). Kelipatan persekutuan adalah himpunan kelipatan yang sama antara dua bilangan atau lebih. <strong>KPK (Kelipatan Persekutuan Terkecil)</strong> adalah nilai terkecil bukan nol di antara kelipatan-kelipatan persekutuan tersebut.<br><br>• <strong>Faktor</strong> suatu bilangan adalah semua bilangan asli yang dapat membagi habis bilangan tersebut tanpa sisa pembagian. Contoh: Faktor dari 18 adalah \\(1, 2, 3, 6, 9, 18\\). Faktor persekutuan adalah faktor yang sama yang dimiliki oleh dua bilangan atau lebih. <strong>FPB (Faktor Persekutuan Terbesar)</strong> adalah faktor persekutuan yang nilainya paling besar di antara seluruh faktor persekutuan.",
        properties: [
          { title: "Faktorisasi Prima (Pohon Faktor)", desc: "Menguraikan bilangan menjadi bentuk perkalian faktor-faktor prima (\\(2, 3, 5, 7, 11, \\dots\\)). Contoh: \\(24 = 2^3 \\times 3\\) dan \\(36 = 2^2 \\times 3^2\\)." },
          { title: "Aturan Penentuan FPB", desc: "Pilih faktor-faktor prima yang <strong>sama persis</strong> pada kedua bilangan, kemudian kalikan dengan mengambil <strong>pangkat terendah (terkecil)</strong>. Contoh: \\(\\text{FPB}(24, 36) = 2^2 \\times 3 = 4 \\times 3 = 12\\)." },
          { title: "Aturan Penentuan KPK", desc: "Kalikan <strong>semua faktor prima</strong> yang muncul pada kedua bilangan. Jika ada faktor prima yang sama, pilih yang memiliki <strong>pangkat tertinggi (terbesar)</strong>. Contoh: \\(\\text{KPK}(24, 36) = 2^3 \\times 3^2 = 8 \\times 9 = 72\\)." },
          { title: "Metode Pembagian Bersusun (Tabel)", desc: "Membagi bilangan bersama-sama secara berjenjang menggunakan bilangan prima terkecil. Bilangan prima yang berhasil membagi habis seluruh angka dilingkari (hasil kali angka yang dilingkari adalah FPB). Perkalian seluruh pembagi di kolom kiri adalah KPK." },
          { title: "Soal Cerita KPK: Waktu Bertemu Kembali", desc: "Diterapkan pada kejadian siklus berulang berkala. Kata kunci soal: <em>'setiap ... hari sekali', 'bersama-sama lagi', 'bertemu kembali', 'lampu menyala bersamaan'</em>." },
          { title: "Soal Cerita FPB: Membagi Barang Sama Rata", desc: "Diterapkan saat membagi sekelompok benda menjadi paket-paket berukuran sama rata tanpa sisa. Kata kunci soal: <em>'sama banyak', 'bingkisan terbanyak', 'jumlah kantong maksimal', 'dibagi rata'</em>." }
        ],
        visualSvg: "",
        exampleProblems: [
          {
            problem: "Ali berlatih renang setiap 4 hari sekali, sedangkan Budi berlatih renang setiap 6 hari sekali di kolam yang sama. Jika mereka berenang bersama pada hari Minggu, setelah berapa harikah mereka akan berenang bersama-sama lagi untuk berikutnya, dan pada hari apa?",
            options: ["10 hari lagi (hari Rabu)", "12 hari lagi (hari Jumat)", "14 hari lagi (hari Minggu)", "24 hari lagi (hari Kamis)"],
            answerIndex: 1,
            solutionSteps: "1. Masalah waktu bertemu kembali diselesaikan dengan <strong>KPK</strong>.<br>2. Faktorisasi prima:<br>\\(4 = 2^2\\)<br>\\(6 = 2 \\times 3\\)<br>3. \\(\\text{KPK}(4, 6) = 2^2 \\times 3 = 4 \\times 3 = 12\\) hari.<br>4. Menghitung hari: 12 hari setelah hari Minggu adalah \\(12 \\pmod 7 = 5\\) hari setelah Minggu, yaitu <strong>hari Jumat</strong>."
          },
          {
            problem: "Rani memiliki 24 permen cokelat dan 36 biskuit vanila. Makanan tersebut akan dimasukkan ke dalam kantong bingkisan dengan isi cokelat dan biskuit yang sama rata di setiap kantong tanpa bersisa. Berapa kantong bingkisan terbanyak yang dapat dibuat Rani, dan berapa isi permen cokelat serta biskuit di setiap kantong?",
            options: ["6 kantong (4 cokelat, 6 biskuit)", "8 kantong (3 cokelat, 4 biskuit)", "12 kantong (2 cokelat, 3 biskuit)", "18 kantong (1 cokelat, 2 biskuit)"],
            answerIndex: 2,
            solutionSteps: "1. Masalah membagi sama rata ke dalam wadah terbanyak diselesaikan dengan <strong>FPB</strong>.<br>2. Faktorisasi prima:<br>\\(24 = 2^3 \\times 3\\)<br>\\(36 = 2^2 \\times 3^2\\)<br>3. \\(\\text{FPB}(24, 36) = 2^2 \\times 3 = 4 \\times 3 = 12\\) kantong.<br>4. Isi setiap kantong:<br>• Cokelat = \\(24 : 12 = 2\\) permen<br>• Biskuit = \\(36 : 12 = 3\\) biskuit."
          }
        ]
      }
    ],
    5: [
      {
        id: "sd-5-volum",
        title: "Volume Kubus & Balok",
        description: "Karakteristik dan sifat geometris kubus dan balok, rumus lengkap volume, luas permukaan, keliling rusuk, serta 2 contoh soal penerapan.",
        icon: "fa-solid fa-cube",
        fase: "Fase C",
        conceptText: "<strong>Pengertian Bangun Ruang Kubus & Balok:</strong><br>Bangun ruang sisi datar adalah bentuk 3 dimensi yang dibatasi oleh bidang-bidang datar. Kapasitas ruang di dalam bangun disebut <strong>Volume</strong>.<br><br>• <strong>Kubus</strong> adalah bangun ruang tiga dimensi khusus yang dibatasi oleh 6 bidang sisi berbentuk persegi bujur sangkar yang kongruen (berukuran persis sama). Semua rusuk kubus memiliki panjang yang sama (\\(s\\)).<br><br>• <strong>Balok</strong> adalah bangun ruang tiga dimensi yang dibatasi oleh 6 bidang sisi berbentuk persegi panjang, di mana sisi-sisi yang saling berhadapan adalah sejajar dan kongruen. Balok memiliki 3 dimensi ukuran: panjang (\\(p\\)), lebar (\\(l\\)), dan tinggi (\\(t\\)).",
        properties: [
          { title: "Sifat-Sifat Lengkap Kubus", desc: "• Jumlah Sisi = 6 persegi kongruen (\\(s \\times s\\)).<br>• Jumlah Rusuk = 12 rusuk sama panjang (\\(s\\)).<br>• Titik Sudut = 8 titik sudut siku-siku (\\(90^\\circ\\)).<br>• Diagonal Bidang/Sisi = 12 buah, panjang \\(d_b = s\\sqrt{2}\\).<br>• Diagonal Ruang = 4 buah sama panjang, \\(d_r = s\\sqrt{3}\\).<br>• Bidang Diagonal = 6 buah berbentuk persegi panjang dengan luas \\(s^2\\sqrt{2}\\)." },
          { title: "Rumus Lengkap Kubus", desc: "• <strong>Volume:</strong> \\(V = s^3 = s \\times s \\times s\\)<br>• <strong>Luas Permukaan:</strong> \\(L = 6 \\times s^2\\)<br>• <strong>Keliling Rusuk (Total Panjang Seluruh Rusuk):</strong> \\(K = 12 \\times s\\)" },
          { title: "Sifat-Sifat Lengkap Balok", desc: "• Jumlah Sisi = 6 sisi persegi panjang (3 pasang berhadapan kongruen).<br>• Jumlah Rusuk = 12 rusuk (terdiri dari 4 panjang \\(p\\), 4 lebar \\(l\\), 4 tinggi \\(t\\)).<br>• Titik Sudut = 8 titik sudut.<br>• Diagonal Bidang = 12 buah (\\(\\sqrt{p^2+l^2}, \\sqrt{p^2+t^2}, \\sqrt{l^2+t^2}\\)).<br>• Diagonal Ruang = 4 buah sama panjang, \\(d_r = \\sqrt{p^2 + l^2 + t^2}\\).<br>• Bidang Diagonal = 6 buah berbentuk persegi panjang." },
          { title: "Rumus Lengkap Balok", desc: "• <strong>Volume:</strong> \\(V = p \\times l \\times t\\)<br>• <strong>Luas Permukaan:</strong> \\(L = 2(pl + pt + lt)\\)<br>• <strong>Keliling Rusuk (Total Panjang Seluruh Rusuk):</strong> \\(K = 4(p + l + t)\\)" }
        ],
        visualSvg: `<svg viewBox="0 0 620 250" class="w-full h-auto max-w-xl mx-auto" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="kubusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#7C3AED" stop-opacity="0.08"/>
            </linearGradient>
            <linearGradient id="balokGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#10B981" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#10B981" stop-opacity="0.08"/>
            </linearGradient>
          </defs>
          <g id="kubusGroup">
            <polygon points="90,60 190,60 190,160 90,160" fill="none" stroke="#7C3AED" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6"/>
            <line x1="50" y1="200" x2="90" y2="160" stroke="#7C3AED" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6"/>
            <line x1="50" y1="100" x2="90" y2="60" stroke="#7C3AED" stroke-width="2"/>
            <line x1="150" y1="100" x2="190" y2="60" stroke="#7C3AED" stroke-width="2"/>
            <line x1="150" y1="200" x2="190" y2="160" stroke="#7C3AED" stroke-width="2"/>
            <line x1="50" y1="200" x2="190" y2="60" stroke="#F59E0B" stroke-width="2" stroke-dasharray="5,3"/>
            <polygon points="50,100 90,60 190,60 150,100" fill="url(#kubusGrad)" stroke="#7C3AED" stroke-width="2"/>
            <polygon points="150,100 190,60 190,160 150,200" fill="url(#kubusGrad)" stroke="#7C3AED" stroke-width="2"/>
            <polygon points="50,100 150,100 150,200 50,200" fill="url(#kubusGrad)" stroke="#7C3AED" stroke-width="2.5"/>
            <line x1="50" y1="200" x2="150" y2="100" stroke="#06B6D4" stroke-width="2" stroke-dasharray="3,3"/>
            <text x="100" y="218" font-size="12" font-weight="bold" fill="#7C3AED" text-anchor="middle">rusuk s</text>
            <text x="35" y="155" font-size="12" font-weight="bold" fill="#7C3AED" text-anchor="middle">s</text>
            <text x="175" y="80" font-size="12" font-weight="bold" fill="#7C3AED" text-anchor="middle">s</text>
            <text x="110" y="145" font-size="10" font-weight="bold" fill="#06B6D4">s√2</text>
            <text x="135" y="125" font-size="10" font-weight="bold" fill="#F59E0B">s√3</text>
            <text x="120" y="240" font-size="13" font-weight="bold" fill="#7C3AED" text-anchor="middle">KUBUS (V = s³)</text>
          </g>
          <g id="balokGroup">
            <polygon points="380,75 560,75 560,160 380,160" fill="none" stroke="#10B981" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6"/>
            <line x1="330" y1="200" x2="380" y2="160" stroke="#10B981" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6"/>
            <line x1="330" y1="115" x2="380" y2="75" stroke="#10B981" stroke-width="2"/>
            <line x1="510" y1="115" x2="560" y2="75" stroke="#10B981" stroke-width="2"/>
            <line x1="510" y1="200" x2="560" y2="160" stroke="#10B981" stroke-width="2"/>
            <line x1="330" y1="200" x2="560" y2="75" stroke="#F59E0B" stroke-width="2" stroke-dasharray="5,3"/>
            <polygon points="330,115 380,75 560,75 510,115" fill="url(#balokGrad)" stroke="#10B981" stroke-width="2"/>
            <polygon points="510,115 560,75 560,160 510,200" fill="url(#balokGrad)" stroke="#10B981" stroke-width="2"/>
            <polygon points="330,115 510,115 510,200 330,200" fill="url(#balokGrad)" stroke="#10B981" stroke-width="2.5"/>
            <text x="420" y="218" font-size="12" font-weight="bold" fill="#10B981" text-anchor="middle">panjang (p)</text>
            <text x="312" y="160" font-size="12" font-weight="bold" fill="#10B981" text-anchor="middle">tinggi (t)</text>
            <text x="545" y="95" font-size="12" font-weight="bold" fill="#10B981" text-anchor="middle">lebar (l)</text>
            <text x="460" y="130" font-size="10" font-weight="bold" fill="#F59E0B">dr = √(p²+l²+t²)</text>
            <text x="445" y="240" font-size="13" font-weight="bold" fill="#10B981" text-anchor="middle">BALOK (V = p × l × t)</text>
          </g>
        </svg>`,
        visualCaption: "Visualisasi 3D Geometris Kubus (Rusuk s, Diagonal Bidang s√2, Diagonal Ruang s√3) dan Balok (Ukuran p, l, t)",
        exampleProblems: [
          {
            problem: "Sebuah bak penampungan air berbentuk kubus memiliki panjang rusuk bagian dalam sebesar 90 cm. Bak tersebut saat ini baru terisi air sebanyak 1/3 bagian. Berapa liter air lagikah yang harus ditambahkan agar bak terisi penuh? (Catatan: 1 liter = 1.000 cm³)",
            options: ["243 Liter", "486 Liter", "729 Liter", "810 Liter"],
            answerIndex: 1,
            solutionSteps: "1. <strong>Volume Total Kubus:</strong><br>\\(V = s^3 = 90 \\times 90 \\times 90 = 729.000\\text{ cm}^3 = 729\\text{ liter}\\).<br>2. <strong>Air yang telah terisi:</strong><br>\\(\\frac{1}{3} \\times 729 = 243\\text{ liter}\\).<br>3. <strong>Kekurangan air yang dibutuhkan:</strong><br>\\(729 - 243 = 486\\text{ liter}\\) (atau \\(\\frac{2}{3} \\times 729 = 486\\text{ liter}\\))."
          },
          {
            problem: "Sebuah kolam renang berbentuk balok memiliki ukuran panjang 12 meter, lebar 6 meter, dan kedalaman (tinggi) 2 meter. Bagian dinding dalam dan alas kolam akan dilapisi keramik. Hitunglah volume air maksimum dalam satuan liter (1 m³ = 1.000 liter) serta luas area keramik yang dipasang (tanpa tutup atas)!",
            options: ["Volume 144.000 Liter dan Luas Keramik 144 m²", "Volume 144.000 Liter dan Luas Keramik 216 m²", "Volume 72.000 Liter dan Luas Keramik 144 m²", "Volume 144.000 Liter dan Luas Keramik 288 m²"],
            answerIndex: 0,
            solutionSteps: "1. <strong>Volume Balok:</strong><br>\\(V = p \\times l \\times t = 12 \\times 6 \\times 2 = 144\\text{ m}^3 = 144.000\\text{ liter}\\).<br>2. <strong>Luas Permukaan Tanpa Tutup Atas:</strong><br>\\(L = (p \\times l) + 2(p \\times t) + 2(l \\times t)\\)<br>\\(L = (12 \\times 6) + 2(12 \\times 2) + 2(6 \\times 2) = 72 + 48 + 24 = 144\\text{ m}^2\\)."
          }
        ]
      }
    ],
    6: [
      {
        id: "sd-6-lingkaran",
        title: "Keliling & Luas Lingkaran",
        description: "Menghitung keliling dan luas lingkaran dengan konstanta Pi.",
        icon: "fa-solid fa-circle-notch",
        fase: "Fase C",
        conceptText: "Rumus keliling dan luas lingkaran bergantung pada panjang jari-jari \\(r\\) atau diameter \\(d\\).<br>$$K = 2 \\pi r, \\quad L = \\pi r^2 \\quad (\\pi \\approx 3.14 \\text{ atau } \\frac{22}{7})$$",
        properties: [
          { title: "Keliling", desc: "Panjang garis lengkung luar pembatas lingkaran." },
          { title: "Luas", desc: "Besar daerah di dalam batas lingkaran." }
        ],
        visualSvg: `<svg viewBox="0 0 200 120" class="w-full h-auto">
          <circle cx="100" cy="60" r="40" fill="rgba(0, 165, 236, 0.15)" stroke="#00A5EC" stroke-width="2"/>
          <line x1="100" y1="60" x2="140" y2="60" stroke="#F59E0B" stroke-width="2"/>
          <text x="120" y="55" font-size="12" font-weight="bold" fill="#F59E0B">r</text>
        </svg>`,
        exampleProblems: [
          {
            problem: "Luas lingkaran dengan jari-jari 7 cm (\\(\\pi = \\frac{22}{7}\\)) adalah...",
            options: ["44 cm²", "88 cm²", "154 cm²", "308 cm²"],
            answerIndex: 2,
            solutionSteps: "\\(L = \\pi r^2 = \\frac{22}{7} \\times 7 \\times 7 = 154\\) cm²."
          }
        ]
      }
    ]
  },

  SMP: {
    7: [
      {
        id: "smp-7-aljabar",
        title: "Bentuk Aljabar & Operasi",
        description: "Definisi suku, variabel, koefisien, konstanta, operasi dasar aljabar, dan teknik pemfaktoran lengkap (distributif, selisih kuadrat, kuadrat sempurna, ax²+bx+c).",
        icon: "fa-solid fa-superscript",
        fase: "Fase D",
        conceptText: "<strong>Unsur-Unsur Pembentuk Aljabar:</strong><br>Bentuk aljabar adalah struktur matematis yang memadukan bilangan riil dan lambang huruf simbolik melalui operasi hitung aritmatika.<br><br>• <strong>Variabel (Peubah):</strong> Simbol alfabet (misal \\(x, y, z, a, b\\)) yang mewakili nilai bilangan yang belum diketahui secara pasti.<br>• <strong>Koefisien:</strong> Bilangan konstan pengali di depan variabel. Contoh: Pada suku \\(7x^3\\), angka 7 adalah koefisien dari \\(x^3\\).<br>• <strong>Konstanta:</strong> Suku tunggal berupa bilangan tetap yang tidak memuat variabel sama sekali. Contoh: Pada bentuk \\(4x^2 - 5x + 9\\), angka 9 adalah konstanta.<br>• <strong>Suku:</strong> Bagian dari bentuk aljabar yang dipisahkan oleh tanda tambah (\\(+\\)) atau kurang (\\(-\\)). Suku sejenis adalah suku-suku yang memiliki variabel dan derajat pangkat yang persis sama (misal \\(3x^2\\) dan \\(-5x^2\\)).",
        properties: [
          { title: "Penjumlahan & Pengurangan Aljabar", desc: "Hanya dapat dilakukan pada suku-suku yang <strong>sejenis</strong> dengan menjumlahkan atau mengurangkan koefisiennya:<br>$$a x^n \\pm b x^n = (a \\pm b) x^n$$<br>Contoh: \\(5x^2 + 3x - 2x^2 + 7x = (5 - 2)x^2 + (3 + 7)x = 3x^2 + 10x\\)." },
          { title: "Perkalian Aljabar", desc: "Menggunakan hukum distributif:<br>• Suku satu dengan dua suku: \\(a(bx + c) = abx + ac\\)<br>• Binomial dengan binomial: \\((ax + b)(cx + d) = acx^2 + (ad + bc)x + bd\\)<br>• Sifat eksponen: \\(x^m \\cdot x^n = x^{m+n}\\)." },
          { title: "Pembagian Aljabar", desc: "Membagi nilai koefisien dan mengurangkan derajat pangkat variabel basis yang sama: \\(\\frac{a x^m}{b x^n} = \\left(\\frac{a}{b}\\right) x^{m-n}\\). Untuk pembagian suku banyak digunakan metode porogapit bersusun aljabar." },
          { title: "Pemfaktoran Hukum Distributif", desc: "Mengeluarkan Faktor Persekutuan Terbesar (FPB) dari setiap suku keluar tanda kurung:<br>$$ab \\pm ac = a(b \\pm c)$$<br>Contoh: \\(12x^3 - 18x^2 = 6x^2(2x - 3)\\)." },
          { title: "Pemfaktoran Selisih Dua Kuadrat", desc: "Bentuk selisih dua bilangan kuadrat sempurna selalu dapat difaktorkan menjadi:<br>$$a^2 - b^2 = (a - b)(a + b)$$<br>Contoh: \\(x^2 - 49 = (x - 7)(x + 7)\\) dan \\(9x^2 - 16y^2 = (3x - 4y)(3x + 4y)\\)." },
          { title: "Pemfaktoran Kuadrat Sempurna", desc: "Memenuhi pola kuadrat binomial:<br>$$a^2 + 2ab + b^2 = (a + b)^2$$<br>$$a^2 - 2ab + b^2 = (a - b)^2$$<br>Contoh: \\(x^2 + 10x + 25 = (x + 5)^2\\) dan \\(4x^2 - 12x + 9 = (2x - 3)^2\\)." },
          { title: "Pemfaktoran Persamaan Kuadrat ax² + bx + c", desc: "• Untuk \\(a = 1\\): Cari bilangan \\(p, q\\) sedemikian rupa sehingga \\(p + q = b\\) dan \\(p \\cdot q = c\\), maka \\(x^2 + bx + c = (x + p)(x + q)\\).<br>• Untuk \\(a \\neq 1\\): Cari bilangan \\(p, q\\) dengan \\(p + q = b\\) dan \\(p \\cdot q = a \\cdot c\\), pecah suku tengah menjadi \\(px + qx\\), lalu faktorkan dengan metode pengelompokan suku." }
        ],
        visualSvg: "",
        exampleProblems: [
          {
            problem: "Sederhanakan bentuk pecahan aljabar berikut: \\(\\frac{x^2 - 9}{2x^2 + 5x - 3}\\)!",
            options: ["\\(\\frac{x - 3}{2x - 1}\\)", "\\(\\frac{x + 3}{2x - 1}\\)", "\\(\\frac{x - 3}{2x + 1}\\)", "\\(\\frac{x + 3}{x - 1}\\)"],
            answerIndex: 0,
            solutionSteps: "1. Faktorkan pembilang (selisih dua kuadrat):<br>\\(x^2 - 9 = (x - 3)(x + 3)\\).<br>2. Faktorkan penyebut kuadrat (\\(a=2, b=5, c=-3\\)):<br>Cari dua angka: hasil kali \\(2 \\times (-3) = -6\\), jumlah \\(5\\) \\(\\implies 6\\) dan \\(-1\\).<br>\\(2x^2 + 6x - x - 3 = 2x(x + 3) - 1(x + 3) = (2x - 1)(x + 3)\\).<br>3. Bagi faktor persekutuan \\((x + 3)\\):<br>\\(\\frac{(x - 3)(x + 3)}{(2x - 1)(x + 3)} = \\frac{x - 3}{2x - 1}\\)."
          },
          {
            problem: "Faktorkan bentuk aljabar kuadrat \\(6x^2 - 11x - 10\\) menjadi dua faktor linear!",
            options: ["\\((2x - 5)(3x + 2)\\)", "\\((3x - 5)(2x + 2)\\)", "\\((6x - 5)(x + 2)\\)", "\\((2x + 5)(3x - 2)\\)"],
            answerIndex: 0,
            solutionSteps: "1. Nilai \\(a \\cdot c = 6 \\times (-10) = -60\\), dan \\(b = -11\\).<br>2. Dua angka yang hasil kalinya \\(-60\\) dan jumlahnya \\(-11\\) adalah \\(-15\\) dan \\(4\\).<br>3. Uraikan suku tengah:<br>\\(6x^2 - 15x + 4x - 10 = 3x(2x - 5) + 2(2x - 5)\\)<br>\\(= (2x - 5)(3x + 2)\\)."
          }
        ]
      }
    ],
    8: [
      {
        id: "smp-8-pythagoras",
        title: "Teorema Pythagoras",
        description: "Hubungan panjang sisi pada segitiga siku-siku.",
        icon: "fa-solid fa-ruler-combined",
        fase: "Fase D",
        conceptText: "Pada segitiga siku-siku, kuadrat sisi miring (hipotenusa) sama dengan jumlah kuadrat kedua sisi tegaknya.<br>$$c^2 = a^2 + b^2 \\implies c = \\sqrt{a^2 + b^2}$$",
        properties: [
          { title: "Hipotenusa", desc: "Sisi terpanjang di hadapan sudut siku-siku (90°)." },
          { title: "Triple Pythagoras", desc: "Kelompok tiga angka asli yang memenuhi rumus (misal: 3, 4, 5)." }
        ],
        visualSvg: `<svg viewBox="0 0 200 120" class="w-full h-auto">
          <polygon points="40,90 160,90 40,20" fill="rgba(0,165,236,0.15)" stroke="#00A5EC" stroke-width="2"/>
          <text x="30" y="60" font-size="12" font-weight="bold" fill="#00A5EC">a</text>
          <text x="100" y="105" font-size="12" font-weight="bold" fill="#00A5EC">b</text>
          <text x="110" y="50" font-size="12" font-weight="bold" fill="#F59E0B">c</text>
        </svg>`,
        exampleProblems: [
          {
            problem: "Jika sisi tegak segitiga siku-siku adalah 6 cm dan 8 cm, panjang sisi miringnya adalah...",
            options: ["9 cm", "10 cm", "12 cm", "14 cm"],
            answerIndex: 1,
            solutionSteps: "\\(c = \\sqrt{6^2 + 8^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10\\) cm."
          }
        ]
      }
    ],
    9: [
      {
        id: "smp-9-persamaankuadrat",
        title: "Persamaan & Fungsi Kuadrat",
        description: "Bentuk umum persamaan ax²+bx+c=0 dan fungsi f(x)=ax²+bx+c, grafik kurva parabola akurat, cara mencari akar, diskriminan D=b²-4ac, dan titik puncak.",
        icon: "fa-solid fa-chart-area",
        fase: "Fase D",
        conceptText: "<strong>Bentuk Umum Persamaan & Fungsi Kuadrat:</strong><br>• <strong>Persamaan Kuadrat:</strong> Persamaan aljabar berderajat dua dengan bentuk baku:<br>$$ax^2 + bx + c = 0, \\quad (a, b, c \\in \\mathbb{R}, \\; a \\neq 0)$$<br>Nilai \\(x\\) yang memenuhi persamaan disebut <em>akar-akar persamaan kuadrat</em> (\\(x_1\\) dan \\(x_2\\)).<br><br>• <strong>Fungsi Kuadrat:</strong> Pemetaan fungsi polinomial derajat dua:<br>$$f(x) = ax^2 + bx + c \\quad \\text{atau} \\quad y = ax^2 + bx + c$$<br>Grafik fungsi kuadrat membentuk kurva simetris yang disebut <strong>Parabola</strong>. Arah kelengkungan parabola ditentukan oleh koefisien \\(a\\):<br>• Jika \\(a > 0\\): Parabola terbuka ke atas dan mempunyai titik puncak balik minimum.<br>• Jika \\(a < 0\\): Parabola terbuka ke bawah dan mempunyai titik puncak balik maksimum.",
        properties: [
          { title: "3 Cara Mencari Akar-Akar Kuadrat", desc: "1. <strong>Pemfaktoran:</strong> Mengubah bentuk menjadi \\((x - x_1)(x - x_2) = 0\\).<br>2. <strong>Melengkapkan Kuadrat Sempurna:</strong> Mengubah ke bentuk \\((x + p)^2 = q \\implies x + p = \\pm \\sqrt{q}\\).<br>3. <strong>Rumus Kuadratik (Rumus ABC):</strong><br>$$x_{1,2} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$" },
          { title: "Nilai Diskriminan (D = b² - 4ac) & Sifat Akar", desc: "• Jika \\(D > 0\\): Memiliki 2 akar real berbeda (kurva parabola memotong sumbu X di dua titik berbeda).<br>• Jika \\(D = 0\\): Memiliki 2 akar real kembar/sama (kurva parabola menyinggung sumbu X di tepat satu titik).<br>• Jika \\(D < 0\\): Tidak memiliki akar real/akar imajiner (kurva tidak memotong maupun menyinggung sumbu X; definit positif jika \\(a > 0\\), definit negatif jika \\(a < 0\\))." },
          { title: "Rumus Titik Puncak (Sumbu Simetri & Nilai Optimum)", desc: "Titik puncak \\((x_p, y_p)\\) merupakan titik ekstrim kurva parabola:<br>• <strong>Sumbu Simetri:</strong> \\(x_p = -\\frac{b}{2a}\\)<br>• <strong>Nilai Optimum (Maksimum/Minimum):</strong> \\(y_p = -\\frac{D}{4a} = -\\frac{b^2 - 4ac}{4a}\\) atau \\(y_p = f(x_p)\\)<br>• <strong>Koordinat Titik Balik Puncak:</strong> \\(\\left(-\\frac{b}{2a}, \\; -\\frac{D}{4a}\\right)\\)." },
          { title: "Teorema Vieta (Hubungan Jumlah & Hasil Kali Akar)", desc: "$$x_1 + x_2 = -\\frac{b}{a}, \\quad x_1 \\cdot x_2 = \\frac{c}{a}, \\quad x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1 x_2$$" }
        ],
        visualSvg: `<svg viewBox="0 0 520 260" class="w-full h-auto max-w-lg mx-auto" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748B"/>
            </marker>
          </defs>
          <line x1="85" y1="20" x2="85" y2="235" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
          <line x1="140" y1="20" x2="140" y2="235" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
          <line x1="195" y1="20" x2="195" y2="235" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
          <line x1="250" y1="20" x2="250" y2="235" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
          <line x1="305" y1="20" x2="305" y2="235" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
          <line x1="360" y1="20" x2="360" y2="235" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
          <line x1="50" y1="185" x2="470" y2="185" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
          <line x1="50" y1="155" x2="470" y2="155" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
          <line x1="50" y1="125" x2="470" y2="125" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
          <line x1="50" y1="95" x2="470" y2="95" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
          <line x1="50" y1="65" x2="470" y2="65" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
          <line x1="50" y1="35" x2="470" y2="35" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
          <line x1="250" y1="20" x2="250" y2="245" stroke="#F59E0B" stroke-width="2" stroke-dasharray="6,4"/>
          <text x="254" y="32" font-size="11" font-weight="bold" fill="#F59E0B">Sumbu Simetri x = 2</text>
          <line x1="40" y1="185" x2="465" y2="185" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>
          <text x="455" y="175" font-size="12" font-weight="bold" fill="#475569">X</text>
          <line x1="140" y1="245" x2="140" y2="20" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>
          <text x="148" y="28" font-size="12" font-weight="bold" fill="#475569">Y</text>
          <path d="M 115,35 Q 140,95 195,185 Q 222.5,215 250,215 Q 277.5,215 305,185 Q 360,95 385,35" fill="none" stroke="#7C3AED" stroke-width="3" stroke-linecap="round"/>
          <circle cx="195" cy="185" r="5" fill="#10B981" stroke="#FFFFFF" stroke-width="1.5"/>
          <text x="195" y="172" font-size="11" font-weight="bold" fill="#10B981" text-anchor="middle">(1, 0)</text>
          <circle cx="305" cy="185" r="5" fill="#10B981" stroke="#FFFFFF" stroke-width="1.5"/>
          <text x="305" y="172" font-size="11" font-weight="bold" fill="#10B981" text-anchor="middle">(3, 0)</text>
          <circle cx="140" cy="95" r="5" fill="#3B82F6" stroke="#FFFFFF" stroke-width="1.5"/>
          <text x="128" y="99" font-size="11" font-weight="bold" fill="#3B82F6" text-anchor="end">(0, 3)</text>
          <circle cx="250" cy="215" r="6" fill="#EF4444" stroke="#FFFFFF" stroke-width="2"/>
          <text x="250" y="235" font-size="11" font-weight="bold" fill="#EF4444" text-anchor="middle">Puncak (2, -1)</text>
          <text x="133" y="198" font-size="10" fill="#64748B" text-anchor="end">0</text>
          <text x="195" y="200" font-size="10" fill="#64748B" text-anchor="middle">1</text>
          <text x="250" y="200" font-size="10" fill="#64748B" text-anchor="middle">2</text>
          <text x="305" y="200" font-size="10" fill="#64748B" text-anchor="middle">3</text>
          <text x="360" y="200" font-size="10" fill="#64748B" text-anchor="middle">4</text>
        </svg>`,
        visualCaption: "Grafik Kurva Parabola Fungsi Kuadrat: f(x) = x² - 4x + 3 (Titik Puncak (2, -1), Akar x₁ = 1, x₂ = 3, Sumbu Simetri x = 2)",
        exampleProblems: [
          {
            problem: "Tentukan akar-akar penyelesaian dari persamaan kuadrat \\(2x^2 - 7x + 3 = 0\\) menggunakan Rumus ABC!",
            options: ["\\(x = 3\\) atau \\(x = \\frac{1}{2}\\)", "\\(x = -3\\) atau \\(x = -\\frac{1}{2}\\)", "\\(x = 2\\) atau \\(x = \\frac{3}{2}\\)", "\\(x = 1\\) atau \\(x = 3\\)"],
            answerIndex: 0,
            solutionSteps: "1. Identifikasi koefisien: \\(a = 2, b = -7, c = 3\\).<br>2. Hitung Diskriminan:<br>\\(D = b^2 - 4ac = (-7)^2 - 4(2)(3) = 49 - 24 = 25\\).<br>3. Substitusikan ke Rumus ABC:<br>\\(x_{1,2} = \\frac{-(-7) \\pm \\sqrt{25}}{2(2)} = \\frac{7 \\pm 5}{4}\\)<br>• \\(x_1 = \\frac{7 + 5}{4} = \\frac{12}{4} = 3\\)<br>• \\(x_2 = \\frac{7 - 5}{4} = \\frac{2}{4} = \\frac{1}{2}\\)."
          },
          {
            problem: "Tentukan koordinat titik puncak dan persamaan sumbu simetri dari fungsi kuadrat \\(f(x) = x^2 - 4x + 3\\)!",
            options: ["Titik Puncak (2, -1) dan Sumbu Simetri x = 2", "Titik Puncak (-2, 1) dan Sumbu Simetri x = -2", "Titik Puncak (2, 3) dan Sumbu Simetri x = 2", "Titik Puncak (4, -1) dan Sumbu Simetri x = 4"],
            answerIndex: 0,
            solutionSteps: "1. Nilai \\(a = 1, b = -4, c = 3\\).<br>2. Sumbu simetri:<br>\\(x_p = -\\frac{b}{2a} = -\\frac{-4}{2(1)} = 2\\).<br>3. Nilai optimum puncak:<br>\\(y_p = f(2) = (2)^2 - 4(2) + 3 = 4 - 8 + 3 = -1\\).<br>4. Koordinat titik puncak minimum adalah \\((2, -1)\\) dan sumbu simetri adalah garis \\(x = 2\\)."
          }
        ]
      }
    ]
  },

  SMA: {
    10: [
      {
        id: "sma-10-eksponen",
        title: "Eksponen & Logaritma",
        description: "Definisi eksponen, 8 sifat dasar eksponen, persamaan eksponen dasar, konsep logaritma dengan syarat basis-numerus, dan 10 sifat wajib logaritma.",
        icon: "fa-solid fa-bolt",
        fase: "Fase E",
        conceptText: "<strong>Konsep Eksponen & Logaritma:</strong><br>• <strong>Eksponen (Perpangkatan):</strong> Operasi perkalian berulang suatu bilangan pokok (basis) sebanyak bilangan pangkat:<br>$$a^n = \\underbrace{a \\times a \\times a \\times \\dots \\times a}_{n \\text{ faktor}}$$ (di mana \\(a\\) adalah basis dan \\(n\\) adalah pangkat/eksponen).<br><br>• <strong>Logaritma:</strong> Operasi invers (kebalikan) dari perpangkatan yang menentukan besar pangkat dari suatu bilangan pokok:<br>$${}^a\\log b = c \\iff a^c = b$$<br><strong>Syarat Mutlak Eksistensi Logaritma:</strong><br>1. <strong>Basis (\\(a\\)):</strong> Harus bernilai positif dan tidak boleh bernilai satu (\\(a > 0\\) dan \\(a \\neq 1\\)).<br>2. <strong>Numerus (\\(b\\)):</strong> Bilangan yang ditarik nilai logaritmanya harus selalu positif (\\(b > 0\\)).",
        properties: [
          { title: "8 Sifat Dasar Eksponen", desc: "1. Perkalian Basis Sama: \\(a^m \\cdot a^n = a^{m+n}\\)<br>2. Pembagian Basis Sama: \\(\\frac{a^m}{a^n} = a^{m-n}\\) (\\(a \\neq 0\\))<br>3. Pangkat Dipangkatkan: \\((a^m)^n = a^{m \\cdot n}\\)<br>4. Perkalian Dipangkatkan: \\((a \\cdot b)^n = a^n \\cdot b^n\\)<br>5. Pembagian Dipangkatkan: \\(\\left(\\frac{a}{b}\\right)^n = \\frac{a^n}{b^n}\\) (\\(b \\neq 0\\))<br>6. Pangkat Nol: \\(a^0 = 1\\) (\\(a \\neq 0\\))<br>7. Pangkat Negatif: \\(a^{-n} = \\frac{1}{a^n}\\) (\\(a \\neq 0\\))<br>8. Pangkat Pecahan / Bentuk Akar: \\(a^{\\frac{m}{n}} = \\sqrt[n]{a^m}\\) (\\(a > 0, n \\ge 2\\))." },
          { title: "Persamaan Eksponen Dasar", desc: "• Jika \\(a^{f(x)} = a^p\\), maka \\(f(x) = p\\) (untuk \\(a > 0, a \\neq 1\\)).<br>• Jika \\(a^{f(x)} = a^{g(x)}\\), maka \\(f(x) = g(x)\\).<br>• Jika \\(a^{f(x)} = b^{f(x)}\\) dengan \\(a \\neq b\\), maka \\(f(x) = 0\\)." },
          { title: "10 Sifat Wajib Logaritma", desc: "1. Identitas Pokok: \\({}^a\\log a = 1\\) dan \\({}^a\\log 1 = 0\\)<br>2. Penjumlahan Log: \\({}^a\\log(x \\cdot y) = {}^a\\log x + {}^a\\log y\\)<br>3. Pengurangan Log: \\({}^a\\log\\left(\\frac{x}{y}\\right) = {}^a\\log x - {}^a\\log y\\)<br>4. Numerus Berpangkat: \\({}^a\\log(x^n) = n \\cdot {}^a\\log x\\)<br>5. Pangkat Basis & Numerus: \\({}^{a^m}\\log(b^n) = \\frac{n}{m} \\cdot {}^a\\log b\\)<br>6. Perubahan Basis Sembarang: \\({}^a\\log b = \\frac{{}^p\\log b}{{}^p\\log a} = \\frac{\\log b}{\\log a}\\) (\\(p > 0, p \\neq 1\\))<br>7. Pembalikan Basis: \\({}^a\\log b = \\frac{1}{{}^b\\log a}\\)<br>8. Perkalian Berantai: \\({}^a\\log b \\cdot {}^b\\log c \\cdot {}^c\\log d = {}^a\\log d\\)<br>9. Eksponen Berpangkat Logaritma: \\(a^{{}^a\\log b} = b\\)<br>10. Sifat Pertukaran Nilai: \\(a^{{}^c\\log b} = b^{{}^c\\log a}\\)." }
        ],
        visualSvg: "",
        exampleProblems: [
          {
            problem: "Tentukan nilai \\(x\\) yang memenuhi persamaan eksponen: \\(4^{x+1} = 8^{2x-1}\\)!",
            options: ["\\(x = \\frac{5}{4}\\)", "\\(x = \\frac{4}{5}\\)", "\\(x = \\frac{5}{2}\\)", "\\(x = 1\\)"],
            answerIndex: 0,
            solutionSteps: "1. Samakan basis kedua ruas ke bilangan pokok 2:<br>\\((2^2)^{x+1} = (2^3)^{2x-1}\\)<br>2. Kalikan pangkatnya:<br>\\(2^{2x+2} = 2^{6x-3}\\)<br>3. Samakan eksponennya:<br>\\(2x + 2 = 6x - 3 \\implies 4x = 5 \\implies x = \\frac{5}{4}\\)."
          },
          {
            problem: "Tentukan hasil dari operasi logaritma: \\({}^3\\log 54 + {}^3\\log 18 - {}^3\\log 12\\)!",
            options: ["3", "4", "5", "9"],
            answerIndex: 1,
            solutionSteps: "1. Gabungkan operasi menggunakan sifat penjumlahan dan pengurangan logaritma:<br>\\({}^3\\log 54 + {}^3\\log 18 - {}^3\\log 12 = {}^3\\log\\left(\\frac{54 \\times 18}{12}\\right)\\)<br>2. Sederhanakan pecahan:<br>\\(\\frac{54 \\times 18}{12} = \\frac{54 \\times 3}{2} = 27 \\times 3 = 81\\)<br>3. Hitung logaritma:<br>\\({}^3\\log 81 = {}^3\\log(3^4) = 4 \\cdot {}^3\\log 3 = 4 \\times 1 = 4\\)."
          }
        ]
      }
    ],
    11: [
      {
        id: "sma-11-matriks",
        title: "Matriks & Determinasi",
        description: "Pengertian ordo, transpose, kesamaan matriks, operasi penjumlahan-pengurangan-perkalian matriks, determinan 2x2 dan 3x3 (Sarrus), serta invers matriks 2x2 dan syarat matriks singular.",
        icon: "fa-solid fa-table-cells",
        fase: "Fase F",
        conceptText: "<strong>Pengertian & Struktur Matriks:</strong><br>• <strong>Matriks:</strong> Susunan skalar bilangan atau fungsi dalam bentuk baris (horizontal) dan kolom (vertikal) yang dilingkupi tanda kurung biasa \\((\\dots)\\) atau kurung siku \\([\\dots]\\).<br>• <strong>Ordo Matriks:</strong> Ukuran dimensi matriks dinyatakan sebagai \\(m \\times n\\), di mana \\(m\\) adalah banyaknya baris dan \\(n\\) adalah banyaknya kolom.<br>• <strong>Transpose Matriks (\\(A^T\\) atau \\(A'\\)):</strong> Operasi menukar susunan elemen baris menjadi kolom dan sebaliknya. Jika matriks \\(A\\) berordo \\(m \\times n\\), maka \\(A^T\\) berordo \\(n \\times m\\). Elemen \\((A^T)_{ij} = A_{ji}\\).<br>• <strong>Kesamaan Dua Matriks:</strong> Matriks \\(A\\) dan \\(B\\) dikatakan sama (\\(A = B\\)) jika keduanya memiliki ordo yang persis sama dan setiap elemen yang seletak bernilai sama (\\(a_{ij} = b_{ij}\\)).",
        properties: [
          { title: "Penjumlahan & Pengurangan Matriks", desc: "Hanya terdefinisi untuk dua matriks berordo sama persis. Dihitung dengan menjumlahkan atau mengurangkan elemen-elemen yang seletak:<br>$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\pm \\begin{pmatrix} e & f \\\\ g & h \\end{pmatrix} = \\begin{pmatrix} a \\pm e & b \\pm f \\\\ c \\pm g & d \\pm h \\end{pmatrix}$$" },
          { title: "Perkalian Dua Matriks (A × B)", desc: "Matriks \\(A_{m \\times k}\\) dapat dikalikan dengan \\(B_{k \\times n}\\) menghasilkan matriks \\(C_{m \\times n}\\). Syarat mutlak: <strong>banyak kolom matriks pertama harus sama dengan banyak baris matriks kedua</strong>.<br>Metode Baris kali Kolom:<br>$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\begin{pmatrix} e & f \\\\ g & h \\end{pmatrix} = \\begin{pmatrix} ae+bg & af+bh \\\\ ce+dg & cf+dh \\end{pmatrix}$$<br><em>(Catatan: Perkalian matriks pada umumnya tidak bersifat komutatif: \\(AB \\neq BA\\))</em>." },
          { title: "Determinan Matriks 2x2", desc: "Selisih perkalian elemen diagonal utama dengan diagonal samping:<br>$$\\det(A) = |A| = \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = ad - bc$$" },
          { title: "Determinan Matriks 3x3 (Aturan Sarrus)", desc: "Tuliskan kembali kolom ke-1 dan ke-2 di sebelah kanan matriks:<br>$$|A| = \\begin{vmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{vmatrix} = (aei + bfg + cdh) - (ceg + afh + bdi)$$" },
          { title: "Invers Matriks 2x2 & Syarat Matriks Singular", desc: "Invers matriks \\(A\\) didefinisikan sebagai \\(A \\cdot A^{-1} = I\\):<br>$$A^{-1} = \\frac{1}{\\det(A)} \\text{Adj}(A) = \\frac{1}{ad - bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}$$<br>• <strong>Matriks Singular:</strong> Matriks dengan determinan bernilai nol (\\(\\det(A) = 0\\)). Matriks singular <strong>tidak memiliki invers</strong>.<br>• <strong>Matriks Non-Singular:</strong> Matriks dengan \\(\\det(A) \\neq 0\\), sehingga inversnya terdefinisi dan tunggal." }
        ],
        visualSvg: "",
        exampleProblems: [
          {
            problem: "Diketahui matriks \\(A = \\begin{pmatrix} 2 & 3 \\\\ 1 & 4 \\end{pmatrix}\\) dan \\(B = \\begin{pmatrix} 1 & 2 \\\\ 3 & 0 \\end{pmatrix}\\). Tentukan hasil perkalian matriks \\(A \\cdot B\\)!",
            options: ["\\(\\begin{pmatrix} 11 & 4 \\\\ 13 & 2 \\end{pmatrix}\\)", "\\(\\begin{pmatrix} 7 & 4 \\\\ 13 & 2 \\end{pmatrix}\\)", "\\(\\begin{pmatrix} 11 & 4 \\\\ 10 & 2 \\end{pmatrix}\\)", "\\(\\begin{pmatrix} 5 & 6 \\\\ 3 & 0 \\end{pmatrix}\\)"],
            answerIndex: 0,
            solutionSteps: "Gunakan aturan perkalian baris kali kolom:<br>• Baris 1 Kolom 1 = \\((2)(1) + (3)(3) = 2 + 9 = 11\\)<br>• Baris 1 Kolom 2 = \\((2)(2) + (3)(0) = 4 + 0 = 4\\)<br>• Baris 2 Kolom 1 = \\((1)(1) + (4)(3) = 1 + 12 = 13\\)<br>• Baris 2 Kolom 2 = \\((1)(2) + (4)(0) = 2 + 0 = 2\\)<br>Hasil = \\(\\begin{pmatrix} 11 & 4 \\\\ 13 & 2 \\end{pmatrix}\\)."
          },
          {
            problem: "Tentukan nilai \\(x\\) agar matriks \\(M = \\begin{pmatrix} 2x & 4 \\\\ 3 & x - 1 \\end{pmatrix}\\) menjadi matriks singular!",
            options: ["\\(x = 3\\) atau \\(x = -2\\)", "\\(x = -3\\) atau \\(x = 2\\)", "\\(x = 4\\) atau \\(x = -3\\)", "\\(x = 6\\) atau \\(x = -1\\)"],
            answerIndex: 0,
            solutionSteps: "1. Syarat matriks singular adalah determinannya sama dengan nol: \\(\\det(M) = 0\\).<br>2. \\(\\det(M) = (2x)(x - 1) - (4)(3) = 0\\)<br>\\(2x^2 - 2x - 12 = 0\\)<br>3. Bagi kedua ruas dengan 2:<br>\\(x^2 - x - 6 = 0\\)<br>4. Faktorkan:<br>\\((x - 3)(x + 2) = 0 \\implies x = 3\\) atau \\(x = -2\\)."
          }
        ]
      }
    ],
    12: [
      {
        id: "sma-12-limit-aljabar",
        title: "Limit Aljabar",
        description: "Konsep dasar limit mendekati nilai c, metode substitusi langsung bentuk tentu, metode pemfaktoran, perkalian akar sekawan, Dalil L'Hopital (0/0), dan limit tak hingga.",
        icon: "fa-solid fa-calculator",
        fase: "Fase F+",
        conceptText: "<strong>Definisi & Konsep Dasar Limit Fungsi:</strong><br>Limit suatu fungsi menyatakan nilai pendekatan \\(f(x)\\) ketika variabel \\(x\\) bergerak mendekati suatu konstanta tertentu \\(c\\) (baik didekati dari sisi kiri \\(x \\to c^-\\) maupun dari sisi kanan \\(x \\to c^+\\)):<br>$$\\lim_{x \\to c} f(x) = L$$<br>Limit dikatakan terdefinisi jika dan hanya jika limit kiri sama dengan limit kanan: \\(\\lim_{x \\to c^-} f(x) = \\lim_{x \\to c^+} f(x) = L\\).<br><br>• <strong>Bentuk Tentu:</strong> Ketika substitusi langsung \\(x = c\\) langsung menghasilkan nilai bilangan riil tertentu (misal \\(k\\), \\(0\\), atau \\(\\frac{k}{0} \\to \\infty\\)). Nilai tersebut adalah hasil limitnya.<br>• <strong>Bentuk Tak Tentu:</strong> Ketika substitusi menghasilkan \\(\\left[\\frac{0}{0}\\right]\\), \\(\\left[\\frac{\\infty}{\\infty}\\right]\\), atau \\([\\infty - \\infty]\\). Bentuk ini wajib diolah dengan manipulasi aljabar.",
        properties: [
          { title: "Metode Substitusi Langsung", desc: "Langkah pertama evaluasi setiap limit adalah memasukkan \\(x = c\\) ke dalam fungsi. Jika hasilnya bernilai riil tertentu, perhitungan selesai. Contoh: \\(\\lim_{x \\to 2} (3x^2 - 4x + 1) = 3(4) - 8 + 1 = 5\\)." },
          { title: "Metode Pemfaktoran (Bentuk 0/0)", desc: "Memfaktorkan pembilang dan penyebut untuk mencoret faktor pembuat nol \\((x - c)\\):<br>$$\\lim_{x \\to 3} \\frac{x^2 - 9}{x - 3} = \\lim_{x \\to 3} \\frac{(x - 3)(x + 3)}{x - 3} = \\lim_{x \\to 3} (x + 3) = 6$$" },
          { title: "Mengalikan dengan Akar Sekawan", desc: "Digunakan pada limit pecahan yang memuat bentuk akar \\(\\sqrt{f(x)} \\pm \\sqrt{g(x)}\\). Kalikan pembilang dan penyebut dengan pasangan akar sekawannya memanfaatkan rumus selisih kuadrat \\((\\sqrt{a} - b)(\\sqrt{a} + b) = a - b^2\\)." },
          { title: "Dalil L'Hopital", desc: "Jika substitusi menghasilkan bentuk tak tentu \\(\\left[\\frac{0}{0}\\right]\\) atau \\(\\left[\\frac{\\infty}{\\infty}\\right]\\), maka:<br>$$\\lim_{x \\to c} \\frac{f(x)}{g(x)} = \\lim_{x \\to c} \\frac{f'(x)}{g'(x)}$$<br>(Turunkan pembilang dan penyebut secara terpisah sampai bentuk \\(\\frac{0}{0}\\) hilang)." },
          { title: "Limit Mendekati Tak Hingga (x → ∞)", desc: "Bagi setiap suku dengan variabel pangkat tertinggi penyebut (\\(x^n\\)).<br>Rumus praktis fungsi rasional \\(\\lim_{x \\to \\infty} \\frac{a x^m + \\dots}{b x^n + \\dots}\\):<br>• Jika \\(m = n\\) (pangkat sama), nilai limit = \\(\\frac{a}{b}\\).<br>• Jika \\(m < n\\) (pangkat penyebut lebih besar), nilai limit = \\(0\\).<br>• Jika \\(m > n\\) (pangkat pembilang lebih besar), nilai limit = \\(\\infty\\) atau \\(-\\infty\\)." },
          { title: "Selisih Akar Mendekati Tak Hingga", desc: "$$\\lim_{x \\to \\infty} \\left(\\sqrt{ax^2 + bx + c} - \\sqrt{ax^2 + px + q}\\right) = \\frac{b - p}{2\\sqrt{a}}$$" }
        ],
        visualSvg: "",
        exampleProblems: [
          {
            problem: "Tentukan nilai limit aljabar berikut: \\(\\lim_{x \\to 2} \\frac{x^2 + x - 6}{x^2 - 4}\\)!",
            options: ["\\(\\frac{5}{4}\\)", "\\(\\frac{3}{4}\\)", "\\(\\frac{5}{2}\\)", "1"],
            answerIndex: 0,
            solutionSteps: "1. Substitusi \\(x = 2 \\implies \\frac{4 + 2 - 6}{4 - 4} = \\frac{0}{0}\\) (Bentuk Tak Tentu).<br>2. Faktorkan pembilang dan penyebut:<br>• Pembilang = \\((x - 2)(x + 3)\\)<br>• Penyebut = \\((x - 2)(x + 2)\\)<br>3. Sederhanakan pembuat nol \\((x - 2)\\):<br>\\(\\lim_{x \\to 2} \\frac{x + 3}{x + 2} = \\frac{2 + 3}{2 + 2} = \\frac{5}{4}\\)."
          },
          {
            problem: "Hitung nilai dari limit bentuk akar: \\(\\lim_{x \\to 0} \\frac{x}{\\sqrt{4 + x} - 2}\\)!",
            options: ["2", "4", "\\(\\frac{1}{4}\\)", "8"],
            answerIndex: 1,
            solutionSteps: "1. Substitusi \\(x = 0 \\implies \\frac{0}{\\sqrt{4}-2} = \\frac{0}{0}\\).<br>2. Kalikan akar sekawan \\(\\frac{\\sqrt{4+x}+2}{\\sqrt{4+x}+2}\\):<br>\\(\\lim_{x \\to 0} \\frac{x(\\sqrt{4+x} + 2)}{(4 + x) - 4} = \\lim_{x \\to 0} \\frac{x(\\sqrt{4+x} + 2)}{x}\\)<br>3. Coret variabel \\(x\\):<br>\\(\\lim_{x \\to 0} (\\sqrt{4+x} + 2) = \\sqrt{4+0} + 2 = 2 + 2 = 4\\)."
          }
        ]
      },
      {
        id: "sma-12-limit-trigono",
        title: "Limit Trigonometri",
        description: "Teorema limit trigonometri dasar sin(ax)/bx dan tan(ax)/bx, strategi identitas sudut ganda 1-cos(ax), dan penyelesaian soal tingkat dasar serta menengah.",
        icon: "fa-solid fa-wave-square",
        fase: "Fase F+",
        conceptText: "<strong>Konsep Dasar Limit Trigonometri:</strong><br>Limit trigonometri mengevaluasi kecenderungan nilai fungsi perbandingan trigonometri ketika sudut variabel mendekati suatu nilai acuan (biasanya \\(x \\to 0\\)).<br><br>Perhatikan karakteristik nilai saat \\(x \\to 0\\):<br>• \\(\\sin 0 = 0\\) dan \\(\\tan 0 = 0 \\implies\\) merupakan sumber utama pembuat bentuk tak tentu \\(\\left[\\frac{0}{0}\\right]\\).<br>• \\(\\cos 0 = 1 \\implies\\) fungsi kosinus yang berdiri sendiri sebagai faktor pengali bernilai 1 dan tidak menghasilkan nol, sehingga dapat disubstitusikan secara langsung.",
        properties: [
          { title: "Teorema Limit Trigonometri Dasar (x → 0)", desc: "Untuk sebarang konstanta riil \\(a, b \\neq 0\\):<br>$$\\lim_{x \\to 0} \\frac{\\sin ax}{bx} = \\frac{a}{b}, \\quad \\lim_{x \\to 0} \\frac{ax}{\\sin bx} = \\frac{a}{b}$$<br>$$\\lim_{x \\to 0} \\frac{\\tan ax}{bx} = \\frac{a}{b}, \\quad \\lim_{x \\to 0} \\frac{ax}{\\tan bx} = \\frac{a}{b}$$<br>$$\\lim_{x \\to 0} \\frac{\\sin ax}{\\tan bx} = \\frac{a}{b}, \\quad \\lim_{x \\to 0} \\frac{\\tan ax}{\\sin bx} = \\frac{a}{b}$$<br><em>(Perhatian: Rumus teorema dasar ini hanya berlaku untuk sinus dan tangen, tidak berlaku langsung untuk kosinus)</em>." },
          { title: "Strategi Identitas Sudut Ganda Kosinus", desc: "Bentuk \\(1 - \\cos(ax)\\) wajib diubah ke bentuk sinus menggunakan rumus identitas sudut rangkap kosinus:<br>$$\\cos(2\\theta) = 1 - 2\\sin^2\\theta \\iff 1 - \\cos(ax) = 2\\sin^2\\left(\\frac{ax}{2}\\right)$$<br>Contoh aplikasi penting:<br>• \\(1 - \\cos(2x) = 2\\sin^2(x)\\)<br>• \\(1 - \\cos(4x) = 2\\sin^2(2x)\\)<br>• \\(1 - \\cos(6x) = 2\\sin^2(3x)\\)." },
          { title: "Strategi Rumus Jumlah & Selisih Kosinus", desc: "$$\\cos A - \\cos B = -2\\sin\\left(\\frac{A + B}{2}\\right)\\sin\\left(\\frac{A - B}{2}\\right)$$" },
          { title: "Penerapan Dalil L'Hopital Trigonometri", desc: "Jika bentuk tak tentu \\(\\left[\\frac{0}{0}\\right]\\) terpenuhi, turunan dapat digunakan:<br>$$\\lim_{x \\to 0} \\frac{f(x)}{g(x)} = \\lim_{x \\to 0} \\frac{f'(x)}{g'(x)}$$<br>Ingat turunan: \\((\\sin ax)' = a\\cos ax\\), \\((\\cos ax)' = -a\\sin ax\\), dan \\((\\tan ax)' = a\\sec^2 ax\\)." }
        ],
        visualSvg: "",
        exampleProblems: [
          {
            problem: "Tentukan nilai dari limit trigonometri dasar: \\(\\lim_{x \\to 0} \\frac{\\sin 6x + \\tan 2x}{4x}\\)!",
            options: ["2", "1", "4", "\\(\\frac{3}{2}\\)"],
            answerIndex: 0,
            solutionSteps: "1. Pisahkan pecahan limit menjadi dua suku terpisah:<br>\\(\\lim_{x \\to 0} \\frac{\\sin 6x}{4x} + \\lim_{x \\to 0} \\frac{\\tan 2x}{4x}\\)<br>2. Gunakan teorema dasar limit:<br>\\(= \\frac{6}{4} + \\frac{2}{4} = \\frac{8}{4} = 2\\)."
          },
          {
            problem: "Hitunglah nilai dari limit trigonometri: \\(\\lim_{x \\to 0} \\frac{1 - \\cos 6x}{2x^2}\\)!",
            options: ["9", "6", "3", "18"],
            answerIndex: 0,
            solutionSteps: "1. Substitusi \\(x = 0 \\implies \\frac{1 - 1}{0} = \\frac{0}{0}\\) (Tak Tentu).<br>2. Ubah bentuk \\(1 - \\cos 6x\\) menjadi \\(2\\sin^2(3x)\\):<br>\\(\\lim_{x \\to 0} \\frac{2\\sin^2(3x)}{2x^2} = \\lim_{x \\to 0} \\frac{\\sin(3x) \\cdot \\sin(3x)}{x \\cdot x}\\)<br>3. Terapkan teorema limit:<br>\\(= \\lim_{x \\to 0} \\left(\\frac{\\sin 3x}{x}\\right) \\cdot \\lim_{x \\to 0} \\left(\\frac{\\sin 3x}{x}\\right) = 3 \\times 3 = 9\\)."
          }
        ]
      },
      {
        id: "sma-12-turunan",
        title: "Turunan (Diferensial)",
        description: "Definisi turunan berbasis limit, aturan pangkat, aturan rantai, perkalian (uv)' dan pembagian (u/v)', turunan trigonometri, persamaan garis singgung, interval fungsi naik/turun, dan titik stasioner.",
        icon: "fa-solid fa-chart-line",
        fase: "Fase F+",
        conceptText: "<strong>Konsep Dasar & Definisi Turunan Berbasis Limit:</strong><br>Turunan (diferensial) merepresentasikan laju perubahan sesaat (instantaneous rate of change) dari nilai fungsi \\(f(x)\\) terhadap peubah \\(x\\). Secara geometris, nilai turunan pertama di titik \\(x = c\\) adalah kemiringan (gradien) garis singgung kurva di titik \\((c, f(c))\\).<br><br>Definisi formal turunan berbasis konsep limit:<br>$$f'(x) = \\frac{df}{dx} = \\lim_{h \\to 0} \\frac{f(x + h) - f(x)}{h}$$",
        properties: [
          { title: "Aturan Dasar Turunan Pangkat Aljabar", desc: "• Konstanta: \\(\\frac{d}{dx}(c) = 0\\)<br>• Fungsi Linear: \\(\\frac{d}{dx}(ax) = a\\)<br>• <strong>Aturan Pangkat:</strong> \\(y = a x^n \\implies y' = a \\cdot n x^{n-1}\\)<br>• Sifat Linear: \\((u \\pm v)' = u' \\pm v'\\) dan \\((k \\cdot u)' = k \\cdot u'\\)." },
          { title: "Aturan Perkalian & Pembagian Turunan", desc: "• <strong>Aturan Perkalian:</strong> \\((u \\cdot v)' = u'v + uv'\\)<br>• <strong>Aturan Pembagian:</strong> \\(\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}\\) (dengan \\(v \\neq 0\\))." },
          { title: "Aturan Rantai (Chain Rule)", desc: "Jika \\(y = f(u)\\) dan \\(u = g(x)\\), maka:<br>$$\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}$$<br>Untuk fungsi komposit berpangkat \\(y = [u(x)]^n\\):<br>$$y' = n [u(x)]^{n-1} \\cdot u'(x)$$" },
          { title: "Turunan Fungsi Trigonometri Dasar", desc: "• \\(\\frac{d}{dx}(\\sin x) = \\cos x\\)<br>• \\(\\frac{d}{dx}(\\cos x) = -\\sin x\\)<br>• \\(\\frac{d}{dx}(\\tan x) = \\sec^2 x\\)<br>• \\(\\frac{d}{dx}(\\cot x) = -\\csc^2 x\\)" },
          { title: "Aplikasi 1: Gradien Garis Singgung Kurva", desc: "• Gradien garis singgung di titik \\((x_1, y_1)\\) adalah \\(m = f'(x_1)\\).<br>• Persamaan Garis Singgung (PGS): \\(y - y_1 = m(x - x_1)\\).<br>• Garis Normal (tegak lurus PGS): \\(m_n = -\\frac{1}{m}\\), persamaan \\(y - y_1 = -\\frac{1}{m}(x - x_1)\\)." },
          { title: "Aplikasi 2: Interval Fungsi Naik & Turun", desc: "• Fungsi <strong>Naik</strong> pada interval di mana \\(f'(x) > 0\\).<br>• Fungsi <strong>Turun</strong> pada interval di mana \\(f'(x) < 0\\)." },
          { title: "Aplikasi 3: Titik Stasioner & Nilai Ekstrim", desc: "Syarat titik stasioner (kritis) adalah \\(f'(x) = 0\\).<br>Uji Turunan Kedua \\(f''(x)\\):<br>• Jika \\(f''(x_0) < 0 \\implies\\) Titik Balik <strong>Maksimum</strong> Relatif.<br>• Jika \\(f''(x_0) > 0 \\implies\\) Titik Balik <strong>Minimum</strong> Relatif.<br>• Jika \\(f''(x_0) = 0 \\implies\\) Uji turunan pertama untuk mengidentifikasi titik belok." }
        ],
        visualSvg: "",
        exampleProblems: [
          {
            problem: "Tentukan persamaan garis singgung pada kurva \\(y = x^2 - 4x + 5\\) di titik yang berabsis \\(x = 3\\)!",
            options: ["\\(y = 2x - 4\\)", "\\(y = 2x - 3\\)", "\\(y = 4x - 10\\)", "\\(y = -2x + 8\\)"],
            answerIndex: 0,
            solutionSteps: "1. Tentukan nilai ordinat \\(y_1\\) pada \\(x = 3\\):<br>\\(y_1 = (3)^2 - 4(3) + 5 = 9 - 12 + 5 = 2 \\implies\\) titik singgung \\((3, 2)\\).<br>2. Cari gradien \\(m = y' = 2x - 4\\):<br>Pada \\(x = 3 \\implies m = 2(3) - 4 = 2\\).<br>3. Susun Persamaan Garis Singgung:<br>\\(y - y_1 = m(x - x_1) \\implies y - 2 = 2(x - 3)\\)<br>\\(y - 2 = 2x - 6 \\implies y = 2x - 4\\)."
          },
          {
            problem: "Tentukan turunan pertama dari fungsi \\(f(x) = (3x^2 - 2)^4\\) menggunakan aturan rantai!",
            options: ["\\(24x(3x^2 - 2)^3\\)", "\\(12x(3x^2 - 2)^3\\)", "\\(4(3x^2 - 2)^3\\)", "\\(24x^2(3x^2 - 2)^3\\)"],
            answerIndex: 0,
            solutionSteps: "1. Misalkan \\(u = 3x^2 - 2 \\implies u'(x) = 6x\\).<br>2. Fungsi menjadi \\(f(u) = u^4\\), dengan turunan luar \\(4u^3\\).<br>3. Terapkan Aturan Rantai:<br>\\(f'(x) = 4u^3 \\cdot u'(x) = 4(3x^2 - 2)^3 \\cdot (6x) = 24x(3x^2 - 2)^3\\)."
          }
        ]
      },
      {
        id: "sma-12-integral",
        title: "Integral",
        description: "Konsep integral sebagai anti-turunan, integral tak tentu aljabar dan trigonometri dasar, teknik substitusi dan integral parsial, integral tentu (Teorema Fundamental Kalkulus), serta aplikasi luas daerah di bawah kurva.",
        icon: "fa-solid fa-infinity",
        fase: "Fase F+",
        conceptText: "<strong>Konsep Dasar Integral Sebagai Anti-Turunan:</strong><br>Integral merupakan operasi balikan (invers) dari pendiferensialan (turunan), sering dinamakan <strong>Anti-Turunan</strong> atau <strong>Anti-Diferensial</strong>. Jika diketahui laju perubahan fungsi \\(f(x)\\), operasi integral merekonstruksi fungsi asalnya \\(F(x)\\):<br>$$\\int f(x) \\, dx = F(x) + C \\iff F'(x) = f(x)$$<br>di mana \\(\\int\\) adalah notasi integral, \\(f(x)\\) adalah <em>integran</em>, \\(dx\\) adalah diferensial penunjuk variabel integrasi, dan \\(C\\) adalah <em>konstanta integrasi</em> sembarang (karena turunan dari sebarang konstanta adalah nol).",
        properties: [
          { title: "Integral Tak Tentu Aljabar", desc: "• Aturan Pangkat Aljabar:<br>$$\\int a x^n \\, dx = \\frac{a}{n + 1} x^{n+1} + C \\quad (n \\neq -1)$$<br>• Kasus khusus pangkat \\(n = -1\\):<br>$$\\int \\frac{1}{x} \\, dx = \\ln|x| + C$$<br>• Sifat Linear: \\(\\int [a f(x) \\pm b g(x)] \\, dx = a \\int f(x) \\, dx \\pm b \\int g(x) \\, dx\\)." },
          { title: "Integral Tak Tentu Trigonometri Dasar", desc: "• \\(\\int \\cos x \\, dx = \\sin x + C\\)<br>• \\(\\int \\sin x \\, dx = -\\cos x + C\\)<br>• \\(\\int \\sec^2 x \\, dx = \\tan x + C\\)<br>• \\(\\int \\cos(ax + b) \\, dx = \\frac{1}{a} \\sin(ax + b) + C\\)<br>• \\(\\int \\sin(ax + b) \\, dx = -\\frac{1}{a} \\cos(ax + b) + C\\)" },
          { title: "Metode Integrasi Substitusi", desc: "Digunakan ketika integran memuat fungsi komposit dan turunan faktor dalamnya:<br>$$\\int f(g(x)) \\cdot g'(x) \\, dx = \\int f(u) \\, du$$<br>Langkah: Tentukan pemisalan \\(u = g(x)\\), hitung \\(du = g'(x)dx\\), integralkan terhadap \\(u\\), lalu kembalikan ke peubah \\(x\\)." },
          { title: "Metode Integrasi Parsial", desc: "Digunakan untuk perkalian dua fungsi yang tidak dapat diselesaikan dengan substitusi sederhana:<br>$$\\int u \\, dv = u \\cdot v - \\int v \\, du$$<br>Urutan prioritas penentuan fungsi \\(u\\) (Aturan LIATE): <strong>L</strong>ogarithmic, <strong>I</strong>nverse Trig, <strong>A</strong>lgebraic, <strong>T</strong>rigonometric, <strong>E</strong>xponential." },
          { title: "Integral Tentu (Teorema Fundamental Kalkulus)", desc: "Integral yang memiliki batas integrasi bawah \\(a\\) dan batas atas \\(b\\):<br>$$\\int_a^b f(x) \\, dx = [F(x)]_a^b = F(b) - F(a)$$<br>Sifat-sifat penting:<br>• \\(\\int_a^a f(x) dx = 0\\)<br>• \\(\\int_b^a f(x) dx = -\\int_a^b f(x) dx\\)<br>• \\(\\int_a^b f(x) dx = \\int_a^c f(x) dx + \\int_c^b f(x) dx\\)." },
          { title: "Aplikasi: Menghitung Luas Daerah Kurva", desc: "• Luas antara kurva \\(y = f(x)\\) dan sumbu X pada interval \\([a, b]\\):<br>$$L = \\int_a^b f(x) \\, dx \\quad (\\text{jika } f(x) \\ge 0)$$<br>• Luas daerah yang dibatasi oleh dua kurva \\(y_1 = f(x)\\) (kurva atas) dan \\(y_2 = g(x)\\) (kurva bawah):<br>$$L = \\int_a^b [f(x) - g(x)] \\, dx$$" }
        ],
        visualSvg: "",
        exampleProblems: [
          {
            problem: "Hitunglah nilai dari integral tentu: \\(\\int_0^2 (3x^2 + 2x - 1) \\, dx\\)!",
            options: ["10", "8", "12", "6"],
            answerIndex: 0,
            solutionSteps: "1. Tentukan fungsi anti-turunan \\(F(x)\\):<br>\\(F(x) = \\left[ \\frac{3}{3}x^3 + \\frac{2}{2}x^2 - x \\right]_0^2 = [x^3 + x^2 - x]_0^2\\).<br>2. Masukkan batas atas \\(x = 2\\):<br>\\(F(2) = (2)^3 + (2)^2 - (2) = 8 + 4 - 2 = 10\\).<br>3. Masukkan batas bawah \\(x = 0\\):<br>\\(F(0) = 0\\).<br>4. Hasil akhir: \\(F(2) - F(0) = 10 - 0 = 10\\)."
          },
          {
            problem: "Tentukan luas daerah tertutup yang dibatasi oleh kurva parabola \\(y = 6x - x^2\\) dan sumbu X!",
            options: ["36 Satuan Luas", "18 Satuan Luas", "72 Satuan Luas", "24 Satuan Luas"],
            answerIndex: 0,
            solutionSteps: "1. Tentukan titik potong dengan sumbu X (\\(y = 0\\)):<br>\\(6x - x^2 = 0 \\implies x(6 - x) = 0 \\implies x = 0\\) dan \\(x = 6\\).<br>2. Hitung luas dengan integral tentu batas \\(0\\) sampai \\(6\\):<br>\\(L = \\int_0^6 (6x - x^2) \\, dx = \\left[ 3x^2 - \\frac{1}{3}x^3 \\right]_0^6\\)<br>3. Evaluasi nilai batas:<br>\\(L = \\left(3(6)^2 - \\frac{1}{3}(6)^3\\right) - 0 = (3 \\times 36 - \\frac{216}{3}) = 108 - 72 = 36\\text{ satuan luas}\\)."
          }
        ]
      }
    ]
  }
};


// ==========================================
// 7. RANGKUMAN MATERI NAVIGATION LOGIC
// ==========================================
let activeJenjang = "SD";
let activeKelas = 1;

const btnFilterSD = document.getElementById("btnFilterSD");
const btnFilterSMP = document.getElementById("btnFilterSMP");
const btnFilterSMA = document.getElementById("btnFilterSMA");
const kelasButtonsContainer = document.getElementById("kelasButtonsContainer");
const materiCatalogGrid = document.getElementById("materiCatalogGrid");
const selectedJenjangBadge = document.getElementById("selectedJenjangBadge");
const selectedKelasBadge = document.getElementById("selectedKelasBadge");
const catalogGridTitle = document.getElementById("catalogGridTitle");
const materiCountBadge = document.getElementById("materiCountBadge");

const materiCatalogView = document.getElementById("materiCatalogView");
const materiDetailContainer = document.getElementById("materiDetailContainer");
const btnBackToCatalogTop = document.getElementById("btnBackToCatalogTop");
const btnBackToCatalogBottom = document.getElementById("btnBackToCatalogBottom");

function setJenjangFilter(jenjang) {
  activeJenjang = jenjang;
  [btnFilterSD, btnFilterSMP, btnFilterSMA].forEach(btn => btn?.classList.remove("active"));

  if (jenjang === "SD") {
    btnFilterSD?.classList.add("active");
    if (selectedJenjangBadge) selectedJenjangBadge.textContent = "SD (Fase A-C)";
  } else if (jenjang === "SMP") {
    btnFilterSMP?.classList.add("active");
    if (selectedJenjangBadge) selectedJenjangBadge.textContent = "SMP (Fase D)";
  } else if (jenjang === "SMA") {
    btnFilterSMA?.classList.add("active");
    if (selectedJenjangBadge) selectedJenjangBadge.textContent = "SMA/SMK (Fase E & F)";
  }

  activeKelas = "all";

  renderKelasButtons();
  renderCatalogGrid();
}

function renderKelasButtons() {
  if (!kelasButtonsContainer) return;
  kelasButtonsContainer.innerHTML = "";

  let classList = [];
  if (activeJenjang === "SD") classList = ["all", 1, 2, 3, 4, 5, 6];
  else if (activeJenjang === "SMP") classList = ["all", 7, 8, 9];
  else if (activeJenjang === "SMA") classList = ["all", 10, 11, 12];

  classList.forEach(k => {
    const btn = document.createElement("button");
    const isSelected = k === activeKelas;
    btn.className = `kelas-filter-btn px-4 py-2 rounded-xl text-xs font-bold border ${isSelected
      ? "active border-emerald-500 bg-emerald-500 text-white"
      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-400"
      } transition`;

    btn.textContent = k === "all" ? `Seluruh Kelas (${activeJenjang === 'SD' ? '1-6' : activeJenjang === 'SMP' ? '7-9' : '10-12'})` : `Kelas ${k}`;
    btn.addEventListener("click", () => {
      activeKelas = k;
      renderKelasButtons();
      renderCatalogGrid();
    });
    kelasButtonsContainer.appendChild(btn);
  });

  if (selectedKelasBadge) {
    selectedKelasBadge.textContent = activeKelas === "all"
      ? `Seluruh Kelas ${activeJenjang} (${activeJenjang === 'SD' ? 'Kelas 1 - 6' : activeJenjang === 'SMP' ? 'Kelas 7 - 9' : 'Kelas 10 - 12'})`
      : `Kelas ${activeKelas} ${activeJenjang}`;
  }
}

function renderCatalogGrid() {
  if (!materiCatalogGrid) return;
  materiCatalogGrid.innerHTML = "";

  let topics = [];
  if (activeKelas === "all") {
    const jenjangData = curriculumData[activeJenjang] || {};
    Object.keys(jenjangData).forEach(k => {
      (jenjangData[k] || []).forEach(t => {
        topics.push({ ...t, kelasNum: k });
      });
    });
  } else {
    const list = (curriculumData[activeJenjang] && curriculumData[activeJenjang][activeKelas]) || [];
    topics = list.map(t => ({ ...t, kelasNum: activeKelas }));
  }

  if (catalogGridTitle) {
    catalogGridTitle.textContent = activeKelas === "all"
      ? `Daftar Topik Materi - Seluruh Kelas ${activeJenjang}`
      : `Daftar Topik Materi - Kelas ${activeKelas} ${activeJenjang}`;
  }
  if (materiCountBadge) materiCountBadge.textContent = `${topics.length} Topik Tersedia`;

  if (topics.length === 0) {
    materiCatalogGrid.innerHTML = `<div class="col-span-full p-8 text-center text-slate-400 text-sm">Belum ada materi untuk kelas ini.</div>`;
    return;
  }

  topics.forEach(t => {
    const card = document.createElement("div");
    card.className = "materi-card bento-card p-6 flex flex-col justify-between space-y-4 cursor-pointer group hover:-translate-y-1.5 hover:shadow-lg transition-all duration-200";
    card.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl bg-flat-purple text-white flex items-center justify-center text-lg font-black group-hover:scale-105 transition-transform">
            <i class="${t.icon}"></i>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="px-2.5 py-0.5 rounded-full bg-flat-blue text-white text-[10px] font-black">Kelas ${t.kelasNum}</span>
            <span class="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-black text-slate-500">${t.fase}</span>
          </div>
        </div>
        <h4 class="font-black text-lg text-slate-900 dark:text-white leading-snug font-heading group-hover:text-[#7C3AED] transition-colors">${t.title}</h4>
        <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">${t.description}</p>
      </div>

      <div class="pt-2 flex items-center justify-between text-xs font-bold text-[#7C3AED] border-t border-slate-100 dark:border-zinc-800/80">
        <span>Pelajari Topik</span>
        <i class="fa-solid fa-arrow-right text-[11px] group-hover:translate-x-1 transition-transform"></i>
      </div>
    `;

    card.addEventListener("click", () => openMaterialDetail(t));
    materiCatalogGrid.appendChild(card);
  });
}

function openMaterialDetail(t) {
  if (!materiCatalogView || !materiDetailContainer) return;

  const kelasText = t.kelasNum ? `Kelas ${t.kelasNum}` : (activeKelas === "all" ? "Seluruh Kelas" : `Kelas ${activeKelas}`);
  document.getElementById("detailBreadcrumb").textContent = `${activeJenjang} / ${kelasText} / ${t.title}`;
  document.getElementById("detailBadgeJenjang").textContent = `${activeJenjang} ${kelasText}`;
  document.getElementById("detailBadgeFase").textContent = t.fase;
  document.getElementById("detailTopicTitle").textContent = t.title;
  document.getElementById("detailTopicDescription").textContent = t.description;

  document.getElementById("detailConceptBody").innerHTML = t.conceptText;

  const propsBody = document.getElementById("detailPropertiesBody");
  propsBody.innerHTML = "";
  t.properties.forEach(p => {
    const pCard = document.createElement("div");
    pCard.className = "p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2 shadow-sm transition overflow-x-auto";
    pCard.innerHTML = `<strong class="text-sky-600 dark:text-sky-400 font-bold block text-sm font-heading">${p.title}</strong><div class="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed math-container">${p.desc}</div>`;
    propsBody.appendChild(pCard);
  });

  const visualSection = document.getElementById("detailVisualSection");
  const visualSvgEl = document.getElementById("detailVisualSvg");
  const visualCaptionEl = document.getElementById("detailVisualCaption");
  const exampleHeading = document.getElementById("detailExampleHeading");

  if (t.visualSvg && t.visualSvg.trim() !== "") {
    if (visualSvgEl) visualSvgEl.innerHTML = t.visualSvg;
    if (visualCaptionEl) visualCaptionEl.innerHTML = t.visualCaption || "Diagram Visualisasi Konsep";
    if (visualSection) visualSection.classList.remove("hidden");
    if (exampleHeading) {
      exampleHeading.innerHTML = `<i class="fa-solid fa-lightbulb text-[#3B82F6]"></i> 4. Contoh Soal Interaktif & Pembahasan`;
    }
  } else {
    if (visualSvgEl) visualSvgEl.innerHTML = "";
    if (visualSection) visualSection.classList.add("hidden");
    if (exampleHeading) {
      exampleHeading.innerHTML = `<i class="fa-solid fa-lightbulb text-[#3B82F6]"></i> 3. Contoh Soal Interaktif & Pembahasan`;
    }
  }

  const exampleContainer = document.getElementById("detailExampleProblemsContainer");
  exampleContainer.innerHTML = "";
  t.exampleProblems.forEach((ep, idx) => {
    const eCard = document.createElement("div");
    eCard.className = "p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3";
    eCard.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="px-2.5 py-0.5 rounded-lg bg-amber-500 text-white font-black text-xs">Contoh Soal #${idx + 1}</span>
      </div>
      <div class="font-bold text-sm text-slate-900 dark:text-white math-container">${ep.problem}</div>
      <div class="p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs space-y-2">
        <div class="font-bold text-emerald-600 dark:text-emerald-400">Kunci Jawaban: ${ep.options[ep.answerIndex]}</div>
        <div class="text-slate-600 dark:text-slate-300 math-container">${ep.solutionSteps}</div>
      </div>
    `;
    exampleContainer.appendChild(eCard);
  });

  materiCatalogView.classList.add("hidden");
  materiDetailContainer.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (window.MathJax && MathJax.typesetPromise) {
    if (window.MathJax.typesetClear) {
      window.MathJax.typesetClear([materiDetailContainer]);
    }
    window.MathJax.typesetPromise([materiDetailContainer]).catch(err => console.log(err));
  }
}

function backToCatalog() {
  if (!materiCatalogView || !materiDetailContainer) return;
  materiDetailContainer.classList.add("hidden");
  materiCatalogView.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

if (btnFilterSD) btnFilterSD.addEventListener("click", () => setJenjangFilter("SD"));
if (btnFilterSMP) btnFilterSMP.addEventListener("click", () => setJenjangFilter("SMP"));
if (btnFilterSMA) btnFilterSMA.addEventListener("click", () => setJenjangFilter("SMA"));

if (btnBackToCatalogTop) btnBackToCatalogTop.addEventListener("click", backToCatalog);
if (btnBackToCatalogBottom) btnBackToCatalogBottom.addEventListener("click", backToCatalog);

// Initial call
setJenjangFilter("SD");


// ==========================================
// 8. PRACTICE QUIZ MODULE & RETAKE LIMIT
// ==========================================
let quizConfigJenjang = "SMA";
let quizConfigKelas = "all"; // "all" for Ujian Komprehensif, or number 1..12
let quizConfigDiff = "Easy"; // Easy (5), Medium (10), Hard (25)

let quizActiveQuestions = [];
let quizUserAnswers = [];
let quizRaguState = [];
let quizCurrentIndex = 0;
let quizStartTime = Date.now();
let quizTimerInterval = null;
let currentReviewFilter = "all"; // "all" | "wrong" | "correct"

const btnQuizJenjangSD = document.getElementById("btnQuizJenjangSD");
const btnQuizJenjangSMP = document.getElementById("btnQuizJenjangSMP");
const btnQuizJenjangSMA = document.getElementById("btnQuizJenjangSMA");
const quizKomprehensifContainer = document.getElementById("quizKomprehensifContainer");
const quizKelasOptionsContainer = document.getElementById("quizKelasOptionsContainer");
const selectedCategoryPill = document.getElementById("selectedCategoryPill");

const btnDiffEasy = document.getElementById("btnDiffEasy");
const btnDiffMedium = document.getElementById("btnDiffMedium");
const btnDiffHard = document.getElementById("btnDiffHard");

const retakeAttemptText = document.getElementById("retakeAttemptText");
const retakeCountBadge = document.getElementById("retakeCountBadge");
const btnStartConfiguredQuiz = document.getElementById("btnStartConfiguredQuiz");

const latihanConfigCard = document.getElementById("latihanConfigCard");
const quizActiveContent = document.getElementById("quizActiveContent");

// ------------------------------------------
// TUGAS 4: STRUKTUR DATA BANK SOAL
// Format: PG dengan 4 Opsi (A, B, C, D) untuk SD & SMP
// dan 5 Opsi (A, B, C, D, E) untuk SMA/SMK
// ------------------------------------------
const bankSoal = [
  // ===== JENJANG SD (Kelas 1 - 6) =====
  {
    id_soal: "SOAL-SD-001",
    jenjang: "SD",
    kelas: 1,
    topik_materi: "Bilangan Cacah & Penjumlahan",
    pertanyaan: "Ibu membeli 8 buah apel di pasar. Ayah membawa pulang lagi 7 buah apel. Berapakah jumlah seluruh apel yang ada sekarang?",
    opsi_jawaban: ["13 buah", "14 buah", "15 buah", "16 buah"],
    jawaban_benar: 2,
    pembahasan: "Jumlah seluruh apel dihitung dengan menjumlahkan kedua nilai: \\(8 + 7 = 15\\) buah apel.",
    petunjuk: "Hitung maju 7 langkah dari angka 8 untuk menemukan hasil penjumlahan."
  },
  {
    id_soal: "SOAL-SD-002",
    jenjang: "SD",
    kelas: 1,
    topik_materi: "Pengurangan Bilangan Cacah",
    pertanyaan: "Hasil pengurangan dari \\(19 - 8\\) adalah...",
    opsi_jawaban: ["10", "11", "12", "13"],
    jawaban_benar: 1,
    pembahasan: "Kurangkan angka satuan: \\(9 - 8 = 1\\), sehingga \\(19 - 8 = 11\\).",
    petunjuk: "Kurangkan bagian satuannya terlebih dahulu lalu gabungkan dengan angka puluhannya."
  },
  {
    id_soal: "SOAL-SD-003",
    jenjang: "SD",
    kelas: 2,
    topik_materi: "Perkalian Dasar Sebagai Penjumlahan Berulang",
    pertanyaan: "Bentuk penjumlahan berulang dari \\(4 \\times 5\\) adalah...",
    opsi_jawaban: [
      "\\(5 + 5 + 5 + 5\\)",
      "\\(4 + 4 + 4 + 4 + 4\\)",
      "\\(4 + 5\\)",
      "\\(4 \\times 4 \\times 4 \\times 4\\)"
    ],
    jawaban_benar: 0,
    pembahasan: "Arti dari perkalian \\(a \\times b\\) adalah menjumlahkan bilangan \\(b\\) sebanyak \\(a\\) kali. Jadi \\(4 \\times 5 = 5 + 5 + 5 + 5 = 20\\).",
    petunjuk: "Angka pertama menunjukkan berapa kali angka kedua dijumlahkan."
  },
  {
    id_soal: "SOAL-SD-004",
    jenjang: "SD",
    kelas: 2,
    topik_materi: "Pengukuran Panjang Sederhana",
    pertanyaan: "Panjang seutas tali adalah \\(2\\text{ meter}\\). Jika dinyatakan dalam sentimeter (cm), panjang tali tersebut adalah...",
    opsi_jawaban: ["20 cm", "100 cm", "200 cm", "2.000 cm"],
    jawaban_benar: 2,
    pembahasan: "Ingat konversi satuan panjang: \\(1\\text{ meter} = 100\\text{ cm}\\). Maka \\(2\\text{ meter} = 2 \\times 100 = 200\\text{ cm}\\).",
    petunjuk: "Turun dua tangga dari meter ke sentimeter berarti dikalikan 100."
  },
  {
    id_soal: "SOAL-SD-005",
    jenjang: "SD",
    kelas: 3,
    topik_materi: "Operasi Perkalian & Pembagian",
    pertanyaan: "Pak Guru membawa 72 butir kelereng yang akan dibagikan sama banyak kepada 8 kelompok siswa. Setiap kelompok menerima ... butir kelereng.",
    opsi_jawaban: ["7 butir", "8 butir", "9 butir", "10 butir"],
    jawaban_benar: 2,
    pembahasan: "Banyak kelereng per kelompok = \\(72 : 8 = 9\\) butir kelereng karena \\(8 \\times 9 = 72\\).",
    petunjuk: "Gunakan kebalikan dari perkalian 8 yang menghasilkan angka 72."
  },
  {
    id_soal: "SOAL-SD-006",
    jenjang: "SD",
    kelas: 3,
    topik_materi: "Pecahan Sederhana",
    pertanyaan: "Sebuah loyang pizza dipotong menjadi 8 bagian sama besar. Dina memakan 3 potong pizza tersebut. Bagian pizza yang dimakan Dina dinyatakan dalam bentuk pecahan adalah...",
    opsi_jawaban: ["\\(\\frac{1}{8}\\)", "\\(\\frac{3}{8}\\)", "\\(\\frac{5}{8}\\)", "\\(\\frac{8}{3}\\)"],
    jawaban_benar: 1,
    pembahasan: "Pembilang menyatakan bagian yang dimakan (3) dan penyebut menyatakan total bagian keseluruhan (8), sehingga pecahan yang tepat adalah \\(\\frac{3}{8}\\).",
    petunjuk: "Pecahan ditulis sebagai (bagian yang diambil) / (jumlah seluruh bagian)."
  },
  {
    id_soal: "SOAL-SD-007",
    jenjang: "SD",
    kelas: 4,
    topik_materi: "FPB & KPK Bilangan",
    pertanyaan: "Faktor Persekutuan Terbesar (FPB) dari bilangan 24 dan 36 adalah...",
    opsi_jawaban: ["6", "8", "12", "72"],
    jawaban_benar: 2,
    pembahasan: "Faktorisasi prima: \\(24 = 2^3 \\times 3\\) dan \\(36 = 2^2 \\times 3^2\\). FPB diambil faktor prima yang sama dengan pangkat terkecil: \\(2^2 \\times 3 = 4 \\times 3 = 12\\).",
    petunjuk: "Cari bilangan prima yang sama dari kedua pohon faktor, lalu kalikan pangkat terendahnya."
  },
  {
    id_soal: "SOAL-SD-008",
    jenjang: "SD",
    kelas: 4,
    topik_materi: "FPB & KPK - Soal Cerita Kasus KPK",
    pertanyaan: "Lampu merah berkedip setiap 6 detik sekali, sedangkan lampu biru berkedip setiap 8 detik sekali. Jika keduanya menyala bersama pada detik ke-0, detik ke berapa kedua lampu akan berkedip bersamaan kembali?",
    opsi_jawaban: ["Detik ke-14", "Detik ke-24", "Detik ke-36", "Detik ke-48"],
    jawaban_benar: 1,
    pembahasan: "Waktu kejadian berulang bersamaan diselesaikan dengan KPK. \\(6 = 2 \\times 3\\) dan \\(8 = 2^3\\). \\(\\text{KPK} = 2^3 \\times 3 = 8 \\times 3 = 24\\) detik.",
    petunjuk: "Kejadian berulang bersama-sama diselesaikan dengan menghitung Kelipatan Persekutuan Terkecil (KPK)."
  },
  {
    id_soal: "SOAL-SD-009",
    jenjang: "SD",
    kelas: 5,
    topik_materi: "FPB - Soal Cerita Membagi Barang Sama Rata",
    pertanyaan: "Budi memiliki 20 buku tulis dan 30 pulpen. Ia ingin membagikannya ke dalam beberapa bingkisan dengan jumlah buku dan pulpen yang sama banyak tanpa sisa. Jumlah bingkisan paling banyak yang dapat dibuat Budi adalah...",
    opsi_jawaban: ["5 bingkisan", "6 bingkisan", "10 bingkisan", "15 bingkisan"],
    jawaban_benar: 2,
    pembahasan: "Membagi barang sama rata tanpa sisa diselesaikan dengan FPB. \\(20 = 2^2 \\times 5\\) dan \\(30 = 2 \\times 3 \\times 5\\). \\(\\text{FPB} = 2 \\times 5 = 10\\) bingkisan.",
    petunjuk: "Membagi dua jenis barang atau lebih menjadi paket sama rata menggunakan FPB."
  },
  {
    id_soal: "SOAL-SD-010",
    jenjang: "SD",
    kelas: 5,
    topik_materi: "Luas Bangun Datar Persegi Panjang",
    pertanyaan: "Sebuah lapangan olahraga berbentuk persegi panjang memiliki panjang 15 meter dan lebar 8 meter. Luas lapangan olahraga tersebut adalah...",
    opsi_jawaban: ["46 m²", "90 m²", "120 m²", "240 m²"],
    jawaban_benar: 2,
    pembahasan: "Luas persegi panjang dirumuskan \\(L = p \\times l\\). Maka \\(L = 15 \\times 8 = 120\\text{ m}^2\\).",
    petunjuk: "Gunakan rumus luas persegi panjang: kalikan panjang dengan lebarnya."
  },
  {
    id_soal: "SOAL-SD-011",
    jenjang: "SD",
    kelas: 6,
    topik_materi: "Volume Kubus & Balok",
    pertanyaan: "Sebuah akuarium berbentuk kubus memiliki panjang rusuk \\(12\\text{ cm}\\). Berapakah volume air maksimal yang dapat ditampung akuarium tersebut?",
    opsi_jawaban: ["144 cm³", "864 cm³", "1.728 cm³", "2.197 cm³"],
    jawaban_benar: 2,
    pembahasan: "Volume kubus dirumuskan \\(V = s^3 = s \\times s \\times s\\). Maka \\(V = 12 \\times 12 \\times 12 = 1.728\\text{ cm}^3\\).",
    petunjuk: "Pangkat tigakan panjang rusuk kubus: \\(12 \\times 12 \\times 12\\)."
  },
  {
    id_soal: "SOAL-SD-012",
    jenjang: "SD",
    kelas: 6,
    topik_materi: "Operasi Campuran Bilangan Bulat",
    pertanyaan: "Suhu udara di dalam lemari pendingin mula-mula \\(-4^\\circ\\text{C}\\). Setelah mesin pemanas dihidupkan, suhunya naik \\(9^\\circ\\text{C}\\). Suhu ruangan sekarang adalah...",
    opsi_jawaban: ["\\(-13^\\circ\\text{C}\\)", "\\(-5^\\circ\\text{C}\\)", "\\(5^\\circ\\text{C}\\)", "\\(13^\\circ\\text{C}\\)"],
    jawaban_benar: 2,
    pembahasan: "Kenaikan suhu dihitung dengan operasi penjumlahan: \\(-4 + 9 = 5^\\circ\\text{C}\\).",
    petunjuk: "Jumlahkan suhu awal yang bertanda negatif dengan kenaikan suhu positif."
  },

  // ===== JENJANG SMP (Kelas 7 - 9) =====
  {
    id_soal: "SOAL-SMP-001",
    jenjang: "SMP",
    kelas: 7,
    topik_materi: "Operasi Hitung Campuran Bilangan Bulat",
    pertanyaan: "Hasil perhitungan dari \\(-12 + 20 : (-4) - (-7)\\) adalah...",
    opsi_jawaban: ["-10", "-8", "0", "2"],
    jawaban_benar: 0,
    pembahasan: "Urutan operasi: dahulukan pembagian \\(20 : (-4) = -5\\). Selanjutnya: \\(-12 + (-5) - (-7) = -17 + 7 = -10\\).",
    petunjuk: "Kerjakan operasi pembagian lebih dulu sebelum penjumlahan dan pengurangan."
  },
  {
    id_soal: "SOAL-SMP-002",
    jenjang: "SMP",
    kelas: 7,
    topik_materi: "Bentuk Aljabar & Operasi Distributif",
    pertanyaan: "Bentuk paling sederhana dari aljabar \\(5(2x - 3) - 3(x - 4)\\) adalah...",
    opsi_jawaban: ["\\(7x - 3\\)", "\\(7x - 27\\)", "\\(7x + 3\\)", "\\(13x - 3\\)"],
    jawaban_benar: 0,
    pembahasan: "Buka kurung secara distributif: \\(10x - 15 - 3x + 12 = (10x - 3x) + (-15 + 12) = 7x - 3\\).",
    petunjuk: "Perhatikan tanda negatif saat mengalikan \\(-3\\) dengan \\(-4\\) sehingga menjadi positif \\(+12\\)."
  },
  {
    id_soal: "SOAL-SMP-003",
    jenjang: "SMP",
    kelas: 7,
    topik_materi: "Persamaan Linear Satu Variabel (PLSV)",
    pertanyaan: "Jika \\(3(2x - 1) = 4x + 9\\), maka nilai \\(x\\) yang memenuhi adalah...",
    opsi_jawaban: ["3", "4", "6", "12"],
    jawaban_benar: 2,
    pembahasan: "\\(6x - 3 = 4x + 9 \\iff 6x - 4x = 9 + 3 \\iff 2x = 12 \\iff x = 6\\).",
    petunjuk: "Kumpulkan suku bervariabel di ruas kiri dan konstanta angka di ruas kanan."
  },
  {
    id_soal: "SOAL-SMP-004",
    jenjang: "SMP",
    kelas: 7,
    topik_materi: "Aritmetika Sosial (Persentase Keuntungan)",
    pertanyaan: "Sebuah tas dibeli dengan harga \\(\\text{Rp}150.000,00\\). Jika pemilik toko ingin mendapatkan keuntungan sebesar \\(20\\%\\), maka tas tersebut harus dijual dengan harga...",
    opsi_jawaban: ["Rp165.000,00", "Rp175.000,00", "Rp180.000,00", "Rp190.000,00"],
    jawaban_benar: 2,
    pembahasan: "Besar laba/untung = \\(20\\% \\times 150.000 = 30.000\\). Harga jual = \\(150.000 + 30.000 = \\text{Rp}180.000,00\\).",
    petunjuk: "Harga jual = Harga beli + (Persentase untung × Harga beli)."
  },
  {
    id_soal: "SOAL-SMP-005",
    jenjang: "SMP",
    kelas: 8,
    topik_materi: "Pola Bilangan & Barisan Aritmetika",
    pertanyaan: "Diketahui barisan bilangan \\(5, 9, 13, 17, 21, \\dots\\). Suku ke-20 (\\(U_{20}\\)) dari barisan tersebut adalah...",
    opsi_jawaban: ["77", "81", "85", "89"],
    jawaban_benar: 1,
    pembahasan: "Suku pertama \\(a = 5\\), beda \\(b = 9 - 5 = 4\\). Rumus suku ke-\\(n\\): \\(U_n = a + (n - 1)b\\). Maka \\(U_{20} = 5 + (19 \\times 4) = 5 + 76 = 81\\).",
    petunjuk: "Gunakan rumus umum suku ke-n barisan aritmetika: \\(U_n = a + (n-1)b\\)."
  },
  {
    id_soal: "SOAL-SMP-006",
    jenjang: "SMP",
    kelas: 8,
    topik_materi: "Teorema Pythagoras Segitiga Siku-Siku",
    pertanyaan: "Sebuah segitiga siku-siku memiliki panjang sisi alas \\(9\\text{ cm}\\) dan tinggi \\(12\\text{ cm}\\). Panjang hipotenusa (sisi miring) segitiga tersebut adalah...",
    opsi_jawaban: ["15 cm", "17 cm", "20 cm", "21 cm"],
    jawaban_benar: 0,
    pembahasan: "Teorema Pythagoras: \\(c = \\sqrt{a^2 + b^2} = \\sqrt{9^2 + 12^2} = \\sqrt{81 + 144} = \\sqrt{225} = 15\\text{ cm}\\).",
    petunjuk: "Jumlahkan kuadrat alas dan tinggi, lalu tarik akar kuadratnya."
  },
  {
    id_soal: "SOAL-SMP-007",
    jenjang: "SMP",
    kelas: 8,
    topik_materi: "Persamaan Garis Lurus (Gradien)",
    pertanyaan: "Gradien garis yang melalui titik \\(A(2, 3)\\) dan titik \\(B(6, 11)\\) adalah...",
    opsi_jawaban: ["1", "2", "3", "4"],
    jawaban_benar: 1,
    pembahasan: "Gradien dirumuskan \\(m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{11 - 3}{6 - 2} = \\frac{8}{4} = 2\\).",
    petunjuk: "Gunakan rumus gradien dua titik: selisih y dibagi dengan selisih x."
  },
  {
    id_soal: "SOAL-SMP-008",
    jenjang: "SMP",
    kelas: 8,
    topik_materi: "Sistem Persamaan Linear Dua Variabel (SPLDV)",
    pertanyaan: "Diketahui sistem persamaan \\(x + 2y = 8\\) dan \\(2x - y = 6\\). Nilai dari \\(x + y\\) adalah...",
    opsi_jawaban: ["4", "5", "6", "7"],
    jawaban_benar: 2,
    pembahasan: "Dari persamaan kedua diperoleh \\(y = 2x - 6\\). Substitusi ke persamaan pertama: \\(x + 2(2x - 6) = 8 \\iff 5x - 12 = 8 \\iff 5x = 20 \\iff x = 4\\). Maka \\(y = 2(4) - 6 = 2\\). Jadi \\(x + y = 4 + 2 = 6\\).",
    petunjuk: "Cari nilai variabel x dan y terlebih dahulu dengan substitusi atau eliminasi."
  },
  {
    id_soal: "SOAL-SMP-009",
    jenjang: "SMP",
    kelas: 9,
    topik_materi: "Bentuk Pangkat & Akar",
    pertanyaan: "Bentuk paling sederhana dari \\(\\sqrt{75} + \\sqrt{48} - \\sqrt{27}\\) adalah...",
    opsi_jawaban: ["\\(5\\sqrt{3}\\)", "\\(6\\sqrt{3}\\)", "\\(7\\sqrt{3}\\)", "\\(8\\sqrt{3}\\)"],
    jawaban_benar: 1,
    pembahasan: "\\(\\sqrt{75} = 5\\sqrt{3}\\), \\(\\sqrt{48} = 4\\sqrt{3}\\), \\(\\sqrt{27} = 3\\sqrt{3}\\). Maka \\(5\\sqrt{3} + 4\\sqrt{3} - 3\\sqrt{3} = 6\\sqrt{3}\\).",
    petunjuk: "Ubah setiap bilangan di dalam akar menjadi perkalian kuadrat sempurna dengan faktor 3."
  },
  {
    id_soal: "SOAL-SMP-010",
    jenjang: "SMP",
    kelas: 9,
    topik_materi: "Persamaan & Pemfaktoran Kuadrat",
    pertanyaan: "Akar-akar dari persamaan kuadrat \\(x^2 - 5x + 6 = 0\\) adalah...",
    opsi_jawaban: [
      "\\(x = 1\\) atau \\(x = 6\\)",
      "\\(x = -2\\) atau \\(x = -3\\)",
      "\\(x = 2\\) atau \\(x = 3\\)",
      "\\(x = -1\\) atau \\(x = 6\\)"
    ],
    jawaban_benar: 2,
    pembahasan: "Pemfaktoran: cari dua angka yang jika dikalikan bernilai 6 dan dijumlahkan bernilai -5, yaitu -2 dan -3. \\((x - 2)(x - 3) = 0 \\implies x = 2\\) atau \\(x = 3\\).",
    petunjuk: "Faktorkan menjadi \\((x - p)(x - q) = 0\\)."
  },
  {
    id_soal: "SOAL-SMP-011",
    jenjang: "SMP",
    kelas: 9,
    topik_materi: "Fungsi Kuadrat & Sumbu Simetri",
    pertanyaan: "Sumbu simetri dari kurva parabola \\(f(x) = x^2 - 6x + 8\\) adalah garis...",
    opsi_jawaban: ["\\(x = -6\\)", "\\(x = -3\\)", "\\(x = 3\\)", "\\(x = 6\\)"],
    jawaban_benar: 2,
    pembahasan: "Sumbu simetri parabola dihitung dengan rumus \\(x_p = -\\frac{b}{2a}\\). Maka \\(x_p = -\\frac{-6}{2(1)} = 3\\).",
    petunjuk: "Gunakan rumus sumbu simetri \\(x = -\\frac{b}{2a}\\)."
  },
  {
    id_soal: "SOAL-SMP-012",
    jenjang: "SMP",
    kelas: 9,
    topik_materi: "Bangun Ruang Sisi Lengkung (Tabung)",
    pertanyaan: "Sebuah tabung memiliki jari-jari alas \\(7\\text{ cm}\\) dan tinggi \\(10\\text{ cm}\\). Dengan \\(\\pi = \\frac{22}{7}\\), volume tabung tersebut adalah...",
    opsi_jawaban: ["440 cm³", "770 cm³", "1.540 cm³", "3.080 cm³"],
    jawaban_benar: 2,
    pembahasan: "Volume tabung: \\(V = \\pi r^2 t = \\frac{22}{7} \\times 7^2 \\times 10 = 22 \\times 7 \\times 10 = 1.540\\text{ cm}^3\\).",
    petunjuk: "Rumus volume tabung adalah luas lingkaran alas dikalikan tinggi tabung: \\(V = \\pi r^2 t\\)."
  },

  // ===== JENJANG SMA/SMK (Kelas 10 - 12) - 5 Opsi (A, B, C, D, E) =====
  {
    id_soal: "SOAL-SMA-001",
    jenjang: "SMA",
    kelas: 10,
    topik_materi: "Eksponen & Sifat-Sifat Pangkat",
    pertanyaan: "Nilai sederhana dari operasi perpangkatan \\(\\frac{2^5 \\times 3^4}{2^3 \\times 3^2}\\) adalah...",
    opsi_jawaban: ["18", "24", "36", "48", "72"],
    jawaban_benar: 2,
    pembahasan: "Sifat pembagian pangkat: \\(a^m / a^n = a^{m-n}\\). Maka \\(2^{5-3} \\times 3^{4-2} = 2^2 \\times 3^2 = 4 \\times 9 = 36\\).",
    petunjuk: "Kurangkan pangkat dari faktor bilangan basis yang sama."
  },
  {
    id_soal: "SOAL-SMA-002",
    jenjang: "SMA",
    kelas: 10,
    topik_materi: "Persamaan Eksponensial",
    pertanyaan: "Himpunan penyelesaian dari persamaan eksponen \\(3^{2x - 1} = 27\\) adalah...",
    opsi_jawaban: ["\\(x = 1\\)", "\\(x = 2\\)", "\\(x = 3\\)", "\\(x = 4\\)", "\\(x = 5\\)"],
    jawaban_benar: 1,
    pembahasan: "Samakan basis menjadi basis 3: \\(27 = 3^3\\). Persamaan menjadi \\(3^{2x - 1} = 3^3 \\iff 2x - 1 = 3 \\iff 2x = 4 \\iff x = 2\\).",
    petunjuk: "Ubah bilangan 27 di ruas kanan menjadi perpangkatan tiga yaitu \\(3^3\\)."
  },
  {
    id_soal: "SOAL-SMA-003",
    jenjang: "SMA",
    kelas: 10,
    topik_materi: "Logaritma & Sifat Operasinya",
    pertanyaan: "Nilai dari \\(^2\\log 12 + ^2\\log 4 - ^2\\log 6\\) adalah...",
    opsi_jawaban: ["1", "2", "3", "4", "5"],
    jawaban_benar: 2,
    pembahasan: "Gunakan sifat: penjumlahan logaritma sebasis menghasilkan perkalian numerus dan pengurangan menghasilkan pembagian. \\(^2\\log\\left(\\frac{12 \\times 4}{6}\\right) = ^2\\log\\left(\\frac{48}{6}\\right) = ^2\\log 8 = 3\\) karena \\(2^3 = 8\\).",
    petunjuk: "Gabungkan numerus menjadi \\(^2\\log (12 \\times 4 / 6)\\)."
  },
  {
    id_soal: "SOAL-SMA-004",
    jenjang: "SMA",
    kelas: 10,
    topik_materi: "Trigonometri Dasar Segitiga Siku-Siku",
    pertanyaan: "Diketahui segitiga siku-siku di titik \\(B\\). Panjang sisi depan sudut \\(A\\) adalah 3 cm dan panjang sisi miringnya 5 cm. Nilai dari \\(\\tan A\\) adalah...",
    opsi_jawaban: [
      "\\(\\frac{3}{5}\\)",
      "\\(\\frac{4}{5}\\)",
      "\\(\\frac{3}{4}\\)",
      "\\(\\frac{4}{3}\\)",
      "\\(\\frac{5}{3}\\)"
    ],
    jawaban_benar: 2,
    pembahasan: "Panjang sisi samping sudut \\(A = \\sqrt{5^2 - 3^2} = \\sqrt{16} = 4\\text{ cm}\\). Nilai \\(\\tan A = \\frac{\\text{sisi depan}}{\\text{sisi samping}} = \\frac{3}{4}\\).",
    petunjuk: "Gunakan dalil Pythagoras untuk mencari sisi samping, lalu hitung perbandingan depan per samping."
  },
  {
    id_soal: "SOAL-SMA-005",
    jenjang: "SMA",
    kelas: 10,
    topik_materi: "Barisan & Deret Aritmetika",
    pertanyaan: "Jumlah 10 suku pertama (\\(S_{10}\\)) dari deret aritmetika \\(3 + 7 + 11 + 15 + \\dots\\) adalah...",
    opsi_jawaban: ["180", "190", "210", "230", "250"],
    jawaban_benar: 2,
    pembahasan: "Suku pertama \\(a = 3\\), beda \\(b = 4\\), jumlah suku \\(n = 10\\). Rumus: \\(S_n = \\frac{n}{2}[2a + (n-1)b]\\). Maka \\(S_{10} = 5[2(3) + 9(4)] = 5[6 + 36] = 5 \\times 42 = 210\\).",
    petunjuk: "Terapkan rumus jumlah \\(n\\) suku pertama deret aritmetika."
  },
  {
    id_soal: "SOAL-SMA-006",
    jenjang: "SMA",
    kelas: 11,
    topik_materi: "Matriks & Operasi Perkalian Dua Matriks",
    pertanyaan: "Diketahui matriks \\(A = \\begin{pmatrix} 2 & 1 \\\\ 3 & 4 \\end{pmatrix}\\) dan \\(B = \\begin{pmatrix} 1 & 0 \\\\ 2 & 3 \\end{pmatrix}\\). Hasil perkalian matriks \\(A \\times B\\) adalah...",
    opsi_jawaban: [
      "\\(\\begin{pmatrix} 4 & 3 \\\\ 11 & 12 \\end{pmatrix}\\)",
      "\\(\\begin{pmatrix} 2 & 0 \\\\ 6 & 12 \\end{pmatrix}\\)",
      "\\(\\begin{pmatrix} 4 & 1 \\\\ 7 & 12 \\end{pmatrix}\\)",
      "\\(\\begin{pmatrix} 3 & 1 \\\\ 5 & 7 \\end{pmatrix}\\)",
      "\\(\\begin{pmatrix} 5 & 3 \\\\ 10 & 12 \\end{pmatrix}\\)"
    ],
    jawaban_benar: 0,
    pembahasan: "Baris 1: \\((2\\cdot1 + 1\\cdot2, 2\\cdot0 + 1\\cdot3) = (4, 3)\\). Baris 2: \\((3\\cdot1 + 4\\cdot2, 3\\cdot0 + 4\\cdot3) = (11, 12)\\).",
    petunjuk: "Kalikan setiap elemen baris matriks pertama dengan kolom matriks kedua."
  },
  {
    id_soal: "SOAL-SMA-007",
    jenjang: "SMA",
    kelas: 11,
    topik_materi: "Matriks & Determinan 2x2",
    pertanyaan: "Nilai determinan dari matriks \\(M = \\begin{pmatrix} 5 & 2 \\\\ 4 & 3 \\end{pmatrix}\\) adalah...",
    opsi_jawaban: ["7", "11", "15", "18", "23"],
    jawaban_benar: 0,
    pembahasan: "Determinan matriks 2x2: \\(\\det(M) = ad - bc = (5 \\times 3) - (2 \\times 4) = 15 - 8 = 7\\).",
    petunjuk: "Kurangkan perkalian diagonal utama dengan perkalian diagonal samping: \\(ad - bc\\)."
  },
  {
    id_soal: "SOAL-SMA-008",
    jenjang: "SMA",
    kelas: 11,
    topik_materi: "Fungsi Komposisi",
    pertanyaan: "Diketahui fungsi \\(f(x) = 2x + 3\\) dan \\(g(x) = x^2 - 1\\). Nilai komposisi fungsi \\((g \\circ f)(1)\\) adalah...",
    opsi_jawaban: ["15", "20", "24", "25", "26"],
    jawaban_benar: 2,
    pembahasan: "Hitung nilai fungsi dalam dahulu: \\(f(1) = 2(1) + 3 = 5\\). Substitusi ke fungsi \\(g\\): \\(g(5) = 5^2 - 1 = 25 - 1 = 24\\).",
    petunjuk: "Hitung nilai \\(f(1)\\) terlebih dahulu kemudian masukkan sebagai input bagi fungsi \\(g\\)."
  },
  {
    id_soal: "SOAL-SMA-009",
    jenjang: "SMA",
    kelas: 11,
    topik_materi: "Deret Geometri Konvergen Tak Hingga",
    pertanyaan: "Jumlah deret geometri tak hingga \\(18 + 6 + 2 + \\frac{2}{3} + \\dots\\) adalah...",
    opsi_jawaban: ["24", "27", "30", "36", "54"],
    jawaban_benar: 1,
    pembahasan: "Suku pertama \\(a = 18\\), rasio \\(r = \\frac{6}{18} = \\frac{1}{3}\\). Rumus deret geometri konvergen: \\(S_\\infty = \\frac{a}{1 - r} = \\frac{18}{1 - 1/3} = \\frac{18}{2/3} = 18 \\times \\frac{3}{2} = 27\\).",
    petunjuk: "Gunakan rumus jumlah deret geometri tak hingga konvergen: \\(S_\\infty = \\frac{a}{1 - r}\\)."
  },
  {
    id_soal: "SOAL-SMA-010",
    jenjang: "SMA",
    kelas: 12,
    topik_materi: "Limit Aljabar Bentuk Tak Tentu 0/0",
    pertanyaan: "Nilai dari \\(\\lim_{x \\to 3} \\frac{x^2 - 9}{x - 3}\\) adalah...",
    opsi_jawaban: ["0", "3", "6", "9", "Tidak terdefinisi"],
    jawaban_benar: 2,
    pembahasan: "Substitusi langsung menghasilkan bentuk tak tentu \\(\\frac{0}{0}\\). Faktorkan pembilang: \\(x^2 - 9 = (x - 3)(x + 3)\\). \\(\\lim_{x \\to 3} \\frac{(x - 3)(x + 3)}{x - 3} = \\lim_{x \\to 3} (x + 3) = 3 + 3 = 6\\).",
    petunjuk: "Faktorkan pembilang menggunakan rumus selisih dua kuadrat \\(a^2 - b^2 = (a-b)(a+b)\\)."
  },
  {
    id_soal: "SOAL-SMA-011",
    jenjang: "SMA",
    kelas: 12,
    topik_materi: "Limit Aljabar Mendekati Tak Hingga",
    pertanyaan: "Nilai dari \\(\\lim_{x \\to \\infty} \\frac{4x^2 - 5x + 1}{2x^2 + 3x - 7}\\) adalah...",
    opsi_jawaban: ["0", "1", "2", "4", "\\(\\infty\\)"],
    jawaban_benar: 2,
    pembahasan: "Karena derajat pangkat tertinggi pembilang dan penyebut sama (yaitu \\(x^2\\)), nilai limit adalah perbandingan koefisien pangkat tertingginya: \\(\\frac{4}{2} = 2\\).",
    petunjuk: "Ambil perbandingan koefisien variabel berpangkat tertinggi pembilang dan penyebut."
  },
  {
    id_soal: "SOAL-SMA-012",
    jenjang: "SMA",
    kelas: 12,
    topik_materi: "Limit Trigonometri Dasar",
    pertanyaan: "Nilai dari \\(\\lim_{x \\to 0} \\frac{\\sin(6x)}{2x}\\) adalah...",
    opsi_jawaban: ["1", "2", "3", "6", "12"],
    jawaban_benar: 2,
    pembahasan: "Berdasarkan teorema limit trigonometri: \\(\\lim_{x \\to 0} \\frac{\\sin(ax)}{bx} = \\frac{a}{b}\\). Maka \\(\\lim_{x \\to 0} \\frac{\\sin(6x)}{2x} = \\frac{6}{2} = 3\\).",
    petunjuk: "Gunakan teorema limit trigonometri dasar: perbandingan koefisien sinus terhadap variabel di penyebut."
  },
  {
    id_soal: "SOAL-SMA-013",
    jenjang: "SMA",
    kelas: 12,
    topik_materi: "Turunan Fungsi Aljabar",
    pertanyaan: "Jika \\(f(x) = 2x^3 - 5x^2 + 4x - 7\\), maka turunan pertama \\(f'(x)\\) adalah...",
    opsi_jawaban: [
      "\\(6x^2 - 10x + 4\\)",
      "\\(6x^2 - 5x + 4\\)",
      "\\(3x^2 - 10x + 4\\)",
      "\\(6x^3 - 10x^2 + 4x\\)",
      "\\(6x^2 - 10x\\)"
    ],
    jawaban_benar: 0,
    pembahasan: "Gunakan aturan pangkat \\(\\frac{d}{dx}[ax^n] = n \\cdot a x^{n-1}\\). Maka \\(f'(x) = 3(2x^2) - 2(5x) + 4 - 0 = 6x^2 - 10x + 4\\).",
    petunjuk: "Turunkan masing-masing suku dengan mengalikan koefisien dengan pangkat lalu kurangi pangkat dengan 1."
  },
  {
    id_soal: "SOAL-SMA-014",
    jenjang: "SMA",
    kelas: 12,
    topik_materi: "Aplikasi Turunan (Gradien Garis Singgung)",
    pertanyaan: "Gradien garis singgung kurva \\(y = x^2 - 4x + 5\\) pada titik dengan absis \\(x = 3\\) adalah...",
    opsi_jawaban: ["-2", "1", "2", "4", "5"],
    jawaban_benar: 2,
    pembahasan: "Gradien garis singgung \\(m = y'\\). Turunan fungsi: \\(y' = 2x - 4\\). Untuk \\(x = 3\\), maka \\(m = 2(3) - 4 = 6 - 4 = 2\\).",
    petunjuk: "Cari turunan pertama kurva \\(y'\\), kemudian masukkan nilai \\(x = 3\\)."
  },
  {
    id_soal: "SOAL-SMA-015",
    jenjang: "SMA",
    kelas: 12,
    topik_materi: "Integral Tentu Aljabar",
    pertanyaan: "Nilai dari integral tentu \\(\\int_{0}^{2} (3x^2 + 2x) \\, dx\\) adalah...",
    opsi_jawaban: ["8", "10", "12", "14", "16"],
    jawaban_benar: 2,
    pembahasan: "Anti-turunan: \\(\\int (3x^2 + 2x) \\, dx = [x^3 + x^2]_0^2\\). Hitung batas atas dikurangi batas bawah: \\((2^3 + 2^2) - (0^3 + 0^2) = (8 + 4) - 0 = 12\\).",
    petunjuk: "Tentukan integral tak tentunya terlebih dahulu, kemudian kurangkan nilai di batas atas dengan batas bawah."
  }
];

// Fisher-Yates Shuffle Utility
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ------------------------------------------
// GENERATOR PARAMETRIK SOAL KURIKULUM
// Memastikan selalu tersedia hingga 25 soal unik untuk mode Hard
// di jenjang dan kelas manapun tanpa duplikasi
// ------------------------------------------
function generateParametricCurriculumQuestion(jenjang, kelas, seed) {
  const targetKelas = kelas === "all" ? (jenjang === "SD" ? (seed % 6) + 1 : jenjang === "SMP" ? (seed % 3) + 7 : (seed % 3) + 10) : Number(kelas);
  const qNum = seed + 1;

  if (jenjang === "SD") {
    // 4 Opsi (A, B, C, D)
    if (targetKelas <= 2) {
      const a = 10 + (seed * 3) % 40;
      const b = 5 + (seed * 7) % 30;
      const ans = a + b;
      return {
        id_soal: `GEN-SD-${targetKelas}-${seed}`,
        jenjang: "SD",
        kelas: targetKelas,
        topik_materi: "Operasi Penjumlahan Bilangan Cacah",
        pertanyaan: `Pak Budi memiliki ${a} butir telur. Ia membeli lagi ${b} butir telur di toko. Berapakah jumlah seluruh telur Pak Budi sekarang?`,
        opsi_jawaban: [`${ans - 2} butir`, `${ans} butir`, `${ans + 3} butir`, `${ans + 5} butir`],
        jawaban_benar: 1,
        pembahasan: `Jumlah seluruh telur dihitung dengan: \\(${a} + ${b} = ${ans}\\) butir telur.`,
        petunjuk: "Jumlahkan kedua bilangan tersebut secara langsung."
      };
    } else if (targetKelas <= 4) {
      const a = 3 + (seed % 7);
      const b = 4 + ((seed * 2) % 6);
      const prod = a * b;
      return {
        id_soal: `GEN-SD-${targetKelas}-${seed}`,
        jenjang: "SD",
        kelas: targetKelas,
        topik_materi: "Perkalian Bilangan Cacah & Soal Cerita",
        pertanyaan: `Sebuah toko memiliki ${a} kardus mainan. Jika setiap kardus berisi ${b} mainan, total mainan yang ada adalah...`,
        opsi_jawaban: [`${prod - a} mainan`, `${prod} mainan`, `${prod + b} mainan`, `${prod + 10} mainan`],
        jawaban_benar: 1,
        pembahasan: `Total mainan = \\(${a} \\times ${b} = ${prod}\\) mainan.`,
        petunjuk: "Kalikan jumlah kardus dengan kapasitas masing-masing kardus."
      };
    } else {
      const s = 5 + (seed % 8);
      const vol = s * s * s;
      return {
        id_soal: `GEN-SD-${targetKelas}-${seed}`,
        jenjang: "SD",
        kelas: targetKelas,
        topik_materi: "Volume Bangun Ruang Kubus",
        pertanyaan: `Sebuah kotak kado berbentuk kubus memiliki panjang rusuk \\(${s}\\text{ cm}\\). Volume kotak kado tersebut adalah...`,
        opsi_jawaban: [`${s * 6} cm³`, `${s * s} cm³`, `${vol} cm³`, `${vol + 20} cm³`],
        jawaban_benar: 2,
        pembahasan: `Volume kubus: \\(V = s^3 = ${s} \\times ${s} \\times ${s} = ${vol}\\text{ cm}^3\\).`,
        petunjuk: "Kalikan rusuk sebanyak tiga kali: \\(s \\times s \\times s\\)."
      };
    }
  } else if (jenjang === "SMP") {
    // 4 Opsi (A, B, C, D)
    if (targetKelas === 7) {
      const k = 2 + (seed % 4);
      const m = 3 + (seed % 5);
      const val = k * m;
      return {
        id_soal: `GEN-SMP-${targetKelas}-${seed}`,
        jenjang: "SMP",
        kelas: targetKelas,
        topik_materi: "Persamaan Linear Satu Variabel (PLSV)",
        pertanyaan: `Penyelesaian dari persamaan aljabar \\(${k}x = ${val}\\) adalah...`,
        opsi_jawaban: [`\\(x = ${m - 1}\\)`, `\\(x = ${m}\\)`, `\\(x = ${m + 1}\\)`, `\\(x = ${m + 2}\\)`],
        jawaban_benar: 1,
        pembahasan: `Bagi kedua ruas dengan ${k}: \\(x = \\frac{${val}}{${k}} = ${m}\\).`,
        petunjuk: "Bagi konstanta di ruas kanan dengan koefisien di depan x."
      };
    } else if (targetKelas === 8) {
      const baseA = 3 * (1 + (seed % 3));
      const baseB = 4 * (1 + (seed % 3));
      const hyp = 5 * (1 + (seed % 3));
      return {
        id_soal: `GEN-SMP-${targetKelas}-${seed}`,
        jenjang: "SMP",
        kelas: targetKelas,
        topik_materi: "Teorema Pythagoras",
        pertanyaan: `Segitiga siku-siku memiliki sisi siku-siku berukuran \\(${baseA}\\text{ cm}\\) dan \\(${baseB}\\text{ cm}\\). Panjang sisi miringnya adalah...`,
        opsi_jawaban: [`${hyp} cm`, `${hyp + 2} cm`, `${hyp + 4} cm`, `${baseA + baseB} cm`],
        jawaban_benar: 0,
        pembahasan: `Panjang sisi miring \\(c = \\sqrt{${baseA}^2 + ${baseB}^2} = \\sqrt{${baseA * baseA + baseB * baseB}} = ${hyp}\\text{ cm}\\).`,
        petunjuk: "Gunakan Teorema Pythagoras: \\(c = \\sqrt{a^2 + b^2}\\)."
      };
    } else {
      const r = 2 + (seed % 5);
      return {
        id_soal: `GEN-SMP-${targetKelas}-${seed}`,
        jenjang: "SMP",
        kelas: targetKelas,
        topik_materi: "Persamaan Kuadrat",
        pertanyaan: `Akar dari persamaan kuadrat \\(x^2 - ${r * r} = 0\\) adalah...`,
        opsi_jawaban: [`\\(x = \\pm ${r}\\)`, `\\(x = ${r}\\) saja`, `\\(x = -${r}\\) saja`, `\\(x = 0\\)`],
        jawaban_benar: 0,
        pembahasan: `Faktorkan selisih kuadrat: \\((x - ${r})(x + ${r}) = 0 \\implies x = ${r}\\) atau \\(x = -${r}\\).`,
        petunjuk: "Bentuk \\(x^2 - a^2 = 0\\) mempunyai dua akar bernilai positif dan negatif."
      };
    }
  } else {
    // Jenjang SMA/SMK: Wajib 5 Opsi (A, B, C, D, E)
    if (targetKelas === 10) {
      const exp = 2 + (seed % 4);
      const val = Math.pow(2, exp);
      return {
        id_soal: `GEN-SMA-${targetKelas}-${seed}`,
        jenjang: "SMA",
        kelas: targetKelas,
        topik_materi: "Eksponen & Persamaan Pangkat",
        pertanyaan: `Jika \\(2^{x} = ${val}\\), maka nilai dari \\(x\\) adalah...`,
        opsi_jawaban: [`${exp - 1}`, `${exp}`, `${exp + 1}`, `${exp + 2}`, `${exp + 3}`],
        jawaban_benar: 1,
        pembahasan: `Karena \\(${val} = 2^{${exp}}\\), maka dengan menyamakan pangkat didapatkan \\(x = ${exp}\\).`,
        petunjuk: "Ubah konstanta di ruas kanan menjadi perpangkatan basis 2."
      };
    } else if (targetKelas === 11) {
      const a = 2 + (seed % 3);
      const d = 3 + (seed % 3);
      const det = a * d - 2;
      return {
        id_soal: `GEN-SMA-${targetKelas}-${seed}`,
        jenjang: "SMA",
        kelas: targetKelas,
        topik_materi: "Matriks & Determinan",
        pertanyaan: `Determinan dari matriks \\(A = \\begin{pmatrix} ${a} & 1 \\\\ 2 & ${d} \\end{pmatrix}\\) adalah...`,
        opsi_jawaban: [`${det}`, `${det + 2}`, `${det - 2}`, `${det + 4}`, `${det + 6}`],
        jawaban_benar: 0,
        pembahasan: `Determinan: \\(\\det(A) = (${a} \\times ${d}) - (1 \\times 2) = ${a * d} - 2 = ${det}\\).`,
        petunjuk: "Hitung dengan rumus determinan matriks 2x2: \\(ad - bc\\)."
      };
    } else {
      const c = 2 + (seed % 5);
      const res = 2 * c;
      return {
        id_soal: `GEN-SMA-${targetKelas}-${seed}`,
        jenjang: "SMA",
        kelas: targetKelas,
        topik_materi: "Kalkulus & Turunan Fungsi",
        pertanyaan: `Turunan pertama dari fungsi \\(f(x) = ${c}x^2 - 4x + 9\\) adalah \\(f'(x) = \\dots\\)`,
        opsi_jawaban: [
          `\\(${res}x - 4\\)`,
          `\\(${c}x - 4\\)`,
          `\\(${res}x + 4\\)`,
          `\\(${res}x^2 - 4\\)`,
          `\\(${res}x\\)`
        ],
        jawaban_benar: 0,
        pembahasan: `Turunan \\(f(x) = ${c}x^2 - 4x + 9\\) adalah \\(f'(x) = 2 \\cdot ${c}x^{2-1} - 4 = ${res}x - 4\\).`,
        petunjuk: "Gunakan rumus turunan \\(\\frac{d}{dx}[ax^n] = n \\cdot ax^{n-1}\\)."
      };
    }
  }
}

// ------------------------------------------
// TUGAS 1: STRUKTUR KATEGORI & KESELARASAN MATERI
// ------------------------------------------
function setQuizJenjang(j) {
  quizConfigJenjang = j;
  [btnQuizJenjangSD, btnQuizJenjangSMP, btnQuizJenjangSMA].forEach(b => b?.classList.remove("active"));

  if (j === "SD") {
    btnQuizJenjangSD?.classList.add("active");
  } else if (j === "SMP") {
    btnQuizJenjangSMP?.classList.add("active");
  } else if (j === "SMA") {
    btnQuizJenjangSMA?.classList.add("active");
  }

  // Default to Ujian Komprehensif saat ganti jenjang
  quizConfigKelas = "all";

  renderQuizKategoriOptions();
  updateRetakeAttemptUI();
}

function renderQuizKategoriOptions() {
  // Update Pill Info
  if (selectedCategoryPill) {
    if (quizConfigKelas === "all") {
      selectedCategoryPill.textContent = `Seluruh Kelas ${quizConfigJenjang} (Ujian Komprehensif)`;
      selectedCategoryPill.className = "text-[11px] font-bold px-3 py-1 rounded-full bg-flat-purple text-white w-fit shadow-sm";
    } else {
      selectedCategoryPill.textContent = `Kelas ${quizConfigKelas} ${quizConfigJenjang} (Kurikulum Spesifik)`;
      selectedCategoryPill.className = "text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-600 text-white w-fit shadow-sm";
    }
  }

  // 1. Kategori Ujian Komprehensif (Campuran)
  if (quizKomprehensifContainer) {
    quizKomprehensifContainer.innerHTML = "";
    const isKomprehensif = quizConfigKelas === "all";

    const btnKomp = document.createElement("button");
    btnKomp.className = `px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 border ${isKomprehensif
      ? "active bg-purple-600 border-purple-600 text-white shadow-md ring-2 ring-purple-300 dark:ring-purple-900"
      : "border-purple-200 dark:border-purple-900/60 bg-white dark:bg-zinc-900 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
      }`;

    let labelJenjang = "Seluruh Kelas SD";
    let subRange = "Kelas 1-6";
    if (quizConfigJenjang === "SMP") {
      labelJenjang = "Seluruh Kelas SMP";
      subRange = "Kelas 7-9";
    } else if (quizConfigJenjang === "SMA") {
      labelJenjang = "Seluruh Kelas SMA/SMK";
      subRange = "Kelas 10-12";
    }

    btnKomp.innerHTML = `
      <i class="fa-solid fa-shuffle ${isKomprehensif ? 'text-white' : 'text-purple-500'}"></i>
      <span>${labelJenjang}</span>
      <span class="text-[10px] px-2 py-0.5 rounded-md ${isKomprehensif ? 'bg-purple-800 text-purple-100' : 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300'} font-bold">
        ${subRange}
      </span>
      ${isKomprehensif ? '<i class="fa-solid fa-check ml-1 text-xs"></i>' : ''}
    `;

    btnKomp.addEventListener("click", () => {
      quizConfigKelas = "all";
      renderQuizKategoriOptions();
      updateRetakeAttemptUI();
    });

    quizKomprehensifContainer.appendChild(btnKomp);
  }

  // 2. Kategori Spesifik Per Kelas
  if (quizKelasOptionsContainer) {
    quizKelasOptionsContainer.innerHTML = "";

    let classList = [];
    if (quizConfigJenjang === "SD") classList = [1, 2, 3, 4, 5, 6];
    else if (quizConfigJenjang === "SMP") classList = [7, 8, 9];
    else if (quizConfigJenjang === "SMA") classList = [10, 11, 12];

    classList.forEach(k => {
      const btn = document.createElement("button");
      const isSel = (quizConfigKelas === k);

      btn.className = `quiz-kelas-btn px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${isSel
        ? "active bg-emerald-600 border-emerald-600 text-white shadow-md ring-2 ring-emerald-300 dark:ring-emerald-900"
        : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 hover:border-emerald-300"
        }`;

      btn.innerHTML = `
        <i class="fa-solid fa-graduation-cap ${isSel ? 'text-white' : 'text-emerald-500'} text-[11px]"></i>
        <span>Kelas ${k} ${quizConfigJenjang === 'SMA' ? 'SMA/SMK' : quizConfigJenjang}</span>
        ${isSel ? '<i class="fa-solid fa-check ml-0.5 text-xs"></i>' : ''}
      `;

      btn.addEventListener("click", () => {
        quizConfigKelas = k;
        renderQuizKategoriOptions();
        updateRetakeAttemptUI();
      });

      quizKelasOptionsContainer.appendChild(btn);
    });
  }
}

// ------------------------------------------
// TUGAS 2: PENGATURAN TINGKAT KESULITAN & JUMLAH SOAL
// Easy: 5 Soal (1 Benar = 20 Poin)
// Medium: 10 Soal (1 Benar = 10 Poin)
// Hard: 25 Soal (1 Benar = 4 Poin)
// ------------------------------------------
function setQuizDiff(d) {
  quizConfigDiff = d;
  [btnDiffEasy, btnDiffMedium, btnDiffHard].forEach(b => b?.classList.remove("active"));

  if (d === "Easy") btnDiffEasy?.classList.add("active");
  else if (d === "Medium") btnDiffMedium?.classList.add("active");
  else if (d === "Hard") btnDiffHard?.classList.add("active");

  updateRetakeAttemptUI();
}

if (btnQuizJenjangSD) btnQuizJenjangSD.addEventListener("click", () => setQuizJenjang("SD"));
if (btnQuizJenjangSMP) btnQuizJenjangSMP.addEventListener("click", () => setQuizJenjang("SMP"));
if (btnQuizJenjangSMA) btnQuizJenjangSMA.addEventListener("click", () => setQuizJenjang("SMA"));

if (btnDiffEasy) btnDiffEasy.addEventListener("click", () => setQuizDiff("Easy"));
if (btnDiffMedium) btnDiffMedium.addEventListener("click", () => setQuizDiff("Medium"));
if (btnDiffHard) btnDiffHard.addEventListener("click", () => setQuizDiff("Hard"));

// Retake Limit Logic (Max 3 attempts per combo)
function getComboKey() {
  const uid = (auth && auth.currentUser) ? auth.currentUser.uid : "guest";
  return `retake_${uid}_${quizConfigJenjang}_${quizConfigKelas}_${quizConfigDiff}`;
}

function getAttemptCount() {
  const key = getComboKey();
  return parseInt(localStorage.getItem(key) || "0", 10);
}

function incrementAttemptCount() {
  const key = getComboKey();
  const current = getAttemptCount();
  localStorage.setItem(key, (current + 1).toString());

  if (isFirebaseReady && db && auth && auth.currentUser) {
    db.collection("users").doc(auth.currentUser.uid).collection("latihan_attempts").doc(`${quizConfigJenjang}_${quizConfigKelas}_${quizConfigDiff}`).set({
      attemptCount: current + 1,
      lastTimestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(e => console.warn("Firestore attempt save fallback:", e));
  }
}

function updateRetakeAttemptUI() {
  const attempts = getAttemptCount();

  if (retakeAttemptText) {
    if (attempts > 0) {
      retakeAttemptText.textContent = `Pengerjaan Ke-${attempts + 1} • Bebas Mengulang Latihan Kapan Saja`;
    } else {
      retakeAttemptText.textContent = `Pengerjaan Perdana • Bebas Mengulang Kapan Saja Tanpa Batas`;
    }
  }
  if (retakeCountBadge) {
    retakeCountBadge.innerHTML = `<i class="fa-solid fa-infinity mr-1"></i> Unlimited`;
    retakeCountBadge.className = "px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-xs flex items-center";
  }

  if (btnStartConfiguredQuiz) {
    btnStartConfiguredQuiz.disabled = false;
    btnStartConfiguredQuiz.innerHTML = `<i class="fa-solid fa-play"></i> Mulai Kerjakan Latihan`;
    btnStartConfiguredQuiz.className = "w-full btn-flat btn-flat-purple py-3.5 text-sm font-black flex items-center justify-center gap-2";
  }
}

// ------------------------------------------
// TUGAS 3: LOGIKA PENGACAKAN SOAL & OPSI (FISHER-YATES)
// Menjamin kombinasi soal dan susunan opsi berbeda setiap sesi latihan
// ------------------------------------------
function generateQuizQuestions() {
  let targetCount = 5;
  if (quizConfigDiff === "Medium") targetCount = 10;
  else if (quizConfigDiff === "Hard") targetCount = 25;

  // 1. Filter bank soal sesuai Jenjang dan Kategori Kelas
  let candidatePool = bankSoal.filter(item => {
    if (item.jenjang !== quizConfigJenjang) return false;
    if (quizConfigKelas !== "all") {
      return item.kelas === Number(quizConfigKelas);
    }
    return true; // Ujian komprehensif mengambil seluruh kelas di jenjang ini
  });

  // 2. Jika jumlah soal di bank kurang dari targetCount (misal mode Hard 25 soal di kelas spesifik),
  // tambahkan soal kurikulum parametrik otomatis sehingga tepat mencapai jumlah yang dibutuhkan
  let currentSeed = 0;
  while (candidatePool.length < targetCount) {
    const extraQ = generateParametricCurriculumQuestion(quizConfigJenjang, quizConfigKelas, currentSeed);
    candidatePool.push(extraQ);
    currentSeed++;
  }

  // 3. Acak seluruh urutan soal menggunakan algoritma Fisher-Yates
  const shuffledCandidates = shuffleArray(candidatePool);

  // 4. Ambil sejumlah targetCount
  const selectedQuestions = shuffledCandidates.slice(0, targetCount);

  // 5. Acak pula urutan opsi jawaban (A, B, C, D atau E) per soal
  // dan petakan kembali indeks jawaban yang benar agar tetap akurat
  const finalQuestions = selectedQuestions.map((q, idx) => {
    const originalOptions = [...q.opsi_jawaban];
    const correctText = originalOptions[q.jawaban_benar];

    // Acak opsi jawaban
    const shuffledOptions = shuffleArray(originalOptions);
    const newCorrectIndex = shuffledOptions.indexOf(correctText);

    return {
      id: idx + 1,
      id_soal: q.id_soal,
      jenjang: q.jenjang,
      kelas: q.kelas,
      topik_materi: q.topik_materi,
      pertanyaan: q.pertanyaan,
      options: shuffledOptions,
      correct: newCorrectIndex,
      hint: q.petunjuk || "Pahami konsep dasar materi ini dan periksa kembali langkah perhitungan.",
      solution: q.pembahasan || "Langkah penyelesaian telah disesuaikan dengan rumus kurikulum standar."
    };
  });

  return finalQuestions;
}

// ------------------------------------------
// TUGAS 5: UI/UX PENGERJAAN SOAL INTERAKTIF
// Menampilkan nomor soal, pertanyaan, radio button / tombol opsi,
// navigasi nomor, submit, dan halaman hasil (score & review)
// ------------------------------------------
if (btnStartConfiguredQuiz) {
  btnStartConfiguredQuiz.addEventListener("click", () => {
    // Proteksi Fitur Latihan Soal: Wajib Login Sebelum Mengerjakan
    const currentUser = (isFirebaseReady && auth) ? auth.currentUser : null;
    if (!currentUser) {
      openAuthModal("Wajib masuk (login) akun terlebih dahulu untuk memulai pengerjaan latihan soal.");
      return;
    }

    quizActiveQuestions = generateQuizQuestions();
    quizUserAnswers = new Array(quizActiveQuestions.length).fill(null);
    quizRaguState = new Array(quizActiveQuestions.length).fill(false);

    if (latihanConfigCard) latihanConfigCard.classList.add("hidden");
    if (quizActiveContent) quizActiveContent.classList.remove("hidden");

    const kelasTitle = quizConfigKelas === "all" ? `Seluruh Kelas ${quizConfigJenjang} (Komprehensif)` : `Kelas ${quizConfigKelas} ${quizConfigJenjang}`;
    const diffBadge = quizConfigDiff === "Easy" ? "Easy (5 Soal)" : quizConfigDiff === "Medium" ? "Medium (10 Soal)" : "Hard (25 Soal)";
    document.getElementById("quizActiveTitle").textContent = `${kelasTitle} - ${diffBadge}`;

    loadActiveQuestion(0);
    startActiveQuizTimer();
  });
}

function startActiveQuizTimer() {
  if (quizTimerInterval) clearInterval(quizTimerInterval);
  quizStartTime = Date.now();
  const timerEl = document.getElementById("quizTimer");

  quizTimerInterval = setInterval(() => {
    const elapsedSec = Math.floor((Date.now() - quizStartTime) / 1000);
    const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
    const secs = String(elapsedSec % 60).padStart(2, '0');
    if (timerEl) timerEl.textContent = `${mins}:${secs}`;
  }, 1000);
}

function loadActiveQuestion(idx) {
  quizCurrentIndex = idx;
  const q = quizActiveQuestions[idx];
  if (!q) return;

  // Nomor soal & Badge Topik
  document.getElementById("questionNumBadge").textContent = `Soal ${idx + 1} dari ${quizActiveQuestions.length}`;
  document.getElementById("questionCategoryBadge").textContent = `${q.topik_materi} • Kelas ${q.kelas} ${q.jenjang}`;
  document.getElementById("questionText").innerHTML = q.pertanyaan;

  // Render Tombol Opsi Jawaban beserta Radio Button
  const optContainer = document.getElementById("optionsContainer");
  optContainer.innerHTML = "";

  q.options.forEach((opt, oIdx) => {
    const letter = String.fromCharCode(65 + oIdx);
    const isSelected = (quizUserAnswers[idx] === oIdx);

    const optCard = document.createElement("label");
    optCard.className = `option-card p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3 sm:gap-3.5 min-h-[52px] select-none ${isSelected
      ? "selected border-[#7C3AED] bg-purple-50/60 dark:bg-purple-950/40 shadow-sm ring-1 ring-[#7C3AED]"
      : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-purple-300 dark:hover:border-purple-800"
      }`;

    optCard.innerHTML = `
      <input type="radio" name="quizOptionRadio" value="${oIdx}" class="w-5 h-5 min-w-[20px] min-h-[20px] text-[#7C3AED] focus:ring-[#7C3AED] border-slate-300 dark:border-zinc-700 cursor-pointer shrink-0" ${isSelected ? "checked" : ""}>
      <div class="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl ${isSelected
        ? "bg-[#7C3AED] text-white font-black shadow-sm"
        : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-bold"
      } flex items-center justify-center text-xs sm:text-sm flex-shrink-0 transition">
        ${letter}
      </div>
      <div class="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 math-container flex-grow leading-relaxed">
        ${opt}
      </div>
      ${isSelected ? '<i class="fa-solid fa-circle-check text-[#7C3AED] text-xl flex-shrink-0"></i>' : ''}
    `;

    optCard.addEventListener("click", () => {
      quizUserAnswers[idx] = oIdx;
      loadActiveQuestion(idx);
    });

    optContainer.appendChild(optCard);
  });

  // Modal Petunjuk Pengerjaan
  const btnHint = document.getElementById("btnHint");
  const hintModal = document.getElementById("hintModal");
  const hintModalBody = document.getElementById("hintModalBody");
  const btnCloseHintModal = document.getElementById("btnCloseHintModal");

  if (btnHint) {
    btnHint.onclick = () => {
      if (hintModalBody) hintModalBody.innerHTML = q.hint;
      if (hintModal) {
        hintModal.classList.remove("hidden");
        setTimeout(() => hintModal.classList.remove("opacity-0"), 10);
      }
      if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([hintModalBody]).catch(e => console.log(e));
      }
    };
  }

  if (btnCloseHintModal) {
    btnCloseHintModal.onclick = () => {
      if (hintModal) {
        hintModal.classList.add("opacity-0");
        setTimeout(() => hintModal.classList.add("hidden"), 200);
      }
    };
  }

  // Ragu-ragu checkbox
  const checkRagu = document.getElementById("checkRagu");
  if (checkRagu) checkRagu.checked = quizRaguState[idx];

  // Navigasi Prev/Next
  const btnPrev = document.getElementById("btnPrevQuestion");
  const btnNext = document.getElementById("btnNextQuestion");
  if (btnPrev) btnPrev.disabled = (idx === 0);
  if (btnNext) {
    if (idx === quizActiveQuestions.length - 1) {
      btnNext.innerHTML = `Selesai & Kumpulkan <i class="fa-solid fa-check ml-1"></i>`;
    } else {
      btnNext.innerHTML = `Selanjutnya <i class="fa-solid fa-arrow-right ml-1"></i>`;
    }
  }

  renderQuizPaletteGrid();

  // Typeset MathJax pada Soal dan Opsi
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([document.getElementById("questionText"), optContainer]).catch(err => console.log(err));
  }
}

const checkRaguEl = document.getElementById("checkRagu");
if (checkRaguEl) {
  checkRaguEl.addEventListener("change", (e) => {
    quizRaguState[quizCurrentIndex] = e.target.checked;
    renderQuizPaletteGrid();
  });
}

function renderQuizPaletteGrid() {
  const grid = document.getElementById("paletteGrid");
  if (!grid) return;
  grid.innerHTML = "";

  let answered = 0;
  quizActiveQuestions.forEach((q, idx) => {
    const isAns = quizUserAnswers[idx] !== null;
    const isRag = quizRaguState[idx];
    const isCur = idx === quizCurrentIndex;

    if (isAns) answered++;

    let bg = "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300 border border-slate-200 dark:border-zinc-700";
    if (isRag) bg = "bg-amber-500 text-white font-bold border-amber-500";
    else if (isAns) bg = "bg-emerald-600 text-white font-bold border-emerald-600";

    const btn = document.createElement("button");
    btn.className = `palette-btn w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl text-xs flex items-center justify-center transition ${bg} ${isCur ? "active ring-2 ring-[#7C3AED] font-black scale-105" : ""
      }`;
    btn.textContent = idx + 1;
    btn.addEventListener("click", () => loadActiveQuestion(idx));
    grid.appendChild(btn);
  });

  const countBadge = document.getElementById("answeredCountBadge");
  if (countBadge) countBadge.textContent = `${answered}/${quizActiveQuestions.length} Dijawab`;
}

const btnPrevQ = document.getElementById("btnPrevQuestion");
const btnNextQ = document.getElementById("btnNextQuestion");
if (btnPrevQ) btnPrevQ.addEventListener("click", () => {
  if (quizCurrentIndex > 0) loadActiveQuestion(quizCurrentIndex - 1);
});
if (btnNextQ) btnNextQ.addEventListener("click", () => {
  if (quizCurrentIndex < quizActiveQuestions.length - 1) {
    loadActiveQuestion(quizCurrentIndex + 1);
  } else {
    submitActiveQuiz();
  }
});

const btnSubmitQ = document.getElementById("btnSubmitQuiz");
if (btnSubmitQ) btnSubmitQ.addEventListener("click", submitActiveQuiz);

// ------------------------------------------
// HALAMAN HASIL (SCORE & PEMBAHASAN)
// ------------------------------------------
function submitActiveQuiz() {
  clearInterval(quizTimerInterval);

  let pointPerQuestion = 20;
  if (quizConfigDiff === "Medium") pointPerQuestion = 10;
  else if (quizConfigDiff === "Hard") pointPerQuestion = 4;

  let correctCount = 0;
  quizActiveQuestions.forEach((q, idx) => {
    if (quizUserAnswers[idx] === q.correct) correctCount++;
  });

  const totalQuestions = quizActiveQuestions.length;
  const totalScore = correctCount * pointPerQuestion;
  const wrongCount = totalQuestions - correctCount;

  const timeSec = Math.floor((Date.now() - quizStartTime) / 1000);
  const mins = Math.floor(timeSec / 60);
  const secs = timeSec % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  incrementAttemptCount();

  const historyRecord = {
    userId: (auth && auth.currentUser) ? auth.currentUser.uid : "guest",
    userName: (auth && auth.currentUser) ? (auth.currentUser.displayName || "Siswa") : "Siswa Guest",
    jenjang: quizConfigJenjang,
    kelas: quizConfigKelas,
    difficulty: quizConfigDiff,
    score: totalScore,
    totalBenar: correctCount,
    totalSalah: wrongCount,
    attemptNumber: getAttemptCount(),
    timestamp: new Date().toISOString(),
    userAnswers: quizActiveQuestions.map((q, idx) => ({
      qId: q.id_soal,
      questionText: q.pertanyaan,
      userAnsIdx: quizUserAnswers[idx],
      userAnsText: quizUserAnswers[idx] !== null ? q.options[quizUserAnswers[idx]] : "Belum Dijawab",
      correctAnsText: q.options[q.correct],
      isCorrect: quizUserAnswers[idx] === q.correct,
      solutionText: q.solution
    }))
  };

  saveHistoryToFirestore(historyRecord);

  // Update Stat Cards pada Result Modal
  const elScore = document.getElementById("resultModalScore");
  const elBadge = document.getElementById("resultModalBadge");
  const elCorrect = document.getElementById("resultModalCorrect");
  const elCorrectSub = document.getElementById("resultModalCorrectSub");
  const elWrong = document.getElementById("resultModalWrong");
  const elWrongSub = document.getElementById("resultModalWrongSub");
  const elTime = document.getElementById("resultModalTime");
  const elTimeSub = document.getElementById("resultModalTimeSub");
  const elSubtitle = document.getElementById("resultModalSubtitle");

  const accuracyPct = Math.round((correctCount / totalQuestions) * 100);
  const avgSec = Math.max(1, Math.round(timeSec / totalQuestions));

  if (elScore) elScore.textContent = totalScore;
  if (elCorrect) elCorrect.textContent = correctCount;
  if (elCorrectSub) elCorrectSub.textContent = `${correctCount} / ${totalQuestions} Soal (${accuracyPct}%)`;
  if (elWrong) elWrong.textContent = wrongCount;
  if (elWrongSub) elWrongSub.textContent = `${wrongCount} Soal Perlu Dipelajari`;
  if (elTime) elTime.textContent = timeStr;
  if (elTimeSub) elTimeSub.textContent = `~${avgSec} dtk / soal`;

  if (elSubtitle) {
    const kText = quizConfigKelas === "all" ? `Seluruh Kelas ${quizConfigJenjang} (Komprehensif)` : `Kelas ${quizConfigKelas} ${quizConfigJenjang}`;
    elSubtitle.textContent = `${kText} • Mode ${quizConfigDiff} • Selesai dalam ${timeStr}`;
  }

  // Update Counter Badges pada Filter Tabs
  const countAll = document.getElementById("filterCountAll");
  const countWrong = document.getElementById("filterCountWrong");
  const countCorrect = document.getElementById("filterCountCorrect");
  if (countAll) countAll.textContent = totalQuestions;
  if (countWrong) countWrong.textContent = wrongCount;
  if (countCorrect) countCorrect.textContent = correctCount;

  if (elBadge) {
    if (totalScore >= 90) {
      elBadge.textContent = "Sangat Baik 🏆";
      elBadge.className = "inline-block px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-center";
    } else if (totalScore >= 75) {
      elBadge.textContent = "Baik 👍";
      elBadge.className = "inline-block px-2.5 py-1 rounded-xl text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-center";
    } else if (totalScore >= 60) {
      elBadge.textContent = "Cukup 🤔";
      elBadge.className = "inline-block px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-center";
    } else {
      elBadge.textContent = "Perlu Belajar Lagi 📚";
      elBadge.className = "inline-block px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-center";
    }
  }

  // Render Peta Cepat Hasil Nomor (Quick Map)
  renderQuickMap();

  // Render Pembahasan Soal
  renderReviewList(currentReviewFilter);

  // Setup Tombol Filter Pembahasan
  setupReviewFilterButtons();

  // Setup Tombol Ulangi Latihan Kuis Ini
  setupRetakeButton();

  const resModal = document.getElementById("quizScoreResultModal");
  if (resModal) {
    resModal.classList.remove("hidden");
    setTimeout(() => resModal.classList.remove("opacity-0"), 10);
  }
}

function renderQuickMap() {
  const mapContainer = document.getElementById("resultModalQuickMap");
  if (!mapContainer) return;
  mapContainer.innerHTML = "";

  quizActiveQuestions.forEach((q, idx) => {
    const isCorr = (quizUserAnswers[idx] === q.correct);
    const btn = document.createElement("button");
    btn.className = `w-8 h-8 rounded-xl text-xs font-black transition flex items-center justify-center ${isCorr
      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-300 dark:ring-emerald-900"
      : "bg-rose-500 hover:bg-rose-600 text-white shadow-sm ring-1 ring-rose-300 dark:ring-rose-900"
      }`;
    btn.innerHTML = `${idx + 1}`;
    btn.title = `Soal ${idx + 1}: ${isCorr ? 'Jawaban Benar' : 'Jawaban Salah'}`;
    btn.addEventListener("click", () => {
      // Jika sedang difilter dan soal ini tersembunyi, ubah ke "all"
      if ((currentReviewFilter === "wrong" && isCorr) || (currentReviewFilter === "correct" && !isCorr)) {
        const btnAll = document.getElementById("btnFilterReviewAll");
        if (btnAll) btnAll.click();
      }
      const targetCard = document.getElementById(`review-card-${idx}`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
        targetCard.classList.add("ring-2", "ring-[#7C3AED]");
        setTimeout(() => targetCard.classList.remove("ring-2", "ring-[#7C3AED]"), 1500);
      }
    });
    mapContainer.appendChild(btn);
  });
}

function renderReviewList(filterMode) {
  currentReviewFilter = filterMode;
  const listContainer = document.getElementById("resultModalPembahasanList");
  if (!listContainer) return;
  listContainer.innerHTML = "";

  let pointPerQuestion = 20;
  if (quizConfigDiff === "Medium") pointPerQuestion = 10;
  else if (quizConfigDiff === "Hard") pointPerQuestion = 4;

  let displayedCount = 0;

  quizActiveQuestions.forEach((q, idx) => {
    const isCorr = (quizUserAnswers[idx] === q.correct);

    if (filterMode === "wrong" && isCorr) return;
    if (filterMode === "correct" && !isCorr) return;

    displayedCount++;

    const card = document.createElement("div");
    card.id = `review-card-${idx}`;
    card.className = `p-5 sm:p-6 rounded-2xl border-2 transition ${isCorr
      ? "border-emerald-300/80 dark:border-emerald-900/60 bg-emerald-50/15 dark:bg-emerald-950/10 shadow-sm"
      : "border-rose-300/80 dark:border-rose-900/60 bg-rose-50/15 dark:bg-rose-950/10 shadow-sm"
      } space-y-4`;

    const userAnsText = quizUserAnswers[idx] !== null ? q.options[quizUserAnswers[idx]] : "Belum Dijawab";
    const correctAnsText = q.options[q.correct];

    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 dark:border-zinc-800 pb-3">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded-xl ${isCorr ? 'bg-emerald-600' : 'bg-rose-600'} text-white font-black text-xs flex items-center justify-center shadow-sm">
            #${idx + 1}
          </span>
          <div>
            <div class="text-xs font-black text-slate-800 dark:text-slate-200 font-heading">
              ${q.topik_materi}
            </div>
            <div class="text-[10px] font-bold text-slate-400">
              ${q.jenjang} Kelas ${q.kelas}
            </div>
          </div>
        </div>

        <div>
          ${isCorr
        ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                   <i class="fa-solid fa-circle-check"></i> Jawaban Benar (+${pointPerQuestion} Poin)
                 </span>`
        : `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                   <i class="fa-solid fa-circle-xmark"></i> Jawaban Salah (0 Poin)
                 </span>`
      }
        </div>
      </div>

      <!-- Teks Pertanyaan -->
      <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/50">
        <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 font-heading block mb-1">
          Soal Pertanyaan:
        </span>
        <div class="text-sm font-semibold text-slate-900 dark:text-white math-container leading-relaxed">
          ${q.pertanyaan}
        </div>
      </div>

      <!-- Perbandingan Jawaban -->
      <div class="grid sm:grid-cols-2 gap-3 text-xs">
        <div class="p-3.5 rounded-xl border ${isCorr
        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
        : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
      } space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider ${isCorr ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'} font-heading">
              <i class="fa-solid ${isCorr ? 'fa-check' : 'fa-xmark'} mr-1"></i> Jawaban Anda ${isCorr ? '(Tepat)' : '(Kurang Tepat)'}:
            </span>
          </div>
          <div class="text-sm font-black ${isCorr ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'} math-container">
            ${userAnsText}
          </div>
        </div>

        <div class="p-3.5 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-heading block">
            <i class="fa-solid fa-bullseye mr-1"></i> Kunci Jawaban Resmi:
          </span>
          <div class="text-sm font-black text-emerald-700 dark:text-emerald-300 math-container">
            ${correctAnsText}
          </div>
        </div>
      </div>

      <!-- Kotak Pembahasan Lengkap & Rumus -->
      <div class="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/25 border border-purple-200 dark:border-purple-900/50 space-y-2">
        <div class="flex items-center gap-1.5 text-xs font-black text-purple-800 dark:text-purple-300 font-heading">
          <i class="fa-solid fa-graduation-cap text-[#7C3AED]"></i>
          <span>Langkah Pembahasan & Konsep Matematika:</span>
        </div>
        <div class="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed math-container">
          ${q.solution}
        </div>
        ${q.hint
        ? `<div class="mt-2.5 pt-2 border-t border-purple-200/60 dark:border-purple-900/40 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5 font-medium">
                 <i class="fa-solid fa-lightbulb mt-0.5"></i>
                 <span><strong>Petunjuk / Konsep:</strong> ${q.hint}</span>
               </div>`
        : ''
      }
      </div>
    `;

    listContainer.appendChild(card);
  });

  if (displayedCount === 0) {
    const emptyBox = document.createElement("div");
    emptyBox.className = "p-8 text-center rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm text-slate-500 font-medium space-y-2";
    if (filterMode === "wrong") {
      emptyBox.innerHTML = `
        <div class="text-3xl">🎉</div>
        <div class="font-black text-slate-900 dark:text-white text-base">Hebat Sekali! Tidak Ada Jawaban yang Salah.</div>
        <p class="text-xs text-slate-400">Seluruh soal berhasil kamu jawab dengan benar (Skor 100%).</p>
      `;
    } else {
      emptyBox.innerHTML = `
        <div class="text-3xl">📝</div>
        <div class="font-black text-slate-900 dark:text-white text-base">Tidak ada soal yang sesuai dengan filter ini.</div>
      `;
    }
    listContainer.appendChild(emptyBox);
  }

  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([listContainer]).catch(err => console.log(err));
  }
}

function setupRetakeButton() {
  const btnRetake = document.getElementById("btnRetakeActiveQuiz");
  if (!btnRetake) return;
  btnRetake.onclick = () => {
    const resModal = document.getElementById("quizScoreResultModal");
    if (resModal) {
      resModal.classList.add("opacity-0");
      setTimeout(() => {
        resModal.classList.add("hidden");
        // Trigger mulai kuis lagi dengan konfigurasi yang sama
        if (btnStartConfiguredQuiz) btnStartConfiguredQuiz.click();
      }, 200);
    }
  };
}

function setupReviewFilterButtons() {
  const btnAll = document.getElementById("btnFilterReviewAll");
  const btnWrong = document.getElementById("btnFilterReviewWrong");
  const btnCorrect = document.getElementById("btnFilterReviewCorrect");

  const updateBtnStyles = (activeBtn) => {
    [btnAll, btnWrong, btnCorrect].forEach(b => {
      if (!b) return;
      b.classList.remove("active", "bg-white", "dark:bg-zinc-700", "shadow-sm", "text-slate-900", "dark:text-white");
      b.classList.add("text-slate-500", "dark:text-slate-400");
    });
    if (activeBtn) {
      activeBtn.classList.add("active", "bg-white", "dark:bg-zinc-700", "shadow-sm", "text-slate-900", "dark:text-white");
      activeBtn.classList.remove("text-slate-500", "dark:text-slate-400");
    }
  };

  if (btnAll) {
    btnAll.onclick = () => {
      updateBtnStyles(btnAll);
      renderReviewList("all");
    };
  }
  if (btnWrong) {
    btnWrong.onclick = () => {
      updateBtnStyles(btnWrong);
      renderReviewList("wrong");
    };
  }
  if (btnCorrect) {
    btnCorrect.onclick = () => {
      updateBtnStyles(btnCorrect);
      renderReviewList("correct");
    };
  }
}

const btnDoneViewingScore = document.getElementById("btnDoneViewingScore");
const btnCloseQuizScoreResultModal = document.getElementById("btnCloseQuizScoreResultModal");

function closeQuizScoreResultModal() {
  const resModal = document.getElementById("quizScoreResultModal");
  if (resModal) {
    resModal.classList.add("opacity-0");
    setTimeout(() => {
      resModal.classList.add("hidden");
      // Reset view kembali ke config latihan
      if (latihanConfigCard) latihanConfigCard.classList.remove("hidden");
      if (quizActiveContent) quizActiveContent.classList.add("hidden");
      updateRetakeAttemptUI();
      // Buka pop-up Healing Game
      openHealingPopUp();
    }, 300);
  }
}

if (btnDoneViewingScore) btnDoneViewingScore.addEventListener("click", closeQuizScoreResultModal);
if (btnCloseQuizScoreResultModal) btnCloseQuizScoreResultModal.addEventListener("click", closeQuizScoreResultModal);

// Initial call untuk memuat konfigurasi Kategori Latihan
setQuizJenjang("SMA");
setQuizDiff("Easy");


// ==========================================
// 9. HEALING POP-UP MODAL LOGIC
// ==========================================
const healingPopUpModal = document.getElementById("healingPopUpModal");
const btnHealingLater = document.getElementById("btnHealingLater");
const btnHealingPlayNow = document.getElementById("btnHealingPlayNow");

function openHealingPopUp() {
  if (!healingPopUpModal) return;
  healingPopUpModal.classList.remove("hidden");
  setTimeout(() => healingPopUpModal.classList.remove("opacity-0"), 10);
}

function closeHealingPopUp() {
  if (!healingPopUpModal) return;
  healingPopUpModal.classList.add("opacity-0");
  setTimeout(() => {
    healingPopUpModal.classList.add("hidden");
    // Return to config screen for quiz
    if (latihanConfigCard) latihanConfigCard.classList.remove("hidden");
    if (quizActiveContent) quizActiveContent.classList.add("hidden");
    updateRetakeAttemptUI();
  }, 300);
}

if (btnHealingLater) btnHealingLater.addEventListener("click", closeHealingPopUp);
if (btnHealingPlayNow) {
  btnHealingPlayNow.addEventListener("click", () => {
    closeHealingPopUp();
    switchSectionSlide("slideMinigame");
  });
}


// ==========================================
// 10. HISTORY MODULE & FIRESTORE INTEGRATION
// ==========================================
function saveHistoryToFirestore(data) {
  if (isFirebaseReady && db && auth && auth.currentUser) {
    db.collection("users").doc(auth.currentUser.uid).collection("latihan_history").add(data)
      .then(() => console.log("History saved to Firestore!"))
      .catch(e => {
        console.warn("Firestore history save fallback:", e);
        saveHistoryToLocalStorage(data);
      });
  } else {
    saveHistoryToLocalStorage(data);
  }
}

function saveHistoryToLocalStorage(data) {
  try {
    const uid = (auth && auth.currentUser) ? auth.currentUser.uid : "guest";
    const key = `history_${uid}`;
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    list.unshift(data);
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.error("Localstorage history save error", e);
  }
}

function loadHistoryFromFirestore() {
  const container = document.getElementById("riwayatListContainer");
  const statusText = document.getElementById("riwayatSyncStatusText");
  if (!container) return;

  container.innerHTML = `<div class="p-8 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat data riwayat...</div>`;

  const uid = (auth && auth.currentUser) ? auth.currentUser.uid : "guest";

  if (isFirebaseReady && db && auth && auth.currentUser) {
    if (statusText) statusText.textContent = "Terhubung ke Firestore &bull; Realtime Sync";
    db.collection("users").doc(uid).collection("latihan_history").orderBy("timestamp", "desc").get()
      .then(snapshot => {
        const docs = snapshot.docs.map(doc => doc.data());
        renderHistoryItems(docs);
      })
      .catch(err => {
        console.warn("Firestore fetch fallback to local", err);
        const list = JSON.parse(localStorage.getItem(`history_${uid}`) || "[]");
        renderHistoryItems(list);
      });
  } else {
    if (statusText) statusText.textContent = "Mode Penyimpanan Lokal (Offline / Guest)";
    const list = JSON.parse(localStorage.getItem(`history_${uid}`) || "[]");
    renderHistoryItems(list);
  }
}

function renderHistoryItems(items) {
  const container = document.getElementById("riwayatListContainer");
  if (!container) return;
  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="glass-card rounded-3xl p-8 text-center text-slate-500 space-y-2 border border-slate-200 dark:border-slate-800">
        <i class="fa-solid fa-folder-open text-3xl text-slate-400"></i>
        <div class="font-bold text-sm">Belum Ada Riwayat Latihan</div>
        <p class="text-xs text-slate-400">Selesaikan minimal 1 latihan soal untuk melihat rekaman skor di sini.</p>
      </div>
    `;
    return;
  }

  items.forEach((item, idx) => {
    const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString("id-ID") : "Tanggal tidak diketahui";
    const card = document.createElement("div");
    card.className = "bento-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4";
    card.innerHTML = `
      <div class="space-y-1.5">
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-xl bg-flat-purple text-white font-black text-xs">
            ${item.jenjang || 'SMA'} Kelas ${item.kelas || 12}
          </span>
          <span class="px-3 py-1 rounded-xl bg-flat-yellow text-slate-950 font-black text-xs">
            ${item.difficulty || 'Easy'}
          </span>
          <span class="text-xs font-bold text-slate-400">• Percobaan ke-${item.attemptNumber || 1}</span>
        </div>
        <div class="text-xs font-medium text-slate-500 dark:text-slate-400">${dateStr}</div>
      </div>

      <div class="flex items-center gap-5">
        <div class="text-right">
          <div class="text-[10px] font-black text-slate-400 uppercase font-heading">Skor</div>
          <div class="text-2xl font-black text-[#7C3AED] font-heading">${item.score || 0}</div>
        </div>

        <button class="btn-detail-history btn-flat btn-flat-purple px-4 py-2 text-xs font-black flex items-center gap-1.5">
          <i class="fa-solid fa-eye"></i> Detail
        </button>
      </div>
    `;

    card.querySelector(".btn-detail-history").addEventListener("click", () => openHistoryDetailModal(item));
    container.appendChild(card);
  });
}

function openHistoryDetailModal(item) {
  const modal = document.getElementById("historyDetailModal");
  if (!modal) return;

  document.getElementById("historyModalTitle").textContent = `${item.jenjang} Kelas ${item.kelas} - ${item.difficulty} (Percobaan #${item.attemptNumber || 1})`;

  const sumBox = document.getElementById("historyModalSummaryBox");
  sumBox.innerHTML = `
    <div>
      <span class="text-slate-400 block text-[10px]">Total Skor</span>
      <span class="font-black text-sky-500 text-xl">${item.score || 0}</span>
    </div>
    <div>
      <span class="text-slate-400 block text-[10px]">Benar / Salah</span>
      <span class="font-bold text-emerald-500 text-sm">${item.totalBenar || 0} / ${item.totalSalah || 0}</span>
    </div>
    <div>
      <span class="text-slate-400 block text-[10px]">Tanggal</span>
      <span class="font-bold text-slate-700 dark:text-slate-300 text-[11px]">${item.timestamp ? new Date(item.timestamp).toLocaleDateString("id-ID") : "-"}</span>
    </div>
  `;

  const container = document.getElementById("historyModalPembahasanContainer");
  container.innerHTML = "";

  (item.userAnswers || []).forEach((ans, idx) => {
    const card = document.createElement("div");
    card.className = `p-4 rounded-2xl border ${ans.isCorrect ? "border-emerald-300 bg-emerald-50/20" : "border-red-300 bg-red-50/20"} space-y-2 text-xs`;
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-bold text-slate-800 dark:text-slate-200">Soal #${idx + 1}</span>
        <span class="font-extrabold ${ans.isCorrect ? "text-emerald-600" : "text-red-600"}">${ans.isCorrect ? "Benar" : "Salah"}</span>
      </div>
      <div class="font-semibold text-slate-900 dark:text-white math-container">${ans.questionText}</div>
      <div class="grid sm:grid-cols-2 gap-2">
        <div class="p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200">
          <span class="text-slate-400 block text-[10px]">Jawaban Anda:</span>
          <span class="font-bold ${ans.isCorrect ? "text-emerald-600" : "text-red-600"}">${ans.userAnsText}</span>
        </div>
        <div class="p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200">
          <span class="text-slate-400 block text-[10px]">Kunci Jawaban:</span>
          <span class="font-bold text-emerald-600">${ans.correctAnsText}</span>
        </div>
      </div>
      <div class="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 math-container">${ans.solutionText}</div>
    `;
    container.appendChild(card);
  });

  modal.classList.remove("hidden");
  setTimeout(() => modal.classList.remove("opacity-0"), 10);

  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([container]).catch(err => console.log(err));
  }
}

const btnCloseHistoryDetailModal = document.getElementById("btnCloseHistoryDetailModal");
if (btnCloseHistoryDetailModal) {
  btnCloseHistoryDetailModal.addEventListener("click", () => {
    const modal = document.getElementById("historyDetailModal");
    if (modal) {
      modal.classList.add("opacity-0");
      setTimeout(() => modal.classList.add("hidden"), 300);
    }
  });
}

const btnRefreshHistory = document.getElementById("btnRefreshHistory");
if (btnRefreshHistory) btnRefreshHistory.addEventListener("click", loadHistoryFromFirestore);


// ==========================================
// 11. MINI GAME 2D PLATFORMER HEALING ENGINE
// ==========================================
let platformerCanvas = null;
let ctx = null;
let gameLoopId = null;
let isGameRunning = false;

let currentLevel = 1;
let gameScore = 0;
let coinsCount = 0;

let player = {
  x: 50,
  y: 280,
  width: 24,
  height: 32,
  vx: 0,
  vy: 0,
  speed: 4,
  jumpPower: -10,
  isGrounded: false
};

const keys = { left: false, right: false, up: false };

let levelPlatforms = [];
let levelCoins = [];
let levelHazards = [];
let finishFlag = { x: 730, y: 280, width: 30, height: 40 };

function initPlatformerCanvas() {
  platformerCanvas = document.getElementById("healingGameCanvas");
  if (!platformerCanvas) return;
  ctx = platformerCanvas.getContext("2d");

  setupLevel(currentLevel);

  // Attach controls
  window.removeEventListener("keydown", handleGameKeyDown);
  window.removeEventListener("keyup", handleGameKeyUp);
  window.addEventListener("keydown", handleGameKeyDown);
  window.addEventListener("keyup", handleGameKeyUp);

  setupTouchControls();
}

function handleGameKeyDown(e) {
  if (currentSlideId !== "slideMinigame") return;

  const gameKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "a", "A", "d", "D", "w", "W"];
  if (gameKeys.includes(e.key)) {
    e.preventDefault();
  }

  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
  if (e.key === "ArrowUp" || e.key === " " || e.key === "w" || e.key === "W") {
    keys.up = true;
    if (player.isGrounded) {
      player.vy = player.jumpPower;
      player.isGrounded = false;
    }
  }
}

function handleGameKeyUp(e) {
  if (currentSlideId !== "slideMinigame") return;

  const gameKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "a", "A", "d", "D", "w", "W"];
  if (gameKeys.includes(e.key)) {
    e.preventDefault();
  }

  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
  if (e.key === "ArrowUp" || e.key === " " || e.key === "w" || e.key === "W") keys.up = false;
}

window.addEventListener("blur", () => {
  keys.left = false;
  keys.right = false;
  keys.up = false;
});

function setupTouchControls() {
  const btnL = document.getElementById("btnTouchLeft");
  const btnR = document.getElementById("btnTouchRight");
  const btnJ = document.getElementById("btnTouchJump");

  if (btnL) {
    btnL.onpointerdown = (e) => { e.preventDefault(); keys.left = true; };
    btnL.onpointerup = (e) => { e.preventDefault(); keys.left = false; };
  }
  if (btnR) {
    btnR.onpointerdown = (e) => { e.preventDefault(); keys.right = true; };
    btnR.onpointerup = (e) => { e.preventDefault(); keys.right = false; };
  }
  if (btnJ) {
    btnJ.onpointerdown = (e) => {
      e.preventDefault();
      keys.up = true;
      if (player.isGrounded) {
        player.vy = player.jumpPower;
        player.isGrounded = false;
      }
    };
    btnJ.onpointerup = (e) => { e.preventDefault(); keys.up = false; };
  }
}

function setupLevel(lvl) {
  isGameRunning = false;
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }

  currentLevel = lvl;
  player.x = 40;
  player.y = 280;
  player.vx = 0;
  player.vy = 0;
  player.isGrounded = false;

  // Reset input keys so character starts stationary on level change
  keys.left = false;
  keys.right = false;
  keys.up = false;

  [document.getElementById("btnGameLevel1"), document.getElementById("btnGameLevel2"), document.getElementById("btnGameLevel3")].forEach(b => b?.classList.remove("active"));
  if (lvl === 1) document.getElementById("btnGameLevel1")?.classList.add("active");
  if (lvl === 2) document.getElementById("btnGameLevel2")?.classList.add("active");
  if (lvl === 3) document.getElementById("btnGameLevel3")?.classList.add("active");

  const overlayTitle = document.getElementById("overlayLevelTitle");
  if (overlayTitle) {
    if (lvl === 1) overlayTitle.textContent = "Level 1: Sunset Meadow Haven";
    else if (lvl === 2) overlayTitle.textContent = "Level 2: Enchanted Forest";
    else if (lvl === 3) overlayTitle.textContent = "Level 3: Cosmic Sky Castle";
  }

  // Level Maps
  if (lvl === 1) {
    levelPlatforms = [
      { x: 0, y: 350, w: 800, h: 50, color: "#10B981" },
      { x: 180, y: 280, w: 120, h: 20, color: "#34D399" },
      { x: 360, y: 220, w: 120, h: 20, color: "#34D399" },
      { x: 540, y: 270, w: 140, h: 20, color: "#34D399" }
    ];
    levelCoins = [
      { x: 220, y: 240, collected: false },
      { x: 400, y: 180, collected: false },
      { x: 590, y: 230, collected: false },
      { x: 700, y: 310, collected: false }
    ];
    levelHazards = [];
    finishFlag = { x: 740, y: 305, width: 30, height: 45 };
  } else if (lvl === 2) {
    levelPlatforms = [
      { x: 0, y: 350, w: 220, h: 50, color: "#059669" },
      { x: 280, y: 300, w: 140, h: 20, color: "#10B981" },
      { x: 480, y: 240, w: 120, h: 20, color: "#10B981" },
      { x: 660, y: 180, w: 140, h: 220, color: "#059669" }
    ];
    levelCoins = [
      { x: 120, y: 310, collected: false },
      { x: 340, y: 260, collected: false },
      { x: 530, y: 200, collected: false },
      { x: 720, y: 140, collected: false }
    ];
    levelHazards = [
      { x: 230, y: 340, w: 40, h: 10 }
    ];
    finishFlag = { x: 730, y: 135, width: 30, height: 45 };
  } else if (lvl === 3) {
    levelPlatforms = [
      { x: 0, y: 350, w: 150, h: 50, color: "#8B5CF6" },
      { x: 200, y: 280, w: 100, h: 20, color: "#A78BFA" },
      { x: 360, y: 220, w: 100, h: 20, color: "#A78BFA" },
      { x: 520, y: 160, w: 100, h: 20, color: "#A78BFA" },
      { x: 670, y: 120, w: 130, h: 280, color: "#8B5CF6" }
    ];
    levelCoins = [
      { x: 240, y: 240, collected: false },
      { x: 400, y: 180, collected: false },
      { x: 560, y: 120, collected: false },
      { x: 720, y: 80, collected: false }
    ];
    levelHazards = [
      { x: 160, y: 340, w: 30, h: 10 },
      { x: 310, y: 340, w: 40, h: 10 }
    ];
    finishFlag = { x: 730, y: 75, width: 30, height: 45 };
  }

  drawPlatformer();
}

function startPlatformerLoop() {
  const overlay = document.getElementById("gameStartOverlay");
  if (overlay) overlay.classList.add("hidden");

  isGameRunning = false;
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }

  isGameRunning = true;

  function loop() {
    if (!isGameRunning) return;

    updatePlatformer();

    if (!isGameRunning) return;

    drawPlatformer();
    gameLoopId = requestAnimationFrame(loop);
  }

  loop();
}

function updatePlatformer() {
  if (!isGameRunning) return;

  // Horizontal movement
  if (keys.left) player.vx = -player.speed;
  else if (keys.right) player.vx = player.speed;
  else player.vx = 0;

  // Apply gravity
  player.vy += 0.5;

  player.x += player.vx;
  player.y += player.vy;

  // Keep player inside left canvas boundary
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > 800) player.x = 800 - player.width;

  // Bottom boundary fall check
  if (player.y > 450) {
    // Reset player position
    player.x = 40;
    player.y = 250;
    player.vx = 0;
    player.vy = 0;
  }

  // Platform collision
  player.isGrounded = false;
  levelPlatforms.forEach(p => {
    if (
      player.x < p.x + p.w &&
      player.x + player.width > p.x &&
      player.y + player.height >= p.y &&
      player.y + player.height <= p.y + p.h + player.vy
    ) {
      if (player.vy > 0) {
        player.y = p.y - player.height;
        player.vy = 0;
        player.isGrounded = true;
      }
    }
  });

  // Hazard collision
  levelHazards.forEach(h => {
    if (
      player.x < h.x + h.w &&
      player.x + player.width > h.x &&
      player.y + player.height > h.y
    ) {
      player.x = 40;
      player.y = 250;
    }
  });

  // Coin pickup
  levelCoins.forEach(c => {
    if (!c.collected) {
      const dist = Math.hypot((player.x + 12) - c.x, (player.y + 16) - c.y);
      if (dist < 22) {
        c.collected = true;
        coinsCount++;
        gameScore += 50;
        document.getElementById("gameCoinCount").textContent = coinsCount;
        document.getElementById("gameScoreCount").textContent = gameScore;
      }
    }
  });

  // Finish Flag Collision
  if (
    player.x < finishFlag.x + finishFlag.width &&
    player.x + player.width > finishFlag.x &&
    player.y < finishFlag.y + finishFlag.height &&
    player.y + player.height > finishFlag.y
  ) {
    isGameRunning = false;
    if (gameLoopId) {
      cancelAnimationFrame(gameLoopId);
      gameLoopId = null;
    }

    if (currentLevel < 3) {
      const nextLvl = currentLevel + 1;
      setTimeout(() => {
        alert(`Level ${currentLevel} Selesai! Kamu hebat! Lanjut ke Level ${nextLvl}.`);
        setupLevel(nextLvl);
        startPlatformerLoop();
      }, 50);
    } else {
      setTimeout(() => {
        alert(`SELAMAT! Kamu berhasil menyelesaikan SELURUH LEVEL Healing Platformer MathVerse! Score Akhir: ${gameScore}`);
        setupLevel(1);
        const overlay = document.getElementById("gameStartOverlay");
        if (overlay) overlay.classList.remove("hidden");
      }, 50);
    }
  }
}

function drawPlatformer() {
  if (!ctx || !platformerCanvas) return;

  // Background gradient per level
  let bgGrad = ctx.createLinearGradient(0, 0, 0, 400);
  if (currentLevel === 1) {
    bgGrad.addColorStop(0, "#0284c7");
    bgGrad.addColorStop(1, "#bae6fd");
  } else if (currentLevel === 2) {
    bgGrad.addColorStop(0, "#064e3b");
    bgGrad.addColorStop(1, "#047857");
  } else {
    bgGrad.addColorStop(0, "#311042");
    bgGrad.addColorStop(1, "#581c87");
  }

  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 800, 400);

  // Draw Clouds / Stars
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.beginPath();
  ctx.arc(150, 60, 25, 0, Math.PI * 2);
  ctx.arc(175, 50, 30, 0, Math.PI * 2);
  ctx.arc(200, 60, 25, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(550, 90, 20, 0, Math.PI * 2);
  ctx.arc(570, 80, 25, 0, Math.PI * 2);
  ctx.arc(590, 90, 20, 0, Math.PI * 2);
  ctx.fill();

  // Draw Platforms
  levelPlatforms.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Grass Top Highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.fillRect(p.x, p.y, p.w, 4);
  });

  // Draw Hazards (Spikes)
  ctx.fillStyle = "#EF4444";
  levelHazards.forEach(h => {
    ctx.beginPath();
    ctx.moveTo(h.x, h.y + h.h);
    ctx.lineTo(h.x + h.w / 2, h.y);
    ctx.lineTo(h.x + h.w, h.y + h.h);
    ctx.fill();
  });

  // Draw Coins
  levelCoins.forEach(c => {
    if (!c.collected) {
      ctx.fillStyle = "#F59E0B";
      ctx.beginPath();
      ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FEF08A";
      ctx.beginPath();
      ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Draw Finish Flag
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(finishFlag.x, finishFlag.y, 4, finishFlag.height);

  ctx.fillStyle = "#EF4444";
  ctx.beginPath();
  ctx.moveTo(finishFlag.x + 4, finishFlag.y);
  ctx.lineTo(finishFlag.x + 28, finishFlag.y + 10);
  ctx.lineTo(finishFlag.x + 4, finishFlag.y + 20);
  ctx.fill();

  // Draw Player Avatar
  ctx.fillStyle = "#00A5EC";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Avatar Eyes
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(player.x + 14, player.y + 6, 6, 6);
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(player.x + 17, player.y + 8, 3, 3);
}

const btnGameLevel1 = document.getElementById("btnGameLevel1");
const btnGameLevel2 = document.getElementById("btnGameLevel2");
const btnGameLevel3 = document.getElementById("btnGameLevel3");
const btnRestartPlatformer = document.getElementById("btnRestartPlatformer");
const btnStartPlatformerPlay = document.getElementById("btnStartPlatformerPlay");

if (btnGameLevel1) btnGameLevel1.addEventListener("click", () => setupLevel(1));
if (btnGameLevel2) btnGameLevel2.addEventListener("click", () => setupLevel(2));
if (btnGameLevel3) btnGameLevel3.addEventListener("click", () => setupLevel(3));

if (btnRestartPlatformer) btnRestartPlatformer.addEventListener("click", () => setupLevel(currentLevel));
if (btnStartPlatformerPlay) btnStartPlatformerPlay.addEventListener("click", startPlatformerLoop);


// ==========================================
// 12. INITIALIZATION ON DOM READY
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("MathVerse Engine Ready!");
});
