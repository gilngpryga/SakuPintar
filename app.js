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
    { id: "p3", name: "Jajan", icon: "fa-hamburger", balance: 0 }
];
let transactions = JSON.parse(localStorage.getItem("saku_transactions")) || [];

let activePocketId = "all";
let activeTxType = "in";
let editingTxId = null;
let selectedIcon = pocketIcons[0];
let balanceChartInstance = null; 

let currentYear = new Date().getFullYear();
let availableYears = []; 

// ==============================
// UTILITIES
// ==============================
function formatIDR(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
}

function generateId(prefix) {
    return prefix + '_' + Math.random().toString(36).substr(2, 9);
}

function getMonthName(monthIndex) {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return months[monthIndex];
}

function setCurrentDateInForm() {
    const dateInput = document.getElementById("txDate");
    if (dateInput) {
        const now = new Date();
        if(now.getFullYear() === currentYear){
             dateInput.value = now.toISOString().split("T")[0];
        } else {
             const customDate = new Date(currentYear, 0, 2); 
             dateInput.value = customDate.toISOString().split("T")[0];
        }
    }
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
    document.getElementById("prevYearBtn").disabled = idx <= 0;
    document.getElementById("nextYearBtn").disabled = idx >= availableYears.length - 1;
    document.getElementById("yearDisplay").innerText = `Tahun ${currentYear}`;
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
    const dataToExport = {
        pockets: pockets,
        transactions: transactions,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport));
    const downloadAnchorNode = document.createElement('a');
    
    const date = new Date();
    const dateString = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `SakuPintar_Backup_${dateString}.json`);
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    showToast("Data berhasil diekspor!", "success");
    toggleModal('settingsModal');
}

async function importData(event) {
    // 1. Simpan referensi input dan file secara langsung agar tidak hilang saat proses 'await'
    const inputElement = event.target;
    const file = inputElement.files[0];
    
    if (!file) return;

    const confirmData = await customConfirm(
        "Peringatan Timpa Data!", 
        "Mengimpor data ini akan MENGHAPUS seluruh data Anda saat ini. Anda yakin?"
    );

    if (confirmData) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if(importedData.pockets && importedData.transactions) {
                    pockets = importedData.pockets;
                    transactions = importedData.transactions;
                    
                    // Kembalikan view ke "Semua Kantong" agar tidak error jika ID kantong lama terhapus
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
            
            // 2. Reset input file setelah semua proses selesai
            inputElement.value = '';
        };
        reader.readAsText(file);
    } else {
        // Reset input file jika pengguna menekan "Batal"
        inputElement.value = '';
    }
}

