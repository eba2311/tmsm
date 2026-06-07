const { sequelize } = require('../src/config/database');
const { QueryInterface, DataTypes } = require('sequelize');

async function addPassengerFields() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const queryInterface = sequelize.getQueryInterface();

    // Check if columns exist before adding them
    const tableDesc = await queryInterface.describeTable('users');
    
    const columnsToAdd = [
      {
        name: 'address',
        definition: {
          type: DataTypes.TEXT,
          allowNull: true
        }
      },
      {
        name: 'date_of_birth',
        definition: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        name: 'gender',
        definition: {
          type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
          allowNull: true
        }
      },
      {
        name: 'emergency_contact',
        definition: {
          type: DataTypes.STRING,
          allowNull: true
        }
      },
      {
        name: 'emergency_phone',
        definition: {
          type: DataTypes.STRING,
          allowNull: true
        }
      },
      {
        name: 'total_trips',
        definition: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          allowNull: false
        }
      },
      {
        name: 'status',
        definition: {
          type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED'),
          defaultValue: 'ACTIVE',
          allowNull: false
        }
      }
    ];

    for (const column of columnsToAdd) {
      if (!tableDesc[column.name]) {
        console.log(`Adding column: ${column.name}`);
        await queryInterface.addColumn('users', column.name, column.definition);
        console.log(`✅ Added column: ${column.name}`);
      } else {
        console.log(`⏭️  Column already exists: ${column.name}`);
      }
    }

    console.log('✅ All passenger fields added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding passenger fields:', error);
    process.exit(1);
  }
}

addPassengerFields();