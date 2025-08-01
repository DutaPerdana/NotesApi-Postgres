const Hapi = require("@hapi/hapi");
// const routes = require("./routes"); // dihapus karena tidak di gunakan lagi
// mendaftarkan notes di server hapi
const notes = require("./api/notes");
// const NotesService = require('./services/inMemory/NotesService');
//ganti NotesService ke postgres
const NotesService = require("./services/postgres/NotesService");
const NotesValidator = require("./validator/notes");
const ClientError = require("./exceptions/ClientError");
require("dotenv").config();

const init = async () => {
  const notesService = new NotesService();
  const server = Hapi.server({
    // port: 3000,
    // host: process.env.NODE_ENV !== "production" ? "localhost" : "0.0.0.0",
    // karna sudah ada env kita pakai kode di bawah ini ya
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });
  // hapus server route
  // server.route(routes);

  // mendaftarkan plugins
  await server.register({
    plugin: notes,
    options: {
      service: notesService,
      // menambahkan validator
      validator: NotesValidator,
    },
  });
  // menambahkan onPreResponse. ini menghapus try and catch yang ada di handler
  server.ext("onPreResponse", (request, h) => {
    // mendapatkan konteks response dari request
    const { response } = request;

    // penanganan client error secara internal.
    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: "fail",
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }

    return h.continue;
  });
  await server.start();
  // console.log(`Server berjalan pada ${server.info.uri}`);
  //ubah ketika di deploy
  console.log(`Server berjalan pada http://${process.env.HOST}:${process.env.PORT}`);
};

init();
