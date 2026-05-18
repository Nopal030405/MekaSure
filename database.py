import os
import sqlite3
import pymysql

# Auto-detect Environment
# Gunakan MySQL hanya jika DB_HOST didefinisikan secara eksplisit di environment.
# Jika tidak ada, gunakan SQLite (sangat cocok untuk akun PythonAnywhere gratis!)
IS_MYSQL = 'DB_HOST' in os.environ

def get_db():
    if IS_MYSQL:
        # Connect to MySQL (Production)
        return pymysql.connect(
            host=os.environ.get('DB_HOST', 'localhost'),
            user=os.environ.get('DB_USER', 'root'),
            password=os.environ.get('DB_PASSWORD', ''),
            database=os.environ.get('DB_NAME', 'mekasur'),
            cursorclass=pymysql.cursors.DictCursor
        )
    else:
        # Connect to SQLite (Local Development)
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mekasur.db")
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn

def query_db(query, args=(), one=False, commit=False):
    conn = get_db()
    cursor = conn.cursor()
    try:
        # SQLite uses '?' as placeholder, MySQL uses '%s'
        # Normalize placeholder to handle both databases seamlessly
        if IS_MYSQL:
            query = query.replace('?', '%s')
        
        cursor.execute(query, args)
        
        if commit:
            conn.commit()
            last_id = cursor.lastrowid
            return last_id
        else:
            rv = cursor.fetchall()
            # Normalize SQLite Row objects into standard dictionaries
            if not IS_MYSQL:
                rv = [dict(row) for row in rv]
            return (rv[0] if rv else None) if one else rv
    except Exception as e:
        if commit:
            conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    try:
        if not IS_MYSQL:
            # SQLite Tables Schema
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'admin'
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS letters (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nomor TEXT UNIQUE NOT NULL,
                    tanggal TEXT NOT NULL,
                    lingkup TEXT NOT NULL,
                    jenis TEXT NOT NULL,
                    isKepanitiaan INTEGER DEFAULT 0,
                    namaKegiatan TEXT,
                    tujuan TEXT NOT NULL,
                    perihal TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS templates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nama TEXT NOT NULL,
                    desc TEXT NOT NULL,
                    url TEXT NOT NULL,
                    fileName TEXT NOT NULL,
                    icon TEXT DEFAULT '📁'
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS contacts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    phone TEXT NOT NULL
                )
            ''')
        else:
            # MySQL Tables Schema
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'admin'
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS letters (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nomor VARCHAR(255) UNIQUE NOT NULL,
                    tanggal DATE NOT NULL,
                    lingkup VARCHAR(50) NOT NULL,
                    jenis VARCHAR(50) NOT NULL,
                    isKepanitiaan BOOLEAN DEFAULT FALSE,
                    namaKegiatan VARCHAR(255),
                    tujuan VARCHAR(255) NOT NULL,
                    perihal VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS templates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nama VARCHAR(255) NOT NULL,
                    `desc` TEXT NOT NULL,
                    url VARCHAR(255) NOT NULL,
                    fileName VARCHAR(255) NOT NULL,
                    icon VARCHAR(50) DEFAULT '📁'
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS contacts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    phone VARCHAR(50) NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ''')
        
        conn.commit()
    finally:
        cursor.close()
        conn.close()

    # Seed default Admin User (adminmekasur / admin123)
    admin = query_db("SELECT id FROM users WHERE role='admin' OR username='adminmekasur'", one=True)
    if not admin:
        from werkzeug.security import generate_password_hash
        hashed_pw = generate_password_hash('admin123')
        query_db("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", 
                 ('adminmekasur', hashed_pw, 'admin'), commit=True)
    
    # Seed default Templates if empty
    templates = query_db("SELECT id FROM templates")
    if not templates:
        default_tpls = [
            ('Surat Tugas', 'Format standar untuk penugasan karyawan keluar kantor.', '/static/document_templates/Surat_Tugas.rtf', 'Surat_Tugas.rtf', '📋'),
            ('Surat Undangan', 'Template undangan resmi untuk keperluan internal maupun eksternal.', '/static/document_templates/Surat_Undangan.rtf', 'Surat_Undangan.rtf', '✉️'),
            ('Surat Keterangan', 'Format baku untuk menerbitkan keterangan kerja, domisili, dsb.', '/static/document_templates/Surat_Keterangan.rtf', 'Surat_Keterangan.rtf', '📝')
        ]
        for nama, desc, url, fileName, icon in default_tpls:
            query_db("INSERT INTO templates (nama, `desc`, url, fileName, icon) VALUES (?, ?, ?, ?, ?)",
                     (nama, desc, url, fileName, icon), commit=True)
            
    # Seed default Contacts if empty
    contacts = query_db("SELECT id FROM contacts")
    if not contacts:
        default_contacts = [
            ('Nopal', '082229136632'),
            ('Gita', '081935135877')
        ]
        for name, phone in default_contacts:
            query_db("INSERT INTO contacts (name, phone) VALUES (?, ?)", (name, phone), commit=True)

if __name__ == '__main__':
    init_db()
    print("Database initialized and default records seeded successfully.")
