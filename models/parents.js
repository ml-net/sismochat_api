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
    pwd: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'parents',
  });
  parents.beforeCreate(p => p.id = uuid.v4());
  return parents;
};
