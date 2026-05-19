'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('messages', 'type', {
      type: Sequelize.STRING,
      defaultValue: 'user',
      allowNull: false
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('messages', 'type');
  }
};
