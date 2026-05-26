'use strict';
const crypto = require('crypto');


const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class devices extends Model {
    static associate(models) {
      devices.belongsTo(models.users, { foreignKey: 'userid', as: 'user' });
    }
  }
  devices.init({
    userid: DataTypes.UUID,
    pushSubscription: DataTypes.JSON,
  }, {
    sequelize,
    modelName: 'devices',
  });
  devices.beforeCreate(d => { if (!d.id) d.id = crypto.randomUUID(); });
  return devices;
};
