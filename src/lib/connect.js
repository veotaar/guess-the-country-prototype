import mongoose from 'mongoose';

const writeConcern = new mongoose.mongo.WriteConcern('majority');

const connect = async () => {
  const dbString = process.env.DB_STRING;

  try {
    await mongoose.connect(dbString, {
      dbName: process.env.DB_NAME,
      retryWrites: true,
      writeConcern: writeConcern,
    });
    console.log('Connected to DB');
  } catch (error) {
    console.log('could not connect to db');
    console.log(error);
    process.exit(1);
  }
};

export default connect;
