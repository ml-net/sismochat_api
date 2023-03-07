'use strict';
const uuid = require('uuid');
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class parents extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
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