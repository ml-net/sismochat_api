'use strict';

const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class users extends Model {
    static associate(models) {
      users.belongsTo(models.parents, { foreignKey: 'parent', as: 'parentAccount' });
      users.hasMany(models.messages, { foreignKey: 'from', as: 'sentMessages' });
      users.hasMany(models.messages, { foreignKey: 'to', as: 'receivedMessages' });
      users.hasOne(models.devices, { foreignKey: 'userid', as: 'device' });
    }
  }
  users.init({
    nick: DataTypes.STRING,
    parent: DataTypes.UUID,
    key: DataTypes.STRING,
    permissions: {
      type: DataTypes.JSON,
      defaultValue: { audio: true, sticker: true }
    }
  }, {
    sequelize,
    modelName: 'users',
  });
  users.beforeCreate(user => { if (!user.id) user.id = crypto.randomUUID(); });
  return users;
};
