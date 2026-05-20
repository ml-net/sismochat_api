'use strict';

const DEFAULT_PERMISSIONS = JSON.stringify({ audio: true, sticker: true });

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'permissions', {
      type: Sequelize.JSON,
      defaultValue: DEFAULT_PERMISSIONS,
      allowNull: false
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'permissions');
  }
};
