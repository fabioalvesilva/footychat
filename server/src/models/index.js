// Centralizar a exportação de todos os models
// Isto facilita a importação em outros ficheiros

const User = require('./User');
const Group = require('./Group');
const Game = require('./Game');
const Field = require('./Field');
const Message = require('./Message');
const Notification = require('./Notification');

module.exports = {
  User,
  Group,
  Game,
  Field,
  Message,
  Notification
};