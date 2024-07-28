import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "admin@123",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currUser = 1;

var users=[];

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries where user_code=$1", [currUser]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  users=await db.query("select * from users");
  //console.log(currUser);
  const colourful=await db.query("select color from users where id=$1",[currUser]);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users.rows,
    color: colourful.rows[0].color,
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name)=$1",
      [input.toLowerCase()]
    );
    //console.log(result.rows);
    //console.log(typeof(result.rows[0].country_code));
    if(result.rows.length==0){
      res.redirect("/");
    }
    else{
      const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_code) VALUES ($1, $2)",
        [countryCode, currUser]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } 
    }
    catch (err) {
      console.log(err);
    }
    
});
app.post("/user", async (req, res) => {

  currUser=req.body.user;
  //console.log(currUser)
  if(req.body.add=="new"){
    res.render("new.ejs");
  }
  users=await db.query("select * from users");
  const colourful=await db.query("select color from users where id=$1",[currUser]);
  const result = await db.query("select country_code from users join visited_countries on users.id=visited_countries.user_code where users.id=$1"
    ,[currUser]
  );
  var countries=[];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  //console.log(colourful.rows[0].color);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users.rows,
    color: colourful.rows[0].color,
  });

});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
    //console.log(req.body);
    db.query("insert into users(user_name, color) values ($1,$2)",[req.body.name, req.body.color]);
    res.redirect("/");

});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
