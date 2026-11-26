import { createApp } from './app.js';
import { readConfig } from './config.js';
import { openDatabase } from './infrastructure/sqlite.js';

const config = readConfig(process.env);
const database = openDatabase(config.dbPath, config.migrationsDirectory);
const app = createApp(database, config);
const server = app.listen(config.port, config.host, () => {
  console.log(`Radar is listening at http://${config.host}:${config.port}`);
});

function stop() {
  server.close(() => database.close());
}

process.once('SIGTERM', stop);
process.once('SIGINT', stop);
