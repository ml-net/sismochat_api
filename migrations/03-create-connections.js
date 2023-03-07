'use strict';

const { DataTypes } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('connections', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID
      },
      from: {
        type: DataTypes.UUID
      },
      to: {
        type: DataTypes.UUID
      },
      status: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('connections');
  }
};