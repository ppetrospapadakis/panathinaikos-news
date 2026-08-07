const dbPath = './backend/database.sqlite';
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        db.run("UPDATE articles SET title = 'Οριστική κίνηση για στόπερ στον Παναθηναϊκό - Εξετάζει τη λίστα ο Κοτσόλης' WHERE title LIKE '%Στη λίστα ο Κοτσόλης%'", function(err) {
            if (err) {
                return console.log(err.message);
            }
            console.log("Row(s) updated: " + this.changes);
        });
    }
});
