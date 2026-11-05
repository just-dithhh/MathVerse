/* script.js - Interactive Engine for MathVerse */

// ==========================================
// 1. FIREBASE CONFIGURATION & INITIALIZATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAIYCnCxT-dDXFcCQPqRpBVr-lfFsRZ-Fs",
  authDomain: "mathverse-kalkulus-bbf32.firebaseapp.com",
  projectId: "mathverse-kalkulus-bbf32",
  storageBucket: "mathverse-kalkulus-bbf32.firebasestorage.app",
  messagingSenderId: "840758561326",
  appId: "1:840758561326:web:21a70ecd578ef7b06cedbf"
};

let isFirebaseReady = false;
let auth = null;
let db = null;

try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    isFirebaseReady = true;
    console.log("Firebase initialized successfully.");
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

const loggedOutView = document.getElementById("loggedOutView");
const loggedInView = document.getElementById("loggedInView");
const userDisplayName = document.getElementById("userDisplayName");
const btnLogout = document.getElementById("btnLogout");
const heroUserGreeting = document.getElementById("heroUserGreeting");

function openAuthModal() {
  if (!authModal) return;
  authModal.classList.remove("hidden");
  setTimeout(() => authModal.classList.remove("opacity-0"), 10);
}

function closeAuthModal() {
  if (!authModal) return;
  authModal.classList.add("opacity-0");
  setTimeout(() => authModal.classList.add("hidden"), 300);
}

if (btnOpenAuth) btnOpenAuth.addEventListener("click", openAuthModal);
if (btnCloseAuthModal) btnCloseAuthModal.addEventListener("click", closeAuthModal);

if (tabAuthLogin && tabAuthRegister) {
  tabAuthLogin.addEventListener("click", () => {
    tabAuthLogin.className = "flex-1 py-3 font-bold text-sm text-sky-500 border-b-2 border-sky-500";
    tabAuthRegister.className = "flex-1 py-3 font-bold text-sm text-slate-400 border-b-2 border-transparent hover:text-slate-600";
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
  });

  tabAuthRegister.addEventListener("click", () => {
    tabAuthRegister.className = "flex-1 py-3 font-bold text-sm text-sky-500 border-b-2 border-sky-500";
    tabAuthLogin.className = "flex-1 py-3 font-bold text-sm text-slate-400 border-b-2 border-transparent hover:text-slate-600";
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  });
}

function updateAuthUI(user) {
  if (user) {
    const name = user.displayName || user.email.split("@")[0];
    if (loggedOutView) loggedOutView.classList.add("hidden");
    if (loggedInView) loggedInView.classList.remove("hidden");
    if (userDisplayName) userDisplayName.textContent = name;
    if (heroUserGreeting) {
      heroUserGreeting.innerHTML = `Selamat datang kembali, <strong class="text-sky-500 font-bold">${name}</strong>! Siapkan dirimu untuk belajar matematika secara menyenangkan.`;
    }
  } else {
    if (loggedOutView) loggedOutView.classList.remove("hidden");
    if (loggedInView) loggedInView.classList.add("hidden");
    if (userDisplayName) userDisplayName.textContent = "Siswa";
    if (heroUserGreeting) {
      heroUserGreeting.innerHTML = `Jelajahi rangkuman materi lengkap, kerjakan latihan soal berkonfigurasi tingkat kesulitan, dan nikmati game platformer healing interaktif.`;
    }
  }
  updateRetakeAttemptUI();
}

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPassword").value;

    if (isFirebaseReady && auth) {
      auth.signInWithEmailAndPassword(email, pass)
        .then(() => closeAuthModal())
        .catch(err => {
          alert("Login info: " + err.message);
          updateAuthUI({ displayName: email.split("@")[0], email: email });
          closeAuthModal();
        });
    } else {
      updateAuthUI({ displayName: email.split("@")[0], email: email });
      closeAuthModal();
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fullName = document.getElementById("regFullName").value;
    const email = document.getElementById("regEmail").value;
    const pass = document.getElementById("regPassword").value;

    if (isFirebaseReady && auth) {
      auth.createUserWithEmailAndPassword(email, pass)
        .then((cred) => cred.user.updateProfile({ displayName: fullName }))
        .then(() => closeAuthModal())
        .catch(err => {
          alert("Registrasi info: " + err.message);
          updateAuthUI({ displayName: fullName, email: email });
          closeAuthModal();
        });
    } else {
      updateAuthUI({ displayName: fullName, email: email });
      closeAuthModal();
    }
  });
}

