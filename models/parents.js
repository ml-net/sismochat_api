'use strict';

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
  parents.beforeCreate(p => { if (!p.id) p.id = crypto.randomUUID(); });
  return parents;
};
