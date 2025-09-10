const { validateNotePayload } = require('../../validator/notes');
const ClientError = require('../../exceptions/ClientError');

/* eslint-disable class-methods-use-this */
// karena sudah memakai postgres kita akan
// menambahkan keyword async pada seluruh fungsi handler dan tambahkan keyword await pada setiap penggunaan fungsi dari service
class NotesHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postNoteHandler = this.postNoteHandler.bind(this);
    this.getNotesHandler = this.getNotesHandler.bind(this);
    this.getNoteByIdHandler = this.getNoteByIdHandler.bind(this);
    this.putNoteByIdHandler = this.putNoteByIdHandler.bind(this);
    this.deleteNoteByIdHandler = this.deleteNoteByIdHandler.bind(this);
     this.getUsersByUsernameHandler = this.getUsersByUsernameHandler.bind(this);
  }

  async postNoteHandler(request, h) {
    this._validator.validateNotePayload(request.payload);
    const { title = 'untitled', body, tags } = request.payload;

    //request auth itu isinya adalah kembalian dari validate pada server.auth.strategy pada serveer.js 
    const { id: credentialId } = request.auth.credentials;
    const noteId = await this._service.addNote({
      title, body, tags, owner: credentialId,
    });

    // const noteId = await this._service.addNote({ title, body, tags });

    const response = h.response({
      status: 'success',
      message: 'Catatan berhasil ditambahkan',
      data: {
        noteId,
      },
    });
    response.code(201);
    return response;
  }

  async getNotesHandler(request) {
    // const notes = await this._service.getNotes();

    const { id: credentialId } = request.auth.credentials;
    const notes = await this._service.getNotes(credentialId);

    return {
      status: 'success',
      data: {
        notes,
      },
    };
  }

  async getNoteByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    //panggil fungsi verirynote owber sebelum ke service nya
//     await this._service.verifyNoteOwner(id, credentialId);

    await this._service.verifyNoteAccess(id, credentialId);

    const note = await this._service.getNoteById(id);
    return {
      status: 'success',
      data: {
        note,
      },
    };
  }

  async putNoteByIdHandler(request, h) {
    this._validator.validateNotePayload(request.payload);
    const { id } = request.params;
    const { id: credentialId} = request.auth.credentials;
    //panggil fungsi verrifynote owner
    // await this._service.verifyNoteOwner(id, credentialId);
    
    await this._service.verifyNoteAccess(id, credentialId);


    await this._service.editNoteById(id, request.payload);

    return {
      status: 'success',
      message: 'Catatan berhasil diperbarui',
    };
  }

  async deleteNoteByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    //panggil fungsi veerify note owner
    await this._service.verifyNoteOwner(id, credentialId);

    await this._service.deleteNoteById(id);

    return {
      status: 'success',
      message: 'Catatan berhasil dihapus',
    };
  }

  async getUsersByUsernameHandler(request, h) {
    const { username = '' } = request.query;
    const users = await this._service.getUsersByUsername(username);
    return {
      status: 'success',
      data: {
        users,
      },
    };
  }
}

module.exports = NotesHandler;