if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    if (isFirebaseReady && auth) {
      auth.signOut().then(() => updateAuthUI(null));
    } else {
      updateAuthUI(null);
    }
  });
}

if (isFirebaseReady && auth) {
  auth.onAuthStateChanged(user => updateAuthUI(user));
}


// ==========================================
// 6. CURRICULUM DATA STRUCTURE (SD, SMP, SMA)
// ==========================================
const curriculumData = {
  SD: {
    1: [
      {
        id: "sd-1-bilangan",
        title: "Bilangan Cacah 1 - 20 & Operasi",
        description: "Mengenal lambang bilangan, membilang benda, serta penjumlahan & pengurangan dasar.",
        icon: "fa-solid fa-list-ol",
        fase: "Fase A",
        conceptText: "<strong>Konsep Dasar:</strong> Bilangan cacah adalah himpunan bilangan bulat non-negatif yaitu \\(0, 1, 2, 3, \\dots\\). Pada Kelas 1, siswa belajar membilang objek konkrit dan mengaitkannya dengan lambang angka.<br><br>$$\\text{Jumlah} = a + b$$",
        properties: [
          { title: "Penjumlahan", desc: "Menggabungkan dua kelompok benda menjadi satu himpunan." },
          { title: "Pengurangan", desc: "Mengambil sebagian benda dari kelompok semula." }
        ],
        visualSvg: `<svg viewBox="0 0 300 120" class="w-full h-auto">
          <circle cx="50" cy="60" r="20" fill="#00A5EC" />
          <circle cx="100" cy="60" r="20" fill="#00A5EC" />
          <text x="135" y="68" font-size="24" fill="#F59E0B" font-weight="bold">+</text>
          <circle cx="180" cy="60" r="20" fill="#10B981" />
          <text x="215" y="68" font-size="24" fill="#F59E0B" font-weight="bold">=</text>
          <text x="255" y="68" font-size="22" fill="#00A5EC" font-weight="bold">3</text>
        </svg>`,
        exampleProblems: [
          {
            problem: "Budi memiliki 5 apel. Ibu memberikan 3 apel lagi. Berapa total apel Budi sekarang?",
            options: ["6 Apel", "7 Apel", "8 Apel", "9 Apel"],
            answerIndex: 2,
            solutionSteps: "1. Apel awal = 5<br>2. Apel tambahan = 3<br>3. Total = \\(5 + 3 = 8\\) Apel."
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
        description: "Mengenal pembilang, penyebut, dan pecahan senilai.",
        icon: "fa-solid fa-pie-chart",
        fase: "Fase B",
        conceptText: "Pecahan menyatakan bagian dari keseluruhan yang dibagi sama besar.<br>$$\\text{Pecahan} = \\frac{a}{b} \\quad (a = \\text{pembilang}, b = \\text{penyebut})$$",
        properties: [
          { title: "Pembilang", desc: "Angka di atas yang menunjukkan banyaknya bagian yang diambil." },
          { title: "Penyebut", desc: "Angka di bawah yang menunjukkan total pembagian." }
        ],
        visualSvg: `<svg viewBox="0 0 200 120" class="w-full h-auto">
          <circle cx="100" cy="60" r="45" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
          <path d="M100,60 L100,15 A45,45 0 0,1 145,60 Z" fill="#00A5EC" />
          <text x="100" y="115" font-size="12" font-weight="bold" fill="#00A5EC" text-anchor="middle">1/4 Bagian</text>
        </svg>`,
        exampleProblems: [
          {
            problem: "Sebuah kue dipotong menjadi 4 bagian sama besar. Ani memakan 1 potong. Berapa bagian kue yang dimakan Ani?",
            options: ["\\(\\frac{1}{2}\\)", "\\(\\frac{1}{3}\\)", "\\(\\frac{1}{4}\\)", "\\(\\frac{3}{4}\\)"],
            answerIndex: 2,
            solutionSteps: "1 potong dari 4 bagian sama dengan pecahan \\(\\frac{1}{4}\\)."
          }
        ]
      }
    ],
    4: [
      {
        id: "sd-4-fpbkpk",
        title: "FPB & KPK Bilangan",
        description: "Faktor Persekutuan Terbesar dan Kelipatan Persekutuan Terkecil.",
        icon: "fa-solid fa-calculator",
        fase: "Fase B",
        conceptText: "FPB adalah faktor persekutuan terbesar dari dua bilangan atau lebih, sedangkan KPK adalah kelipatan persekutuan terkecil.",
        properties: [
          { title: "FPB", desc: "Gunakan perkalian faktor prima dengan pangkat terendah." },
          { title: "KPK", desc: "Gunakan semua faktor prima dengan pangkat tertinggi." }
        ],
        visualSvg: `<svg viewBox="0 0 240 80" class="w-full h-auto">
          <text x="30" y="45" font-size="14" font-weight="bold" fill="#00A5EC">FPB(12, 18) = 6</text>
          <text x="150" y="45" font-size="14" font-weight="bold" fill="#10B981">KPK(12, 18) = 36</text>
        </svg>`,
        exampleProblems: [
          {
            problem: "KPK dari 4 dan 6 adalah...",
            options: ["8", "12", "16", "24"],
            answerIndex: 1,
            solutionSteps: "Kelipatan 4: 4, 8, 12, 16...<br>Kelipatan 6: 6, 12, 18...<br>Kelipatan persekutuan terkecil adalah 12."
          }
        ]
      }
    ],
    5: [
      {
        id: "sd-5-volum",
        title: "Volume Kubus & Balok",
        description: "Menghitung kapasitas dan luas permukaan bangun ruang kubus dan balok.",
        icon: "fa-solid fa-cube",
        fase: "Fase C",
        conceptText: "Volume menyatakan besar ruang yang dapat ditempati oleh suatu bangun ruang 3 dimensi.<br>$$V_{\\text{kubus}} = s^3, \\quad V_{\\text{balok}} = p \\times l \\times t$$",
        properties: [
          { title: "Kubus", desc: "Semua rusuk sama panjang (s)." },
          { title: "Balok", desc: "Memiliki panjang (p), lebar (l), dan tinggi (t)." }
        ],
        visualSvg: `<svg viewBox="0 0 200 120" class="w-full h-auto">
          <rect x="40" y="40" width="50" height="50" fill="none" stroke="#00A5EC" stroke-width="2"/>
          <rect x="60" y="20" width="50" height="50" fill="none" stroke="#00A5EC" stroke-width="2" stroke-dasharray="4"/>
          <line x1="40" y1="40" x2="60" y2="20" stroke="#00A5EC" stroke-width="2"/>
          <line x1="90" y1="40" x2="110" y2="20" stroke="#00A5EC" stroke-width="2"/>
          <line x1="40" y1="90" x2="60" y2="70" stroke="#00A5EC" stroke-width="2"/>
          <line x1="90" y1="90" x2="110" y2="70" stroke="#00A5EC" stroke-width="2"/>
        </svg>`,
        exampleProblems: [
          {
            problem: "Sebuah kubus memiliki panjang rusuk 5 cm. Berapakah volumenya?",
            options: ["25 cm³", "75 cm³", "125 cm³", "150 cm³"],
            answerIndex: 2,
            solutionSteps: "\\(V = s^3 = 5 \\times 5 \\times 5 = 125\\) cm³."
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
        description: "Mengenal variabel, koefisien, konstanta, dan suku sejenis.",
        icon: "fa-solid fa-superscript",
        fase: "Fase D",
        conceptText: "Bentuk aljabar terdiri dari kombinasi huruf (variabel) dan angka (koefisien/konstanta).<br>$$a x + b = 0$$",
        properties: [
          { title: "Variabel", desc: "Simbol lambang pengganti nilai yang belum diketahui." },
          { title: "Suku Sejenis", desc: "Suku dengan variabel dan pangkat yang persis sama." }
        ],
        visualSvg: `<svg viewBox="0 0 240 80" class="w-full h-auto">
          <text x="40" y="45" font-size="18" font-weight="bold" fill="#00A5EC">3x + 5y - 7</text>
        </svg>`,
        exampleProblems: [
          {
            problem: "Sederhanakan bentuk aljabar: \\(3x + 4y - x + 2y\\)",
            options: ["\\(2x + 6y\\)", "\\(4x + 6y\\)", "\\(2x + 2y\\)", "\\(5x + 6y\\)"],
            answerIndex: 0,
            solutionSteps: "Kelompokkan suku sejenis:<br>\\((3x - x) + (4y + 2y) = 2x + 6y\\)."
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
        description: "Akar-akar persamaan kuadrat dan bentuk grafik parabola.",
        icon: "fa-solid fa-chart-area",
        fase: "Fase D",
        conceptText: "Persamaan kuadrat memiliki bentuk umum \\(a x^2 + b x + c = 0\\) dengan \\(a \\neq 0\\).<br>$$x_{1,2} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$",
        properties: [
          { title: "Diskriminan (D)", desc: "\\(D = b^2 - 4ac\\). Jika \\(D > 0\\), memiliki 2 akar real berbeda." },
          { title: "Grafik Parabola", desc: "Kurva terbuka ke atas jika \\(a > 0\\) dan terbuka ke bawah jika \\(a < 0\\)." }
        ],
        visualSvg: `<svg viewBox="0 0 200 120" class="w-full h-auto">
          <line x1="20" y1="90" x2="180" y2="90" stroke="#94a3b8" stroke-width="1.5"/>
          <path d="M 40,20 Q 100,110 160,20" fill="none" stroke="#00A5EC" stroke-width="2.5"/>
        </svg>`,
        exampleProblems: [
          {
            problem: "Akar-akar dari persamaan kuadrat \\(x^2 - 5x + 6 = 0\\) adalah...",
            options: ["x = 1 atau x = 6", "x = 2 atau x = 3", "x = -2 atau x = -3", "x = -1 atau x = 6"],
            answerIndex: 1,
            solutionSteps: "Faktorkan: \\((x - 2)(x - 3) = 0 \\implies x = 2\\) atau \\(x = 3\\)."
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
        description: "Sifat-sifat perpangkatan dan bentuk invers logaritma.",
        icon: "fa-solid fa-bolt",
        fase: "Fase E",
        conceptText: "Eksponen menyatakan perkalian berulang. Logaritma merupakan invers dari eksponen.<br>$$a^x = b \\iff \\phantom{}^a\\log b = x$$",
        properties: [
          { title: "Perkalian Eksponen", desc: "\\(a^m \\cdot a^n = a^{m+n}\\)" },
          { title: "Sifat Logaritma", desc: "\\(\\log(a \\cdot b) = \\log a + \\log b\\)" }
        ],
        visualSvg: `<svg viewBox="0 0 200 100" class="w-full h-auto">
          <path d="M 30,80 Q 100,75 170,10" fill="none" stroke="#00A5EC" stroke-width="2.5"/>
        </svg>`,
        exampleProblems: [
          {
            problem: "Nilai dari \\(2^3 \\cdot 2^4\\) adalah...",
            options: ["\\(2^7 = 128\\)", "\\(2^{12} = 4096\\)", "\\(4^7\\)", "64"],
            answerIndex: 0,
            solutionSteps: "Gunakan sifat \\(a^m \\cdot a^n = a^{m+n} \\implies 2^{3+4} = 2^7 = 128\\)."
          }
        ]
      }
    ],
    11: [
      {
        id: "sma-11-matriks",
        title: "Matriks & Determinasi",
        description: "Operasi penjumlahan, perkalian matriks, dan determinan 2x2.",
        icon: "fa-solid fa-table-cells",
        fase: "Fase F",
        conceptText: "Matriks adalah susunan bilangan berbentuk persegi panjang dalam baris dan kolom.<br>$$\\det \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc$$",
        properties: [
          { title: "Determinan 2x2", desc: "Selisih hasil kali diagonal utama dan diagonal samping." },
          { title: "Invers Matriks", desc: "\\(A^{-1} = \\frac{1}{\\det(A)} \\text{Adj}(A)\\)" }
        ],
        visualSvg: `<svg viewBox="0 0 200 80" class="w-full h-auto">
          <text x="60" y="45" font-size="20" font-weight="bold" fill="#00A5EC">[ A ] × [ B ] = [ C ]</text>
        </svg>`,
        exampleProblems: [
          {
            problem: "Determinan dari matriks \\(A = \\begin{pmatrix} 4 & 2 \\\\ 1 & 3 \\end{pmatrix}\\) adalah...",
            options: ["10", "14", "8", "6"],
            answerIndex: 0,
            solutionSteps: "\\(\\det(A) = (4 \\times 3) - (2 \\times 1) = 12 - 2 = 10\\)."
          }
        ]
      }
    ],
    12: [
      {
        id: "sma-12-kalkulus",
        title: "Limit, Turunan, & Integral (Kalkulus)",
        description: "Analisis laju perubahan dan anti-turunan fungsi.",
        icon: "fa-solid fa-infinity",
        fase: "Fase F+",
        conceptText: "Kalkulus mempelajari perubahan kontinu melalui konsep Limit, Turunan (Diferensial), dan Integral (Anti-Turunan).<br>$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}, \\quad \\int x^n dx = \\frac{1}{n+1}x^{n+1} + C$$",
        properties: [
          { title: "Turunan Pangkat", desc: "\\(\\frac{d}{dx}(a x^n) = a \\cdot n x^{n-1}\\)" },
          { title: "Integral Tentu", desc: "\\(\\int_a^b f(x) dx = F(b) - F(a)\\)" }
        ],
        visualSvg: `<svg viewBox="0 0 240 100" class="w-full h-auto">
          <path d="M 30,80 Q 120,10 210,80" fill="none" stroke="#00A5EC" stroke-width="2.5"/>
          <line x1="70" y1="80" x2="70" y2="45" stroke="#F59E0B" stroke-dasharray="3"/>
          <line x1="170" y1="80" x2="170" y2="45" stroke="#F59E0B" stroke-dasharray="3"/>
        </svg>`,
        exampleProblems: [
          {
            problem: "Turunan pertama dari \\(f(x) = 3x^2 - 5x + 4\\) adalah...",
            options: ["\\(6x - 5\\)", "\\(3x - 5\\)", "\\(6x + 4\\)", "\\(6x^2 - 5\\)"],
            answerIndex: 0,
            solutionSteps: "\\(f'(x) = 3 \\cdot (2x^{2-1}) - 5(1) + 0 = 6x - 5\\)."
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
    btn.className = `kelas-filter-btn px-4 py-2 rounded-xl text-xs font-bold border ${
      isSelected
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
    pCard.className = "p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1";
    pCard.innerHTML = `<strong class="text-sky-600 dark:text-sky-400 font-bold block">${p.title}</strong><span class="text-slate-600 dark:text-slate-400 text-xs">${p.desc}</span>`;
    propsBody.appendChild(pCard);
  });

  document.getElementById("detailVisualSvg").innerHTML = t.visualSvg;

  const exampleContainer = document.getElementById("detailExampleProblemsContainer");
  exampleContainer.innerHTML = "";
  t.exampleProblems.forEach((ep, idx) => {
    const eCard = document.createElement("div");
    eCard.className = "p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3";
    eCard.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="px-2.5 py-0.5 rounded-lg bg-amber-500 text-white font-black text-xs">Contoh Soal #${idx + 1}</span>
      </div>
      <div class="font-bold text-sm text-slate-900 dark:text-white math-container">${ep.problem}</div>
      <div class="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
        <div class="font-bold text-emerald-600 dark:text-emerald-400">Jawaban Langsung: ${ep.options[ep.answerIndex]}</div>
        <div class="text-slate-600 dark:text-slate-300 math-container">${ep.solutionSteps}</div>
      </div>
    `;
    exampleContainer.appendChild(eCard);
  });

  materiCatalogView.classList.add("hidden");
  materiDetailContainer.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([materiDetailContainer]).catch(err => console.log(err));
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
let quizConfigKelas = 12;
let quizConfigDiff = "Easy"; // Easy (5), Medium (10), Hard (25)

let quizActiveQuestions = [];
let quizUserAnswers = [];
let quizRaguState = [];
let quizCurrentIndex = 0;
let quizStartTime = Date.now();
let quizTimerInterval = null;

const btnQuizJenjangSD = document.getElementById("btnQuizJenjangSD");
const btnQuizJenjangSMP = document.getElementById("btnQuizJenjangSMP");
const btnQuizJenjangSMA = document.getElementById("btnQuizJenjangSMA");
const quizKelasOptionsContainer = document.getElementById("quizKelasOptionsContainer");

const btnDiffEasy = document.getElementById("btnDiffEasy");
const btnDiffMedium = document.getElementById("btnDiffMedium");
const btnDiffHard = document.getElementById("btnDiffHard");

const retakeAttemptText = document.getElementById("retakeAttemptText");
const retakeCountBadge = document.getElementById("retakeCountBadge");
const btnStartConfiguredQuiz = document.getElementById("btnStartConfiguredQuiz");

const latihanConfigCard = document.getElementById("latihanConfigCard");
const quizActiveContent = document.getElementById("quizActiveContent");

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

  quizConfigKelas = "all";

  renderQuizKelasOptions();
  updateRetakeAttemptUI();
}

function renderQuizKelasOptions() {
  if (!quizKelasOptionsContainer) return;
  quizKelasOptionsContainer.innerHTML = "";

  let list = [];
  if (quizConfigJenjang === "SD") list = ["all", 1, 2, 3, 4, 5, 6];
  else if (quizConfigJenjang === "SMP") list = ["all", 7, 8, 9];
  else if (quizConfigJenjang === "SMA") list = ["all", 10, 11, 12];

  list.forEach(k => {
    const btn = document.createElement("button");
    const isSel = k === quizConfigKelas;
    btn.className = `quiz-kelas-btn px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
      isSel
        ? "active border-emerald-500 bg-emerald-500 text-white"
        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
    } transition`;
    btn.textContent = k === "all" ? `Seluruh Kelas (${quizConfigJenjang === 'SD' ? '1-6' : quizConfigJenjang === 'SMP' ? '7-9' : '10-12'})` : `Kelas ${k}`;
    btn.addEventListener("click", () => {
      quizConfigKelas = k;
      renderQuizKelasOptions();
      updateRetakeAttemptUI();
    });
    quizKelasOptionsContainer.appendChild(btn);
  });
}

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

setQuizJenjang("SMA");
setQuizDiff("Easy");

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
  const remaining = Math.max(0, 3 - attempts);

  if (retakeAttemptText) {
    retakeAttemptText.textContent = `Pengerjaan Ke-${Math.min(attempts + 1, 3)} dari Maksimal 3 Kali`;
  }
  if (retakeCountBadge) {
    if (remaining > 0) {
      retakeCountBadge.textContent = `Sisa ${remaining}x`;
      retakeCountBadge.className = "px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-xs";
    } else {
      retakeCountBadge.textContent = "Batas Tercapai (0x)";
      retakeCountBadge.className = "px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-extrabold text-xs";
    }
  }

  if (btnStartConfiguredQuiz) {
    if (attempts >= 3) {
      btnStartConfiguredQuiz.disabled = true;
      btnStartConfiguredQuiz.innerHTML = `<i class="fa-solid fa-ban mr-1"></i> Batas Maksimal 3x Retake Tercapai`;
      btnStartConfiguredQuiz.className = "w-full py-3.5 rounded-2xl bg-slate-200 dark:bg-zinc-800 text-slate-400 font-bold text-sm cursor-not-allowed text-center";
    } else {
      btnStartConfiguredQuiz.disabled = false;
      btnStartConfiguredQuiz.innerHTML = `<i class="fa-solid fa-play"></i> Mulai Kerjakan Latihan`;
      btnStartConfiguredQuiz.className = "w-full btn-flat btn-flat-purple py-3.5 text-sm font-black flex items-center justify-center gap-2";
    }
  }
}

// Generate Question Set
function generateQuizQuestions() {
  let count = 5;
  if (quizConfigDiff === "Medium") count = 10;
  else if (quizConfigDiff === "Hard") count = 25;

  const samplePool = [
    {
      q: "Nilai dari \\(15 + 27\\) adalah...",
      opts: ["38", "42", "44", "52"],
      a: 1,
      hint: "Jumlahkan satuan 5 + 7 = 12, lalu tambahkan puluhannya.",
      sol: "15 + 27 = 42."
    },
    {
      q: "Bentuk sederhana dari \\(4x + 3x\\) adalah...",
      opts: ["\\(7x\\)", "\\(12x\\)", "\\(7x^2\\)", "\\(x\\)"],
      a: 0,
      hint: "Jumlahkan koefisien 4 + 3.",
      sol: "\\(4x + 3x = 7x\\)."
    },
    {
      q: "Hasil dari \\(6 \\times 7\\) adalah...",
      opts: ["36", "42", "48", "54"],
      a: 1,
      hint: "Perkalian 6 dengan 7.",
      sol: "\\(6 \\times 7 = 42\\)."
    },
    {
      q: "Jika \\(2x = 10\\), maka \\(x = \\dots\\)",
      opts: ["2", "4", "5", "10"],
      a: 2,
      hint: "Bagi kedua ruas dengan 2.",
      sol: "\\(x = 10 / 2 = 5\\)."
    },
    {
      q: "Luas persegi dengan panjang sisi 6 cm adalah...",
      opts: ["12 cm²", "24 cm²", "36 cm²", "48 cm²"],
      a: 2,
      hint: "Luas = s × s.",
      sol: "L = 6 × 6 = 36 cm²."
    }
  ];

  let list = [];
  for (let i = 0; i < count; i++) {
    const base = samplePool[i % samplePool.length];
    list.push({
      id: i + 1,
      category: `${quizConfigJenjang} Kelas ${quizConfigKelas}`,
      question: `Soal #${i+1}: ${base.q}`,
      options: base.opts,
      correct: base.a,
      hint: base.hint,
      solution: `<strong>Langkah Pembahasan:</strong><br>${base.sol}`
    });
  }
  return list;
}

if (btnStartConfiguredQuiz) {
  btnStartConfiguredQuiz.addEventListener("click", () => {
    if (getAttemptCount() >= 3) {
      alert("Anda telah mencapai batas maksimal 3 kali latihan untuk kombinasi ini!");
      return;
    }

    quizActiveQuestions = generateQuizQuestions();
    quizUserAnswers = new Array(quizActiveQuestions.length).fill(null);
    quizRaguState = new Array(quizActiveQuestions.length).fill(false);

    if (latihanConfigCard) latihanConfigCard.classList.add("hidden");
    if (quizActiveContent) quizActiveContent.classList.remove("hidden");

    const kelasTitle = quizConfigKelas === "all" ? "Seluruh Kelas" : `Kelas ${quizConfigKelas}`;
    document.getElementById("quizActiveTitle").textContent = `${quizConfigJenjang} ${kelasTitle} - ${quizConfigDiff} (${quizActiveQuestions.length} Soal)`;

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

  document.getElementById("questionNumBadge").textContent = `Soal ${idx + 1} dari ${quizActiveQuestions.length}`;
  document.getElementById("questionCategoryBadge").textContent = q.category;
  document.getElementById("questionText").innerHTML = q.question;

  const optContainer = document.getElementById("optionsContainer");
  optContainer.innerHTML = "";
  q.options.forEach((opt, oIdx) => {
    const letter = String.fromCharCode(65 + oIdx);
    const isSelected = quizUserAnswers[idx] === oIdx;

    const div = document.createElement("div");
    div.className = `option-card p-4 rounded-2xl border ${
      isSelected ? "selected border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
    } flex items-center gap-3.5`;
    div.innerHTML = `
      <div class="w-9 h-9 rounded-xl ${isSelected ? "bg-indigo-500 text-white font-black shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"} flex items-center justify-center text-xs flex-shrink-0">
        ${letter}
      </div>
      <div class="text-sm font-semibold text-slate-800 dark:text-slate-200 math-container flex-grow">${opt}</div>
      ${isSelected ? '<i class="fa-solid fa-circle-check text-indigo-500 text-xl"></i>' : ''}
    `;
    div.addEventListener("click", () => {
      quizUserAnswers[idx] = oIdx;
      loadActiveQuestion(idx);
    });
    optContainer.appendChild(div);
  });

  const checkRagu = document.getElementById("checkRagu");
  if (checkRagu) checkRagu.checked = quizRaguState[idx];

  const btnPrev = document.getElementById("btnPrevQuestion");
  const btnNext = document.getElementById("btnNextQuestion");
  if (btnPrev) btnPrev.disabled = (idx === 0);
  if (btnNext) {
    if (idx === quizActiveQuestions.length - 1) btnNext.innerHTML = `Selesai <i class="fa-solid fa-check"></i>`;
    else btnNext.innerHTML = `Selanjutnya <i class="fa-solid fa-arrow-right"></i>`;
  }

  renderQuizPaletteGrid();

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

    let bg = "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    if (isRag) bg = "bg-amber-500 text-white font-bold";
    else if (isAns) bg = "bg-emerald-500 text-white font-bold";

    const btn = document.createElement("button");
    btn.className = `palette-btn w-9 h-9 rounded-xl text-xs flex items-center justify-center ${bg} ${isCur ? "active ring-2 ring-sky-500 font-extrabold scale-105" : ""}`;
    btn.textContent = idx + 1;
    btn.addEventListener("click", () => loadActiveQuestion(idx));
    grid.appendChild(btn);
  });

  const countBadge = document.getElementById("answeredCountBadge");
  if (countBadge) countBadge.textContent = `${answered}/${quizActiveQuestions.length} Dijawab`;
}

const btnPrevQ = document.getElementById("btnPrevQuestion");
const btnNextQ = document.getElementById("btnNextQuestion");
if (btnPrevQ) btnPrevQ.addEventListener("click", () => { if (quizCurrentIndex > 0) loadActiveQuestion(quizCurrentIndex - 1); });
if (btnNextQ) btnNextQ.addEventListener("click", () => {
  if (quizCurrentIndex < quizActiveQuestions.length - 1) loadActiveQuestion(quizCurrentIndex + 1);
  else submitActiveQuiz();
});

const btnSubmitQ = document.getElementById("btnSubmitQuiz");
if (btnSubmitQ) btnSubmitQ.addEventListener("click", submitActiveQuiz);

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
    totalSalah: totalQuestions - correctCount,
    attemptNumber: getAttemptCount(),
    timestamp: new Date().toISOString(),
    userAnswers: quizActiveQuestions.map((q, idx) => ({
      qId: q.id,
      questionText: q.question,
      userAnsIdx: quizUserAnswers[idx],
      userAnsText: quizUserAnswers[idx] !== null ? q.options[quizUserAnswers[idx]] : "Belum Dijawab",
      correctAnsText: q.options[q.correct],
      isCorrect: quizUserAnswers[idx] === q.correct,
      solutionText: q.solution
    }))
  };

  saveHistoryToFirestore(historyRecord);

  // Render Result Modal
  document.getElementById("resultModalScore").textContent = totalScore;
  document.getElementById("resultModalCorrect").textContent = `${correctCount} / ${totalQuestions}`;
  document.getElementById("resultModalTime").textContent = timeStr;

  const listContainer = document.getElementById("resultModalPembahasanList");
  listContainer.innerHTML = "";

  quizActiveQuestions.forEach((q, idx) => {
    const isCorr = quizUserAnswers[idx] === q.correct;
    const card = document.createElement("div");
    card.className = `p-4 sm:p-5 rounded-2xl border ${isCorr ? "border-emerald-300 bg-emerald-50/20" : "border-red-300 bg-red-50/20"} space-y-3`;
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="px-2.5 py-0.5 rounded-lg ${isCorr ? 'bg-emerald-500' : 'bg-red-500'} text-white font-extrabold text-xs">Soal ${idx + 1}</span>
        <span class="text-xs font-bold ${isCorr ? 'text-emerald-600' : 'text-red-600'}">${isCorr ? 'Benar' : 'Salah'}</span>
      </div>
      <div class="text-sm font-semibold text-slate-900 dark:text-white math-container">${q.question}</div>
      <div class="grid sm:grid-cols-2 gap-2 text-xs">
        <div class="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200">
          <span class="text-slate-400 block mb-0.5">Jawaban Kamu:</span>
          <span class="font-bold ${isCorr ? 'text-emerald-600' : 'text-red-600'}">${quizUserAnswers[idx] !== null ? q.options[quizUserAnswers[idx]] : "Belum Dijawab"}</span>
        </div>
        <div class="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200">
          <span class="text-slate-400 block mb-0.5">Kunci Jawaban:</span>
          <span class="font-bold text-emerald-600">${q.options[q.correct]}</span>
        </div>
      </div>
      <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 text-xs text-slate-700 dark:text-slate-300 math-container">${q.solution}</div>
    `;
    listContainer.appendChild(card);
  });

  const resModal = document.getElementById("quizScoreResultModal");
  if (resModal) {
    resModal.classList.remove("hidden");
    setTimeout(() => resModal.classList.remove("opacity-0"), 10);
  }

  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([listContainer]).catch(err => console.log(err));
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
      // Open Healing Pop-up automatically
      openHealingPopUp();
    }, 300);
  }
}

if (btnDoneViewingScore) btnDoneViewingScore.addEventListener("click", closeQuizScoreResultModal);
if (btnCloseQuizScoreResultModal) btnCloseQuizScoreResultModal.addEventListener("click", closeQuizScoreResultModal);


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
