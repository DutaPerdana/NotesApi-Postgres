/* eslint-disable no-unused-vars */
/* eslint-disable linebreak-style */
const Hapi = require('@hapi/hapi');
const notes = require('./api/notes');
const NotesService = require('./services/postgres/NotesService');
const NotesValidator = require('./validator/notes');
const ClientError = require('./exceptions/ClientError');
require('dotenv').config(); // Pastikan dotenv dimuat paling awal

// Tambahkan library node-pg-migrate dan path
// const { migrate } = require('node-pg-migrate');
// const path = require('path');

const init = async () => {
  // Jalankan migrasi database sebelum memulai server Hapi
  // try {
  //   console.log("Running database migrations...");
  //   await migrate({
  //     // Konfigurasi koneksi database menggunakan variabel lingkungan individu
  //     database: process.env.PGDATABASE,
  //     user: process.env.PGUSER,
  //     password: process.env.PGPASSWORD,
  //     host: process.env.PGHOST,
  //     port: parseInt(process.env.PGPORT, 10), // Pastikan port di-parse sebagai integer

  //     migrationsTable: "pgmigrations", // Nama tabel untuk melacak migrasi
  //     dir: path.resolve(__dirname, "./migrations"), // Path ke folder migrasi Anda
  //     direction: "up", // Selalu migrasi ke versi terbaru
  //     timestamp: true, // Asumsikan nama file migrasi berdasarkan timestamp
  //     log: (msg) => console.log(msg), // Output log migrasi ke konsol
  //   });
  //   console.log("Database migrations completed successfully!");
  // } catch (err) {
  //   console.error("Database migration failed:", err);
  //   // Sangat penting: Hentikan aplikasi jika migrasi gagal
  //   // Ini mencegah aplikasi berjalan dengan skema database yang tidak konsisten
  //   process.exit(1);
  // }

  // Setelah migrasi berhasil, baru inisialisasi NotesService
  const notesService = new NotesService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // Mendaftarkan plugins
  await server.register({
    plugin: notes,
    options: {
      service: notesService,
      validator: NotesValidator,
    },
  });

  // Menambahkan onPreResponse untuk penanganan error
  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

// Penanganan unhandled rejection untuk mencegah proses crash tanpa pemberitahuan
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

init();
