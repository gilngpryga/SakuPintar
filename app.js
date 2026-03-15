// ==============================
// CONFIG & STATE DATA
// ==============================
const pocketIcons = [
    "fa-wallet", "fa-piggy-bank", "fa-shopping-cart",
    "fa-utensils", "fa-graduation-cap", "fa-heartbeat",
    "fa-bus", "fa-home", "fa-gamepad", "fa-gift"
];
const chartColors = ['#4F46E5', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#F97316', '#F43F5E'];

let pockets = JSON.parse(localStorage.getItem("saku_pockets")) || [
    { id: "p1", name: "Bulanan", icon: "fa-shopping-cart", balance: 0 },
    { id: "p2", name: "Tabungan", icon: "fa-piggy-bank", balance: 0 },
    { id: "p3", name: "Jajan", icon: "fa-utensils", balance: 0 }
];
let transactions = JSON.parse(localStorage.getItem("saku_transactions")) || [];

let activePocketId = "all";
let activeTxType = "in";
let editingTxId = null;
let selectedIcon = pocketIcons[0];
let balanceChartInstance = null;
let flatpickrInstance = null;
let activeContextMenu = null;

let currentYear = new Date().getFullYear();
let availableYears = [];
let searchQuery = "";

// ==============================
// UTILITIES
// ==============================
function formatIDR(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
}

function formatIDRInput(num) {
    // Format angka untuk tampilan di input (tanpa simbol Rp)
    return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(num);
}

function parseIDRInput(str) {
    // Parse string berformat "1.500.000" ke angka
    return parseFloat(str.replace(/\./g, "").replace(",", ".")) || 0;
}

function generateId(prefix) {
    return prefix + '_' + Math.random().toString(36).substr(2, 9);
}

function getMonthName(monthIndex) {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return months[monthIndex];
}

// ==============================
// INPUT NOMINAL FORMATTER
// ==============================
function initAmountInput() {
    const input = document.getElementById("txAmount");
    if (!input) return;

    // Saat user mengetik, format otomatis
    input.addEventListener("input", function () {
        const raw = this.value.replace(/\./g, "").replace(/[^0-9]/g, "");
        if (raw === "") { this.value = ""; return; }
        const num = parseInt(raw, 10);
        this.value = formatIDRInput(num);
        // Simpan nilai raw ke dataset
        this.dataset.raw = raw;
        // Hapus error saat mengetik
        this.classList.remove("input-error");
    });

    // Saat focus, bersihkan format agar mudah diedit
    input.addEventListener("focus", function () {
        const raw = this.dataset.raw || this.value.replace(/\./g, "");
        this.value = raw === "0" ? "" : raw;
    });

    // Saat blur, format kembali + validasi
    input.addEventListener("blur", function () {
        const raw = this.value.replace(/\./g, "").replace(/[^0-9]/g, "");
        if (!raw || parseInt(raw) <= 0) {
            this.value = "";
            this.dataset.raw = "";
            markInvalidInput(this);
        } else {
            this.value = formatIDRInput(parseInt(raw));
            this.dataset.raw = raw;
            this.classList.remove("input-error");
        }
    });
}

function getAmountValue() {
    const input = document.getElementById("txAmount");
    const raw = input.dataset.raw || input.value.replace(/\./g, "").replace(/[^0-9]/g, "");
    return parseInt(raw, 10) || 0;
}

function setAmountValue(num) {
    const input = document.getElementById("txAmount");
    input.dataset.raw = String(num);
    input.value = formatIDRInput(num);
}

// ==============================
// YEAR NAVIGATION
// ==============================
function updateAvailableYears() {
    let yearsSet = new Set();
    transactions.forEach(t => yearsSet.add(new Date(t.date).getFullYear()));
    yearsSet.add(new Date().getFullYear());
    yearsSet.add(currentYear);
    availableYears = Array.from(yearsSet).sort((a, b) => a - b);
}

function renderYearNavigation() {
    const idx = availableYears.indexOf(currentYear);
    const prevBtn = document.getElementById("prevYearBtn");
    const nextBtn = document.getElementById("nextYearBtn");
    if (prevBtn) prevBtn.disabled = idx <= 0;
    if (nextBtn) nextBtn.disabled = idx >= availableYears.length - 1;
    const display = document.getElementById("yearDisplay");
    if (display) display.innerText = currentYear;
}

function changeYear(step) {
    let idx = availableYears.indexOf(currentYear);
    idx += step;
    if (idx >= 0 && idx < availableYears.length) {
        currentYear = availableYears[idx];
        saveAndRefresh();
    }
}

function saveAndRefresh() {
    pockets.forEach(p => {
        p.balance = transactions
            .filter(t => t.pocketId === p.id)
            .reduce((acc, t) => t.type === "in" ? acc + t.amount : acc - t.amount, 0);
    });
    localStorage.setItem("saku_pockets", JSON.stringify(pockets));
    localStorage.setItem("saku_transactions", JSON.stringify(transactions));

    updateAvailableYears();
    renderYearNavigation();
    renderPockets();
    renderStats();
    renderTransactions();
    renderChart();
}

// ==============================
// EXPORT / IMPORT DATA
// ==============================
function exportData() {
    const dataToExport = { pockets, transactions, exportDate: new Date().toISOString() };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport));
    const a = document.createElement('a');
    const date = new Date();
    const ds = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}`;
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `SakuPintar_Backup_${ds}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast("Data berhasil diekspor!", "success");
    toggleModal('settingsModal');
}

