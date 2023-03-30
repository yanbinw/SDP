import { database } from "./connect.js";
import { users } from "./users.js";

import auth from "./auth.js";

import { fileURLToPath } from "url";
import { dirname } from "path";

import express from "express";
import expressSession from "express-session";
import logger from "morgan";

import "dotenv/config";

// We will use __dirname later on to send files back to the client.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(dirname(__filename));

const app = express();
const port = process.env.PORT || 62300;

const sessionConfig = {
    secret: process.env.SECRET || "SECRET",
    resave: false,
    saveUninitialized: false
}

app.use(expressSession(sessionConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger("dev"));
app.use("/", express.static("client"));

auth.configure(app);

const headerFields = { "Content-Type": "application/json" };
const badValue = [undefined, null, "", "none"];

try {
    await database.connect();
}
catch (error) {
    console.error(error);
}

/**
 * @param {express.Request} request
 * @param {express.Response} response
 * @param {express.NextFunction} next
 */
function checkLoggedIn(request, response, next) {
    if (request.isAuthenticated()) {
        next();
    }
    else {
        response.redirect("/login");
    }
}

/**
 * @param {express.Request} request
 * @param {express.Response} response
 * @param {express.NextFunction} next
 */
function checkLoggedOut(request, response, next) {
    request.logout(
        (error) => {
            if (error) {
                return next(error);
            }
            response.redirect("/");
        }
    );
}

/**
 * @param {http.ServerResponse} response
 * @param {string} name
 */
async function postItemByName(response, name) {
    if (badValue.some((x) => x === name)) {
        response.writeHead(400, headerFields);
        response.write(JSON.stringify({ "status": "bad request" }));
        response.end();
    }
    else {
        let storage = await database.searchItemByName(name);
        response.writeHead(200, headerFields);
        response.write(JSON.stringify(storage));
        response.end();

    }
}

/**
 * @param {http.ServerResponse} response
 */
async function postAllItemName(response) {
    let storage = await database.getAllItemName();
        response.writeHead(200, headerFields);
        response.write(JSON.stringify(storage));
        response.end();
}

app.post("/", (request, response) => response.redirect("/"));

app.get("/", (request, response) => response.sendFile("client/index.html", { root: __dirname }));

app.get("/login", (request, response) => response.sendFile("client/login.html", { root: __dirname }));

app.post(
    "/login",
    auth.authenticate(
        "local",
        {
            // use username/password authentication
            successRedirect: "/private", // when we login, go to /private
            failureRedirect: "/login", // otherwise, back to login
        }
    )
);

app.post("/logout", (request, response) => response.redirect("/logout"));

app.get("/logout", checkLoggedOut);

app.post(
    "/register",
    (request, response) => {
        const { username, password } = request.body;
        if (users.addUser(username, password)) {
            response.redirect("/login");
        }
        else {
            response.redirect("/register");
        }
    }
);

app.get("/register", (request, response) => { response.sendFile("client/register.html", { root: __dirname }) });

app.get(
    "/private",
    checkLoggedIn,
    (request, response) => {
        response.redirect("/private/" + request.user);
    }
);

app.get(
    "/private/:userID/",
    checkLoggedIn,
    (request, response) => {
        if (request.params.userID === request.user) {
            response.sendFile("client/private.html", { root: __dirname });
        }
        else {
            response.redirect("/private");
        }
    }
);

app.post(
    "/item",
    (request, response) => {
        const { itemID } = request.body;
        // console.log(request.body);
        response.redirect("/item/" + itemID);
    }
);

app.get(
    "/item",
    checkLoggedIn,
    (request, response) => {
        response.redirect("/itemNotFound");
    }
);

app.get(
    "/item/:itemID/",
    checkLoggedIn,
    (request, response) => {
        response.sendFile("client/item.html", { root: __dirname });
    }
);

app.get(
    "/itemNotFound",
    checkLoggedIn,
    (request, response) => response.sendFile("client/itemNotFound.html", { root: __dirname })
);

app.post(
    "/searchItemByName",
    (request, response) => {
        const { name } = request.body;
        postItemByName(response, name);
    }
);

app.post(
    "/postAllItemName",
    (request, response) => {
        postAllItemName(response);
    }
);

// Start the server.
app.listen(port, () => console.log(`\nServer started on http://localhost:${port}`));
