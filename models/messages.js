'use strict';
const crypto = require('crypto');


const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class messages extends Model {
    static associate(models) {
      messages.belongsTo(models.users, { foreignKey: 'from', as: 'sender' });
      messages.belongsTo(models.users, { foreignKey: 'to', as: 'recipient' });
    }
  }
  messages.init({
    from: DataTypes.UUID,
    to: DataTypes.UUID,
    body: DataTypes.TEXT,
    status: DataTypes.INTEGER,
    type: { type: DataTypes.STRING, defaultValue: 'user' }
  }, {
    sequelize,
    modelName: 'messages',
  });
  messages.beforeCreate(m => { if (!m.id) m.id = crypto.randomUUID(); });
  return messages;
};