async function importData(event) {
    const inputElement = event.target;
    const file = inputElement.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
        showToast("Gagal: Harap pilih file cadangan berformat .json", "error");
        inputElement.value = '';
        return;
    }

    const confirmData = await customConfirm("Peringatan Timpa Data!", "Mengimpor data ini akan MENGHAPUS seluruh data Anda saat ini. Anda yakin?");
    if (confirmData) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.pockets && importedData.transactions) {
                    pockets = importedData.pockets;
                    transactions = importedData.transactions;
                    activePocketId = "all";
                    saveAndRefresh();
                    showToast("Data berhasil dipulihkan!", "success");
                    toggleModal('settingsModal');
                } else {
                    showToast("Format file tidak sesuai!", "error");
                }
            } catch (err) {
                showToast("File rusak atau tidak valid!", "error");
            }
            inputElement.value = '';
        };
        reader.readAsText(file);
    } else {
        inputElement.value = '';
    }
}

// ==============================
// CUSTOM DROPDOWN SELECT
// ==============================
function populateCustomPocketSelect() {
    const menu = document.getElementById("customPocketSelectMenu");
    if (!menu) return;

    if (pockets.length === 0) {
        menu.innerHTML = '<div class="p-4 text-center text-sm text-gray-500 font-medium">Buat Kantong Terlebih Dahulu</div>';
        return;
    }

    menu.innerHTML = pockets.map(p => `
        <div onclick="selectCustomPocket('${p.id}')" class="flex items-center justify-between p-3.5 cursor-pointer transition-colors border-b border-gray-50 last:border-none rounded-xl active:bg-indigo-50">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                    <i class="fas ${p.icon} text-[13px]"></i>
                </div>
                <span class="font-bold text-gray-700 text-sm">${p.name}</span>
            </div>
            <span class="text-xs text-gray-500 font-bold bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">${formatIDR(p.balance)}</span>
        </div>
    `).join("");
}

function toggleCustomSelect() {
    const menu = document.getElementById("customPocketSelectMenu");
    const icon = document.getElementById("customPocketSelectIcon");
    const toggleBtn = document.getElementById("customPocketSelectToggle");

    if (menu.classList.contains("hidden")) {
        menu.classList.remove("hidden");
        toggleBtn.classList.add("border-indigo-500", "ring-4", "ring-indigo-500/10", "bg-white");
        setTimeout(() => {
            menu.classList.remove("opacity-0", "translate-y-[-10px]");
            icon.classList.add("rotate-180");
        }, 10);
    } else {
        closeCustomSelect();
    }
}

function closeCustomSelect() {
    const menu = document.getElementById("customPocketSelectMenu");
    const icon = document.getElementById("customPocketSelectIcon");
    const toggleBtn = document.getElementById("customPocketSelectToggle");
    if (!menu) return;

    menu.classList.add("opacity-0", "translate-y-[-10px]");
    icon.classList.remove("rotate-180");
    toggleBtn.classList.remove("border-indigo-500", "ring-4", "ring-indigo-500/10", "bg-white");

    setTimeout(() => menu.classList.add("hidden"), 200);
}

