import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'travel_app',
  connectionLimit: 10,
});

async function runQueries() {
  try {
    // 1. Create the database (if it doesn't exist)
    await pool.query('CREATE DATABASE IF NOT EXISTS travel_app');
    console.log('Database created or already exists');

    // 2. Use the travel_app database
    await pool.query('USE travel_app');
    console.log('Using travel_app database');

    // 3. Create the events table (if it doesn't exist)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        place VARCHAR(255) NOT NULL,
        gradient VARCHAR(50) NOT NULL,
        icon VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Events table created or already exists');

    // 4. Insert a sample event
    const [insertResult] = await pool.query(`
      INSERT INTO events (title, place, gradient, icon, date, time)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['Sample Event', 'Sample Place', 'from-purple-200 to-purple-100', 'plane', '2023-05-01', '14:30:00']);
    console.log('Sample event inserted, ID:', insertResult.insertId);

    // 5. Query all events
    const [allEvents] = await pool.query('SELECT * FROM events');
    console.log('All events:', allEvents);

    // 6. Query upcoming events
    const [upcomingEvents] = await pool.query(`
      SELECT * FROM events
      WHERE date >= CURDATE()
      ORDER BY date ASC, time ASC
    `);
    console.log('Upcoming events:', upcomingEvents);

    // 7. Query events for a specific date
    const specificDate = '2023-05-01';
    const [eventsOnDate] = await pool.query(`
      SELECT * FROM events
      WHERE date = ?
      ORDER BY time ASC
    `, [specificDate]);
    console.log(`Events on ${specificDate}:`, eventsOnDate);

    // 8. Update an event
    const eventIdToUpdate = 1;
    await pool.query(`
      UPDATE events
      SET title = ?, place = ?
      WHERE id = ?
    `, ['Updated Event', 'Updated Place', eventIdToUpdate]);
    console.log(`Event with ID ${eventIdToUpdate} updated`);

    // 9. Delete an event
    const eventIdToDelete = 2;
    await pool.query('DELETE FROM events WHERE id = ?', [eventIdToDelete]);
    console.log(`Event with ID ${eventIdToDelete} deleted`);

    // 10. Query events with pagination
    const page = 1;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;
    const [paginatedEvents] = await pool.query(`
      SELECT * FROM events
      ORDER BY date ASC, time ASC
      LIMIT ? OFFSET ?
    `, [pageSize, offset]);
    console.log(`Events (page ${page}):`, paginatedEvents);

  } catch (error) {
    console.error('Error executing queries:', error);
  } finally {
    await pool.end();
  }
}

runQueries();