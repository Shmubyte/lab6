
import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));



const pool = mysql.createPool({
    host: "l9dwvv6j64hlhpul.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "lqrt41dptohhuhal",
    password: "n2dv9gi8gs2prjui",
    database: "vah4p2hwhu2dyt9z",
    connectionLimit: 10,
    waitForConnections: true
});

// home page
app.get('/', async (req, res) => {
    let sql = `SELECT authorId, firstName, lastName
               FROM q_authors
               ORDER BY lastName`;
    const [rows] = await pool.query(sql);
    res.render("index", {"authors":rows});
});

// Display Authors
app.get("/authors", async (req, res) => {
    let sql = `SELECT authorId, firstName, lastName, dob, 
               DATE_FORMAT(dob, '%Y-%m-%d') as dobFormatted
               FROM q_authors
               ORDER BY lastName`;
    const [rows] = await pool.query(sql);
    res.render("authors", {"authors": rows});
});

// Display New Author Form
app.get("/author/new", (req, res) => {
    res.render("newAuthor", {"message": null});
});

app.post("/author/new", async (req, res) => {
    let fName = req.body.fName;
    let lName = req.body.lName;
    let birthDate = req.body.birthDate || null;
    let deathDate = req.body.deathDate || null;
    let country = req.body.birthPlace || null;
    let sex = req.body.sex || null;
    let profession = req.body.profession || null;
    let portrait = req.body.portrait || null;
    let bio = req.body.bio || null;
    
    let sql = `INSERT INTO q_authors
               (firstName, lastName, dob, dod, country, sex, profession, portrait, biography)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    let params = [fName, lName, birthDate, deathDate, country, sex, profession, portrait, bio];
    
    await pool.query(sql, params);
    res.render("newAuthor", {"message": "Author added successfully!"});
});

// Display Edit Author Form
app.get("/author/edit", async (req, res) => {
    let authorId = req.query.authorId;
    
    let sql = `SELECT authorId, firstName, lastName,
               DATE_FORMAT(dob, '%Y-%m-%d') as dob
               FROM q_authors
               WHERE authorId = ?`;
    const [rows] = await pool.query(sql, [authorId]);
    
    res.render("editAuthor", {"author": rows[0], "message": null});
});

// Edit Author Submission
app.post("/author/edit", async (req, res) => {
    let authorId = req.body.authorId;
    let fName = req.body.fName;
    let lName = req.body.lName;
    let birthDate = req.body.birthDate;
    
    let sql = `UPDATE q_authors
               SET firstName = ?, lastName = ?, dob = ?
               WHERE authorId = ?`;
    let params = [fName, lName, birthDate, authorId];
    
    await pool.query(sql, params);
    
    let selectSql = `SELECT authorId, firstName, lastName,
                     DATE_FORMAT(dob, '%Y-%m-%d') as dob
                     FROM q_authors
                     WHERE authorId = ?`;
    const [rows] = await pool.query(selectSql, [authorId]);
    
    res.render("editAuthor", {
        "author": rows[0], 
        "message": "Author updated successfully!"
    });
});

// Delete Author
app.get("/author/delete", async (req, res) => {
    let authorId = req.query.authorId;
    
    let sql = `DELETE FROM q_authors WHERE authorId = ?`;
    await pool.query(sql, [authorId]);
    
    res.redirect("/authors");
});

// Display All Quotes
app.get("/quotes", async (req, res) => {
    let sql = `SELECT q.quoteId, q.quote, q.authorId, q.category,
               a.firstName, a.lastName
               FROM q_quotes q
               LEFT JOIN q_authors a ON q.authorId = a.authorId
               ORDER BY q.quoteId DESC`;
    const [rows] = await pool.query(sql);
    res.render("quotes", {"quotes": rows});
});

// Display form to add new quote
app.get("/quote/new", async (req, res) => {
    let authorSql = `SELECT authorId, firstName, lastName 
                     FROM q_authors 
                     ORDER BY lastName`;
    const [authors] = await pool.query(authorSql);
    
    let categorySql = `SELECT DISTINCT category 
                       FROM q_quotes 
                       WHERE category IS NOT NULL 
                       ORDER BY category`;
    const [categories] = await pool.query(categorySql);
    
    res.render("newQuote", {
        "authors": authors,
        "categories": categories,
        "message": null
    });
});

// New Quote Submission
app.post("/quote/new", async (req, res) => {
    let quote = req.body.quote;
    let authorId = req.body.authorId;
    let category = req.body.category;
    
    let sql = `INSERT INTO q_quotes (quote, authorId, category)
               VALUES (?, ?, ?)`;
    let params = [quote, authorId, category];
    
    await pool.query(sql, params);
    
    let authorSql = `SELECT authorId, firstName, lastName 
                     FROM q_authors 
                     ORDER BY lastName`;
    const [authors] = await pool.query(authorSql);
    
    let categorySql = `SELECT DISTINCT category 
                       FROM q_quotes 
                       WHERE category IS NOT NULL 
                       ORDER BY category`;
    const [categories] = await pool.query(categorySql);
    
    res.render("newQuote", {
        "authors": authors,
        "categories": categories,
        "message": "Quote added successfully!"
    });
});

// Display Edit Quote Form
app.get("/quote/edit", async (req, res) => {
    let quoteId = req.query.quoteId;
    
    let quoteSql = `SELECT quoteId, quote, authorId, category
                    FROM q_quotes
                    WHERE quoteId = ?`;
    const [quoteRows] = await pool.query(quoteSql, [quoteId]);
    
    let authorSql = `SELECT authorId, firstName, lastName 
                     FROM q_authors 
                     ORDER BY lastName`;
    const [authors] = await pool.query(authorSql);
    
    let categorySql = `SELECT DISTINCT category 
                       FROM q_quotes 
                       WHERE category IS NOT NULL 
                       ORDER BY category`;
    const [categories] = await pool.query(categorySql);
    
    res.render("editQuote", {
        "quote": quoteRows[0],
        "authors": authors,
        "categories": categories,
        "message": null
    });
});

// Editing quote
app.post("/quote/edit", async (req, res) => {
    let quoteId = req.body.quoteId;
    let quote = req.body.quote;
    let authorId = req.body.authorId;
    let category = req.body.category;
    
    let sql = `UPDATE q_quotes
               SET quote = ?, authorId = ?, category = ?
               WHERE quoteId = ?`;
    let params = [quote, authorId, category, quoteId];
    
    await pool.query(sql, params);
    
    let quoteSql = `SELECT quoteId, quote, authorId, category
                    FROM q_quotes
                    WHERE quoteId = ?`;
    const [quoteRows] = await pool.query(quoteSql, [quoteId]);
    
    let authorSql = `SELECT authorId, firstName, lastName 
                     FROM q_authors 
                     ORDER BY lastName`;
    const [authors] = await pool.query(authorSql);
    
    let categorySql = `SELECT DISTINCT category 
                       FROM q_quotes 
                       WHERE category IS NOT NULL 
                       ORDER BY category`;
    const [categories] = await pool.query(categorySql);
    
    res.render("editQuote", {
        "quote": quoteRows[0],
        "authors": authors,
        "categories": categories,
        "message": "Quote updated successfully!"
    });
});

// Delete Quote
app.get("/quote/delete", async (req, res) => {
    let quoteId = req.query.quoteId;
    
    let sql = `DELETE FROM q_quotes WHERE quoteId = ?`;
    await pool.query(sql, [quoteId]);
    
    res.redirect("/quotes");
});

app.get("/dbTest", async(req, res) => {
    let sql = "SELECT * FROM q_authors";
    const [rows] = await pool.query(sql);
    res.send(rows);
});

app.listen(3000, ()=>{
    console.log("Express server running on port 3000");
});