function selectCustomPocket(pocketId) {
    const pocket = pockets.find(p => p.id === pocketId);
    if (!pocket) return;

    document.getElementById("txPocketId").value = pocket.id;
    document.getElementById("customPocketSelectLabel").innerHTML = `
        <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <i class="fas ${pocket.icon} text-[10px]"></i>
            </div>
            <span class="font-bold text-indigo-900">${pocket.name}</span>
        </div>
    `;
    document.getElementById("customPocketSelectToggle").classList.remove('input-error');
    closeCustomSelect();
}

document.addEventListener('click', function (event) {
    const container = document.getElementById('customPocketSelectContainer');
    if (container && !container.contains(event.target)) {
        closeCustomSelect();
    }
    // Tutup context menu jika klik di luar
    if (activeContextMenu && !activeContextMenu.contains(event.target)) {
        closeAllContextMenus();
    }
});

// ==============================
// CONTEXT MENU (3-dot) untuk Pocket
// ==============================
function closeAllContextMenus() {
    document.querySelectorAll('.pocket-context-menu').forEach(m => {
        m.classList.add('opacity-0', 'scale-95');
        setTimeout(() => m.classList.add('hidden'), 150);
    });
    activeContextMenu = null;
}

function togglePocketContextMenu(event, pocketId) {
    event.stopPropagation();
    const menuEl = document.getElementById(`ctx-${pocketId}`);
    if (!menuEl) return;

    const isHidden = menuEl.classList.contains('hidden');
    closeAllContextMenus();

    if (isHidden) {
        menuEl.classList.remove('hidden');
        setTimeout(() => menuEl.classList.remove('opacity-0', 'scale-95'), 10);
        activeContextMenu = menuEl;
    }
}

// ==============================
// UI & NOTIFICATIONS
// ==============================
function customConfirm(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmTitle').innerText = title;
        document.getElementById('confirmMessage').innerText = message;

        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('div').classList.remove('scale-95');
        }, 10);

        const btnOk = document.getElementById('btnConfirmOk');
        const btnCancel = document.getElementById('btnConfirmCancel');

        const closeModal = () => {
            modal.classList.add('opacity-0');
            modal.querySelector('div').classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
        };

        btnOk.onclick = () => { closeModal(); resolve(true); };
        btnCancel.onclick = () => { closeModal(); resolve(false); };
    });
}

