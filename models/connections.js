'use strict';
const uuid = require('uuid');
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class connections extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  connections.init({
    from: DataTypes.UUID,
    to: DataTypes.UUID,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'connections',
  });
  connections.beforeCreate(c => c.id = uuid.v4());
  return connections;
};