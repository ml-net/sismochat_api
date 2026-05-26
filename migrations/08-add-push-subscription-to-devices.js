'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('devices', 'pushSubscription', {
      type: Sequelize.JSON,
      allowNull: true
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('devices', 'pushSubscription');
  }
};
