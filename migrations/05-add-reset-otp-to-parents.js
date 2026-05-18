'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('parents', 'resetOtp', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('parents', 'resetOtpExpiry', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('parents', 'resetOtpAttempts', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.removeColumn('parents', 'resetOtp');
    await queryInterface.removeColumn('parents', 'resetOtpExpiry');
    await queryInterface.removeColumn('parents', 'resetOtpAttempts');
  }
};
