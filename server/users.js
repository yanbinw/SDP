import { database } from "./connect.js";

class Users {
    constructor() {
        this.database = database;
        this.user = [];
    }

    async init() {
        try {
            await this.database.connect();
        }
        catch (error) {
            console.error(error);
        }

        let userData = await this.database.readUser();
        this.user = userData;
    }

    findUser(name) {
        return this.user.some((x) => x.username === name);
    }

    validatePassword(name, pwd) {
        return this.user.some((x) => x.username === name && x.password === pwd);
    }

    addUser(name, pwd) {
        const badValue = [undefined, null, "", "none"];
        if (this.findUser(name) || badValue.some((x) => x === name || x === pwd)) {
            return false;
        }
        this.user.push({ username: name, password: pwd });
        this.database.writeUserData(name, pwd);
        return true;
    }
}

const users = new Users();
await users.init();

export { users };
