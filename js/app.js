// Role Management globally accessible
let currentRole = localStorage.getItem('userRole') || 'viewer';

window.setRole = (role) => {
    currentRole = role;
    localStorage.setItem('userRole', role);
    document.body.className = `role-${role}`;
    const display = document.getElementById('current-role-display');
    if(display) display.textContent = `Anda masuk sebagai: ${role.toUpperCase()}`;
    
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

    // === Navigation Logic ===
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and sections
            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.add('hidden'));

            // Add active class to clicked button and target section
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // === Form & Surat Logic ===
    const formSurat = document.getElementById('form-surat');
    const resultModal = document.getElementById('result-modal');
    const generatedNumberEl = document.getElementById('generated-number');
    const btnCloseResult = document.getElementById('btn-close-result');
    const tableBody = document.querySelector('#table-rekap tbody');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const filterJenis = document.getElementById('filter-jenis');

    // Edit Modal Elements
    const editModal = document.getElementById('edit-modal');
    const formEditSurat = document.getElementById('form-edit-surat');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');

    // Initialize data from LocalStorage
    let suratData = JSON.parse(localStorage.getItem('suratData')) || [];

    // Helper: Generate Nomor Surat
    // Format Baku: XX/YY/ZZ/[Panpel(nama kegiatan)]/HIMAMEKA/KM-UTM/Bulan/Tahun
    const generateNomorSurat = (lingkup, jenis, isKepanitiaan, namaKegiatan, tanggalStr) => {
        const count = suratData.length + 1;
        const paddedCount = String(count).padStart(3, '0');
        
        const dateObj = new Date(tanggalStr);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1; // 1-12
        
        const romawiMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
        const romawi = romawiMonths[month - 1];

        // Panpel part
        let panpelPart = "";
        if (isKepanitiaan) {
            // Remove spaces from nama kegiatan
            const cleanedNama = namaKegiatan.replace(/\s+/g, '');
            panpelPart = `/Panpel${cleanedNama}`;
        }

        return `${paddedCount}/${lingkup}/${jenis}${panpelPart}/HIMAMEKA/KM-UTM/${romawi}/${year}`;
    };

    // Helper: Render Table
    const renderTable = (dataToRender = suratData) => {
        tableBody.innerHTML = '';
        if (dataToRender.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            dataToRender.forEach((surat, index) => {
                // Find actual index in suratData to ensure edit/delete works on filtered data
                const actualIndex = suratData.indexOf(surat);
                const kepanitiaanDisplay = surat.isKepanitiaan ? surat.namaKegiatan : '-';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${surat.nomor}</strong></td>
                    <td>${surat.tanggal}</td>
                    <td>${surat.jenis}</td>
                    <td>${kepanitiaanDisplay}</td>
                    <td>${surat.tujuan}</td>
                    <td>${surat.perihal}</td>
                    <td class="admin-only">
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-blue" style="padding: 5px 10px; font-size: 0.8rem;" onclick="editSurat(${actualIndex})">Edit</button>
                            <button class="btn btn-yellow" style="padding: 5px 10px; font-size: 0.8rem;" onclick="hapusSurat(${actualIndex})">Hapus</button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }
    };

    // Filter and Search Logic
    const filterTable = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filterVal = filterJenis.value;

        const filteredData = suratData.filter(surat => {
            const matchSearch = surat.perihal.toLowerCase().includes(searchTerm) || surat.tujuan.toLowerCase().includes(searchTerm);
            const matchFilter = filterVal === "" || surat.jenis === filterVal;
            return matchSearch && matchFilter;
        });

        renderTable(filteredData);
    };

    if (searchInput) searchInput.addEventListener('input', filterTable);
    if (filterJenis) filterJenis.addEventListener('change', filterTable);

    // Handle Delete Surat
    window.hapusSurat = (index) => {
        if(confirm("Apakah Anda yakin ingin menghapus data surat ini?")) {
            suratData.splice(index, 1);
            localStorage.setItem('suratData', JSON.stringify(suratData));
            filterTable();
        }
    };

    // Handle Edit Surat
    window.editSurat = (index) => {
        const surat = suratData[index];
        document.getElementById('edit-index').value = index;
        document.getElementById('edit-nomor').value = surat.nomor;
        document.getElementById('edit-tanggal').value = surat.tanggal;
        document.getElementById('edit-tujuan').value = surat.tujuan;
        document.getElementById('edit-perihal').value = surat.perihal;
        
        if(editModal) editModal.classList.remove('hidden');
    };

    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', () => {
            editModal.classList.add('hidden');
        });
    }

    if (formEditSurat) {
        formEditSurat.addEventListener('submit', (e) => {
            e.preventDefault();
            const index = document.getElementById('edit-index').value;
            
            suratData[index].tanggal = document.getElementById('edit-tanggal').value;
            suratData[index].tujuan = document.getElementById('edit-tujuan').value;
            suratData[index].perihal = document.getElementById('edit-perihal').value;

            localStorage.setItem('suratData', JSON.stringify(suratData));
            editModal.classList.add('hidden');
            filterTable();
        });
    }

    // Handle Checkbox Kepanitiaan Toggle
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

    // Handle Form Submit
    formSurat.addEventListener('submit', (e) => {
        e.preventDefault();

        const tanggal = document.getElementById('tanggal').value;
        const lingkup = document.getElementById('lingkup').value;
        const jenis = document.getElementById('jenis').value;
        const tujuan = document.getElementById('tujuan').value;
        const perihal = document.getElementById('perihal').value;
        
        const isKepanitiaan = isKepanitiaanCb ? isKepanitiaanCb.checked : false;
        const namaKegiatan = namaKegiatanInput ? namaKegiatanInput.value : '';

        const nomorSurat = generateNomorSurat(lingkup, jenis, isKepanitiaan, namaKegiatan, tanggal);

        // Save data
        const newSurat = {
            nomor: nomorSurat,
            tanggal: tanggal,
            lingkup: lingkup,
            jenis: jenis,
            isKepanitiaan: isKepanitiaan,
            namaKegiatan: namaKegiatan,
            tujuan: tujuan,
            perihal: perihal
        };

        suratData.push(newSurat);
        localStorage.setItem('suratData', JSON.stringify(suratData));

        // Show result
        generatedNumberEl.textContent = nomorSurat;
        resultModal.classList.remove('hidden');
        
        // Reset form
        formSurat.reset();
        if(isKepanitiaanCb) {
            kegiatanGroup.classList.add('hidden');
            namaKegiatanInput.removeAttribute('required');
        }

        // Update table
        filterTable();
    });

    btnCloseResult.addEventListener('click', () => {
        resultModal.classList.add('hidden');
    });

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

    // === Template Logic ===
    const templateContainer = document.getElementById('template-container');
    const btnTambahTemplate = document.getElementById('btn-tambah-template');
    const templateModal = document.getElementById('template-modal');
    const formTambahTemplate = document.getElementById('form-tambah-template');
    const btnCancelTemplate = document.getElementById('btn-cancel-template');

    let defaultTemplates = [
        { nama: 'Surat Tugas', desc: 'Format standar untuk penugasan karyawan keluar kantor.', url: 'templates/Surat_Tugas.rtf', fileName: 'Surat_Tugas.rtf', icon: '📋' },
        { nama: 'Surat Undangan', desc: 'Template undangan resmi untuk keperluan internal maupun eksternal.', url: 'templates/Surat_Undangan.rtf', fileName: 'Surat_Undangan.rtf', icon: '✉️' },
        { nama: 'Surat Keterangan', desc: 'Format baku untuk menerbitkan keterangan kerja, domisili, dsb.', url: 'templates/Surat_Keterangan.rtf', fileName: 'Surat_Keterangan.rtf', icon: '📝' }
    ];

    let templateData = JSON.parse(localStorage.getItem('templateData')) || defaultTemplates;

    const renderTemplates = () => {
        if (!templateContainer) return;
        templateContainer.innerHTML = '';

        templateData.forEach((tpl, index) => {
            const div = document.createElement('div');
            div.className = 'card neo-card bg-cream template-card custom-template';
            div.style.position = 'relative';
            
            const dlName = tpl.fileName || 'template';
            const icon = tpl.icon || '📁';

            div.innerHTML = `
                <button class="admin-only" style="position: absolute; top: 10px; right: 10px; background: #ff4d4d; color: white; border: 2px solid black; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; box-shadow: 2px 2px 0px black;" onclick="hapusTemplate(${index})" title="Hapus Template">❌</button>
                <div class="template-icon bg-yellow">${icon}</div>
                <h3>${tpl.nama}</h3>
                <p>${tpl.desc}</p>
                <a href="${tpl.url}" download="${dlName}" class="btn btn-blue w-100" style="text-decoration: none;">Unduh File</a>
            `;
            templateContainer.appendChild(div);
        });
    };

    window.hapusTemplate = (index) => {
        if(confirm("Apakah Anda yakin ingin menghapus template ini?")) {
            templateData.splice(index, 1);
            localStorage.setItem('templateData', JSON.stringify(templateData));
            renderTemplates();
        }
    };

    if (btnTambahTemplate) {
        btnTambahTemplate.addEventListener('click', () => {
            templateModal.classList.remove('hidden');
        });
    }

    if (btnCancelTemplate) {
        btnCancelTemplate.addEventListener('click', () => {
            templateModal.classList.add('hidden');
        });
    }

    if (formTambahTemplate) {
        formTambahTemplate.addEventListener('submit', (e) => {
            e.preventDefault();
            const nama = document.getElementById('template-nama').value;
            const desc = document.getElementById('template-desc').value;
            const fileInput = document.getElementById('template-file');

            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const reader = new FileReader();

                reader.onload = function(event) {
                    const url = event.target.result;
                    templateData.push({ 
                        nama: nama, 
                        desc: desc, 
                        url: url,
                        fileName: file.name,
                        icon: '📁'
                    });
                    localStorage.setItem('templateData', JSON.stringify(templateData));
                    
                    formTambahTemplate.reset();
                    templateModal.classList.add('hidden');
                    renderTemplates();
                };

                reader.readAsDataURL(file);
            }
        });
    }

    // === Admin Login Logic ===
    const adminLoginForm = document.getElementById('form-admin-login');
    const btnCancelLogin = document.getElementById('btn-cancel-login');
    const adminLoginModal = document.getElementById('admin-login-modal');

    if (btnCancelLogin) {
        btnCancelLogin.addEventListener('click', () => {
            adminLoginModal.classList.add('hidden');
        });
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;

            if (username === 'adminmekasur' && password === 'admin123') {
                setRole('admin');
                adminLoginModal.classList.add('hidden');
                adminLoginForm.reset();
            } else {
                alert('Username atau Password salah!');
            }
        });
    }

    // === Contact Settings Logic ===
    const helpContactsContainer = document.getElementById('help-contacts-container');
    const btnEditContacts = document.getElementById('btn-edit-contacts');
    const contactSettingsModal = document.getElementById('contact-settings-modal');
    const btnCancelContact = document.getElementById('btn-cancel-contact');
    const formContactSettings = document.getElementById('form-contact-settings');

    let defaultContacts = [
        { name: 'Nopal', phone: '082229136632' },
        { name: 'Gita', phone: '081935135877' }
    ];
    let contactsData = JSON.parse(localStorage.getItem('helpContacts')) || defaultContacts;

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
            
            // Image icon
            const img = document.createElement('img');
            img.src = `assets/${index+1}.png`; 
            img.alt = `WA ${contact.name}`;
            img.style.cssText = 'width: 50px; height: 50px; object-fit: cover; border-radius: 50%; border: 2px solid white; display: block; margin: 0 auto 5px;';
            
            // Name span
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
            contactSettingsModal.classList.remove('hidden');
        });
    }

    if (btnCancelContact) {
        btnCancelContact.addEventListener('click', () => {
            contactSettingsModal.classList.add('hidden');
        });
    }

    if (formContactSettings) {
        formContactSettings.addEventListener('submit', (e) => {
            e.preventDefault();
            const c1Name = document.getElementById('contact1-name').value;
            const c1Phone = document.getElementById('contact1-phone').value;
            const c2Name = document.getElementById('contact2-name').value;
            const c2Phone = document.getElementById('contact2-phone').value;

            contactsData = [
                { name: c1Name, phone: c1Phone },
                { name: c2Name, phone: c2Phone }
            ];
            
            localStorage.setItem('helpContacts', JSON.stringify(contactsData));
            contactSettingsModal.classList.add('hidden');
            renderContacts();
        });
    }

    // Initial render
    renderTable();
    renderTemplates();
    renderContacts();
});
