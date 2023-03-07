'use strict';
const uuid = require('uuid');
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class messages extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  messages.init({
    from: DataTypes.UUID,
    to: DataTypes.UUID,
    body: DataTypes.TEXT,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'messages',
  });
  messages.beforeCreate(m => m.id = uuid.v4());
  return messages;
};