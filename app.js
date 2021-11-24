const express = require("express");
const app = express();
const fs = require ('fs');
const json = require ('json');
const multipart = require ('multipart');
const path = require("path");

const multer = require('multer');
const upload = multer();
const bodyParser = require('body-parser');
const formidable = require('express-formidable');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(upload.array()); 

app.use(express.static('public')); 

app.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}.`);
});


app.get("/", function (request, response) {
    response.send(`
    <h2>Home</h2>
    <div>
        <nav>
        <ul>
            <li>
                <a href="/">Home</a>
            </li>
            <li>
                <a href="/register">User registration</a>
            </li>
            <li>
                <a href="/users">List of users</a>
            </li>
        </ul>
        </nan>
    </div>
    `);
});

app.get("/register", (req, res) => {
res.sendFile(path.resolve(__dirname,  'public',  'register.html'));
});

  

app.post("/register", function (request, response) {

    const validationErr = validateRequest(request.body);
    if (validationErr) {
        response.send(`<h2>${validationErr}</h2>`);
        return;
    }
    var email = request.body.email;
    var name = request.body.name;
    var surname = request.body.surname;
    var age = request.body.age;
    age = parseInt(age);



    db.serialize(function () {
        db.run("CREATE TABLE if not exists users (email TEXT, name TEXT, surname TEXT, age TEXT)");

        db.run('INSERT INTO users(email, name, surname, age) VALUES(?, ?, ?, ?)', [email, name, surname, age], (err) => {
            if (err) {
                return console.log(err.message);
            }
            console.log('Row was added to the table');
        })

        db.each("SELECT * FROM users", function (err, row) {
            console.log(row.email + " " + row.name);
        });
    });


    response.send(`
    <h2>OK</h2>
    <div>
        <nav>
        <ul>
            <li>
                <a href="/">Home</a>
            </li>

            <li>
                <a href="/users">List of users</a>
            </li>
        </ul>
        </nan>
    </div>
    `);
});


app.get("/users", function (request, response) {

    var emails = request.query.email ? request.query.email.split(',') : ''; 

    let ors = '';
    if(emails){
        emails.forEach(email => {
            ors += ' email = "' + email + '" OR ';
        }); 
        ors = ors.substr (0, ors.length - 4);
    }else{
        ors  = ' email like "%" ';
    }
    

    db.serialize(async function () {

        db.all("SELECT * FROM users where " + ors, [], function (err, rows) {
            if (err) {
                return console.log(err.message);
            }
            let tableHtml = `
              <table style='font-size: 18px'>
            <tr style='color: green; font-size: 24px'>
                <th><i>№</i></th>
                <th>Email</th>
                <th>Name</th>
                <th>Surname</th>
                <th>Age</th>
            </tr>`;
            rows.forEach((row, i) => {
                let rowHtml = '<tr>';
                rowHtml += '<td style="padding: 10px 25px;">' + (i + 1) + '</td>';
                rowHtml += '<td style="padding: 10px 25px;">' + row.email + '</td>';
                rowHtml += '<td style="padding: 10px 25px;">' + row.name + '</td>';
                rowHtml += '<td style="padding: 10px 25px;">' + row.surname + '</td>';
                rowHtml += '<td style="padding: 10px 25px;">' + row.age + '</td>';
                rowHtml += '</tr>';
                tableHtml += rowHtml; 
            });
            tableHtml += '</table>';

            response.send(tableHtml);    
        });
        
    });

});


function validateRequest(query) {
    if (!query.email) {
        return 'Email is required';
    }
    if (!query.name) {
        return 'Name is required';
    }
    if (!query.surname) {
        return 'Surname is required';
    }
    if (!query.age) {
        return 'Age is required';
    }
    const age = parseInt(query.age);
    if (age < 18) {
        return 'Age must be more or equal 18';
    }
}
