const { validateNotePayload } = require("../../validator/notes");
const ClientError = require("../../exceptions/ClientError");

/* eslint-disable class-methods-use-this */
//karena sudah memakai postgres kita akan
//menambahkan keyword async pada seluruh fungsi handler dan tambahkan keyword await pada setiap penggunaan fungsi dari service
class NotesHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postNoteHandler = this.postNoteHandler.bind(this);
    this.getNotesHandler = this.getNotesHandler.bind(this);
    this.getNoteByIdHandler = this.getNoteByIdHandler.bind(this);
    this.putNoteByIdHandler = this.putNoteByIdHandler.bind(this);
    this.deleteNoteByIdHandler = this.deleteNoteByIdHandler.bind(this);
  }

  async postNoteHandler(request, h) {
    this._validator.validateNotePayload(request.payload);
    const { title = "untitled", body, tags } = request.payload;

    const noteId = await this._service.addNote({ title, body, tags });

    const response = h.response({
      status: "success",
      message: "Catatan berhasil ditambahkan",
      data: {
        noteId,
      },
    });
    response.code(201);
    return response;
  }

  async getNotesHandler() {
    const notes = await this._service.getNotes();
    return {
      status: "success",
      data: {
        notes,
      },
    };
  }

  async getNoteByIdHandler(request, h) {
    const { id } = request.params;
    const note = await this._service.getNoteById(id);
    return {
      status: "success",
      data: {
        note,
      },
    };
  }

  async putNoteByIdHandler(request, h) {
    this._validator.validateNotePayload(request.payload);
    const { id } = request.params;

    await this._service.editNoteById(id, request.payload);

    return {
      status: "success",
      message: "Catatan berhasil diperbarui",
    };
  }

  async deleteNoteByIdHandler(request, h) {
    const { id } = request.params;
    await this._service.deleteNoteById(id);

    return {
      status: "success",
      message: "Catatan berhasil dihapus",
    };
  }
}

module.exports = NotesHandler;
