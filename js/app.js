/**
 * Logika Kontroler Utama & Simulasi Database MasjidKita
 * Mengatur perutean layar, pengelolaan sesi, transaksi akuntansi entri ganda,
 * pinjaman Qardhul Hasan, kupon E-Sembako, pasar warga, dan agen chat cerdas BantuBot.
 */

// ==========================================
// 1. INBOUND DATA & STORAGE SEED (DATABASE LOCALSTORAGE)
// ==========================================

const SEED_DATA = {
    users: [
        { id: 1, name: 'Haji Sulaiman', phone: '081234567890', password: '1234', role: 'admin', rt: '01', rw: '05', block_number: 'B1', is_verified: 1 },
        { id: 2, name: 'Ahmad Fauzi', phone: '089876543210', password: 'warga', role: 'resident', rt: '02', rw: '05', block_number: 'C4', is_verified: 1 },
        { id: 3, name: 'Budi Santoso', phone: '085544332211', password: 'warga', role: 'resident', rt: '03', rw: '05', block_number: 'A12', is_verified: 1 }
    ],
    ledgers: {
        'Operational Cash': 12500000.00,
        'Zakat Fund': 8400000.00,
        'Infaq Sedekah Fund': 15650000.00,
        'Emergency Social Fund': 9500000.00
    },
    transactions: [
        { id: 101, user_id: 2, ledger: 'Infaq Sedekah Fund', amount: 250000.00, type: 'debit', category: 'Infaq', description: 'Infaq Jumat Berkah Ahmad', payment_method: 'QRIS', reference_no: 'MK-1718000001', status: 'success', created_at: '2026-06-18T10:00:00Z' },
        { id: 102, user_id: null, ledger: 'Operational Cash', amount: 500000.00, type: 'credit', category: 'Operational', description: 'Pembelian Sapu & Pengharum Ruangan', payment_method: 'Cash', reference_no: 'MK-1718000002', status: 'success', created_at: '2026-06-18T14:30:00Z' },
        { id: 103, user_id: 2, ledger: 'Zakat Fund', amount: 1200000.00, type: 'debit', category: 'Zakat', description: 'Zakat Mal Ahmad Fauzi', payment_method: 'Bank Transfer', reference_no: 'MK-1718000003', status: 'success', created_at: '2026-06-19T08:00:00Z' }
    ],
    loans: [
        { id: 201, resident_id: 2, amount: 2000000.00, purpose: 'Modal Usaha Warung Klontong', tenor_months: 5, status: 'approved', remaining_balance: 1600000.00, created_at: '2026-06-10T09:00:00Z', approved_at: '2026-06-11T10:00:00Z' }
    ],
    loan_payments: [
        { id: 301, loan_id: 201, amount: 400000.00, payment_date: '2026-06-15T15:00:00Z', transaction_id: 104 }
    ],
    coupons: [
        { id: 401, resident_id: 2, coupon_code: 'SEMBAKO-ABCD-1234', value_amount: 150000.00, status: 'active', created_at: '2026-06-19T10:00:00Z', redeemed_at: null, redeemed_at_shop: null }
    ],
    market: [
        { id: 501, seller_id: 2, title: 'Nasi Kebuli Loyang Ayam Bakar', description: 'Nasi kebuli rempah khas Timur Tengah halal, porsi 3-4 orang. Enak & gurih.', price: 75000.00, category: 'Makanan & Minuman', status: 'available', image_url: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=200', created_at: '2026-06-19T11:00:00Z' },
        { id: 502, seller_id: 2, title: 'Jasa Servis AC Rumah Murah', description: 'Melayani cuci AC, tambah freon, dan perbaikan AC mati/bocor khusus komplek.', price: 60000.00, category: 'Jasa', status: 'available', image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=200', created_at: '2026-06-19T12:00:00Z' }
    ],
    tickets: [
        { id: 601, resident_id: 2, encrypted_alias: 'Warga_RT02_Blok_C4', screening_summary: '[BantuBot Screening] Dana Kas Tersedia: Rp 9,500,000. Permintaan: Suami PHK, butuh uang belanja mendesak Rp 500,000.', requested_amount: 500000.00, status: 'pending', created_at: '2026-06-19T16:00:00Z', reviewed_at: null, action_taken: null }
    ],
    chat_logs: []
};

// Inisialisasi Database LocalStorage jika belum ada
function initDB() {
    // Clear any existing data to ensure fresh seed data (useful for debugging)
    localStorage.clear();
    // Initialize storage with seed data
    localStorage.setItem('masjidkita_users', JSON.stringify(SEED_DATA.users));
    localStorage.setItem('masjidkita_ledgers', JSON.stringify(SEED_DATA.ledgers));
    localStorage.setItem('masjidkita_transactions', JSON.stringify(SEED_DATA.transactions));
    localStorage.setItem('masjidkita_loans', JSON.stringify(SEED_DATA.loans));
    localStorage.setItem('masjidkita_loan_payments', JSON.stringify(SEED_DATA.loan_payments));
    localStorage.setItem('masjidkita_coupons', JSON.stringify(SEED_DATA.coupons));
    localStorage.setItem('masjidkita_market', JSON.stringify(SEED_DATA.market));
    localStorage.setItem('masjidkita_tickets', JSON.stringify(SEED_DATA.tickets));
    localStorage.setItem('masjidkita_chat_logs', JSON.stringify(SEED_DATA.chat_logs));
}

// Helper Get & Set Database
const DB = {
    get: (key) => JSON.parse(localStorage.getItem(`masjidkita_${key}`)),
    set: (key, data) => localStorage.setItem(`masjidkita_${key}`, JSON.stringify(data))
};

// State Aplikasi Saat Ini
let currentSession = null;
let currentChatContext = {
    step: 'idle', // idle, screening_reason, screening_amount
    ticketData: {}
};

// ==========================================
// 2. SISTEM ROUTING LAYAR & LIFECYCLE
// ==========================================

function switchScreen(screenId) {
    // Sembunyikan semua layar
    document.querySelectorAll('.app-screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Tampilkan layar yang dituju
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    // Perbarui penanda bottom nav aktif
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
        if (nav.getAttribute('onclick').includes(screenId)) {
            nav.classList.add('active');
        }
    });

    // Jalankan loader data layar spesifik
    if (screenId === 'screen-dashboard') loadDashboardData();
    if (screenId === 'screen-zakat') initZakatScreen();
    if (screenId === 'screen-loans') loadLoansData();
    if (screenId === 'screen-sembako') loadSembakoData();
    if (screenId === 'screen-market') loadMarketData();
    if (screenId === 'screen-chat') initChatLogs();
    if (screenId === 'screen-admin') loadAdminData();
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.className = `toast show ${type}`;
    toast.querySelector('.toast-text').innerText = message;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// Format Rupiah
function formatRupiah(amount) {
    return 'Rp ' + parseFloat(amount).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Format Tanggal
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}


// ==========================================
// 3. LOGIKA CORE PILLAR 1: AUTENTIKASI
// ==========================================

function registerUser(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value;
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;
    const rt = document.getElementById('reg-rt').value;
    const rw = document.getElementById('reg-rw').value;
    const block = document.getElementById('reg-block').value;

    if (!name || !phone || !password || !rt || !rw || !block) {
        showToast('Mohon lengkapi semua data pendaftaran!', 'error');
        return;
    }

    const users = DB.get('users');
    
    // Cek jika nomor telp sudah terdaftar
    if (users.find(u => u.phone === phone)) {
        showToast('Nomor telepon sudah terdaftar!', 'error');
        return;
    }

    const newUser = {
        id: Date.now(),
        name,
        phone,
        password,
        role: 'resident',
        rt,
        rw,
        block_number: block,
        is_verified: 0 // Menunggu persetujuan DKM
    };

    users.push(newUser);
    DB.set('users', users);

    showToast('Pendaftaran berhasil! Akun Anda menunggu verifikasi DKM.', 'info');
    
    // Reset form dan kembalikan ke layar login
    document.getElementById('register-form').reset();
    toggleAuthView();
}

function loginUser(event) {
    event.preventDefault();
    const phone = document.getElementById('login-phone').value;
    const password = document.getElementById('login-password').value;

    const users = DB.get('users');
    const user = users.find(u => u.phone === phone);

    if (!user) {
        showToast('Nomor telepon tidak terdaftar!', 'error');
        return;
    }

    // Admin harus memasukkan password khusus 1234
    if (user.role === 'admin') {
        if (password !== '1234') {
            showToast('Sandi admin salah! Gunakan password 1234.', 'error');
            return;
        }
    } else {
        // Resident biasa memeriksa password tersimpan
        if (user.password !== password) {
            showToast('Nomor telepon atau sandi salah!', 'error');
            return;
        }
    }

    if (user.role === 'resident' && user.is_verified === 0) {
        showToast('Akun Anda belum diverifikasi oleh DKM. Silakan hubungi pengurus RT/RW.', 'error');
        return;
    }

    // Set Sesi
    currentSession = user;
    localStorage.setItem('masjidkita_session', JSON.stringify(user));

    showToast(`Selamat datang kembali, ${user.name}!`);

    // Tampilkan/sembunyikan menu bottom nav admin
    updateNavigationMenu();

    // Reset Form
    document.getElementById('login-form').reset();

    // Masuk Dashboard
    switchScreen('screen-dashboard');
}



function logoutUser() {
    currentSession = null;
    localStorage.removeItem('masjidkita_session');
    
    // Hapus UI info user
    document.getElementById('header-badge').style.display = 'none';
    document.getElementById('bottom-nav-bar').style.display = 'none';

    showToast('Anda telah keluar.');
    switchScreen('screen-login');
}

function checkActiveSession() {
    const session = localStorage.getItem('masjidkita_session');
    if (session) {
        currentSession = JSON.parse(session);
        updateNavigationMenu();
        switchScreen('screen-dashboard');
    } else {
        switchScreen('screen-login');
    }
}

function updateNavigationMenu() {
    const badge = document.getElementById('header-badge');
    const navBar = document.getElementById('bottom-nav-bar');
    const navAdmin = document.getElementById('nav-admin-tab');

    if (currentSession) {
        badge.style.display = 'flex';
        badge.innerHTML = `
            <span>${currentSession.name} (${currentSession.role === 'admin' ? 'DKM' : 'Warga'})</span>
            <button onclick="logoutUser()" class="logout-btn" title="Keluar">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
        `;
        navBar.style.display = 'flex';

        // Hanya tampilkan tab admin untuk pengurus DKM
        if (currentSession.role === 'admin') {
            navAdmin.style.display = 'flex';
        } else {
            navAdmin.style.display = 'none';
        }
    } else {
        badge.style.display = 'none';
        navBar.style.display = 'none';
    }
}

function toggleAuthView() {
    const login = document.getElementById('screen-login');
    const reg = document.getElementById('screen-register');

    if (login.style.display === 'none') {
        login.style.display = 'block';
        reg.style.display = 'none';
    } else {
        login.style.display = 'none';
        reg.style.display = 'block';
    }
}


// ==========================================
// 4. LOGIKA CORE PILLAR 2A: AKUNTANSI & PEMBAYARAN SYARIAH
// ==========================================

function loadDashboardData() {
    const ledgers = DB.get('ledgers');
    const txList = DB.get('transactions');

    // Hitung Total Kas
    let totalCash = 0;
    for (let acc in ledgers) {
        totalCash += ledgers[acc];
        // Cari elemen nilai sub-account
        const valElem = document.getElementById(`val-${acc.toLowerCase().replace(/\s+/g, '-')}`);
        if (valElem) valElem.innerText = formatRupiah(ledgers[acc]);
    }

    document.getElementById('total-cash-balance').innerText = formatRupiah(totalCash);

    // Load Riwayat Jurnal Transaksi
    const listContainer = document.getElementById('dashboard-tx-list');
    listContainer.innerHTML = '';

    const users = DB.get('users');

    // Menampilkan 10 transaksi terakhir
    const latestTx = txList.slice().reverse().slice(0, 10);
    
    if (latestTx.length === 0) {
        listContainer.innerHTML = '<div class="text-muted" style="font-size: 12px; padding: 15px 0;">Belum ada transaksi terekam.</div>';
        return;
    }

    latestTx.forEach(tx => {
        const u = tx.user_id ? users.find(usr => usr.id === tx.user_id) : null;
        const payerName = u ? u.name : 'Umum (Anonim)';
        const dateStr = formatDate(tx.created_at);
        const sign = tx.type === 'debit' ? '+' : '-';
        const colorClass = tx.type === 'debit' ? 'debit' : 'credit';

        const txItem = document.createElement('div');
        txItem.className = 'tx-item';
        txItem.innerHTML = `
            <div class="tx-info">
                <div class="tx-category">${tx.category}</div>
                <div class="tx-desc">${tx.description} • <span class="tx-date">${dateStr}</span></div>
                <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Metode: ${tx.payment_method} | Kode: ${tx.reference_no}</div>
            </div>
            <div class="tx-amount ${colorClass}">${sign} ${formatRupiah(tx.amount)}</div>
        `;
        listContainer.appendChild(txItem);
    });
}

// Simulasi Alur Pembayaran Digital (Zakat / Infaq) via QRIS
function openPaymentDrawer(category) {
    document.getElementById('payment-category').innerText = category;
    document.getElementById('payment-amount-input').value = '';
    document.getElementById('payment-desc-input').value = '';
    
    // Tampilkan overlay drawer
    document.getElementById('payment-overlay').classList.add('active');
    document.getElementById('payment-drawer').classList.add('active');
}

function closePaymentDrawer() {
    document.getElementById('payment-overlay').classList.remove('active');
    document.getElementById('payment-drawer').classList.remove('active');
    document.getElementById('qris-overlay').classList.remove('active');
    document.getElementById('qris-drawer').classList.remove('active');
}

function processPaymentSubmission() {
    const category = document.getElementById('payment-category').innerText;
    const amount = parseFloat(document.getElementById('payment-amount-input').value);
    const desc = document.getElementById('payment-desc-input').value || `Pembayaran ${category} Warga`;
    const method = document.getElementById('payment-method-select').value;

    if (isNaN(amount) || amount <= 0) {
        showToast('Jumlah pembayaran tidak valid!', 'error');
        return;
    }

    if (method === 'QRIS') {
        // Tampilkan Simulasi QRIS
        document.getElementById('qris-payment-amount').innerText = formatRupiah(amount);
        
        // Generate mock QR Code menggunakan Canvas
        const canvas = document.getElementById('qris-canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Buat kotak-kotak QR tiruan
        ctx.fillStyle = '#000000';
        // 3 anchor square di pojok
        ctx.fillRect(10, 10, 50, 50); ctx.fillRect(20, 20, 30, 30);
        ctx.fillRect(140, 10, 50, 50); ctx.fillRect(150, 20, 30, 30);
        ctx.fillRect(10, 140, 50, 50); ctx.fillRect(20, 150, 30, 30);
        // Random squares
        for (let i = 0; i < 200; i++) {
            let x = Math.floor(Math.random() * 18) * 10 + 10;
            let y = Math.floor(Math.random() * 18) * 10 + 10;
            if (!((x < 70 && y < 70) || (x > 130 && y < 70) || (x < 70 && y > 130))) {
                ctx.fillRect(x, y, 8, 8);
            }
        }
        // Label QRIS di tengah
        ctx.fillStyle = '#059669';
        ctx.fillRect(80, 80, 40, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Inter';
        ctx.fillText('QRIS', 88, 104);

        // Tampilkan Modal QRIS
        document.getElementById('qris-overlay').classList.add('active');
        document.getElementById('qris-drawer').classList.add('active');

        // Simpan data transaksi sementara di session
        currentChatContext.pendingTx = { amount, category, desc, method };
    } else {
        // Bank Transfer / Cash langsung dieksekusi
        executeJournalTransaction(amount, category, desc, method);
        closePaymentDrawer();
    }
}

// Simulasi tombol scan QRIS sukses oleh user
function simulateQRISScanSuccess() {
    const tx = currentChatContext.pendingTx;
    if (tx) {
        executeJournalTransaction(tx.amount, tx.category, tx.desc, tx.method);
        currentChatContext.pendingTx = null;
    }
    closePaymentDrawer();
}

// Logika Double-Entry Jurnal Keuangan & Relasi Ledger
function executeJournalTransaction(amount, category, desc, method) {
    const ledgers = DB.get('ledgers');
    const transactions = DB.get('transactions');

    // Cari sub-account kas masjid berdasarkan aturan Syariah
    let targetLedger = '';
    if (category === 'Zakat') targetLedger = 'Zakat Fund';
    else if (category === 'Infaq' || category === 'Sedekah') targetLedger = 'Infaq Sedekah Fund';
    else if (category === 'Operational') targetLedger = 'Operational Cash';
    else if (category === 'Emergency Loan' || category === 'Social Food Bank' || category === 'Social Aid') targetLedger = 'Emergency Social Fund';
    
    if (!targetLedger) {
        showToast('Buku besar tidak valid!', 'error');
        return;
    }

    const refNo = 'MK-' + Date.now().toString().slice(-6) + '-' + Math.floor(Math.random() * 1000);
    const newTx = {
        id: Date.now(),
        user_id: currentSession ? currentSession.id : null,
        ledger: targetLedger,
        amount: parseFloat(amount),
        type: 'debit', // Transaksi masuk
        category,
        description: desc,
        payment_method: method,
        reference_no: refNo,
        status: 'success',
        created_at: new Date().toISOString()
    };

    // Update Saldo Rekening Buku Besar (Double-Entry Debit)
    ledgers[targetLedger] += parseFloat(amount);
    transactions.push(newTx);

    DB.set('ledgers', ledgers);
    DB.set('transactions', transactions);

    showToast('Transaksi Sukses! Keuangan otomatis ter-posting ke Jurnal DKM.');
    
    // Tampilkan struk/receipt digital
    showReceiptModal(newTx);

    // Refresh data dashboard jika sedang dibuka
    loadDashboardData();
}

function showReceiptModal(tx) {
    const userName = currentSession ? currentSession.name : 'Umum (Anonim)';
    const content = `
        <div style="text-align: center; margin-bottom: 20px;">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 10px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <h3 style="font-family: 'Outfit'; color: var(--primary);">TRANSAKSI SELESAI</h3>
            <p style="font-size: 11px; color: var(--text-muted);">MasjidKita Digital Receipt</p>
        </div>
        <div style="font-size: 12px; line-height: 1.8;">
            <div style="display: flex; justify-content: space-between;"><span>No. Ref:</span><strong>${tx.reference_no}</strong></div>
            <div style="display: flex; justify-content: space-between;"><span>Muzakki/Pemberi:</span><strong>${userName}</strong></div>
            <div style="display: flex; justify-content: space-between;"><span>Kategori:</span><strong>${tx.category}</strong></div>
            <div style="display: flex; justify-content: space-between;"><span>Tujuan Dana:</span><strong>${tx.ledger}</strong></div>
            <div style="display: flex; justify-content: space-between;"><span>Metode:</span><strong>${tx.payment_method}</strong></div>
            <div style="display: flex; justify-content: space-between;"><span>Tanggal:</span><strong>${formatDate(tx.created_at)}</strong></div>
            <hr style="border: 0.5px dashed var(--border-color); margin: 10px 0;">
            <div style="display: flex; justify-content: space-between; font-size: 15px;"><span>Jumlah:</span><strong style="color: var(--primary-dark); font-family: 'Outfit';">${formatRupiah(tx.amount)}</strong></div>
            <div style="font-size: 10px; color: var(--text-muted); text-align: center; margin-top: 20px;">Dana amanah yang Anda serahkan akan dikelola secara aman, akuntabel, dan transparan untuk kemaslahatan umat. Syukron Katsiron.</div>
        </div>
    `;

    document.getElementById('receipt-content').innerHTML = content;
    document.getElementById('receipt-overlay').classList.add('active');
    document.getElementById('receipt-drawer').classList.add('active');
}

function closeReceiptDrawer() {
    document.getElementById('receipt-overlay').classList.remove('active');
    document.getElementById('receipt-drawer').classList.remove('active');
}


// ==========================================
// 5. LOGIKA CORE PILLAR 2B: WELFARE / MUAMALAH
// ==========================================

// A. KALKULATOR ZAKAT
function initZakatScreen() {
    document.getElementById('zakat-salary-date').value = '25'; // Tanggal gajian default
}

function calculateZakat() {
    const wealth = parseFloat(document.getElementById('zakat-wealth').value) || 0;
    const gold = parseFloat(document.getElementById('zakat-gold').value) || 0;
    const salary = parseFloat(document.getElementById('zakat-salary').value) || 0;
    const type = document.getElementById('zakat-type-select').value;

    const goldPrice = 1000000; // Asumsi harga emas per gram Rp 1.000.000
    const nisabMal = 85 * goldPrice; // Rp 85.000.000 per tahun
    const nisabProfesi = 520 * goldPrice; // Nisab profesi bulanan setara 520 gram beras/perak (kira-kira Rp 7.000.000)

    let totalZakat = 0;
    let explanation = '';

    if (type === 'mal') {
        const totalWealth = wealth + (gold * goldPrice);
        if (totalWealth >= nisabMal) {
            totalZakat = totalWealth * 0.025;
            explanation = `Total harta kena zakat: ${formatRupiah(totalWealth)} (Telah mencapai Nisab Zakat Mal ${formatRupiah(nisabMal)}). Zakat Anda (2.5%) adalah ${formatRupiah(totalZakat)}.`;
        } else {
            totalZakat = 0;
            explanation = `Total harta Anda: ${formatRupiah(totalWealth)} belum mencapai Nisab tahunan Zakat Mal (${formatRupiah(nisabMal)}). Anda tidak wajib membayar Zakat Mal, namun disarankan memperbanyak Sedekah/Infaq.`;
        }
    } else {
        // Profesi / Penghasilan
        if (salary >= 7000000) {
            totalZakat = salary * 0.025;
            explanation = `Penghasilan bulanan Anda: ${formatRupiah(salary)} telah mencapai nisab bulanan Zakat Profesi (setara Rp 7.000.000). Zakat Anda (2.5%) adalah ${formatRupiah(totalZakat)} per bulan.`;
        } else {
            totalZakat = 0;
            explanation = `Penghasilan bulanan Anda: ${formatRupiah(salary)} belum mencapai nisab bulanan Zakat Profesi. Anda tidak wajib membayar Zakat Profesi.`;
        }
    }

    const resBox = document.getElementById('zakat-result-box');
    resBox.style.display = 'block';
    document.getElementById('zakat-result-amount').innerText = formatRupiah(totalZakat);
    document.getElementById('zakat-result-explanation').innerText = explanation;

    const payBtn = document.getElementById('zakat-pay-btn');
    if (totalZakat > 0) {
        payBtn.style.display = 'block';
        payBtn.onclick = () => {
            openPaymentDrawer('Zakat');
            document.getElementById('payment-amount-input').value = totalZakat;
            document.getElementById('payment-desc-input').value = `Zakat Al-${type === 'mal' ? 'Mal' : 'Fitr/Profesi'} ${currentSession.name}`;
        };
    } else {
        payBtn.style.display = 'none';
    }
}

function saveZakatReminder() {
    const salaryDate = document.getElementById('zakat-salary-date').value;
    if (salaryDate < 1 || salaryDate > 31) {
        showToast('Tanggal gajian tidak valid!', 'error');
        return;
    }
    showToast(`Pengingat Zakat diatur otomatis setiap tanggal ${salaryDate} tiap bulannya.`, 'success');
}


// B. QARDHUL HASAN (Pinjaman Bebas Bunga)
function loadLoansData() {
    const loans = DB.get('loans');
    const container = document.getElementById('loan-list-container');
    container.innerHTML = '';

    const myLoans = loans.filter(l => l.resident_id === currentSession.id);

    if (myLoans.length === 0) {
        container.innerHTML = '<div class="text-muted" style="font-size: 12px; padding: 15px 0; text-align: center;">Anda tidak memiliki riwayat pinjaman Qardhul Hasan.</div>';
        return;
    }

    myLoans.forEach(loan => {
        const dateStr = formatDate(loan.created_at);
        let statusBadge = '';
        let actionBtn = '';

        if (loan.status === 'pending') statusBadge = '<span class="badge badge-pending">Menunggu Review</span>';
        else if (loan.status === 'approved') {
            statusBadge = '<span class="badge badge-approved">Aktif (Belum Lunas)</span>';
            actionBtn = `<button onclick="openRepaymentDrawer(${loan.id}, ${loan.remaining_balance})" class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; margin-top: 10px; width: auto; display: inline-flex;">Bayar Angsuran</button>`;
        }
        else if (loan.status === 'rejected') statusBadge = '<span class="badge badge-rejected">Ditolak</span>';
        else if (loan.status === 'fully_paid') statusBadge = '<span class="badge badge-approved" style="background-color: #bfdbfe; color: #1e3a8a;">Lunas</span>';

        const card = document.createElement('div');
        card.className = 'ticket-item';
        card.innerHTML = `
            <div class="ticket-header">
                <strong>Pinjaman #${loan.id}</strong>
                ${statusBadge}
            </div>
            <div class="ticket-body">
                <div>Jumlah Awal: <strong>${formatRupiah(loan.amount)}</strong></div>
                <div>Sisa Pinjaman: <strong style="color: var(--error);">${formatRupiah(loan.remaining_balance)}</strong></div>
                <div>Tenor: <strong>${loan.tenor_months} Bulan</strong></div>
                <div>Tujuan: <em>"${loan.purpose}"</em></div>
                ${actionBtn}
            </div>
            <div class="ticket-meta">Diajukan pada: ${dateStr}</div>
        `;
        container.appendChild(card);
    });
}

function submitLoanApplication() {
    const amount = parseFloat(document.getElementById('loan-amount').value);
    const purpose = document.getElementById('loan-purpose').value;
    const tenor = parseInt(document.getElementById('loan-tenor').value);

    if (isNaN(amount) || amount <= 0 || !purpose || isNaN(tenor) || tenor <= 0) {
        showToast('Harap lengkapi semua formulir pengajuan pinjaman!', 'error');
        return;
    }

    const loans = DB.get('loans');
    const newLoan = {
        id: Date.now(),
        resident_id: currentSession.id,
        amount,
        purpose,
        tenor_months: tenor,
        status: 'pending',
        remaining_balance: amount,
        created_at: new Date().toISOString(),
        approved_at: null
    };

    loans.push(newLoan);
    DB.set('loans', loans);

    showToast('Pengajuan pinjaman Qardhul Hasan terkirim secara syariah.', 'success');
    document.getElementById('loan-amount').value = '';
    document.getElementById('loan-purpose').value = '';
    
    loadLoansData();
}

function openRepaymentDrawer(loanId, remaining) {
    currentChatContext.activeLoanId = loanId;
    currentChatContext.activeLoanRemaining = remaining;
    
    document.getElementById('repay-max-info').innerText = `Maksimal Pelunasan: ${formatRupiah(remaining)}`;
    document.getElementById('repay-amount-input').value = Math.min(remaining, 500000); // Rekomendasi angsuran
    
    document.getElementById('repay-overlay').classList.add('active');
    document.getElementById('repay-drawer').classList.add('active');
}

function closeRepaymentDrawer() {
    document.getElementById('repay-overlay').classList.remove('active');
    document.getElementById('repay-drawer').classList.remove('active');
}

function processRepaymentSubmission() {
    const amount = parseFloat(document.getElementById('repay-amount-input').value);
    const loanId = currentChatContext.activeLoanId;
    const remaining = currentChatContext.activeLoanRemaining;

    if (isNaN(amount) || amount <= 0 || amount > remaining) {
        showToast('Jumlah angsuran tidak valid atau melebihi sisa pinjaman!', 'error');
        return;
    }

    // Eksekusi Pembayaran Angsuran (Kembali ke Emergency Social Fund)
    const ledgers = DB.get('ledgers');
    const transactions = DB.get('transactions');
    const loans = DB.get('loans');

    const refNo = 'QH-REP-' + Date.now().toString().slice(-6);
    const tx = {
        id: Date.now(),
        user_id: currentSession.id,
        ledger: 'Emergency Social Fund',
        amount: amount,
        type: 'debit', // Uang kembali masuk kas
        category: 'Qardhul Hasan Repayment',
        description: `Angsuran Pinjaman Qardhul Hasan ID #${loanId}`,
        payment_method: 'QRIS',
        reference_no: refNo,
        status: 'success',
        created_at: new Date().toISOString()
    };

    // Update Ledger & Transactions
    ledgers['Emergency Social Fund'] += amount;
    transactions.push(tx);

    // Update Status Pinjaman
    const loanIndex = loans.findIndex(l => l.id === loanId);
    if (loanIndex !== -1) {
        loans[loanIndex].remaining_balance -= amount;
        if (loans[loanIndex].remaining_balance <= 0) {
            loans[loanIndex].status = 'fully_paid';
        }
        DB.set('loans', loans);
    }

    DB.set('ledgers', ledgers);
    DB.set('transactions', transactions);

    showToast('Angsuran Qardhul Hasan berhasil dibayarkan (Bebas Riba).');
    closeRepaymentDrawer();
    loadLoansData();
}


// C. E-SEMBAKO
function loadSembakoData() {
    const coupons = DB.get('coupons');
    const container = document.getElementById('sembako-coupons-container');
    container.innerHTML = '';

    const myCoupons = coupons.filter(c => c.resident_id === currentSession.id);

    if (myCoupons.length === 0) {
        container.innerHTML = `
            <div class="info-banner" style="margin-top: 10px;">
                Anda belum memiliki kupon pangan aktif. Jika Anda sedang menghadapi kesulitan finansial, Anda dapat mengobrol dengan <strong>BantuBot</strong> untuk pengaduan sosial secara rahasia.
            </div>
        `;
        return;
    }

    myCoupons.forEach(c => {
        let statusText = 'KUPON AKTIF';
        let descText = 'Tunjukkan kupon ini ke Warung Warga / Koperasi Mitra DKM';
        let style = '';

        if (c.status === 'redeemed') {
            statusText = 'KUPON TELAH DITUKARKAN';
            descText = `Ditukarkan di: ${c.redeemed_at_shop} pada ${formatDate(c.redeemed_at)}`;
            style = 'background: #94a3b8; color: #f1f5f9;';
        }

        const card = document.createElement('div');
        card.className = 'sembako-coupon-card';
        card.style = style;
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-weight: 700;">
                <span>E-SEMBAKO MASJIDKITA</span>
                <span>${c.status.toUpperCase()}</span>
            </div>
            <div class="coupon-dashed"></div>
            <div style="font-family: 'Outfit'; font-size: 20px; font-weight: 800; text-align: center; margin: 10px 0;">
                Kode: ${c.coupon_code}
            </div>
            <div style="font-size: 11px; opacity: 0.9; text-align: center;">
                Nilai Paket Pangan: <strong>${formatRupiah(c.value_amount)}</strong>
            </div>
            <div class="coupon-dashed"></div>
            <div style="font-size: 10px; text-align: center; font-style: italic;">
                ${descText}
            </div>
        `;
        container.appendChild(card);
    });
}

function claimSembakoCoupon() {
    const coupons = DB.get('coupons');
    
    // Cek duplikasi klaim per bulan
    const currentMonth = new Date().getMonth();
    const hasClaimed = coupons.some(c => c.resident_id === currentSession.id && new Date(c.created_at).getMonth() === currentMonth);

    if (hasClaimed) {
        showToast('Klaim gagal! Anda sudah mengklaim bantuan kupon sembako bulan ini.', 'error');
        return;
    }

    const code = 'SEMBAKO-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
    const newCoupon = {
        id: Date.now(),
        resident_id: currentSession.id,
        coupon_code: code,
        value_amount: 150000.00,
        status: 'active',
        created_at: new Date().toISOString(),
        redeemed_at: null,
        redeemed_at_shop: null
    };

    coupons.push(newCoupon);
    DB.set('coupons', coupons);

    showToast('Klaim Kupon E-Sembako senilai Rp 150.000 Berhasil!', 'success');
    loadSembakoData();
}


// D. PASAR MUAMALAH
function loadMarketData() {
    const market = DB.get('market');
    const container = document.getElementById('market-grid-container');
    container.innerHTML = '';

    const availableItems = market.filter(item => item.status === 'available');

    if (availableItems.length === 0) {
        container.innerHTML = '<div class="text-muted" style="grid-column: 1/-1; padding: 20px; text-align: center; font-size: 12px;">Belum ada produk terpasang di Pasar Muamalah Kompleks.</div>';
        return;
    }

    const users = DB.get('users');

    availableItems.forEach(item => {
        const seller = users.find(u => u.id === item.seller_id);
        const sellerName = seller ? seller.name : 'Warga';
        const contactLink = `https://wa.me/${seller ? seller.phone : '0812'}/?text=Assalamu'alaikum,%20saya%20tertarik%20dengan%20produk%20"${encodeURIComponent(item.title)}"%20di%20MasjidKita.`;

        const card = document.createElement('div');
        card.className = 'market-item-card';
        
        // Gunakan placeholder cantik jika image_url kosong
        const imgUrl = item.image_url || 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=200';

        card.innerHTML = `
            <img class="market-item-img" src="${imgUrl}" alt="${item.title}">
            <div class="market-item-content">
                <span class="badge" style="background-color: #ecfdf5; color: #047857; margin-bottom: 5px; width: fit-content; font-size: 8px;">${item.category}</span>
                <div class="market-item-title">${item.title}</div>
                <div class="market-item-seller">Penjual: ${sellerName} (Blok ${seller ? seller.block_number : ''})</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <span class="market-item-price">${formatRupiah(item.price)}</span>
                    <a href="${contactLink}" target="_blank" style="background-color: #25d366; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; text-decoration: none;" title="Beli">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="#ffffff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function openMarketDrawer() {
    document.getElementById('market-overlay').classList.add('active');
    document.getElementById('market-drawer').classList.add('active');
}

function closeMarketDrawer() {
    document.getElementById('market-overlay').classList.remove('active');
    document.getElementById('market-drawer').classList.remove('active');
}

function submitMarketItem() {
    const title = document.getElementById('market-item-title-input').value;
    const desc = document.getElementById('market-item-desc-input').value;
    const price = parseFloat(document.getElementById('market-item-price-input').value);
    const cat = document.getElementById('market-item-cat-select').value;
    const img = document.getElementById('market-item-img-input').value;

    if (!title || isNaN(price) || price < 0 || !cat) {
        showToast('Nama barang, harga, dan kategori wajib diisi!', 'error');
        return;
    }

    const market = DB.get('market');
    const newItem = {
        id: Date.now(),
        seller_id: currentSession.id,
        title,
        description: desc,
        price,
        category: cat,
        status: 'available',
        image_url: img || '',
        created_at: new Date().toISOString()
    };

    market.push(newItem);
    DB.set('market', market);

    showToast('Produk Anda berhasil dipasang di Pasar Muamalah Kompleks.', 'success');
    
    // Reset form
    document.getElementById('market-item-title-input').value = '';
    document.getElementById('market-item-desc-input').value = '';
    document.getElementById('market-item-price-input').value = '';
    document.getElementById('market-item-img-input').value = '';

    closeMarketDrawer();
    loadMarketData();
}


// ==========================================
// 6. LOGIKA CORE PILLAR 2C: ASISTEN AI BANTUBOT
// ==========================================

function initChatLogs() {
    const container = document.getElementById('chat-history-container');
    container.innerHTML = '';

    // Respons bot pembuka jika chat kosong
    const welcomeBubble = document.createElement('div');
    welcomeBubble.className = 'chat-bubble bot';
    welcomeBubble.innerHTML = `
        Assalamu'alaikum, saya <strong>BantuBot</strong>, asisten finansial & Syariah MasjidKita. Ada yang bisa saya bantu hari ini?<br><br>
        Anda dapat memilih pertanyaan cepat di bawah atau mengetik langsung. Jika Anda membutuhkan bantuan darurat, Anda dapat melaporkan kesulitan keuangan secara rahasia ke pengurus DKM.
        <span class="chat-bubble-meta">${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
    `;
    container.appendChild(welcomeBubble);
    
    container.scrollTop = container.scrollHeight;
}

function sendChatMessage(directText = null) {
    const input = document.getElementById('chat-input-text');
    const text = directText || input.value.trim();

    if (!text) return;

    if (!directText) input.value = '';

    appendChatBubble('user', text);

    // Simulasi respons bot (Mock AI Processing)
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble bot';
    typingBubble.innerHTML = '<em>BantuBot sedang berpikir...</em>';
    const container = document.getElementById('chat-history-container');
    container.appendChild(typingBubble);
    container.scrollTop = container.scrollHeight;

    setTimeout(() => {
        container.removeChild(typingBubble);
        const botResponse = generateAIResponse(text);
        appendChatBubble('bot', botResponse);
    }, 1000);
}

function appendChatBubble(sender, text) {
    const container = document.getElementById('chat-history-container');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerHTML = `
        ${text.replace(/\n/g, '<br>')}
        <span class="chat-bubble-meta">${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
    `;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
}

// Logika Pemrosesan AI / Asisten BantuBot
function generateAIResponse(input) {
    const prompt = input.toLowerCase();

    // 1. Skrining Sosial Anonim Flow (Negosiasi / Bantuan Darurat)
    if (currentChatContext.step === 'screening_reason') {
        currentChatContext.ticketData.reason = input;
        currentChatContext.step = 'screening_amount';
        return `Mengerti. Berapa perkiraan nominal dana darurat yang Anda butuhkan saat ini? (Contoh: "500000" atau "750000")`;
    }

    if (currentChatContext.step === 'screening_amount') {
        const amount = parseFloat(input.replace(/[^0-9]/g, '')) || 500000;
        currentChatContext.ticketData.amount = amount;
        
        // Simpan tiket rahasia ke database lokal
        const tickets = DB.get('tickets');
        const ledgers = DB.get('ledgers');
        const emergencyCash = ledgers['Emergency Social Fund'];

        const alias = `Warga_RT${currentSession.rt}_Blok_${currentSession.block_number}`;
        const newTicket = {
            id: Date.now().toString().slice(-4),
            resident_id: currentSession.id,
            encrypted_alias: alias,
            screening_summary: `[BantuBot Screening] Dana Kas Sosial Tersedia: Rp ${emergencyCash.toLocaleString('id-ID')}. Permintaan: ${currentChatContext.ticketData.reason}`,
            requested_amount: amount,
            status: 'pending',
            created_at: new Date().toISOString(),
            reviewed_at: null,
            action_taken: null
        };

        tickets.push(newTicket);
        DB.set('tickets', tickets);

        currentChatContext.step = 'idle';
        currentChatContext.ticketData = {};

        return `Alhamdulillah, tiket pengajuan bantuan darurat Anda telah berhasil dibuat secara rahasia dengan **ID Tiket #${newTicket.id}**.\n\nIdentitas asli Anda disamarkan sebagai **"${alias}"** demi menjaga kehormatan Anda. Pengurus DKM sedang meninjau permohonan ini secara tertutup di panel khusus. Semoga Allah mudahkan segalanya.`;
    }

    if (prompt.includes('zakat mal') || prompt.includes('hitung zakat')) {
        return `Untuk Zakat Mal (Harta): Nisab zakat mal tahunan adalah setara emas 85 gram (asumsi Rp 85.000.000). Jika aset tabungan Anda yang mengendap selama 1 tahun telah melewati angka ini, Anda wajib mengeluarkan zakat 2.5%. Anda dapat menggunakan kalkulator Zakat di tab menu "Zakat" untuk perhitungan otomatis.`;
    }

    if (prompt.includes('qardhul') || prompt.includes('pinjaman tanpa bunga') || prompt.includes('riba')) {
        return `Qardhul Hasan adalah pinjaman kebajikan syariah tanpa bunga sama sekali. Anda mengembalikan modal pinjaman pokok sesuai tenggat waktu yang dipilih. Dana ini diambil dari Kas Darurat Sosial. Pengajuan dapat dilakukan di menu "Muamalah".`;
    }

    if (prompt.includes('kesulitan') || prompt.includes('bantuan darurat') || prompt.includes('tidak punya uang') || prompt.includes('butuh bantuan')) {
        currentChatContext.step = 'screening_reason';
        currentChatContext.ticketData = {};
        return `Saya memahami situasi sulit yang sedang Anda hadapi. Sesuai prinsip muamalah berkah, saya dapat mencatatkan permohonan bantuan darurat ini secara anonim ke pengurus DKM.\n\nSebagai langkah awal, tolong jelaskan kebutuhan mendesak Anda saat ini secara singkat.`;
    }

    if (prompt.includes('draft pengumuman') || prompt.includes('buat pengumuman')) {
        if (currentSession.role !== 'admin') {
            return `Maaf, perintah penyusunan pengumuman hanya tersedia untuk akun Pengurus DKM.`;
        }
        return `Berikut adalah draf pengumuman pengumpulan donasi yang telah saya rancang:\n\n**"PENGUMUMAN DKM MASJIDKITA: Assalamu'alaikum Wr. Wb. Kaum muslimin rahimakumullah, Laporan keuangan kas masjid per hari ini telah diperbarui di aplikasi. Total saldo kas terhimpun saat ini sebesar Rp [Sebutkan Jumlah]. Mari salurkan infaq terbaik Anda via QRIS. Jazakumullahu Khairan. Wassalamu'alaikum."**`;
    }

    if (prompt.includes('ringkasan keuangan') || prompt.includes('laporan kas')) {
        const ledgers = DB.get('ledgers');
        let total = 0;
        let summary = `**LAPORAN KAS MASJIDKITA (Real-Time)**\n\n`;
        for (let name in ledgers) {
            summary += `- ${name}: ${formatRupiah(ledgers[name])}\n`;
            total += ledgers[name];
        }
        summary += `\n**Total Dana Terhimpun: ${formatRupiah(total)}**`;
        return summary;
    }

    // Default Responses
    return `Assalamu'alaikum ${currentSession.name}. Saya adalah BantuBot, asisten finansial & Syariah MasjidKita. Ada yang bisa saya bantu terkait Zakat, Infaq/Sedekah, Pinjaman Qardhul Hasan, atau program bantuan pangan E-Sembako?`;
}


// ==========================================
// 7. PANEL ADMIN DKM (VERIFIKASI & TIKET SOSIAL)
// ==========================================

function loadAdminData() {
    const users = DB.get('users');
    const tickets = DB.get('tickets');
    const coupons = DB.get('coupons');

    // 1. Verifikasi Warga Pending
    const pendingContainer = document.getElementById('pending-residents-list');
    pendingContainer.innerHTML = '';

    const pendingUsers = users.filter(u => u.role === 'resident' && u.is_verified === 0);

    if (pendingUsers.length === 0) {
        pendingContainer.innerHTML = '<div class="text-muted" style="font-size: 11px;">Tidak ada permohonan warga baru yang pending.</div>';
    } else {
        pendingUsers.forEach(u => {
            const item = document.createElement('div');
            item.className = 'verify-item';
            item.innerHTML = `
                <div class="verify-header">
                    <strong>${u.name}</strong>
                    <span class="badge badge-pending">Pending</span>
                </div>
                <div class="verify-body">
                    Telp: <strong>${u.phone}</strong><br>
                    Alamat: <strong>RT ${u.rt} / RW ${u.rw} - Blok ${u.block_number}</strong>
                    <div class="admin-action-row">
                        <button onclick="processResidentVerification(${u.id}, true)" class="btn btn-primary">Setujui</button>
                        <button onclick="processResidentVerification(${u.id}, false)" class="btn btn-danger">Tolak</button>
                    </div>
                </div>
            `;
            pendingContainer.appendChild(item);
        });
    }

    // 2. Tiket Bantuan Rahasia AI (Discreet Tickets)
    const ticketsContainer = document.getElementById('admin-tickets-list');
    ticketsContainer.innerHTML = '';

    if (tickets.length === 0) {
        ticketsContainer.innerHTML = '<div class="text-muted" style="font-size: 11px;">Tidak ada tiket sosial masuk.</div>';
    } else {
        tickets.forEach(t => {
            let badge = '';
            let buttons = '';

            if (t.status === 'pending') {
                badge = '<span class="badge badge-pending">Menunggu Review</span>';
                buttons = `
                    <div class="admin-action-row">
                        <button onclick="processDiscreetTicket(${t.id}, true)" class="btn btn-primary">Setujui & Cairkan Kas</button>
                        <button onclick="processDiscreetTicket(${t.id}, false)" class="btn btn-danger">Tolak</button>
                    </div>
                `;
            } else if (t.status === 'approved') {
                badge = '<span class="badge badge-approved">Disetujui</span>';
                buttons = `<div style="font-size: 11px; margin-top: 8px; color: var(--success);">Diselesaikan: <em>"${t.action_taken}"</em></div>`;
            } else {
                badge = '<span class="badge badge-rejected">Ditolak</span>';
            }

            const item = document.createElement('div');
            item.className = 'ticket-item';
            item.innerHTML = `
                <div class="ticket-header">
                    <strong>Tiket Rahasia #${t.id} (${t.encrypted_alias})</strong>
                    ${badge}
                </div>
                <div class="ticket-body">
                    Skrining AI: <em>"${t.screening_summary}"</em><br>
                    Jumlah Permintaan: <strong>${formatRupiah(t.requested_amount)}</strong>
                    ${buttons}
                </div>
                <div class="ticket-meta">Diajukan: ${formatDate(t.created_at)}</div>
            `;
            ticketsContainer.appendChild(item);
        });
    }

    // 3. Permintaan Pinjaman Qardhul Hasan (Admin Approval)
    const loansContainer = document.getElementById('admin-loans-list');
    loansContainer.innerHTML = '';

    const loans = DB.get('loans');
    const pendingLoans = loans.filter(l => l.status === 'pending');

    if (pendingLoans.length === 0) {
        loansContainer.innerHTML = '<div class="text-muted" style="font-size: 11px;">Tidak ada permohonan pinjaman pending.</div>';
    } else {
        pendingLoans.forEach(l => {
            const resident = users.find(u => u.id === l.resident_id);
            const rName = resident ? resident.name : 'Warga';
            
            const item = document.createElement('div');
            item.className = 'ticket-item';
            item.innerHTML = `
                <div class="ticket-header">
                    <strong>Pinjaman #${l.id} - ${rName}</strong>
                    <span class="badge badge-pending">Pending</span>
                </div>
                <div class="ticket-body">
                    Jumlah: <strong>${formatRupiah(l.amount)}</strong><br>
                    Tenor: <strong>${l.tenor_months} Bulan</strong><br>
                    Tujuan: <em>"${l.purpose}"</em>
                    <div class="admin-action-row">
                        <button onclick="processLoanApproval(${l.id}, true)" class="btn btn-primary">Setujui & Transfer</button>
                        <button onclick="processLoanApproval(${l.id}, false)" class="btn btn-danger">Tolak</button>
                    </div>
                </div>
                <div class="ticket-meta">Diajukan: ${formatDate(l.created_at)}</div>
            `;
            loansContainer.appendChild(item);
        });
    }
}

// Proses verifikasi pendaftaran warga
function processResidentVerification(userId, approve) {
    const users = DB.get('users');
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex !== -1) {
        if (approve) {
            users[userIndex].is_verified = 1;
            showToast('Warga berhasil diverifikasi.');
        } else {
            users.splice(userIndex, 1);
            showToast('Pendaftaran ditolak.');
        }
        DB.set('users', users);
        loadAdminData();
    }
}

// Proses verifikasi persetujuan pinjaman Qardhul Hasan
function processLoanApproval(loanId, approve) {
    const loans = DB.get('loans');
    const ledgers = DB.get('ledgers');
    const transactions = DB.get('transactions');

    const loanIndex = loans.findIndex(l => l.id === loanId);
    
    if (loanIndex !== -1) {
        if (approve) {
            const loan = loans[loanIndex];
            
            // Periksa kecukupan dana sosial darurat
            if (ledgers['Emergency Social Fund'] < loan.amount) {
                showToast('Gagal! Saldo Dana Sosial Darurat tidak mencukupi.', 'error');
                return;
            }

            // Kurangi saldo buku besar & catat mutasi kas (Double-Entry Credit)
            ledgers['Emergency Social Fund'] -= loan.amount;
            
            const refNo = 'QH-DISB-' + Date.now().toString().slice(-6);
            const tx = {
                id: Date.now(),
                user_id: loan.resident_id,
                ledger: 'Emergency Social Fund',
                amount: loan.amount,
                type: 'credit', // Transaksi keluar
                category: 'Qardhul Hasan Disbursed',
                description: `Penyaluran Pinjaman Qardhul Hasan ID #${loan.id}`,
                payment_method: 'Cash',
                reference_no: refNo,
                status: 'success',
                created_at: new Date().toISOString()
            };

            transactions.push(tx);
            loans[loanIndex].status = 'approved';
            loans[loanIndex].approved_at = new Date().toISOString();

            DB.set('ledgers', ledgers);
            DB.set('transactions', transactions);
            showToast('Pinjaman disetujui, kas darurat berhasil didebit.');
        } else {
            loans[loanIndex].status = 'rejected';
            showToast('Pengajuan pinjaman ditolak.');
        }
        DB.set('loans', loans);
        loadAdminData();
    }
}

// Proses verifikasi persetujuan tiket sosial rahasia AI
function processDiscreetTicket(ticketId, approve) {
    const tickets = DB.get('tickets');
    const ledgers = DB.get('ledgers');
    const transactions = DB.get('transactions');

    const ticketIndex = tickets.findIndex(t => t.id === ticketId.toString());

    if (ticketIndex !== -1) {
        if (approve) {
            const ticket = tickets[ticketIndex];

            if (ledgers['Emergency Social Fund'] < ticket.requested_amount) {
                showToast('Gagal! Saldo Dana Sosial Darurat tidak mencukupi.', 'error');
                return;
            }

            // Kurangi saldo
            ledgers['Emergency Social Fund'] -= ticket.requested_amount;

            const refNo = 'AID-DISC-' + Date.now().toString().slice(-6);
            const tx = {
                id: Date.now(),
                user_id: ticket.resident_id,
                ledger: 'Emergency Social Fund',
                amount: ticket.requested_amount,
                type: 'credit',
                category: 'Social Aid',
                description: `Bantuan Sosial Rahasia Tiket #${ticket.id} (${ticket.encrypted_alias})`,
                payment_method: 'Bank Transfer',
                reference_no: refNo,
                status: 'success',
                created_at: new Date().toISOString()
            };

            transactions.push(tx);
            tickets[ticketIndex].status = 'approved';
            tickets[ticketIndex].reviewed_at = new Date().toISOString();
            tickets[ticketIndex].action_taken = `Diberikan Bantuan Tunai ${formatRupiah(ticket.requested_amount)} dari Kas Sosial Darurat`;

            DB.set('ledgers', ledgers);
            DB.set('transactions', transactions);
            showToast('Tiket sosial disetujui, dana berhasil ditransfer secara rahasia.');
        } else {
            tickets[ticketIndex].status = 'rejected';
            showToast('Tiket sosial ditolak.');
        }
        DB.set('tickets', tickets);
        loadAdminData();
    }
}

// ==========================================
// 8. DOCUMENT READY INITIALIZER
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initDB();
    checkActiveSession();

    // Event Listener Forms
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', loginUser);

    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.addEventListener('submit', registerUser);
});
// --- LOGIKA LOGIN BARU (GANTIIN YANG LAMA) ---
function cekLogin() {
    let user = document.getElementById("username").value;
    let pass = document.getElementById("password").value;

    if (user === "admin" && pass === "12345678910") {
        window.location.href = "dashboard-admin.html";
    } else if (user === "warga" && pass === "10987654321") {
        window.location.href = "dashboard-warga.html";
    } else {
        alert("Username atau Password salah, men!");
    }
}