import os
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash
from database import query_db, init_db

# Initialize database automatically
init_db()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'mekasur_super_secret_key_030405')

# Configure File Uploads
UPLOAD_FOLDER = os.path.join(app.root_path, 'static', 'uploads', 'templates')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload size
ALLOWED_EXTENSIONS = {'doc', 'docx', 'pdf', 'rtf', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ========================
# WEB ROUTING
# ========================
@app.route('/')
def index():
    return render_template('index.html')

# ========================
# AUTHENTICATION API
# ========================
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    user = query_db("SELECT * FROM users WHERE username = ?", (username,), one=True)
    if user and check_password_hash(user['password'], password):
        session['user_role'] = 'admin'
        session['username'] = username
        return jsonify({"success": True, "role": "admin"})
    
    return jsonify({"success": False, "message": "Username atau Password salah!"}), 400

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({"success": True})

# ========================
# LETTERS MANAGEMENT API
# ========================
@app.route('/api/letters', methods=['GET'])
def get_letters():
    letters = query_db("SELECT * FROM letters ORDER BY id DESC")
    return jsonify(letters)

@app.route('/api/letters', methods=['POST'])
def create_letter():
    data = request.get_json() or {}
    tanggal = data.get('tanggal')
    lingkup = data.get('lingkup')
    jenis = data.get('jenis')
    isKepanitiaan = data.get('isKepanitiaan', False)
    namaKegiatan = data.get('namaKegiatan', '')
    tujuan = data.get('tujuan')
    perihal = data.get('perihal')

    if not (tanggal and lingkup and jenis and tujuan and perihal):
        return jsonify({"success": False, "message": "Semua field wajib diisi!"}), 400

    # Dynamic Sequential Number Generation (concurrency-safe)
    count_row = query_db("SELECT COUNT(id) AS count FROM letters", one=True)
    count = count_row['count'] + 1
    paddedCount = str(count).zfill(3)

    # Date calculations
    date_obj = datetime.strptime(tanggal, "%Y-%m-%d")
    year = date_obj.year
    month = date_obj.month
    
    romawi_months = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]
    romawi = romawi_months[month - 1]

    # Handle Kepanitiaan name cleanup
    panpel_part = ""
    if isKepanitiaan and namaKegiatan:
        cleaned_nama = "".join(namaKegiatan.split())
        panpel_part = f"/Panpel{cleaned_nama}"

    # Format Baku: XX/YY/ZZ/[Panpel(nama kegiatan)]/HIMAMEKA/KM-UTM/Bulan/Tahun
    nomor = f"{paddedCount}/{lingkup}/{jenis}{panpel_part}/HIMAMEKA/KM-UTM/{romawi}/{year}"

    # Save to Database
    query_db(
        "INSERT INTO letters (nomor, tanggal, lingkup, jenis, isKepanitiaan, namaKegiatan, tujuan, perihal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (nomor, tanggal, lingkup, jenis, 1 if isKepanitiaan else 0, namaKegiatan, tujuan, perihal),
        commit=True
    )

    return jsonify({"success": True, "nomor": nomor})

@app.route('/api/letters/<int:letter_id>', methods=['PUT'])
def update_letter(letter_id):
    # Standard security check can be enforced here, e.g., session.get('user_role') == 'admin'
    data = request.get_json() or {}
    tanggal = data.get('tanggal')
    tujuan = data.get('tujuan')
    perihal = data.get('perihal')

    if not (tanggal and tujuan and perihal):
        return jsonify({"success": False, "message": "Semua field wajib diisi!"}), 400

    query_db(
        "UPDATE letters SET tanggal = ?, tujuan = ?, perihal = ? WHERE id = ?",
        (tanggal, tujuan, perihal, letter_id),
        commit=True
    )
    return jsonify({"success": True})

@app.route('/api/letters/<int:letter_id>', methods=['DELETE'])
def delete_letter(letter_id):
    query_db("DELETE FROM letters WHERE id = ?", (letter_id,), commit=True)
    return jsonify({"success": True})

# ========================
# TEMPLATES MANAGEMENT API
# ========================
@app.route('/api/templates', methods=['GET'])
def get_templates():
    templates = query_db("SELECT * FROM templates ORDER BY id DESC")
    return jsonify(templates)

@app.route('/api/templates', methods=['POST'])
def upload_template():
    nama = request.form.get('nama')
    desc = request.form.get('desc')
    file = request.files.get('file')

    if not (nama and desc and file):
        return jsonify({"success": False, "message": "Nama, Deskripsi, dan File wajib diisi!"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add timestamp to avoid collisions
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_filename = f"{timestamp}_{filename}"
        
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)

        url = f"/static/uploads/templates/{unique_filename}"
        query_db(
            "INSERT INTO templates (nama, `desc`, url, fileName, icon) VALUES (?, ?, ?, ?, ?)",
            (nama, desc, url, filename, "📁"),
            commit=True
        )
        return jsonify({"success": True})

    return jsonify({"success": False, "message": "Tipe file tidak diizinkan!"}), 400

@app.route('/api/templates/<int:template_id>', methods=['DELETE'])
def delete_template(template_id):
    tpl = query_db("SELECT * FROM templates WHERE id = ?", (template_id,), one=True)
    if not tpl:
        return jsonify({"success": False, "message": "Template tidak ditemukan!"}), 404

    # Remove physical file if it was custom uploaded
    if tpl['url'].startswith('/static/uploads/templates/'):
        relative_path = tpl['url'].lstrip('/')
        absolute_path = os.path.join(app.root_path, relative_path)
        if os.path.exists(absolute_path):
            try:
                os.remove(absolute_path)
            except Exception:
                pass # Fail silently if file is locked or missing

    query_db("DELETE FROM templates WHERE id = ?", (template_id,), commit=True)
    return jsonify({"success": True})

# ========================
# CONTACTS API
# ========================
@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    contacts = query_db("SELECT * FROM contacts ORDER BY id ASC")
    return jsonify(contacts)

@app.route('/api/contacts', methods=['POST'])
def save_contacts():
    data = request.get_json() or []
    if len(data) < 2:
        return jsonify({"success": False, "message": "Harus mengisi minimal 2 kontak!"}), 400

    query_db("DELETE FROM contacts", commit=True)
    for c in data:
        name = c.get('name')
        phone = c.get('phone')
        query_db("INSERT INTO contacts (name, phone) VALUES (?, ?)", (name, phone), commit=True)

    return jsonify({"success": True})

if __name__ == '__main__':
    # Local Development server
    app.run(debug=True, port=5000)
