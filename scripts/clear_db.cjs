require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB. Clearing all collections...');
    
    // Clear employees
    const empResult = await mongoose.connection.collection('employees').deleteMany({});
    console.log(`Deleted ${empResult.deletedCount} employees.`);

    // Clear deliveries
    const delResult = await mongoose.connection.collection('deliveryrequests').deleteMany({});
    console.log(`Deleted ${delResult.deletedCount} delivery requests.`);

    // Clear robot status
    const statusResult = await mongoose.connection.collection('robotstatuses').deleteMany({});
    console.log(`Deleted ${statusResult.deletedCount} robot statuses.`);

    console.log('Database cleanup complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
