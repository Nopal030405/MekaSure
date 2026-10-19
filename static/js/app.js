// Role Management globally accessible
let currentRole = localStorage.getItem('userRole') || 'viewer';

let updateViewerNoticeGlobal = () => {};
let updatePendingBadgeGlobal = () => {};
let renderPendingTableGlobal = () => {};
let filterTableGlobal = () => {};

window.setRole = (role) => {
    currentRole = role;
    localStorage.setItem('userRole', role);
    document.body.className = `role-${role}`;
    const display = document.getElementById('current-role-display');
    if(display) display.textContent = `Anda masuk sebagai: ${role.toUpperCase()}`;
    
    updateViewerNoticeGlobal();
    filterTableGlobal();
    renderPendingTableGlobal();
    updatePendingBadgeGlobal();

    // Switch to ambil nomor section
    const btnAmbil = document.querySelector('[data-target="ambil-nomor"]');
    if (btnAmbil) btnAmbil.click();
};

window.showAdminLogin = () => {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.classList.remove('hidden');
};

document.addEventListener('DOMContentLoaded', () => {
    // Apply initial role class
    document.body.className = `role-${currentRole}`;
    const display = document.getElementById('current-role-display');
    if(display) display.textContent = `Anda masuk sebagai: ${currentRole.toUpperCase()}`;

    // === Helper: Viewer Notice & Button Text ===
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
    updateViewerNoticeGlobal = updateViewerNotice;

    // === Navigation Logic ===
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.add('hidden'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.classList.remove('hidden');

            if (targetId === 'rekap-surat') {
                filterTable();
                renderPendingTable();
                updatePendingBadge();
            }
            if (targetId === 'ambil-nomor') {
                updateViewerNotice();
            }
            if (targetId === 'template-surat') {
                showKopWarningModal();
            }
        });
    });

    // === Modal: Peringatan Format KOP Surat (Window Tengah) ===
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

    // =========================================
    // TAB SWITCHER: REKAP SURAT
    // =========================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.add('hidden'));

            btn.classList.add('active');
            const targetEl = document.getElementById(targetTab);
            if (targetEl) targetEl.classList.remove('hidden');

            if (targetTab === 'tab-pending') renderPendingTable();
            if (targetTab === 'tab-semua') filterTable();
        });
    });

    // =========================================
    // DATA & TABLES
    // =========================================
    let suratData = [];
    let pendingData = [];

    const tableBody = document.querySelector('#table-rekap tbody');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const filterJenis = document.getElementById('filter-jenis');

    const pendingTableBody = document.querySelector('#table-pending tbody');
    const emptyStatePending = document.getElementById('empty-state-pending');

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
    updatePendingBadgeGlobal = updatePendingBadge;

    // Load Letters from Server
    const loadLetters = async () => {
        try {
            const res = await fetch('/api/letters');
            const allLetters = await res.json();
            // Separate approved vs pending/rejected
            suratData = allLetters.filter(l => l.status === 'approved' || (!l.status && l.nomor && !l.nomor.startsWith('REQ-')));
            pendingData = allLetters.filter(l => l.status === 'pending' || l.status === 'rejected' || (l.nomor && l.nomor.startsWith('REQ-')));
            filterTable();
            renderPendingTable();
            updatePendingBadge();
        } catch (err) {
            console.error("Gagal memuat data surat dari server:", err);
        }
    };

    // Render Table: Semua Surat (Approved)
    const renderTable = (dataToRender = suratData) => {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        if (dataToRender.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
        } else {
            if (emptyState) emptyState.classList.add('hidden');
            dataToRender.forEach((surat) => {
                const kepanitiaanDisplay = surat.isKepanitiaan ? (surat.namaKegiatan || '✓') : '-';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${surat.nomor}</strong></td>
                    <td>${surat.tanggal}</td>
                    <td>${surat.jenis}</td>
                    <td>${kepanitiaanDisplay}</td>
                    <td>${surat.tujuan}</td>
                    <td>${surat.perihal}</td>
                    <td><span class="status-badge badge-approved" style="background:#d4edda; color:#155724; border:2px solid #155724; padding:3px 8px; font-weight:700; font-size:0.75rem; border-radius:3px;">✅ DISETUJUI</span></td>
                    <td class="admin-only">
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-blue" style="padding: 5px 10px; font-size: 0.8rem;" onclick="editSurat(${surat.id})">Edit</button>
                            <button class="btn btn-yellow" style="padding: 5px 10px; font-size: 0.8rem;" onclick="hapusSurat(${surat.id})">Hapus</button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }
    };

    // Filter and Search Logic
    const filterTable = () => {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const filterVal = filterJenis ? filterJenis.value : '';

        const filteredData = suratData.filter(surat => {
            const matchSearch = (surat.perihal || '').toLowerCase().includes(searchTerm) || (surat.tujuan || '').toLowerCase().includes(searchTerm);
            const matchFilter = filterVal === "" || surat.jenis === filterVal;
            return matchSearch && matchFilter;
        });

        renderTable(filteredData);
    };
    filterTableGlobal = filterTable;

    if (searchInput) searchInput.addEventListener('input', filterTable);
    if (filterJenis) filterJenis.addEventListener('change', filterTable);

    // Render Table: Menunggu Persetujuan
    const renderPendingTable = () => {
        if (!pendingTableBody) return;
        pendingTableBody.innerHTML = '';

        if (pendingData.length === 0) {
            if (emptyStatePending) emptyStatePending.classList.remove('hidden');
            updatePendingBadge();
            return;
        }

        if (emptyStatePending) emptyStatePending.classList.add('hidden');

        pendingData.forEach((surat) => {
            const kepanitiaanDisplay = surat.isKepanitiaan ? (surat.namaKegiatan || '✓') : '-';

            let statusBadge = '';
            let followUpBtn = '';
            if (surat.status === 'pending') {
                statusBadge = '<span class="status-badge badge-pending" style="background:#fff3cd; color:#856404; border:2px solid #856404; padding:3px 8px; font-weight:700; font-size:0.75rem; border-radius:3px;">⏳ MENUNGGU</span>';
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
                        style="display:inline-block; margin-top:5px; background:#25d366; color:white; padding:3px 8px; border-radius:3px; font-size:0.75rem; text-decoration:none; font-weight:bold; border:1px solid #128c7e;">
                        💬 Hubungi Admin
                    </a>`;
                }
            } else if (surat.status === 'approved') {
                statusBadge = `<span class="status-badge badge-approved" style="background:#d4edda; color:#155724; border:2px solid #155724; padding:3px 8px; font-weight:700; font-size:0.75rem; border-radius:3px;">✅ DISETUJUI: <strong>${surat.nomor}</strong></span>`;
            } else if (surat.status === 'rejected') {
                statusBadge = '<span class="status-badge badge-rejected" style="background:#f8d7da; color:#721c24; border:2px solid #721c24; padding:3px 8px; font-weight:700; font-size:0.75rem; border-radius:3px;">❌ DITOLAK</span>';
            }

            let actionCell = '<span style="font-size:0.8rem; color:#777;">Selesai</span>';
            if (surat.status === 'pending') {
                actionCell = `
                    <div style="display:flex; gap:5px; flex-wrap:wrap;">
                        <button class="btn btn-blue" style="padding:5px 10px; font-size:0.8rem;" onclick="approveSurat(${surat.id})">✅ Setujui</button>
                        <button class="btn btn-yellow" style="padding:5px 10px; font-size:0.8rem;" onclick="rejectSurat(${surat.id})">❌ Tolak</button>
                    </div>
                `;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${surat.tanggal}</td>
                <td>${surat.lingkup || '-'}</td>
                <td>${surat.jenis}</td>
                <td>${kepanitiaanDisplay}</td>
                <td>${surat.tujuan}</td>
                <td>${surat.perihal}</td>
                <td>
                    ${statusBadge}
                    ${followUpBtn ? `<div>${followUpBtn}</div>` : ''}
                </td>
                <td class="admin-only">${actionCell}</td>
            `;
            pendingTableBody.appendChild(tr);
        });

        updatePendingBadge();
    };
    renderPendingTableGlobal = renderPendingTable;

    // === Approve & Reject Surat ===
    window.approveSurat = async (id) => {
        if (currentRole !== 'admin') return;
        try {
            const res = await fetch(`/api/letters/${id}/approve`, { method: 'POST' });
            const result = await res.json();
            if (result.success) {
                alert(`✅ Permintaan nomor surat berhasil disetujui!\n\nNomor: ${result.nomor}`);
                await loadLetters();
            } else {
                alert(result.message || 'Gagal menyetujui surat!');
            }
        } catch (err) {
            console.error('Gagal approve surat:', err);
            alert('Terjadi kesalahan jaringan!');
        }
    };

    window.rejectSurat = async (id) => {
        if (currentRole !== 'admin') return;
        if (!confirm('Apakah Anda yakin ingin MENOLAK permintaan nomor surat ini?')) return;
        try {
            const res = await fetch(`/api/letters/${id}/reject`, { method: 'POST' });
            const result = await res.json();
            if (result.success) {
                alert('Permintaan nomor surat telah ditolak.');
                await loadLetters();
            } else {
                alert(result.message || 'Gagal menolak surat!');
            }
        } catch (err) {
            console.error('Gagal reject surat:', err);
            alert('Terjadi kesalahan jaringan!');
        }
    };

    // Handle Delete Surat
    window.hapusSurat = async (id) => {
        if(confirm("Apakah Anda yakin ingin menghapus data surat ini?")) {
            try {
                const res = await fetch(`/api/letters/${id}`, { method: 'DELETE' });
                const result = await res.json();
                if (result.success) {
                    await loadLetters();
                } else {
                    alert("Gagal menghapus surat!");
                }
            } catch (err) {
                console.error("Gagal menghapus surat:", err);
            }
        }
    };

    // Handle Edit Surat Modal Popup
    const editModal = document.getElementById('edit-modal');
    const formEditSurat = document.getElementById('form-edit-surat');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');

    window.editSurat = (id) => {
        const surat = suratData.find(s => s.id === id);
        if (!surat) return;
        
        document.getElementById('edit-index').value = surat.id;
        document.getElementById('edit-nomor').value = surat.nomor;
        document.getElementById('edit-tanggal').value = surat.tanggal;
        document.getElementById('edit-tujuan').value = surat.tujuan;
        document.getElementById('edit-perihal').value = surat.perihal;
        
        if(editModal) editModal.classList.remove('hidden');
    };

    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', () => {
            if (editModal) editModal.classList.add('hidden');
        });
    }

    if (formEditSurat) {
        formEditSurat.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-index').value;
            const tanggal = document.getElementById('edit-tanggal').value;
            const tujuan = document.getElementById('edit-tujuan').value;
            const perihal = document.getElementById('edit-perihal').value;

            try {
                const res = await fetch(`/api/letters/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tanggal, tujuan, perihal })
                });
                const result = await res.json();
                if (result.success) {
                    if (editModal) editModal.classList.add('hidden');
                    await loadLetters();
                } else {
                    alert("Gagal mengupdate data!");
                }
            } catch (err) {
                console.error("Gagal mengupdate data:", err);
            }
        });
    }

    // === Form & Ambil Nomor Surat Logic ===
    const formSurat = document.getElementById('form-surat');
    const resultModal = document.getElementById('result-modal');
    const generatedNumberEl = document.getElementById('generated-number');
    const btnCloseResult = document.getElementById('btn-close-result');
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
        formSurat.addEventListener('submit', async (e) => {
            e.preventDefault();

            const tanggal = document.getElementById('tanggal').value;
            const lingkup = document.getElementById('lingkup').value;
            const jenis = document.getElementById('jenis').value;
            const tujuan = document.getElementById('tujuan').value;
            const perihal = document.getElementById('perihal').value;
            
            const isKepanitiaan = isKepanitiaanCb ? isKepanitiaanCb.checked : false;
            const namaKegiatan = namaKegiatanInput ? namaKegiatanInput.value : '';
            const status = (currentRole === 'admin') ? 'approved' : 'pending';

            try {
                const res = await fetch('/api/letters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tanggal, lingkup, jenis, isKepanitiaan, namaKegiatan, tujuan, perihal, status
                    })
                });
                const result = await res.json();
                if (result.success) {
                    formSurat.reset();
                    if(isKepanitiaanCb) {
                        kegiatanGroup.classList.add('hidden');
                        namaKegiatanInput.removeAttribute('required');
                    }

                    if (currentRole === 'admin') {
                        // Admin: langsung tampilkan nomor resmi
                        if (generatedNumberEl) generatedNumberEl.textContent = result.nomor;
                        if (resultModal) resultModal.classList.remove('hidden');
                    } else {
                        // Viewer: tampilkan modal toast permintaan terkirim
                        const toastDetail = document.getElementById('toast-detail');
                        if (toastDetail) {
                            toastDetail.innerHTML = `
                                <div><strong>Jenis:</strong> ${jenis}</div>
                                <div><strong>Tujuan:</strong> ${tujuan}</div>
                                <div><strong>Perihal:</strong> ${perihal}</div>
                                <div><strong>Tanggal:</strong> ${tanggal}</div>
                            `;
                        }
                        const toast = document.getElementById('submit-toast');
                        if (toast) toast.classList.remove('hidden');
                    }

                    await loadLetters();
                } else {
                    alert(result.message || "Gagal membuat nomor surat!");
                }
            } catch (err) {
                console.error("Gagal membuat nomor surat:", err);
                alert("Terjadi kesalahan jaringan!");
            }
        });
    }

    if (btnCloseResult) {
        btnCloseResult.addEventListener('click', () => {
            if (resultModal) resultModal.classList.add('hidden');
        });
    }

    const btnCopyResult = document.getElementById('btn-copy-result');
    if (btnCopyResult) {
        btnCopyResult.addEventListener('click', () => {
            const num = generatedNumberEl.textContent;
            navigator.clipboard.writeText(num).then(() => {
                const originalText = btnCopyResult.textContent;
                btnCopyResult.textContent = 'Tersalin!';
                setTimeout(() => {
                    btnCopyResult.textContent = originalText;
                }, 2000);
            });
        });
    }

    // Toast helper
    window.closeToast = (e) => {
        if (!e || e.target.id === 'submit-toast' || e.target.id === 'btn-close-toast') {
            const toast = document.getElementById('submit-toast');
            if (toast) toast.classList.add('hidden');
        }
    };
    const btnCloseToast = document.getElementById('btn-close-toast');
    if (btnCloseToast) {
        btnCloseToast.addEventListener('click', () => {
            const toast = document.getElementById('submit-toast');
            if (toast) toast.classList.add('hidden');
        });
    }

    // === Template Logic (from Backend API /api/templates) ===
    const templateContainer = document.getElementById('template-container');
    const btnTambahTemplate = document.getElementById('btn-tambah-template');
    const templateModal = document.getElementById('template-modal');
    const formTambahTemplate = document.getElementById('form-tambah-template');
    const btnCancelTemplate = document.getElementById('btn-cancel-template');

    let templateData = [];

    const loadTemplates = async () => {
        try {
            const res = await fetch('/api/templates');
            templateData = await res.json();
            renderTemplates();
        } catch (err) {
            console.error("Gagal memuat template dari server:", err);
        }
    };

    const renderTemplates = () => {
        if (!templateContainer) return;
        templateContainer.innerHTML = '';

        templateData.forEach((tpl) => {
            const div = document.createElement('div');
            div.className = 'card neo-card bg-cream template-card custom-template';
            div.style.position = 'relative';
            
            const dlName = tpl.fileName || 'template';
            const icon = tpl.icon || '📁';

            div.innerHTML = `
                <button class="admin-only" style="position: absolute; top: 10px; right: 10px; background: #ff4d4d; color: white; border: 2px solid black; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; box-shadow: 2px 2px 0px black;" onclick="hapusTemplate(${tpl.id})" title="Hapus Template">✕</button>
                <div class="template-icon bg-yellow">${icon}</div>
                <h3>${tpl.nama}</h3>
                <p>${tpl.desc}</p>
                <a href="${tpl.url}" download="${dlName}" class="btn btn-blue w-100" style="text-decoration: none;">Unduh File</a>
            `;
            templateContainer.appendChild(div);
        });
    };

    window.hapusTemplate = async (id) => {
        if(confirm("Apakah Anda yakin ingin menghapus template ini?")) {
            try {
                const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
                const result = await res.json();
                if (result.success) {
                    await loadTemplates();
                } else {
                    alert("Gagal menghapus template!");
                }
            } catch (err) {
                console.error("Gagal menghapus template:", err);
            }
        }
    };

    if (btnTambahTemplate) {
        btnTambahTemplate.addEventListener('click', () => {
            if (templateModal) templateModal.classList.remove('hidden');
        });
    }

    if (btnCancelTemplate) {
        btnCancelTemplate.addEventListener('click', () => {
            if (templateModal) templateModal.classList.add('hidden');
        });
    }

    if (formTambahTemplate) {
        formTambahTemplate.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nama = document.getElementById('template-nama').value;
            const desc = document.getElementById('template-desc').value;
            const fileInput = document.getElementById('template-file');

            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const formData = new FormData();
                formData.append('nama', nama);
                formData.append('desc', desc);
                formData.append('file', file);

                try {
                    const res = await fetch('/api/templates', {
                        method: 'POST',
                        body: formData
                    });
                    const result = await res.json();
                    if (result.success) {
                        formTambahTemplate.reset();
                        if (templateModal) templateModal.classList.add('hidden');
                        await loadTemplates();
                    } else {
                        alert(result.message || "Gagal mengunggah template!");
                    }
                } catch (err) {
                    console.error("Gagal mengunggah file template:", err);
                    alert("Terjadi kesalahan koneksi saat mengupload!");
                }
            }
        });
    }

    // === Admin Login Logic ===
    const adminLoginForm = document.getElementById('form-admin-login');
    const btnCancelLogin = document.getElementById('btn-cancel-login');
    const adminLoginModal = document.getElementById('admin-login-modal');

    if (btnCancelLogin) {
        btnCancelLogin.addEventListener('click', () => {
            if (adminLoginModal) adminLoginModal.classList.add('hidden');
        });
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const result = await res.json();
                if (result.success) {
                    setRole('admin');
                    if (adminLoginModal) adminLoginModal.classList.add('hidden');
                    adminLoginForm.reset();
                } else {
                    alert(result.message || 'Username atau Password salah!');
                }
            } catch (err) {
                console.error("Gagal login:", err);
                alert('Gagal menghubungkan ke server login!');
            }
        });
    }

    // === Contact Settings Logic ===
    const helpContactsContainer = document.getElementById('help-contacts-container');
    const btnEditContacts = document.getElementById('btn-edit-contacts');
    const contactSettingsModal = document.getElementById('contact-settings-modal');
    const btnCancelContact = document.getElementById('btn-cancel-contact');
    const formContactSettings = document.getElementById('form-contact-settings');

    let contactsData = [];

    const loadContacts = async () => {
        try {
            const res = await fetch('/api/contacts');
            contactsData = await res.json();
            renderContacts();
        } catch (err) {
            console.error("Gagal memuat kontak dari server:", err);
        }
    };

    const renderContacts = () => {
        if (!helpContactsContainer) return;
        helpContactsContainer.innerHTML = '';
        contactsData.forEach((contact, index) => {
            let waNumber = contact.phone.replace(/^0/, '62');
            
            const link = document.createElement('a');
            link.href = `https://wa.me/${waNumber}`;
            link.target = '_blank';
            link.className = 'wa-logo-dynamic';
            link.style.textDecoration = 'none';
            link.style.color = 'white';
            
            const img = document.createElement('img');
            img.src = `/static/assets/${index+1}.png`; 
            img.alt = `WA ${contact.name}`;
            img.style.cssText = 'width: 50px; height: 50px; object-fit: cover; border-radius: 50%; border: 2px solid white; display: block; margin: 0 auto 5px;';
            
            const span = document.createElement('span');
            span.style.fontSize = '0.9rem';
            span.style.fontWeight = 'bold';
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
            if (contactSettingsModal) contactSettingsModal.classList.remove('hidden');
        });
    }

    if (btnCancelContact) {
        btnCancelContact.addEventListener('click', () => {
            if (contactSettingsModal) contactSettingsModal.classList.add('hidden');
        });
    }

    if (formContactSettings) {
        formContactSettings.addEventListener('submit', async (e) => {
            e.preventDefault();
            const c1Name = document.getElementById('contact1-name').value;
            const c1Phone = document.getElementById('contact1-phone').value;
            const c2Name = document.getElementById('contact2-name').value;
            const c2Phone = document.getElementById('contact2-phone').value;

            const newContacts = [
                { name: c1Name, phone: c1Phone },
                { name: c2Name, phone: c2Phone }
            ];
            
            try {
                const res = await fetch('/api/contacts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newContacts)
                });
                const result = await res.json();
                if (result.success) {
                    if (contactSettingsModal) contactSettingsModal.classList.add('hidden');
                    await loadContacts();
                } else {
                    alert("Gagal menyimpan kontak!");
                }
            } catch (err) {
                console.error("Gagal menyimpan kontak:", err);
            }
        });
    }

    // === Logout Logic ===
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin logout dari akun Admin?')) {
                setRole('viewer');
                fetch('/api/logout', { method: 'POST' }).catch(() => {});
            }
        });
    }

    // Initial load from Backend APIs
    loadLetters();
    loadTemplates();
    loadContacts();
    updateViewerNotice();
});
