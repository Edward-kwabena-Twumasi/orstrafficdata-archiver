const Db = require('../models/Response')

const db = Db.sequelize;
const Response = Db.TrafficResponse

const initializeDb = async () => {
  try {
    await db.sync();
    console.log('Database initialized and synced with models.');
  } catch (error) {
    console.log('Error initializing the database:', error);
  }
};

module.exports = {
  initializeDb,
  Response
}
