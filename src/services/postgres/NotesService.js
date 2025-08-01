/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const InvariantError = require("../../exceptions/InvariantError");
const { mapDBToModel } = require("../../utils");
const NotFoundError = require("../../exceptions/NotFoundError");

class NotesService {
  // buat constructor dan di dalamnya inisialisasi properti this._pool dengan instance dari package pg.Pool.
  constructor() {
    //ganti pool nya, karna ini mau di deploy
    this._pool = new Pool();
    // this._pool = new Pool({ ssl: { rejectUnauthorized: false } });
    // this._pool = new Pool({
    //   connectionString: process.env.DATABASE_URL, // <-- Ini Perubahannya!
    //   // Tambahkan konfigurasi SSL untuk Railway/produksi
    //   ssl: {
    //     rejectUnauthorized: false, // Penting untuk koneksi ke Railway/prod jika sertifikat tidak formal
    //   },
    // });
  }

  // Buat nama fungsi dan parameter sama persis seperti yang ada pada inMemory -> NotesService yah.
  async addNote({ title, body, tags }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    // Selanjutnya buat objek query untuk memasukan notes baru ke database seperti ini.

    // analogi returning, id ibarat nomor antrian ya,
    // Kasir menuliskan pesananmu di kertas order (query).

    // Di kertas order itu ada instruksi: "Tolong buat pizza ini (INSERT ke notes dengan toping-toping $1 sampai $6).
    //  Setelah selesai, beritahu aku NOMOR ANTRIAN pizza yang baru jadi itu! (RETURNING id)".
    const query = {
      text: "INSERT INTO notes VALUES($1, $2, $3, $4, $5, $6) RETURNING id",
      values: [id, title, body, tags, createdAt, updatedAt],
    };

    // Untuk mengeksekusi query yang sudah dibuat, kita gunakan fungsi this._pool.query.

    // Ingat! fungsi query() berjalan secara asynchronous, dengan begitu kita perlu menambahkan async pada addNote dan await pada pemanggilan query().

    // analogi
    // Kasir mengirim kertas order itu ke dapur (this._pool.query) dan menunggu (await) sampai pizzanya selesai dibuat dan dapur mengkonfirmasi.

    // Dapur bekerja (menjalankan INSERT). Setelah pizza jadi, dapur memberikan konfirmasi kepada kasir.
    const result = await this._pool.query(query);

    // Ketika dapur memberikan konfirmasi (result), kasir memeriksa. Di konfirmasi itu, harus ada NOMOR ANTRIAN pizza yang baru jadi.
    if (!result.rows[0].id) {
      throw new InvariantError("Catatan gagal ditambahkan");
    }
    // Jika nomor antrian ada di konfirmasi (result.rows[0].id), kasir sekarang tahu nomor antrian pizza yang baru jadi.

    // Kasir lalu memberitahu kamu (mengembalikan id) nomor antrian pizza pesananmu
    return result.rows[0].id;
  }

  async getNotes() {
    const result = await this._pool.query("SELECT * FROM notes");
    //karenna struktur nya beda, dari createdAt menjadi created_at kini kita ubah pakai map yang di setting dari utils index.js
    return result.rows.map(mapDBToModel);
  }

  async getNoteById(id) {
    const query = {
      text: "SELECT * FROM notes WHERE id = $1",
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Catatan tidak ditemukan");
    }

    return result.rows.map(mapDBToModel)[0];
  }

  async editNoteById(id, { title, body, tags }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: "UPDATE notes SET title = $1, body = $2, tags = $3, updated_at = $4 WHERE id = $5 RETURNING id",
      values: [title, body, tags, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Gagal memperbarui catatan. Id tidak ditemukan");
    }
  }

  async deleteNoteById(id) {
    const query = {
      text: "DELETE FROM notes WHERE id = $1 RETURNING id",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Catatan gagal dihapus. Id tidak ditemukan");
    }
  }
}

module.exports = NotesService;
