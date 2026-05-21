'use strict';
const uuid = require('uuid');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class parents extends Model {
    static associate(models) {
      parents.hasMany(models.users, { foreignKey: 'parent', as: 'children' });
    }
  }
  parents.init({
    email: DataTypes.STRING,
    pwd: DataTypes.STRING,
    resetOtp: DataTypes.STRING,
    resetOtpExpiry: DataTypes.DATE,
    resetOtpAttempts: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'parents',
  });
  parents.beforeCreate(p => { if (!p.id) p.id = uuid.v4(); });
  return parents;
};
