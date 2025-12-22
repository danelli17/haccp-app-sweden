const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite::memory:', {
  dialect: process.env.DATABASE_URL ? 'postgres' : 'sqlite',
  logging: false,
  dialectOptions: {
    ssl: process.env.DATABASE_URL ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  storage: path.join(__dirname, 'database.sqlite'), // Only used for SQLite
});

const TemperatureLog = sequelize.define('TemperatureLog', {
  equipmentName: { type: DataTypes.STRING, allowNull: false },
  temperature: { type: DataTypes.FLOAT, allowNull: false },
  unit: { type: DataTypes.STRING, defaultValue: '°C' },
  staffName: { type: DataTypes.STRING, allowNull: false },
  isDeviation: { type: DataTypes.BOOLEAN, defaultValue: false },
  correctiveAction: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('Normal', 'Deviation', 'Resolved'), defaultValue: 'Normal' }
});

const CCP = sequelize.define('CCP', {
  name: { type: DataTypes.STRING, allowNull: false },
  minLimit: { type: DataTypes.FLOAT },
  maxLimit: { type: DataTypes.FLOAT },
  description: { type: DataTypes.TEXT }
});

const GoodsReceipt = sequelize.define('GoodsReceipt', {
  supplierName: { type: DataTypes.STRING, allowNull: false },
  productType: { type: DataTypes.STRING, allowNull: false },
  temperature: { type: DataTypes.FLOAT },
  packagingOk: { type: DataTypes.BOOLEAN, defaultValue: true },
  receivedBy: { type: DataTypes.STRING, allowNull: false },
  notes: { type: DataTypes.TEXT }
});

const CleaningTask = sequelize.define('CleaningTask', {
  title: { type: DataTypes.STRING, allowNull: false },
  frequency: { type: DataTypes.ENUM('Daily', 'Weekly'), defaultValue: 'Daily' },
  area: { type: DataTypes.STRING }
});

const CleaningLog = sequelize.define('CleaningLog', {
  staffName: { type: DataTypes.STRING, allowNull: false }
});

CleaningTask.hasMany(CleaningLog);
CleaningLog.belongsTo(CleaningTask);

const initDb = async () => {
  await sequelize.sync({ force: true });
  
  // Seed initial CCPs for a typical Swedish restaurant
  await CCP.bulkCreate([
    { name: 'Kylskåp (Fridge)', maxLimit: 8, description: 'Standard cold storage' },
    { name: 'Frys (Freezer)', maxLimit: -18, description: 'Frozen storage' },
    { name: 'Varmhållning (Hot Holding)', minLimit: 60, description: 'Food kept hot for service' },
    { name: 'Nedkylning (Cooling)', description: 'Cooling from 60°C to 8°C within 4 hours' }
  ]);

  // Seed Cleaning Tasks
  await CleaningTask.bulkCreate([
    { title: 'Rengör arbetsbänkar (Clean benches)', frequency: 'Daily', area: 'Kitchen' },
    { title: 'Töm sopor (Empty trash)', frequency: 'Daily', area: 'General' },
    { title: 'Diskmaskin temp check', frequency: 'Daily', area: 'Dishwash' },
    { title: 'Storstädning kylar (Deep clean fridges)', frequency: 'Weekly', area: 'Kitchen' },
    { title: 'Rengör fläktfilter (Clean vent filters)', frequency: 'Weekly', area: 'Kitchen' }
  ]);
};

module.exports = { sequelize, TemperatureLog, CCP, GoodsReceipt, CleaningTask, CleaningLog, initDb };
