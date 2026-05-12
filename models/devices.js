'use strict';
const uuid = require('uuid');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class devices extends Model {
    static associate(models) {
      devices.belongsTo(models.users, { foreignKey: 'userid', as: 'user' });
    }
  }
  devices.init({
    userid: DataTypes.UUID,
  }, {
    sequelize,
    modelName: 'devices',
  });
  devices.beforeCreate(d => d.id = uuid.v4());
  return devices;
};