function showToast(msg, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col items-center gap-3 pointer-events-none w-full max-w-sm px-4';
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    const styles = {
        success: { icon: 'fa-check', bg: 'bg-emerald-100', color: 'text-emerald-600' },
        error: { icon: 'fa-exclamation', bg: 'bg-rose-100', color: 'text-rose-600' },
        warning: { icon: 'fa-exclamation-triangle', bg: 'bg-amber-100', color: 'text-amber-600' },
        info: { icon: 'fa-info', bg: 'bg-blue-100', color: 'text-blue-600' }
    };
    const style = styles[type] || styles.success;

    toast.className = `flex items-center gap-3 bg-white border border-gray-100 text-gray-700 px-4 py-3 rounded-2xl shadow-xl transition-all duration-400 transform -translate-y-10 opacity-0 w-max max-w-full`;
    toast.innerHTML = `
        <div class="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full ${style.bg} ${style.color}">
            <i class="fas ${style.icon} text-sm"></i>
        </div>
        <span class="font-semibold text-sm">${msg}</span>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove('-translate-y-10', 'opacity-0'));
    setTimeout(() => {
        toast.classList.add('-translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function markInvalidInput(inputElement) {
    let targetEl = inputElement;
    if (inputElement.id === 'txDate' && flatpickrInstance && flatpickrInstance.altInput) {
        targetEl = flatpickrInstance.altInput;
    }
    targetEl.classList.add('input-error', 'animate-shake');
    setTimeout(() => targetEl.classList.remove('animate-shake'), 300);
}

function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal.classList.contains('hidden')) {
        modal.querySelectorAll('input, button').forEach(el => el.classList.remove('input-error'));
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('div').classList.remove('scale-95');
        }, 10);
    } else {
        modal.classList.add('opacity-0');
        modal.querySelector('div').classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

function togglePocketModal() {
    document.getElementById('pocketName').value = '';
    selectIcon(pocketIcons[0]);
    toggleModal('pocketModal');
}

function setTxType(type) {
    activeTxType = type;
    const btnIn = document.getElementById("btnTypeIn");
    const btnOut = document.getElementById("btnTypeOut");
    if (type === "in") {
        btnIn.className = "py-2.5 rounded-xl font-bold transition-all bg-white text-emerald-600 shadow-sm border border-gray-200/50";
        btnOut.className = "py-2.5 rounded-xl font-bold transition-all text-gray-500 border border-transparent";
    } else {
        btnOut.className = "py-2.5 rounded-xl font-bold transition-all bg-white text-rose-600 shadow-sm border border-gray-200/50";
        btnIn.className = "py-2.5 rounded-xl font-bold transition-all text-gray-500 border border-transparent";
    }
}

function renderIconPicker() {
    const wrap = document.getElementById("iconPicker");
    if (!wrap) return;
    wrap.innerHTML = pocketIcons.map(icon => `
        <button type="button" onclick="selectIcon('${icon}')"
            class="w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all duration-200 outline-none
            ${icon === selectedIcon ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-gray-200 text-gray-500'}">
            <i class="fas ${icon} text-lg"></i>
        </button>
    `).join("");
}

function selectIcon(icon) {
    selectedIcon = icon;
    renderIconPicker();
}

// ==============================
// POCKET LOGIC
// ==============================
function selectPocket(id) {
    activePocketId = id;
    const pocket = pockets.find(p => p.id === id);
    document.getElementById("currentPocketTitle").innerText = pocket ? pocket.name : "Semua Transaksi";
    document.getElementById("currentPocketDesc").innerText = pocket ? `Riwayat arus kas kantong ini` : "Riwayat arus kas Anda";
    renderPockets();
    renderStats();
    renderTransactions();
    closeAllContextMenus();
}

function addPocket() {
    const nameInput = document.getElementById("pocketName");
    const name = nameInput.value.trim();
    if (!name) { markInvalidInput(nameInput); showToast("Nama kantong wajib diisi", "error"); return; }
    pockets.push({ id: generateId("p"), name, icon: selectedIcon, balance: 0 });
    saveAndRefresh();
    toggleModal("pocketModal");
    showToast("Kantong baru berhasil dibuat!", "success");
}

async function deletePocket(id) {
    closeAllContextMenus();
    const confirmData = await customConfirm("Hapus Kantong?", "Kantong ini dan seluruh data transaksi di dalamnya akan dihapus permanen. Lanjutkan?");
    if (confirmData) {
        pockets = pockets.filter(p => p.id !== id);
        transactions = transactions.filter(t => t.pocketId !== id);
        if (activePocketId === id) activePocketId = "all";
        saveAndRefresh();
        showToast("Kantong dihapus", "info");
    }
}

function renderPockets() {
    const list = document.getElementById("pocketList");
    const totalBalance = pockets.reduce((acc, p) => acc + p.balance, 0);

    const th = document.getElementById("totalBalanceHeader");
    if (th) th.innerText = `Total Saldo: ${formatIDR(totalBalance)}`;

    let html = `
        <div onclick="selectPocket('all')" class="p-3 rounded-2xl cursor-pointer border-2 transition-all ${activePocketId === "all" ? "border-indigo-600 bg-indigo-50/50 shadow-sm" : "border-gray-100 bg-white"}">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 ${activePocketId === "all" ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-gray-100 text-gray-500"} transition-all flex items-center justify-center rounded-xl">
                    <i class="fas fa-layer-group text-lg"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-bold text-gray-800">Semua Kantong</p>
                    <p class="text-xs ${totalBalance < 0 ? 'text-rose-500' : 'text-gray-500'} font-semibold">${formatIDR(totalBalance)}</p>
                </div>
            </div>
        </div>
    `;

    pockets.forEach(p => {
        const isActive = activePocketId === p.id;
        html += `
            <div class="flex items-center gap-2 p-3 rounded-2xl cursor-pointer border-2 transition-all ${isActive ? "border-indigo-600 bg-indigo-50/50 shadow-sm" : "border-gray-100 bg-white"} relative" onclick="selectPocket('${p.id}')">
                <div class="w-12 h-12 ${isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-indigo-50 text-indigo-600"} flex-shrink-0 flex items-center justify-center rounded-xl transition-all">
                    <i class="fas ${p.icon} text-lg"></i>
                </div>
                <div class="flex-1 overflow-hidden">
                    <p class="text-sm font-bold text-gray-800 truncate">${p.name}</p>
                    <p class="text-xs ${p.balance < 0 ? 'text-rose-500' : 'text-gray-500'} font-semibold">${formatIDR(p.balance)}</p>
                </div>

                <!-- Tombol 3-titik -->
                <button onclick="togglePocketContextMenu(event, '${p.id}')" class="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 flex-shrink-0 z-10" title="Opsi">
                    <i class="fas fa-ellipsis-v text-sm"></i>
                </button>

                <!-- Context Menu -->
                <div id="ctx-${p.id}" class="pocket-context-menu hidden opacity-0 scale-95 absolute right-2 top-12 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden transition-all duration-150 min-w-[160px]">
                    <button onclick="event.stopPropagation(); deletePocket('${p.id}')" class="w-full flex items-center gap-3 px-4 py-3 text-rose-600 text-sm font-bold">
                        <i class="fas fa-trash-alt text-xs"></i>
                        Hapus Kantong
                    </button>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

// ==============================
// SEARCH
// ==============================
function handleSearch(e) {
    searchQuery = e.target.value.toLowerCase().trim();
    renderTransactions();
}

function clearSearch() {
    const input = document.getElementById("searchInput");
    if (input) input.value = "";
    searchQuery = "";
    renderTransactions();
}

// ==============================
// TRANSACTION LOGIC
// ==============================
function openTransactionModal(txId = null) {
    if (pockets.length === 0) {
        showToast("Buat kantong terlebih dahulu!", "warning");
        return;
    }

    populateCustomPocketSelect();
    const title = document.getElementById("txModalTitle");

    if (txId) {
        editingTxId = txId;
        title.innerText = "Edit Transaksi";
        const tx = transactions.find(t => t.id === txId);
        setAmountValue(tx.amount);
        document.getElementById("txNote").value = tx.note;

        if (flatpickrInstance) flatpickrInstance.setDate(tx.date);

        selectCustomPocket(tx.pocketId);
        setTxType(tx.type);
    } else {
        editingTxId = null;
        title.innerText = "Tambah Transaksi";

        // Reset amount
        const amountInput = document.getElementById("txAmount");
        amountInput.value = "";
        amountInput.dataset.raw = "";

        document.getElementById("txNote").value = "";
        document.getElementById("txPocketId").value = "";
        document.getElementById("customPocketSelectLabel").innerHTML = `<span class="text-gray-500">Pilih Kantong...</span>`;

        if (flatpickrInstance) {
            const now = new Date();
            if (now.getFullYear() === currentYear) {
                flatpickrInstance.setDate(now);
            } else {
                flatpickrInstance.setDate(new Date(currentYear, 0, 2));
            }
        }

        setTxType("in");

        if (activePocketId !== "all") {
            selectCustomPocket(activePocketId);
        } else {
            selectCustomPocket(pockets[0].id);
        }
    }

    closeCustomSelect();
    toggleModal("transactionModal");
}

function saveTransaction() {
    const amountInput = document.getElementById("txAmount");
    const noteInput = document.getElementById("txNote");
    const dateInput = document.getElementById("txDate");
    const pocketInput = document.getElementById("txPocketId");
    const pocketToggle = document.getElementById("customPocketSelectToggle");

    const amount = getAmountValue();
    const note = noteInput.value.trim();
    const date = dateInput.value;
    const pocketId = pocketInput.value;
    let isFormValid = true;

    if (!amount || amount <= 0) { markInvalidInput(amountInput); isFormValid = false; }
    if (!note) { markInvalidInput(noteInput); isFormValid = false; }
    if (!date) { markInvalidInput(dateInput); isFormValid = false; }
    if (!pocketId) { markInvalidInput(pocketToggle); isFormValid = false; }

    if (!isFormValid) { showToast("Oops, lengkapi bagian yang merah!", "error"); return; }

    currentYear = new Date(date).getFullYear();

    if (editingTxId) {
        const idx = transactions.findIndex(t => t.id === editingTxId);
        transactions[idx] = { ...transactions[idx], pocketId, amount, note, date, type: activeTxType };
        showToast("Perubahan disimpan", "success");
    } else {
        transactions.push({ id: generateId("tx"), pocketId, type: activeTxType, amount, note, date });
        showToast("Transaksi baru berhasil dicatat", "success");
    }
    saveAndRefresh();
    toggleModal("transactionModal");
    editingTxId = null;
}

async function deleteTransaction(id) {
    const confirmData = await customConfirm("Hapus Catatan?", "Transaksi ini akan dihapus permanen.");
    if (confirmData) {
        transactions = transactions.filter(t => t.id !== id);
        saveAndRefresh();
        showToast("Catatan dihapus", "info");
    }
}

function renderTransactions() {
    const body = document.getElementById("transactionBody");
    const empty = document.getElementById("emptyState");

    let filtered = transactions.filter(t => new Date(t.date).getFullYear() === currentYear);
    if (activePocketId !== "all") {
        filtered = filtered.filter(t => t.pocketId === activePocketId);
    }

    // Filter berdasarkan search
    if (searchQuery) {
        filtered = filtered.filter(t =>
            t.note.toLowerCase().includes(searchQuery) ||
            (pockets.find(p => p.id === t.pocketId)?.name || "").toLowerCase().includes(searchQuery)
        );
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Tampilkan/sembunyikan tombol clear search
    const clearBtn = document.getElementById("clearSearchBtn");
    if (clearBtn) clearBtn.classList.toggle("hidden", !searchQuery);

    if (!filtered.length) {
        body.innerHTML = "";
        // Teks empty state yang kontekstual
        const emptyTitle = document.getElementById("emptyTitle");
        const emptyDesc = document.getElementById("emptyDesc");
        const emptyAction = document.getElementById("emptyAction");

        if (searchQuery) {
            if (emptyTitle) emptyTitle.innerText = "Tidak ditemukan";
            if (emptyDesc) emptyDesc.innerText = `Tidak ada transaksi yang cocok dengan "${searchQuery}".`;
            if (emptyAction) emptyAction.classList.add("hidden");
        } else if (transactions.filter(t => new Date(t.date).getFullYear() === currentYear).length === 0) {
            if (emptyTitle) emptyTitle.innerText = "Belum ada catatan";
            if (emptyDesc) emptyDesc.innerText = `Belum ada transaksi di tahun ${currentYear}.`;
            if (emptyAction) emptyAction.classList.remove("hidden");
        } else {
            if (emptyTitle) emptyTitle.innerText = "Tidak ada catatan";
            if (emptyDesc) emptyDesc.innerText = "Belum ada transaksi di kantong ini.";
            if (emptyAction) emptyAction.classList.remove("hidden");
        }

        empty.classList.remove("hidden");
        return;
    }

    empty.classList.add("hidden");

    const groupedTxs = {};
    filtered.forEach(t => {
        const monthIdx = new Date(t.date).getMonth();
        if (!groupedTxs[monthIdx]) groupedTxs[monthIdx] = [];
        groupedTxs[monthIdx].push(t);
    });

    let html = '';
    const sortedMonths = Object.keys(groupedTxs).sort((a, b) => b - a);

    sortedMonths.forEach(monthIdx => {
        const monthName = getMonthName(parseInt(monthIdx));
        const monthTxs = groupedTxs[monthIdx];

        // Hitung subtotal per bulan
        const monthIn = monthTxs.filter(t => t.type === "in").reduce((a, b) => a + b.amount, 0);
        const monthOut = monthTxs.filter(t => t.type === "out").reduce((a, b) => a + b.amount, 0);

        html += `
            <tr class="bg-indigo-50/50 border-y border-indigo-100">
                <td colspan="4" class="py-3 px-4">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                        <span class="text-xs font-bold text-indigo-800 uppercase tracking-widest flex items-center gap-2">
                            <i class="fas fa-calendar-alt"></i> ${monthName}
                        </span>
                        <span class="flex items-center gap-2 text-xs font-semibold">
                            ${monthIn > 0 ? `<span class="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+${formatIDR(monthIn)}</span>` : ''}
                            ${monthOut > 0 ? `<span class="text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">-${formatIDR(monthOut)}</span>` : ''}
                        </span>
                    </div>
                </td>
            </tr>
        `;

        monthTxs.forEach(t => {
            const pocket = pockets.find(p => p.id === t.pocketId);
            const isIncome = t.type === "in";
            const dateObj = new Date(t.date);
            const formattedDate = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

            // Highlight search match
            let noteDisplay = t.note;
            if (searchQuery) {
                const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                noteDisplay = t.note.replace(regex, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>');
            }

            html += `
                <tr class="transition-colors border-b border-gray-100 last:border-none">
                    <td class="py-4 px-4 text-sm text-gray-500 whitespace-nowrap font-medium">${formattedDate}</td>
                    <td class="py-4 px-4">
                        <p class="font-bold text-gray-800 text-sm md:text-base">${noteDisplay}</p>
                        <p class="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                            <i class="fas ${pocket?.icon || "fa-folder"} text-[10px]"></i>
                            ${pocket?.name || "Kantong Dihapus"}
                        </p>
                    </td>
                    <td class="py-4 px-4 text-right font-bold whitespace-nowrap text-sm md:text-base ${isIncome ? "text-emerald-600" : "text-gray-800"}">
                        ${isIncome ? "+" : "-"} ${formatIDR(t.amount)}
                    </td>
                    <td class="py-4 px-4 text-center align-middle w-32">
                        <div class="flex justify-center items-center gap-2">
                            <button onclick="openTransactionModal('${t.id}')" class="w-9 h-9 flex items-center justify-center text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm" title="Edit">
                                <i class="fas fa-edit text-xs"></i>
                            </button>
                            <button onclick="deleteTransaction('${t.id}')" class="w-9 h-9 flex items-center justify-center text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm" title="Hapus">
                                <i class="fas fa-trash-alt text-xs"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    });

    body.innerHTML = html;
}

// ==============================
// STATS & CHART
// ==============================
function renderStats() {
    const statsGrid = document.getElementById("statsCards");

    let allTxs = transactions;
    if (activePocketId !== "all") {
        allTxs = allTxs.filter(t => t.pocketId === activePocketId);
    }

    const totalIn = allTxs.filter(t => t.type === "in").reduce((a, b) => a + b.amount, 0);
    const totalOut = allTxs.filter(t => t.type === "out").reduce((a, b) => a + b.amount, 0);
    const selisih = totalIn - totalOut;

    statsGrid.innerHTML = `
        <div class="glass p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
            <div class="absolute right-[-10px] top-[-10px] w-24 h-24 bg-emerald-50 rounded-full opacity-50"></div>
            <div class="absolute right-4 top-4 text-emerald-400 text-2xl"><i class="fas fa-arrow-down"></i></div>
            <p class="text-xs text-gray-500 font-bold uppercase mb-2 relative z-10 tracking-wide">Total Pemasukan</p>
            <p class="text-2xl font-bold text-emerald-600 relative z-10">${formatIDR(totalIn)}</p>
        </div>

        <div class="glass p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
            <div class="absolute right-[-10px] top-[-10px] w-24 h-24 bg-rose-50 rounded-full opacity-50"></div>
            <div class="absolute right-4 top-4 text-rose-400 text-2xl"><i class="fas fa-arrow-up"></i></div>
            <p class="text-xs text-gray-500 font-bold uppercase mb-2 relative z-10 tracking-wide">Total Pengeluaran</p>
            <p class="text-2xl font-bold text-rose-600 relative z-10">${formatIDR(totalOut)}</p>
        </div>

        <div class="${selisih >= 0 ? 'bg-indigo-600' : 'bg-rose-600'} p-5 rounded-3xl text-white shadow-lg relative overflow-hidden group">
            <div class="absolute right-[-10px] top-[-10px] w-24 h-24 bg-white/10 rounded-full"></div>
            <div class="absolute right-4 top-4 text-white/50 text-2xl"><i class="fas fa-wallet"></i></div>
            <p class="text-xs font-bold uppercase mb-2 relative z-10 tracking-wide opacity-90">Total Saldo Saat Ini</p>
            <p class="text-2xl font-bold relative z-10">${formatIDR(selisih)}</p>
        </div>
    `;
}

function renderChart() {
    const ctx = document.getElementById('balanceChart').getContext('2d');
    const positivePockets = pockets.filter(p => p.balance > 0);
    const totalPositiveBalance = positivePockets.reduce((sum, p) => sum + p.balance, 0);

    const labelsWithPercentage = positivePockets.map(p => {
        const percent = ((p.balance / totalPositiveBalance) * 100).toFixed(1);
        return `${p.name} (${percent}%)`;
    });
    const data = positivePockets.map(p => p.balance);

    if (balanceChartInstance) balanceChartInstance.destroy();

    if (data.length === 0) {
        // Pesan kontekstual: cek apakah ada kantong tapi semua negatif
        const hasNegative = pockets.some(p => p.balance < 0);
        const noTransactions = transactions.length === 0;

        let chartLabel = 'Belum ada saldo';
        if (hasNegative && !noTransactions) chartLabel = 'Saldo negatif';

        const chartEmpty = document.getElementById('chartEmptyMsg');
        if (chartEmpty) {
            chartEmpty.innerText = noTransactions
                ? 'Catat transaksi pertama Anda untuk melihat portofolio'
                : hasNegative
                    ? 'Semua kantong dalam kondisi minus'
                    : 'Belum ada saldo positif';
            chartEmpty.classList.remove('hidden');
        }

        balanceChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: [chartLabel], datasets: [{ data: [1], backgroundColor: ['#F3F4F6'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { tooltip: { enabled: false }, legend: { display: false } } }
        });
        return;
    }

    const chartEmpty = document.getElementById('chartEmptyMsg');
    if (chartEmpty) chartEmpty.classList.add('hidden');

    balanceChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labelsWithPercentage,
            datasets: [{ data, backgroundColor: chartColors.slice(0, data.length), borderWidth: 2, borderColor: '#ffffff', hoverOffset: 8 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: {
                legend: { position: 'right', labels: { usePointStyle: true, padding: 15, font: { family: 'Inter', size: 12, weight: '500' } } },
                tooltip: {
                    backgroundColor: 'rgba(255,255,255,0.95)', titleColor: '#374151', bodyColor: '#111827',
                    borderColor: '#E5E7EB', borderWidth: 1, padding: 12, boxPadding: 6,
                    titleFont: { family: 'Inter', size: 12, weight: '600' }, bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
                    callbacks: { label: (ctx) => ' ' + formatIDR(ctx.raw) }
                }
            }
        }
    });
}

// ==============================
// BOOT & SERVICE WORKER
// ==============================
function init() {
    renderIconPicker();
    initAmountInput();

    // Inisialisasi Flatpickr dengan kustomisasi penuh (tanpa disableMobile)
    flatpickrInstance = flatpickr("#txDate", {
        locale: {
            weekdays: {
                shorthand: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
                longhand: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
            },
            months: {
                shorthand: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"],
                longhand: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
            },
            firstDayOfWeek: 1
        },
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d F Y",
        disableMobile: false,
        onOpen: function (selectedDates, dateStr, instance) {
            instance.calendarContainer.style.zIndex = "9999";
            // Pastikan kalender tidak terpotong di kanan
            instance.calendarContainer.style.maxWidth = "calc(100vw - 32px)";
        },
        onChange: function () {
            if (flatpickrInstance && flatpickrInstance.altInput) {
                flatpickrInstance.altInput.classList.remove('input-error', 'animate-shake');
            }
        }
    });

    saveAndRefresh();
}

window.onload = () => {
    init();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(r => console.log('SW terdaftar:', r.scope))
            .catch(e => console.error('SW gagal:', e));
    }
};

// ==============================
// OBFUSCATION SAFETY NET
// ==============================
window.changeYear = changeYear;
window.toggleModal = toggleModal;
window.togglePocketModal = togglePocketModal;
window.openTransactionModal = openTransactionModal;
window.exportData = exportData;
window.importData = importData;
window.addPocket = addPocket;
window.setTxType = setTxType;
window.toggleCustomSelect = toggleCustomSelect;
window.selectCustomPocket = selectCustomPocket;
window.saveTransaction = saveTransaction;
window.selectIcon = selectIcon;
window.selectPocket = selectPocket;
window.deletePocket = deletePocket;
window.deleteTransaction = deleteTransaction;
window.togglePocketContextMenu = togglePocketContextMenu;
window.handleSearch = handleSearch;
window.clearSearch = clearSearch;
