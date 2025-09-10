/* eslint-disable no-irregular-whitespace */
/* eslint-disable linebreak-style */
const routes = (handler) => [
  {
    method: 'GET',
    path: '/users',
    handler: handler.getUsersByUsernameHandler,
  },
  {
    method: 'POST',
    path: '/users',
    handler: handler.postUserHandler,
  },
  {
    method: 'GET',
    path: '/users/{id}',
    handler: handler.getUserByIdHandler,
  },

];

module.exports = routes;
