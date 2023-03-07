'use strict';
const uuid = require('uuid');
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
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