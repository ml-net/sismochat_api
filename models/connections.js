'use strict';
const crypto = require('crypto');


const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class connections extends Model {
    static associate(models) {
      connections.belongsTo(models.users, { foreignKey: 'from', as: 'requester' });
      connections.belongsTo(models.users, { foreignKey: 'to', as: 'target' });
    }
  }
  connections.init({
    from: DataTypes.UUID,
    to: DataTypes.UUID,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'connections',
  });
  connections.beforeCreate(c => { if (!c.id) c.id = crypto.randomUUID(); });
  return connections;
};
