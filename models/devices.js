'use strict';
const uuid = require('uuid');
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class devices extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  devices.init({
    deviceid: DataTypes.STRING,
    userid: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'devices',
  });
  devices.beforeCreate(d => d.id = uuid.v4());
  return devices;
};