// ==============================
// CUSTOM DROPDOWN SELECT
// ==============================
function populateCustomPocketSelect() {
    const menu = document.getElementById("customPocketSelectMenu");
    if(!menu) return;
    
    if(pockets.length === 0){
        menu.innerHTML = '<div class="p-4 text-center text-sm text-gray-500 font-medium">Buat Kantong Terlebih Dahulu</div>';
        return;
    }

    menu.innerHTML = pockets.map(p => `
        <div onclick="selectCustomPocket('${p.id}')" class="flex items-center justify-between p-3.5 hover:bg-indigo-50/80 cursor-pointer transition-colors border-b border-gray-50 last:border-none group rounded-xl">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 flex items-center justify-center transition-colors shadow-sm">
                    <i class="fas ${p.icon} text-[13px]"></i>
                </div>
                <span class="font-bold text-gray-700 text-sm group-hover:text-indigo-900 transition-colors">${p.name}</span>
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
    
    setTimeout(() => {
        menu.classList.add("hidden");
    }, 200);
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

document.addEventListener('click', function(event) {
    const container = document.getElementById('customPocketSelectContainer');
    if (container && !container.contains(event.target)) {
        closeCustomSelect();
    }
});

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

        btnOk.onclick = () => {
            closeModal();
            resolve(true);
        };

        btnCancel.onclick = () => {
            closeModal();
            resolve(false);
        };
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
        error:   { icon: 'fa-exclamation', bg: 'bg-rose-100', color: 'text-rose-600' },
        warning: { icon: 'fa-exclamation-triangle', bg: 'bg-amber-100', color: 'text-amber-600' },
        info:    { icon: 'fa-info', bg: 'bg-blue-100', color: 'text-blue-600' }
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

document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => input.classList.remove('input-error'));
});

function markInvalidInput(inputElement) {
    inputElement.classList.add('input-error', 'animate-shake');
    setTimeout(() => inputElement.classList.remove('animate-shake'), 300);
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
        btnOut.className = "py-2.5 rounded-xl font-bold transition-all text-gray-500 hover:text-gray-700 border border-transparent";
    } else {
        btnOut.className = "py-2.5 rounded-xl font-bold transition-all bg-white text-rose-600 shadow-sm border border-gray-200/50";
        btnIn.className = "py-2.5 rounded-xl font-bold transition-all text-gray-500 hover:text-gray-700 border border-transparent";
    }
}

function renderIconPicker() {
    const wrap = document.getElementById("iconPicker");
    if (!wrap) return;
    wrap.innerHTML = pocketIcons.map(icon => `
        <button type="button" onclick="selectIcon('${icon}')"
            class="w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all duration-200 outline-none
            ${icon === selectedIcon ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300'}">
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
    renderPockets();
    renderStats();
    renderTransactions();
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
    if(th) th.innerText = `Total Saldo: ${formatIDR(totalBalance)}`;

    let html = `
        <div onclick="selectPocket('all')" class="p-3 rounded-2xl cursor-pointer border-2 transition-all ${activePocketId === "all" ? "border-indigo-600 bg-indigo-50/50 shadow-sm" : "border-gray-100 hover:border-gray-300 bg-white"}">
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
            <div class="flex items-center gap-2 p-3 rounded-2xl cursor-pointer border-2 transition-all ${isActive ? "border-indigo-600 bg-indigo-50/50 shadow-sm" : "border-gray-100 hover:border-gray-300 bg-white"}" onclick="selectPocket('${p.id}')">
                <div class="w-12 h-12 ${isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-indigo-50 text-indigo-600"} flex-shrink-0 flex items-center justify-center rounded-xl transition-all">
                    <i class="fas ${p.icon} text-lg"></i>
                </div>
                <div class="flex-1 overflow-hidden">
                    <p class="text-sm font-bold text-gray-800 truncate">${p.name}</p>
                    <p class="text-xs ${p.balance < 0 ? 'text-rose-500' : 'text-gray-500'} font-semibold">${formatIDR(p.balance)}</p>
                </div>
                <button onclick="event.stopPropagation(); deletePocket('${p.id}')" class="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm flex-shrink-0" title="Hapus Kantong">
                    <i class="fas fa-trash-alt text-xs"></i>
                </button>
            </div>
        `;
    });
    list.innerHTML = html;
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
        document.getElementById("txAmount").value = tx.amount;
        document.getElementById("txNote").value = tx.note;
        document.getElementById("txDate").value = tx.date;
        
        selectCustomPocket(tx.pocketId);
        setTxType(tx.type);
    } else {
        editingTxId = null;
        title.innerText = "Tambah Transaksi";
        document.getElementById("txForm").reset();
        setCurrentDateInForm();
        setTxType("in");
        
        if(activePocketId !== "all") {
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

    const amount = parseFloat(amountInput.value);
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
    if(activePocketId !== "all") {
        filtered = filtered.filter(t => t.pocketId === activePocketId);
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!filtered.length) {
        body.innerHTML = "";
        empty.classList.remove("hidden");
        return;
    }

    empty.classList.add("hidden");

    const groupedTxs = {};
    filtered.forEach(t => {
        const monthIdx = new Date(t.date).getMonth();
        if(!groupedTxs[monthIdx]) groupedTxs[monthIdx] = [];
        groupedTxs[monthIdx].push(t);
    });

    let html = '';
    const sortedMonths = Object.keys(groupedTxs).sort((a,b) => b - a);

    sortedMonths.forEach(monthIdx => {
        const monthName = getMonthName(monthIdx);
        
        html += `
            <tr class="bg-indigo-50/50 border-y border-indigo-100">
                <td colspan="4" class="py-3 px-4 text-xs font-bold text-indigo-800 uppercase tracking-widest">
                    <i class="fas fa-calendar-alt mr-2"></i> Bulan ${monthName}
                </td>
            </tr>
        `;

        groupedTxs[monthIdx].forEach(t => {
            const pocket = pockets.find(p => p.id === t.pocketId);
            const isIncome = t.type === "in";
            const dateObj = new Date(t.date);
            const formattedDate = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

            html += `
                <tr class="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-none">
                    <td class="py-4 px-4 text-sm text-gray-500 whitespace-nowrap font-medium">
                        ${formattedDate}
                    </td>
                    <td class="py-4 px-4">
                        <p class="font-bold text-gray-800 text-sm md:text-base">${t.note}</p>
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
                            <button onclick="openTransactionModal('${t.id}')" class="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg border border-gray-200 hover:border-indigo-200 transition-colors shadow-sm" title="Edit">
                                <i class="fas fa-edit text-xs"></i>
                            </button>
                            <button onclick="deleteTransaction('${t.id}')" class="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg border border-gray-200 hover:border-rose-200 transition-colors shadow-sm" title="Hapus">
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
    if(activePocketId !== "all"){
        allTxs = allTxs.filter(t => t.pocketId === activePocketId);
    }

    const totalIn = allTxs.filter(t => t.type === "in").reduce((a, b) => a + b.amount, 0);
    const totalOut = allTxs.filter(t => t.type === "out").reduce((a, b) => a + b.amount, 0);
    const selisih = totalIn - totalOut;

    statsGrid.innerHTML = `
        <div class="glass p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
            <div class="absolute right-[-10px] top-[-10px] w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
            <div class="absolute right-4 top-4 text-emerald-400 text-2xl"><i class="fas fa-arrow-down"></i></div>
            <p class="text-xs text-gray-500 font-bold uppercase mb-2 relative z-10 tracking-wide">Total Pemasukan</p>
            <p class="text-2xl font-bold text-emerald-600 relative z-10">${formatIDR(totalIn)}</p>
        </div>

        <div class="glass p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-rose-200 transition-colors">
            <div class="absolute right-[-10px] top-[-10px] w-24 h-24 bg-rose-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
            <div class="absolute right-4 top-4 text-rose-400 text-2xl"><i class="fas fa-arrow-up"></i></div>
            <p class="text-xs text-gray-500 font-bold uppercase mb-2 relative z-10 tracking-wide">Total Pengeluaran</p>
            <p class="text-2xl font-bold text-rose-600 relative z-10">${formatIDR(totalOut)}</p>
        </div>

        <div class="${selisih >= 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'} p-5 rounded-3xl text-white shadow-lg relative overflow-hidden transition-colors group">
            <div class="absolute right-[-10px] top-[-10px] w-24 h-24 bg-white/10 rounded-full group-hover:scale-110 transition-transform"></div>
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

    if (balanceChartInstance) { balanceChartInstance.destroy(); }

    if (data.length === 0) {
        balanceChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['Belum ada saldo'], datasets: [{ data: [1], backgroundColor: ['#F3F4F6'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { tooltip: { enabled: false }, legend: { display: false } } }
        });
        return;
    }

    balanceChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labelsWithPercentage,
            datasets: [{ data: data, backgroundColor: chartColors.slice(0, data.length), borderWidth: 2, borderColor: '#ffffff', hoverOffset: 8 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: {
                legend: { position: 'right', labels: { usePointStyle: true, padding: 15, font: { family: 'Inter', size: 12, weight: '500' } } },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', titleColor: '#374151', bodyColor: '#111827', borderColor: '#E5E7EB', borderWidth: 1, padding: 12, boxPadding: 6, titleFont: { family: 'Inter', size: 12, weight: '600' }, bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
                    callbacks: { 
                        label: function(context) { 
                            return ' ' + formatIDR(context.raw); 
                        } 
                    }
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
    saveAndRefresh(); 
}

window.onload = () => {
    init();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('Service Worker terdaftar dengan scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Pendaftaran Service Worker gagal:', error);
            });
    }
};

// ==============================
// OBFUSCATION SAFETY NET
// ==============================
// WAJIB ADA SAAT DIOBFUSCATE AGAR HTML BISA MENGAKSES FUNGSI INI
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
