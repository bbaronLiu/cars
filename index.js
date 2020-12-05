// Load packages and access services
const express = require("express");
const app = express();
const multer = require("multer");
const upload = multer();
// Add packages
const dblib = require("./dblib.js");

dblib.getTotalRecords()
    .then(result => {
        if (result.msg.substring(0, 5) === "Error") {
            console.log(`Error Encountered.  ${result.msg}`);
        } else {
            console.log(`Total number of database records: ${result.totRecords}`);
        };
    })
    .catch(err => {
        console.log(`Error: ${err.message}`);
    });


// Add packages
require("dotenv").config();
// Add database package and connection string
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
      rejectUnauthorized: false
  }
});

//Testing Database Query

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error', err.stack)
  }
  client.query('SELECT * FROM car', (err, result) => {
    release()
    if (err) {
      return console.error('Error executing query', err.stack)
    }
    console.log(result.rows)
  })
})

// Setup view engine to ejs
app.set('view engine', 'ejs');

// Serve static content directly
app.use(express.static("css"));

// Add middleware to parse default urlencoded form
app.use(express.urlencoded({ extended: false }));

// Enable CORS (see https://enable-cors.org/server_expressjs.html)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });

// Setup routes

app.get('/', (req, res) => res.render('index'));


const findProducts = (product) => {
  // Will build query based on data provided from the form
  //  Use parameters to avoid sql injection

  // Declare variables
  var i = 1;
  params = [];
  sql = "SELECT * FROM car WHERE true";

  // Check data provided and build query as necessary
  if (car.carvin!== "") {
      params.push(parseInt(car.carvin));
      sql += ` AND carvin = $${i}`;
      i++;
  };
  if (car.carmake !== "") {
      params.push(`${car.carmake}%`);
      sql += ` AND UPPER(carmake) LIKE UPPER($${i})`;
      i++;
  };
  if (car.carmodel !== "") {
      params.push(`${car.carmodel}%`);
      sql += ` AND UPPER(carmodel) LIKE UPPER($${i})`;
      i++;
  };
  if (car.carmileage !== "") {
      params.push(parseFloat(car.carmileage));
      sql += ` AND carmileage >= $${i}`;
      i++;
  };

  sql += ` ORDER BY carvin`;
  // for debugging
   console.log("sql: " + sql);
   console.log("params: " + params);

  return pool.query(sql, params)
      .then(result => {
          return { 
              trans: "success",
              result: result.rows
          }
      })
      .catch(err => {
          return {
              trans: "Error",
              result: `Error: ${err.message}`
          }
      });
};

app.get("index", async (req, res) => {
  // Omitted validation check
  const totRecs = await dblib.getTotalRecords();
  res.render("index", {
      type: "get",
      totRecs: totRecs.totRecords
  });
});

app.post("index", async (req, res) => {
  // Omitted validation check
  //  Can get this from the page rather than using another DB call.
  //  Add it as a hidden form value.
  const totRecs = await dblib.getTotalRecords();

  dblib.findProducts(req.body)
      .then(result => {
          res.render("index", {
              type: "post",
              totRecs: totRecs.totRecords,
              result: result,
              prod: req.body
          })
      })
      .catch(err => {
          res.render("index", {
              type: "post",
              totRecs: totRecs.totRecords,
              result: `Unexpected Error: ${err.message}`,
              prod: req.body
          });
      });
});

// Add towards the bottom of the page
module.exports.findProducts = findProducts;


// Start listening to incoming requests
// If process.env.PORT is not defined, port number 3000 is used
const listener = app.listen(process.env.PORT || 3000, () => {
    console.log(`Your app is listening on port ${listener.address().port}`);
});
