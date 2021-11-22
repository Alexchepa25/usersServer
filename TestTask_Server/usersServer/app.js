const express = require("express");
const app = express();

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

app.get("/register", function (request, response) {

    const validationErr = validateRequest(request.query);
    if (validationErr) {
        response.send(`<h2>${validationErr}</h2>`);
    }
    var email = request.query.email;
    var name = request.query.name;
    var surname = request.query.surname;
    var age = request.query.age;
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

    response.send("<h2>ok</h2>");
});


app.get("/users", function (request, response) {

    if (!request.query.email) {
        response.send(`<h2>Email is required</h2>`);
    }


    var emails = request.query.email.split(',');
 
    let ors = '';
    emails.forEach(email => {
        ors += ' email = "' + email + '" OR ';
    }); 
    ors = ors.substr (0, ors.length - 4);


    db.serialize(async function () {

        db.all("SELECT * FROM users where " + ors, [], function (err, rows) {
            if (err) {
                return console.log(err.message);
            }
            console.log(rows.email + " " + rows.name);
            response.send(rows);    
        });
        
    });

});

app.listen(3000);


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