'use strict';
const uuid = require('uuid');
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
    key: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'users',
  });
  users.beforeCreate(user => user.id = uuid.v4());
  return users;
};
