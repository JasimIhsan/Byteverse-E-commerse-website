const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("welcome to the server");
});

app.get("/sum/:n1/:n2", (req, res) => {
    let b = req.params.n1;
    let c = req.params.n2;
    let sum = Number(b) + Number(c);
    res.send(`Sum : ${sum}`);
});

app.listen(7005);