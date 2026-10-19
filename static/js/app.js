// =============================================
// MEKASUR - app.js
// Sistem Surat HIMAMEKA UTM (Versi Statis)
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    // =========================================
    // DATA (from localStorage)
    // =========================================
    let suratData = JSON.parse(localStorage.getItem('suratData')) || [];
    let pendingData = JSON.parse(localStorage.getItem('pendingData')) || [];
    let currentRole = localStorage.getItem('userRole') || 'viewer';

    // =========================================
    // APPLY INITIAL ROLE
    // =========================================
    document.body.className = `role-${currentRole}`;
    const displayEl = document.getElementById('current-role-display');
    if (displayEl) displayEl.textContent = `Anda masuk sebagai: ${currentRole.toUpperCase()}`;

    // =========================================
    // HELPER: UPDATE VIEWER NOTICE
    // =========================================
    const updateViewerNotice = () => {
        const notice = document.getElementById('viewer-notice');
        const btnGenerate = document.getElementById('btn-generate');
        if (!notice) return;
        if (currentRole === 'viewer') {
            notice.classList.remove('hidden');
            if (btnGenerate) btnGenerate.textContent = '📨 Kirim Permintaan Nomor Surat';
        } else {
            notice.classList.add('hidden');
            if (btnGenerate) btnGenerate.textContent = 'Generate Nomor Surat';
        }
    };

    // =========================================
    // HELPER: UPDATE PENDING BADGE
    // =========================================
    const updatePendingBadge = () => {
        const count = pendingData.filter(p => p.status === 'pending').length;
        const badge = document.getElementById('pending-badge');
        if (badge) {
            badge.textContent = count;
            count > 0 ? badge.classList.remove('hidden') : badge.classList.add('hidden');
        }
        const badgeNav = document.getElementById('pending-badge-nav');
        if (badgeNav) {
            count > 0 ? badgeNav.classList.remove('hidden') : badgeNav.classList.add('hidden');
        }
    };

    // =========================================
    // HELPER: GENERATE NOMOR SURAT
    // =========================================
    const generateNomorSurat = (lingkup, jenis, isKepanitiaan, namaKegiatan, tanggalStr) => {
        const count = suratData.length + 1;
        const paddedCount = String(count).padStart(3, '0');
        const dateObj = new Date(tanggalStr);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        const romawiMonths = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
        const romawi = romawiMonths[month - 1];
        let panpelPart = "";
        if (isKepanitiaan && namaKegiatan) {
            panpelPart = `/Panpel${namaKegiatan.replace(/\s+/g, '')}`;
        }
        return `${paddedCount}/${lingkup}/${jenis}${panpelPart}/HIMAMEKA/KM-UTM/${romawi}/${year}`;
    };

    // =========================================
    // SET ROLE (exposed globally for onclick)
    // =========================================
    window.setRole = (role) => {
        currentRole = role;
        localStorage.setItem('userRole', role);
        document.body.className = `role-${role}`;
        const display = document.getElementById('current-role-display');
        if (display) display.textContent = `Anda masuk sebagai: ${role.toUpperCase()}`;

        // Re-render affected sections
        updateViewerNotice();
        renderTemplates();
        renderPendingTable();
        updatePendingBadge();

        // Navigate to Ambil Nomor
        const btnAmbil = document.querySelector('[data-target="ambil-nomor"]');
        if (btnAmbil) btnAmbil.click();
    };

    // =========================================
    // SHOW ADMIN LOGIN (exposed globally for onclick)
    // =========================================
    window.showAdminLogin = () => {
        const modal = document.getElementById('admin-login-modal');
        if (modal) modal.classList.remove('hidden');
    };

    // =========================================
    // NAVIGATION
    // =========================================
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.add('hidden'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');

            if (targetId === 'rekap-surat') {
                renderTable();
                renderPendingTable();
                updatePendingBadge();
            }
            if (targetId === 'template-surat') {
                renderTemplates();
                showKopWarningModal();
            }
            if (targetId === 'ambil-nomor') {
                updateViewerNotice();
            }
        });
    });

    // =========================================
    // LOGOUT
    // =========================================
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin logout dari akun Admin?')) {
                currentRole = 'viewer';
                localStorage.setItem('userRole', 'viewer');
                document.body.className = 'role-viewer';
                const display = document.getElementById('current-role-display');
                if (display) display.textContent = 'Anda masuk sebagai: VIEWER';
                updateViewerNotice();
                renderTemplates();
                renderPendingTable();
                updatePendingBadge();
                const btnHome = document.querySelector('[data-target="homescreen"]');
                if (btnHome) btnHome.click();
            }
        });
    }

    // =========================================
    // TAB SWITCHER (Rekap Surat)
    // =========================================
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            btn.classList.add('active');
            const tabTarget = btn.getAttribute('data-tab');
            document.getElementById(tabTarget).classList.remove('hidden');
        });
    });

    // =========================================
    // REKAP SURAT — APPROVED TABLE
    // =========================================
    const tableBody = document.querySelector('#table-rekap tbody');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const filterJenis = document.getElementById('filter-jenis');

    const renderTable = (dataToRender = suratData) => {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        if (dataToRender.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
        } else {
            if (emptyState) emptyState.classList.add('hidden');
            dataToRender.forEach((surat) => {
                const actualIndex = suratData.indexOf(surat);
                const kepanitiaanDisplay = surat.isKepanitiaan ? (surat.namaKegiatan || '✓') : '-';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${surat.nomor}</strong></td>
                    <td>${surat.tanggal}</td>
                    <td>${surat.jenis}</td>
                    <td>${kepanitiaanDisplay}</td>
                    <td>${surat.tujuan}</td>
                    <td>${surat.perihal}</td>
                    <td class="admin-only">
                        <div style="display:flex;gap:5px;">
                            <button class="btn btn-blue" style="padding:5px 10px;font-size:0.8rem;" onclick="editSurat(${actualIndex})">Edit</button>
                            <button class="btn btn-yellow" style="padding:5px 10px;font-size:0.8rem;" onclick="hapusSurat(${actualIndex})">Hapus</button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }
    };

    const filterTable = () => {
        const term = searchInput ? searchInput.value.toLowerCase() : '';
        const val = filterJenis ? filterJenis.value : '';
        const filtered = suratData.filter(s => {
            const matchSearch = s.perihal.toLowerCase().includes(term) || s.tujuan.toLowerCase().includes(term);
            const matchFilter = val === '' || s.jenis === val;
            return matchSearch && matchFilter;
        });
        renderTable(filtered);
    };

    if (searchInput) searchInput.addEventListener('input', filterTable);
    if (filterJenis) filterJenis.addEventListener('change', filterTable);

    // =========================================
    // HAPUS & EDIT SURAT (Admin Only)
    // =========================================
    window.hapusSurat = (index) => {
        if (currentRole !== 'admin') { alert('Hanya Admin yang dapat menghapus surat!'); return; }
        if (confirm('Apakah Anda yakin ingin menghapus data surat ini?')) {
            suratData.splice(index, 1);
            localStorage.setItem('suratData', JSON.stringify(suratData));
            filterTable();
        }
    };

    const editModal = document.getElementById('edit-modal');
    const formEditSurat = document.getElementById('form-edit-surat');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');

    window.editSurat = (index) => {
        if (currentRole !== 'admin') return;
        const surat = suratData[index];
        if (!surat) return;
        document.getElementById('edit-index').value = index;
        document.getElementById('edit-nomor').value = surat.nomor;
        document.getElementById('edit-tanggal').value = surat.tanggal;
        document.getElementById('edit-tujuan').value = surat.tujuan;
        document.getElementById('edit-perihal').value = surat.perihal;
        if (editModal) editModal.classList.remove('hidden');
    };

    if (btnCancelEdit) btnCancelEdit.addEventListener('click', () => editModal.classList.add('hidden'));
    if (formEditSurat) {
        formEditSurat.addEventListener('submit', (e) => {
            e.preventDefault();
            if (currentRole !== 'admin') return;
            const idx = parseInt(document.getElementById('edit-index').value);
            suratData[idx].tanggal = document.getElementById('edit-tanggal').value;
            suratData[idx].tujuan = document.getElementById('edit-tujuan').value;
            suratData[idx].perihal = document.getElementById('edit-perihal').value;
            localStorage.setItem('suratData', JSON.stringify(suratData));
            editModal.classList.add('hidden');
            filterTable();
        });
    }

    // =========================================
    // REKAP SURAT — PENDING TABLE
    // =========================================
    const pendingTableBody = document.querySelector('#table-pending tbody');
    const emptyStatePending = document.getElementById('empty-state-pending');

    const renderPendingTable = () => {
        if (!pendingTableBody) return;
        pendingTableBody.innerHTML = '';

        if (pendingData.length === 0) {
            if (emptyStatePending) emptyStatePending.classList.remove('hidden');
            updatePendingBadge();
            return;
        }

        if (emptyStatePending) emptyStatePending.classList.add('hidden');

        pendingData.forEach((surat, index) => {
            const kepanitiaanDisplay = surat.isKepanitiaan ? (surat.namaKegiatan || '✓') : '-';

            let statusBadge;
            let followUpBtn = '';
            if (surat.status === 'pending') {
                statusBadge = '<span class="status-badge badge-pending">⏳ MENUNGGU</span>';
                // Tombol Follow Up WA ke admin
                const adminPhone = (contactsData[0]?.phone || '').replace(/^0/, '62');
                if (adminPhone) {
                    const msg = encodeURIComponent(
                        `Halo Admin MEKASUR,\n\nSaya ingin menindaklanjuti permintaan nomor surat saya:\n\n` +
                        `📅 Tanggal   : ${surat.tanggal}\n` +
                        `📄 Jenis     : ${surat.jenis}\n` +
                        `🎯 Tujuan    : ${surat.tujuan}\n` +
                        `📝 Perihal   : ${surat.perihal}\n\n` +
                        `Mohon kiranya dapat segera disetujui. Terima kasih! 🙏`
                    );
                    followUpBtn = `<a href="https://wa.me/${adminPhone}?text=${msg}" target="_blank"
                        class="btn btn-blue follow-up-btn" title="Follow Up ke Admin via WhatsApp">
                        📲 Follow Up Admin
                    </a>`;
                }
            } else if (surat.status === 'approved') {
                statusBadge = `<span class="status-badge badge-approved">✅ DISETUJUI</span><br><small style="font-size:0.75rem;word-break:break-all;">${surat.nomor || ''}</small>`;
            } else {
                statusBadge = '<span class="status-badge badge-rejected">❌ DITOLAK</span>';
                // Bisa follow up juga jika ditolak
                const adminPhone = (contactsData[0]?.phone || '').replace(/^0/, '62');
                if (adminPhone) {
                    const msg = encodeURIComponent(
                        `Halo Admin MEKASUR,\n\nPermintaan nomor surat saya sebelumnya ditolak. Boleh saya mohon klarifikasi atau pengajuan ulang?\n\n` +
                        `📅 Tanggal   : ${surat.tanggal}\n` +
                        `📄 Jenis     : ${surat.jenis}\n` +
                        `🎯 Tujuan    : ${surat.tujuan}\n` +
                        `📝 Perihal   : ${surat.perihal}\n\nTerima kasih! 🙏`
                    );
                    followUpBtn = `<a href="https://wa.me/${adminPhone}?text=${msg}" target="_blank"
                        class="btn btn-yellow follow-up-btn" title="Tanyakan ke Admin via WhatsApp">
                        💬 Tanya Admin
                    </a>`;
                }
            }

            let actionCell = '-';
            if (currentRole === 'admin' && surat.status === 'pending') {
                actionCell = `
                    <div style="display:flex;gap:5px;flex-wrap:wrap;">
                        <button class="btn btn-blue" style="padding:5px 10px;font-size:0.8rem;" onclick="approveSurat(${index})">✅ Setujui</button>
                        <button class="btn btn-yellow" style="padding:5px 10px;font-size:0.8rem;" onclick="rejectSurat(${index})">❌ Tolak</button>
                    </div>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${surat.tanggal}</td>
                <td>${surat.lingkup}</td>
                <td>${surat.jenis}</td>
                <td>${kepanitiaanDisplay}</td>
                <td>${surat.tujuan}</td>
                <td>${surat.perihal}</td>
                <td>
                    ${statusBadge}
                    ${followUpBtn ? `<div style="margin-top:8px;">${followUpBtn}</div>` : ''}
                </td>
                <td class="admin-only">${actionCell}</td>
            `;
            pendingTableBody.appendChild(tr);
        });

        updatePendingBadge();
    };

    // =========================================
    // APPROVE & REJECT SURAT
    // =========================================
    window.approveSurat = (index) => {
        if (currentRole !== 'admin') return;
        const pending = pendingData[index];
        if (!pending || pending.status !== 'pending') return;

        const nomor = generateNomorSurat(
            pending.lingkup, pending.jenis,
            pending.isKepanitiaan, pending.namaKegiatan,
            pending.tanggal
        );

        suratData.push({
            nomor, tanggal: pending.tanggal, lingkup: pending.lingkup,
            jenis: pending.jenis, isKepanitiaan: pending.isKepanitiaan,
            namaKegiatan: pending.namaKegiatan, tujuan: pending.tujuan,
            perihal: pending.perihal
        });
        localStorage.setItem('suratData', JSON.stringify(suratData));

        pendingData[index].status = 'approved';
        pendingData[index].nomor = nomor;
        localStorage.setItem('pendingData', JSON.stringify(pendingData));

        renderPendingTable();
        filterTable();
        alert(`✅ Nomor surat berhasil disetujui!\n\nNomor: ${nomor}`);
    };

    window.rejectSurat = (index) => {
        if (currentRole !== 'admin') return;
        if (!confirm('Apakah Anda yakin ingin MENOLAK permintaan nomor surat ini?')) return;
        pendingData[index].status = 'rejected';
        localStorage.setItem('pendingData', JSON.stringify(pendingData));
        renderPendingTable();
    };

    // =========================================
    // FORM GENERATE NOMOR SURAT
    // =========================================
    const formSurat = document.getElementById('form-surat');
    const resultModal = document.getElementById('result-modal');
    const generatedNumberEl = document.getElementById('generated-number');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const btnCloseResult = document.getElementById('btn-close-result');
    const btnCopyResult = document.getElementById('btn-copy-result');
    const isKepanitiaanCb = document.getElementById('is-kepanitiaan');
    const kegiatanGroup = document.getElementById('kegiatan-group');
    const namaKegiatanInput = document.getElementById('nama-kegiatan');

    if (isKepanitiaanCb) {
        isKepanitiaanCb.addEventListener('change', (e) => {
            if (e.target.checked) {
                kegiatanGroup.classList.remove('hidden');
                namaKegiatanInput.setAttribute('required', 'true');
            } else {
                kegiatanGroup.classList.add('hidden');
                namaKegiatanInput.removeAttribute('required');
                namaKegiatanInput.value = '';
            }
        });
    }

    if (formSurat) {
        formSurat.addEventListener('submit', (e) => {
            e.preventDefault();
            const tanggal = document.getElementById('tanggal').value;
            const lingkup = document.getElementById('lingkup').value;
            const jenis = document.getElementById('jenis').value;
            const tujuan = document.getElementById('tujuan').value;
            const perihal = document.getElementById('perihal').value;
            const isKepanitiaan = isKepanitiaanCb ? isKepanitiaanCb.checked : false;
            const namaKegiatan = namaKegiatanInput ? namaKegiatanInput.value : '';

            if (currentRole === 'admin') {
                // Admin: langsung generate & simpan
                const nomorSurat = generateNomorSurat(lingkup, jenis, isKepanitiaan, namaKegiatan, tanggal);
                suratData.push({ nomor: nomorSurat, tanggal, lingkup, jenis, isKepanitiaan, namaKegiatan, tujuan, perihal });
                localStorage.setItem('suratData', JSON.stringify(suratData));

                if (resultTitle) resultTitle.textContent = '✅ Nomor Surat Anda:';
                if (generatedNumberEl) { generatedNumberEl.textContent = nomorSurat; generatedNumberEl.style.display = 'inline-block'; }
                if (resultMessage) resultMessage.innerHTML = 'Surat telah otomatis tersimpan di menu <strong>Rekap Surat</strong>.';
                if (btnCopyResult) btnCopyResult.classList.remove('hidden');
                if (resultModal) resultModal.classList.remove('hidden');
                filterTable();

            } else {
                // Viewer: simpan ke pending, tampilkan toast kecil
                const newPending = { tanggal, lingkup, jenis, isKepanitiaan, namaKegiatan, tujuan, perihal, status: 'pending', submittedAt: new Date().toLocaleString('id-ID') };
                pendingData.push(newPending);
                localStorage.setItem('pendingData', JSON.stringify(pendingData));

                // Isi detail di toast
                const toastDetail = document.getElementById('toast-detail');
                if (toastDetail) {
                    toastDetail.innerHTML = `
                        <div><strong>Jenis:</strong> ${jenis}</div>
                        <div><strong>Tujuan:</strong> ${tujuan}</div>
                        <div><strong>Perihal:</strong> ${perihal}</div>
                        <div><strong>Tanggal:</strong> ${tanggal}</div>
                    `;
                }

                // Tampilkan toast
                const toast = document.getElementById('submit-toast');
                if (toast) toast.classList.remove('hidden');
                updatePendingBadge();
            }

            // Reset form
            formSurat.reset();
            if (kegiatanGroup) kegiatanGroup.classList.add('hidden');
            if (namaKegiatanInput) namaKegiatanInput.removeAttribute('required');
        });
    }

    if (btnCloseResult) {
        btnCloseResult.addEventListener('click', () => {
            if (resultModal) resultModal.classList.add('hidden');
            if (generatedNumberEl) generatedNumberEl.style.display = 'inline-block';
        });
    }

    if (btnCopyResult) {
        btnCopyResult.addEventListener('click', () => {
            if (!generatedNumberEl) return;
            navigator.clipboard.writeText(generatedNumberEl.textContent).then(() => {
                const orig = btnCopyResult.textContent;
                btnCopyResult.textContent = '✅ Tersalin!';
                setTimeout(() => { btnCopyResult.textContent = orig; }, 2000);
            });
        });
    }

    // =========================================
    // TEMPLATE LOGIC
    // =========================================
    const templateContainer = document.getElementById('template-container');
    const btnTambahTemplate = document.getElementById('btn-tambah-template');
    const templateModal = document.getElementById('template-modal');
    const formTambahTemplate = document.getElementById('form-tambah-template');
    const btnCancelTemplate = document.getElementById('btn-cancel-template');

    const defaultTemplates = [
        { nama: 'Surat Tugas', desc: 'Format standar untuk penugasan pengurus/anggota keluar.', url: 'templates/Surat_Tugas.rtf', fileName: 'Surat_Tugas.rtf', icon: '📋', fileSize: null },
        { nama: 'Surat Undangan', desc: 'Template undangan resmi untuk keperluan internal maupun eksternal.', url: 'templates/Surat_Undangan.rtf', fileName: 'Surat_Undangan.rtf', icon: '✉️', fileSize: null },
        { nama: 'Surat Keterangan', desc: 'Format baku untuk menerbitkan surat keterangan organisasi.', url: 'templates/Surat_Keterangan.rtf', fileName: 'Surat_Keterangan.rtf', icon: '📝', fileSize: null }
    ];
    let templateData = JSON.parse(localStorage.getItem('templateData'));
    if (!templateData || templateData.length === 0) {
        templateData = defaultTemplates;
    }

    // =========================================
    // MODAL: PERINGATAN KOP SURAT (WINDOW TENGAH OTOMATIS)
    // =========================================
    const DEFAULT_KOP_WARNING = 'Sesuaikan KOP suratnya jangan Lupa (apabila surat dari panitia pelaksana maka beri keterangan PANITIA PELAKSANA "APA", jika bukan maka hapus tulisan "PANITIA PELAKSANA" pada KOP nya.';

    const getKopWarningText = () => {
        return localStorage.getItem('kop_reminder_text') || DEFAULT_KOP_WARNING;
    };

    const showKopWarningModal = () => {
        const modal = document.getElementById('kop-warning-modal');
        const textEl = document.getElementById('kop-warning-text');
        const inputEl = document.getElementById('kop-warning-input');
        const currentText = getKopWarningText();

        if (textEl) textEl.textContent = currentText;
        if (inputEl) inputEl.value = currentText;
        if (modal) modal.classList.remove('hidden');
    };

    const btnCloseKopWarning = document.getElementById('btn-close-kop-warning');
    const btnCloseKopWarningX = document.getElementById('btn-close-kop-warning-x');
    const btnOpenKopWarning = document.getElementById('btn-open-kop-warning');
    const btnSaveKopWarning = document.getElementById('btn-save-kop-warning');

    if (btnCloseKopWarning) {
        btnCloseKopWarning.addEventListener('click', () => {
            const modal = document.getElementById('kop-warning-modal');
            if (modal) modal.classList.add('hidden');
        });
    }
    if (btnCloseKopWarningX) {
        btnCloseKopWarningX.addEventListener('click', () => {
            const modal = document.getElementById('kop-warning-modal');
            if (modal) modal.classList.add('hidden');
        });
    }
    if (btnOpenKopWarning) {
        btnOpenKopWarning.addEventListener('click', () => {
            showKopWarningModal();
        });
    }
    if (btnSaveKopWarning) {
        btnSaveKopWarning.addEventListener('click', () => {
            const inputEl = document.getElementById('kop-warning-input');
            const textEl = document.getElementById('kop-warning-text');
            if (inputEl && inputEl.value.trim()) {
                const newText = inputEl.value.trim();
                localStorage.setItem('kop_reminder_text', newText);
                if (textEl) textEl.textContent = newText;
                btnSaveKopWarning.textContent = '✅ Perubahan Tersimpan!';
                setTimeout(() => {
                    btnSaveKopWarning.textContent = '💾 Simpan Perubahan Teks';
                }, 2000);
            }
        });
    }

    // -- Helpers --
    const getFileIcon = (fileName) => {
        const ext = (fileName || '').split('.').pop().toLowerCase();
        const icons = { pdf: '📕', doc: '📘', docx: '📘', rtf: '📓', txt: '📝' };
        return icons[ext] || '📄';
    };
    const getFileTypeBadge = (fileName) => {
        const ext = (fileName || '').split('.').pop().toUpperCase();
        return ext || 'FILE';
    };
    const formatFileSize = (bytes) => {
        if (!bytes) return '-';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    // -- File input preview --
    const fileInput = document.getElementById('template-file');
    if (fileInput) {
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            const dropZone = document.getElementById('file-drop-zone');
            const info = document.getElementById('file-selected-info');
            if (!file) return;

            const MAX_SIZE = 3 * 1024 * 1024; // 3MB
            if (file.size > MAX_SIZE) {
                alert(`⚠️ File terlalu besar! Maksimal 3 MB.\n\nFile Anda: ${formatFileSize(file.size)}`);
                fileInput.value = '';
                return;
            }

            // Show selected file info
            document.getElementById('file-selected-icon').textContent = getFileIcon(file.name);
            document.getElementById('file-selected-name').textContent = file.name;
            document.getElementById('file-selected-size').textContent = formatFileSize(file.size);
            if (info) info.style.display = 'block';
            if (dropZone) dropZone.style.background = '#eaffea';
        });
    }
    window.clearFileInput = () => {
        if (fileInput) fileInput.value = '';
        const info = document.getElementById('file-selected-info');
        if (info) info.style.display = 'none';
        const dropZone = document.getElementById('file-drop-zone');
        if (dropZone) dropZone.style.background = '#fafafa';
    };

    // -- View Template Modal --
    const viewTemplateModal = document.getElementById('view-template-modal');
    const btnCloseViewTemplate = document.getElementById('btn-close-view-template');
    let currentViewIndex = -1;

    // Helper: update KOP panpel line in preview
    const updateKopPreview = (isPanpel, panpelName) => {
        const line = document.getElementById('kop-panpel-line');
        if (!line) return;
        if (isPanpel && panpelName && panpelName.trim()) {
            line.textContent = `PANITIA PELAKSANA "${panpelName.trim().toUpperCase()}"`;
            line.style.display = 'block';
        } else {
            line.style.display = 'none';
            line.textContent = '';
        }
    };

    window.viewTemplate = (index) => {
        const tpl = templateData[index];
        if (!tpl) return;
        currentViewIndex = index;
        const icon = tpl.icon || getFileIcon(tpl.fileName);
        document.getElementById('view-template-icon').textContent = icon;
        document.getElementById('view-template-title').textContent = tpl.nama;
        document.getElementById('view-template-type-badge').textContent = getFileTypeBadge(tpl.fileName);
        document.getElementById('view-template-filename').textContent = tpl.fileName || '-';
        const sizeEl = document.getElementById('view-template-filesize');
        if (sizeEl) sizeEl.textContent = tpl.fileSize ? formatFileSize(tpl.fileSize) : 'File Bawaan';
        const dlLink = document.getElementById('view-template-download');
        if (dlLink) { dlLink.href = tpl.url; dlLink.setAttribute('download', tpl.fileName || 'template'); }

        // Desc
        const descEl = document.getElementById('view-template-desc');
        if (descEl) descEl.textContent = tpl.desc;

        // KOP preview
        updateKopPreview(tpl.isPanpel, tpl.panpelName);

        // Populate admin edit fields
        const editDesc = document.getElementById('edit-tpl-desc');
        const editPanpel = document.getElementById('edit-tpl-panpel');
        const editPanpelName = document.getElementById('edit-tpl-panpel-name');
        const panpelGroup = document.getElementById('panpel-name-group');
        if (editDesc) editDesc.value = tpl.desc || '';
        if (editPanpel) editPanpel.checked = !!tpl.isPanpel;
        if (editPanpelName) editPanpelName.value = tpl.panpelName || '';
        if (panpelGroup) panpelGroup.style.display = tpl.isPanpel ? 'block' : 'none';

        if (viewTemplateModal) viewTemplateModal.classList.remove('hidden');
    };

    // Panpel checkbox toggle
    const editPanpelCb = document.getElementById('edit-tpl-panpel');
    if (editPanpelCb) {
        editPanpelCb.addEventListener('change', () => {
            const group = document.getElementById('panpel-name-group');
            if (group) group.style.display = editPanpelCb.checked ? 'block' : 'none';
            // Live preview update
            const nameVal = document.getElementById('edit-tpl-panpel-name')?.value || '';
            updateKopPreview(editPanpelCb.checked, nameVal);
        });
    }
    const editPanpelNameInput = document.getElementById('edit-tpl-panpel-name');
    if (editPanpelNameInput) {
        editPanpelNameInput.addEventListener('input', () => {
            const isPanpel = document.getElementById('edit-tpl-panpel')?.checked;
            updateKopPreview(isPanpel, editPanpelNameInput.value);
        });
    }

    // Save admin edits to template
    const btnSaveTplInfo = document.getElementById('btn-save-tpl-info');
    if (btnSaveTplInfo) {
        btnSaveTplInfo.addEventListener('click', () => {
            if (currentRole !== 'admin' || currentViewIndex < 0) return;
            const newDesc = document.getElementById('edit-tpl-desc')?.value.trim();
            const isPanpel = document.getElementById('edit-tpl-panpel')?.checked;
            const panpelName = document.getElementById('edit-tpl-panpel-name')?.value.trim();
            if (!newDesc) { alert('Deskripsi tidak boleh kosong!'); return; }

            templateData[currentViewIndex].desc = newDesc;
            templateData[currentViewIndex].isPanpel = isPanpel;
            templateData[currentViewIndex].panpelName = isPanpel ? panpelName : '';

            localStorage.setItem('templateData', JSON.stringify(templateData));
            // Update desc display
            const descEl = document.getElementById('view-template-desc');
            if (descEl) descEl.textContent = newDesc;
            updateKopPreview(isPanpel, panpelName);
            renderTemplates();

            btnSaveTplInfo.textContent = '✅ Tersimpan!';
            setTimeout(() => { btnSaveTplInfo.textContent = '💾 Simpan Perubahan'; }, 2000);
        });
    }

    if (btnCloseViewTemplate) {
        btnCloseViewTemplate.addEventListener('click', () => {
            if (viewTemplateModal) viewTemplateModal.classList.add('hidden');
        });
    }

    // -- Render Templates --
    const renderTemplates = () => {
        if (!templateContainer) return;
        templateContainer.innerHTML = '';
        if (templateData.length === 0) {
            templateContainer.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:50px 20px;">
                    <div style="font-size:3rem; margin-bottom:15px;">📂</div>
                    <p style="font-weight:700; font-size:1.1rem; color:#555;">Belum ada template surat.</p>
                    <p style="color:#888; font-size:0.9rem;">Admin dapat menambahkan template menggunakan tombol di atas.</p>
                </div>`;
            return;
        }
        templateData.forEach((tpl, index) => {
            const div = document.createElement('div');
            div.className = 'card neo-card bg-cream template-card';
            div.style.position = 'relative';
            const icon = tpl.icon || getFileIcon(tpl.fileName);
            const typeBadge = getFileTypeBadge(tpl.fileName);
            const fileSizeStr = tpl.fileSize ? formatFileSize(tpl.fileSize) : 'Bawaan';
            const deleteBtn = (currentRole === 'admin') ? `
                <button onclick="hapusTemplate(${index})" title="Hapus Template"
                    style="position:absolute;top:10px;right:10px;background:#ff4d4d;color:white;border:2px solid black;border-radius:50%;width:30px;height:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.8rem;box-shadow:2px 2px 0px black;">
                    ✕
                </button>` : '';
            div.innerHTML = `
                ${deleteBtn}
                <div class="template-icon bg-yellow" style="font-size:2.5rem;">${icon}</div>
                <h3 style="margin:10px 0 6px; font-size:1rem;">${tpl.nama}</h3>
                <p style="font-size:0.85rem; color:#666; margin-bottom:10px; line-height:1.4;">${tpl.desc}</p>
                <div style="display:flex; gap:6px; margin-bottom:14px; flex-wrap:wrap;">
                    <span style="background:#eee; border:1.5px solid #333; border-radius:4px; padding:2px 8px; font-size:0.73rem; font-weight:700; font-family:monospace; letter-spacing:0.5px;">${typeBadge}</span>
                    <span style="background:#f0f0f0; border:1.5px solid #ccc; border-radius:4px; padding:2px 8px; font-size:0.73rem; color:#666;">💾 ${fileSizeStr}</span>
                </div>
                <button onclick="viewTemplate(${index})" class="btn btn-blue w-100" style="width:100%;">👁️ Lihat &amp; Unduh</button>
            `;
            templateContainer.appendChild(div);
        });
    };

    window.hapusTemplate = (index) => {
        if (currentRole !== 'admin') return;
        if (confirm('Apakah Anda yakin ingin menghapus template ini?')) {
            templateData.splice(index, 1);
            localStorage.setItem('templateData', JSON.stringify(templateData));
            renderTemplates();
        }
    };

    if (btnTambahTemplate) btnTambahTemplate.addEventListener('click', () => templateModal.classList.remove('hidden'));
    if (btnCancelTemplate) btnCancelTemplate.addEventListener('click', () => templateModal.classList.add('hidden'));

    if (formTambahTemplate) {
        formTambahTemplate.addEventListener('submit', (e) => {
            e.preventDefault();
            if (currentRole !== 'admin') return;
            const nama = document.getElementById('template-nama').value.trim();
            const desc = document.getElementById('template-desc').value.trim();
            const fileInput = document.getElementById('template-file');
            if (!nama || !desc) { alert('Nama dan Deskripsi wajib diisi!'); return; }
            if (!fileInput || fileInput.files.length === 0) { alert('Pilih file template terlebih dahulu!'); return; }

            const file = fileInput.files[0];
            const MAX_SIZE = 3 * 1024 * 1024;
            if (file.size > MAX_SIZE) {
                alert(`⚠️ File terlalu besar! Maksimal 3 MB.\nFile Anda: ${formatFileSize(file.size)}`);
                return;
            }

            const icon = getFileIcon(file.name);
            const reader = new FileReader();
            reader.onload = (event) => {
                templateData.push({ nama, desc, url: event.target.result, fileName: file.name, icon, fileSize: file.size });
                localStorage.setItem('templateData', JSON.stringify(templateData));
                formTambahTemplate.reset();
                window.clearFileInput();
                templateModal.classList.add('hidden');
                renderTemplates();
                alert(`✅ Template "${nama}" berhasil ditambahkan!`);
            };
            reader.readAsDataURL(file);
        });
    }

    // =========================================
    // TOAST: Close Handler
    // =========================================
    const submitToast = document.getElementById('submit-toast');
    const btnCloseToast = document.getElementById('btn-close-toast');

    window.closeToast = (e) => {
        // Tutup hanya jika klik backdrop (bukan isi box)
        if (e && e.target !== submitToast) return;
        if (submitToast) submitToast.classList.add('hidden');
    };

    if (btnCloseToast) {
        btnCloseToast.addEventListener('click', () => {
            if (submitToast) submitToast.classList.add('hidden');
        });
    }

    // =========================================
    // ADMIN LOGIN
    // =========================================
    const adminLoginForm = document.getElementById('form-admin-login');
    const btnCancelLogin = document.getElementById('btn-cancel-login');
    const adminLoginModal = document.getElementById('admin-login-modal');

    if (btnCancelLogin) btnCancelLogin.addEventListener('click', () => adminLoginModal.classList.add('hidden'));

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('admin-username').value.trim();
            const password = document.getElementById('admin-password').value;
            if (username === 'adminmekasur' && password === 'admin123') {
                adminLoginModal.classList.add('hidden');
                adminLoginForm.reset();
                setRole('admin'); // calls window.setRole defined above
            } else {
                alert('❌ Username atau Password salah!\n\nHint: adminmekasur / admin123');
            }
        });
    }

    // =========================================
    // CONTACT SETTINGS
    // =========================================
    const helpContactsContainer = document.getElementById('help-contacts-container');
    const btnEditContacts = document.getElementById('btn-edit-contacts');
    const contactSettingsModal = document.getElementById('contact-settings-modal');
    const btnCancelContact = document.getElementById('btn-cancel-contact');
    const formContactSettings = document.getElementById('form-contact-settings');

    const defaultContacts = [
        { name: 'Nopal', phone: '082229136632' },
        { name: 'Gita', phone: '081935135877' }
    ];
    let contactsData = JSON.parse(localStorage.getItem('helpContacts')) || defaultContacts;

    const renderContacts = () => {
        if (!helpContactsContainer) return;
        helpContactsContainer.innerHTML = '';
        contactsData.forEach((contact, index) => {
            const waNumber = contact.phone.replace(/^0/, '62');
            const link = document.createElement('a');
            link.href = `https://wa.me/${waNumber}`;
            link.target = '_blank';
            link.style.cssText = 'text-decoration:none;color:white;text-align:center;';
            const img = document.createElement('img');
            img.src = `assets/${index + 1}.png`;
            img.alt = `WA ${contact.name}`;
            img.style.cssText = 'width:50px;height:50px;object-fit:cover;border-radius:50%;border:2px solid white;display:block;margin:0 auto 5px;';
            const span = document.createElement('span');
            span.style.cssText = 'font-size:0.9rem;font-weight:bold;display:block;';
            span.textContent = contact.name;
            link.appendChild(img);
            link.appendChild(span);
            helpContactsContainer.appendChild(link);
        });
    };

    if (btnEditContacts) {
        btnEditContacts.addEventListener('click', () => {
            document.getElementById('contact1-name').value = contactsData[0]?.name || '';
            document.getElementById('contact1-phone').value = contactsData[0]?.phone || '';
            document.getElementById('contact2-name').value = contactsData[1]?.name || '';
            document.getElementById('contact2-phone').value = contactsData[1]?.phone || '';
            contactSettingsModal.classList.remove('hidden');
        });
    }
    if (btnCancelContact) btnCancelContact.addEventListener('click', () => contactSettingsModal.classList.add('hidden'));
    if (formContactSettings) {
        formContactSettings.addEventListener('submit', (e) => {
            e.preventDefault();
            contactsData = [
                { name: document.getElementById('contact1-name').value, phone: document.getElementById('contact1-phone').value },
                { name: document.getElementById('contact2-name').value, phone: document.getElementById('contact2-phone').value }
            ];
            localStorage.setItem('helpContacts', JSON.stringify(contactsData));
            contactSettingsModal.classList.add('hidden');
            renderContacts();
        });
    }

    // =========================================
    // INITIAL RENDER
    // =========================================
    renderTable();
    renderPendingTable();
    renderTemplates();
    renderContacts();
    updatePendingBadge();
    updateViewerNotice();

}); // END DOMContentLoaded
