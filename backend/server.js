const express = require('express');
const app = express();
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

function generateRandomID(prefix) {
    prefix = prefix ? prefix : 'rnd';
    let dateSeed = new Date();
    let randomSeed = Math.random().toString(36).replace('0.', '');
    // console.log(`Random Seed result: ${randomSeed}`);
    return prefix + dateSeed.getMonth() + '' + dateSeed.getDate() + '' + dateSeed.getHours() + '' + dateSeed.getMinutes() + '' + dateSeed.getSeconds() + '' + randomSeed;
}

function createSalt() {
    return crypto.randomBytes(20).toString('hex');
}

function createHash(password, salt) {
    password = password.length && typeof password === 'string' ? password : undefined;

    if (password && salt) {
        let hash = crypto
            .createHmac('sha512', salt)
            .update(password)
            .digest('hex');

        return hash;
    } else {
        return null;
    }
}

function craftAccessToken(username, id) {
    return jwt.sign({ name: username, userID: id }, process.env.SECRET, { expiresIn: '7d' });
}

function saveUser(user) {
    // a ported fxn from chatventure; will require adjustment to use here
    const filter = { name: user.username };
    const update = { $set: user };
    const options = { new: true, useFindAndModify: false };
    User.findOneAndUpdate(filter, update, options)
        .then(updatedResult => {
            console.log(`${updatedResult.name} has been saved and updated in the database.`);

        })
        .catch(err => {
            console.log(`We encountered an error saving the user: ${err}.`);
        });
}

// HERE: probably a saveDeck(deck) fxn, similar to above

mongoose.connect(process.env.DB_HOST)
    .then(() => console.log(`Successfully connected to Flashcard Fighters database.`))
    .catch(err => console.log(`Error connecting to Flashcard Fighters database: ${err}`));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.post('/user/create', (req, res, next) => {
    // CURRENTLY this is a ported route from TC. Requires some attention to be updated to FCF parameters.

    /*
        HERE: Let's hash out what sort of information is coming here... ideally, everything the User model needs
        username (proposed)... should proooobably be unique
        id (generated upon username acceptance), so a backend only concept
        password
        salt
        hash
        appData
        ... so let's ensure we receive all this good stuff from the client

    */


    // Ideally, when a new profile is successfully created, the client gets a copy of the login token to interface with
    // We'd also like to echo down a message that can then be ALERTed at the user


    let { newUser } = req.body;
    // return console.log(`I have received this newUser object: ${JSON.stringify(newUser)}`);
    // now we have newUser.username, newUser.appData, newUser.password; no salt, id, or hash yet

 
    // HERE: Make sure newUser.name isn't yet taken (scan DB in characters collection)
    User.findOne({ name: newUser.username })
        .then(searchResult => {
            if (searchResult === null) {
                console.log(`Profile name of ${newUser.username} is available! Creating...`);
                const salt = createSalt();
                const hash = createHash(newUser.password, salt);


                let createdUser = new User({
                    username: newUser.username,
                    id: generateRandomID('usr'),
                    salt: salt,
                    hash: hash,
                    appData: JSON.stringify(newUser.appData) // whoops, almost forgot to save this as a string instead of an obj
                });

                console.log(`Proposed new User, right before saving, looks like this: ${JSON.stringify(createdUser)}.`);

                createdUser.save()
                    .then(freshUser => {
                        const token = craftAccessToken(freshUser.username, freshUser.id);
                        let userToLoad = JSON.parse(JSON.stringify(freshUser));
                        
                        // delete userToLoad.salt;
                        // delete userToLoad.hash;
                        // can skip this since we're effectively 're-writing' userToLoad into JUST the appData portion

                        userToLoad.appData = JSON.parse(userToLoad.appData); // convert back from stringiness
                        userToLoad.appData.username = userToLoad.username;
                        userToLoad = userToLoad.appData;

                        // it -mostly- works, buuuuut the auto-saving seems to kill off the alertString?
                        // we can either NOT strip off the alertString during saving, and let it 'run its course'...
                        // or we can try to amend the save-worthiness useEffect in App.js a bit
                        // it also calls a staccato of saveApp() upon new Profile creation, so it'd make sense to try to avoid that, as well :P
                        userToLoad.mode = 'homeScreen';
                        userToLoad.token = token;
                        userToLoad.alertString = `Your new Profile has been created. Enjoy your NEW POWERS!`;
                        userToLoad.alertType = `info`;

                        // Can pop a new alert down in the client based off the ECHO here, so we can change that a bit for nuance
                        // NOTE: we can change appDataToLoad.mode to 'undefined' or 'homeScreen' to pop back away from Profile

                        // fireAlert takes... let's see... ok, just a string. :P It'd be nice to set it up to handle error vs feedback, hmmm...
                        // I vaguely recall we had some issues with that? Well, let's see if we can spruce it up.
                        res.status(200).json({appData: userToLoad});
                        // res.status(200).json({success: true, echo: `${userToLoad.username} is up and ready to go.`, payload: {user: userToLoad, token: token}});
                    })
                    .catch(err => {
                        res.json({success: false, alertString: `Something went wrong attempting to save the new profile: ${JSON.stringify(err)}`});
                    })
            } else {
                // Name is unavailable! Share the sad news. :P
                res.json({success: false, alertString: `That Profile Name is unavailable. Please choose another.`});
            }
        })
        .catch(err => {
            console.log(err);
            res.json({sucess: false, alertString: JSON.stringify(err)});
        });

});

app.post('/user/login', (req, res, next) => {
    // token login sxn; assumes a token is present rather than username/pw login
    if (req.body.userToken !== undefined) {
        const { userToken } = req.body;
        console.log(`Receiving request to log in with a JWT. Processing.`);

        // HERE: handle token login
        const decodedToken = jwt.verify(userToken, process.env.SECRET);
        const { name, userID } = decodedToken;

        // console.log(`It appears we're searching for a user by the name of ${name} and id ${userID}.`);
        User.findOne({ name: name, userID: userID })
            .then(searchResult => {
                if (searchResult === null) {
                    // HERE: handle no such character now
                    console.log(`No such user found. 406 error reported.`);
                    res.status(406).json({type: `failure`, echo: `No such username exists yet. You can create them, if you'd like!`});
                } else {
                    // Token worked! Currently we make a brand-new one here to pass down, but we can play with variations on that later
                    const token = craftAccessToken(searchResult.name, searchResult.userID);
                    const userToLoad = JSON.parse(JSON.stringify(searchResult));
                    delete userToLoad.salt;
                    delete userToLoad.hash;
                    userToLoad.appState = 'home';
                    // if (characters[userToLoad.entityID] !== undefined) characters[userToLoad.entityID].fighting = {main: undefined, others: []};
                    // const alreadyInGame = addCharacterToGame(userToLoad);

                    // if (alreadyInGame) res.status(200).json({type: `success`, echo: `Reconnecting to ${userToLoad.name}.`, payload: {character: characters[userToLoad.entityID], token: token}})
                    // else res.status(200).json({type: `success`, echo: `Good news everyone! ${userToLoad.name} is ready to play.`, payload: {character: userToLoad, token: token}});

                    // console.log(`BACKEND IS LOADING AND SENDING THIS USER DATA: ${JSON.stringify(userToLoad)}`)
                    res.status(200).json({type: `success`, echo: `Good news everyone! ${userToLoad.username} is ready to play.`, payload: {user: userToLoad, token: token}});

                }


            })
            .catch(err => {
                console.log(`Someone had some difficulty logging in with a token: ${err}`);
                res.status(406).json({type: `failure`, echo: `Something went wrong logging in with these credentials.`});
            })        
    }


    // username/password login
    if (req.body.userCredentials !== undefined) {
        const { userCredentials } = req.body; // username, password
        console.log(`Someone is attempting to log in with these credentials: ${JSON.stringify(userCredentials)}`);

        // HERE: handle credentials login: take userCredentials.charName and userCredentials.password and go boldly:


        // NOTE: currently, login is case-sensitive, which bit me already; consider allowing case-imperfect matching

        User.findOne({ username: userCredentials.username })
            .then(searchResult => {
                if (searchResult === null) {
                    // HERE: handle no such user/profile
                    res.status(406).json({alertString: `Welp, that Profile doesn't seem to exist. Whoops.`});
                } else {
                    let thisHash = createHash(userCredentials.password, searchResult.salt);
                    if (thisHash === searchResult.hash) {
                        // Password is good, off we go!
                        const token = craftAccessToken(searchResult.name, searchResult.userID);
                        let userToLoad = JSON.parse(JSON.stringify(searchResult));


                        userToLoad.appData = JSON.parse(userToLoad.appData); // convert back from stringiness
                        userToLoad.appData.username = userToLoad.username;
                        userToLoad = userToLoad.appData;
                        userToLoad.mode = 'homeScreen';
                        userToLoad.token = token;
                        userToLoad.alertString = `Successfully logged in!`;
                        userToLoad.alertType = `info`;

                        // Can pop a new alert down in the client based off the ECHO here, so we can change that a bit for nuance
                        // NOTE: we can change appDataToLoad.mode to 'undefined' or 'homeScreen' to pop back away from Profile

                        // fireAlert takes... let's see... ok, just a string. :P It'd be nice to set it up to handle error vs feedback, hmmm...
                        // I vaguely recall we had some issues with that? Well, let's see if we can spruce it up.
                        return res.status(200).json({appData: userToLoad});




                        // userToLoad.whatDo = 'dashboard';

                        // This will probably only work a small subset of times, actually; socket disconnection removes the char from the game
                        // const alreadyInGame = addCharacterToGame(charToLoad);

                        // if (alreadyInGame) res.status(200).json({type: `success`, message: `Reconnected to live character.`, payload: {character: characters[charToLoad.entityID], token: token}})
                        // else res.status(200).json({type: `success`, message: `Good news everyone! ${charToLoad.name} is ready to play.`, payload: {character: charToLoad, token: token}});
                        // return res.status(200).json({type: `success`, echo: `Good news everyone! ${userToLoad.name} is ready to play.`, payload: {user: userToLoad, token: token}});                        


                    } else {
                        // Password is incorrect, try again... if THOU DAREST
                        return res.status(401).json({alertString: `Failed to log in. Should probably expound on that, huh?`});
                    }
                }


            })
            .catch(err => {
                console.log(`Someone had some difficulty logging in: ${err}`);
                return res.status(406).json({type: `failure`, message: `Something went wrong logging in with these credentials.`});
            })
    }
});

app.post('/user/add_deck', (req, res, next) => {
    // THIS: the user requests an Online Deck to be added to their own collection
    // -- client should already check IDs to make sure it's not a duplicate and avoid making a 'duplicate request'
    //      -> but we'll still check here because it's safer that way
    // -- add deck to user, save user, pass new info down to requesting user client to update their appState/data
    // consider the ability to add multiple decks at once in the future
});

app.post('/deck/update', (req, res, next) => {
    // HERE: handle both the creation and updating of a 'public deck' (private decks live with their user's data)
    // Note that 'update' is used here because the webapp won't 'know' automatically if a deck is shared or not under the current design
    // Deck deletion can, therefore, live here as well, though having one route do three different tasks feels a little clunky
    // Also note that it's likely that the 'shared' attribute is going onto decks soon, which should help disambiguate a bit

    // NOTE that only 'profiles' can upload decks, which also allows us to assign the user profile's id as the deck's ownerID
    // -- this is to allow later deletion of the deck by its 'owner,' as well as other 'associated actions' between creator and deck
});

app.post('/deck/fetch', (req, res, next) => {
    // THIS: fetch any/all decks that meet search criteria, OR just turn into a GET and throw ALL the decks at the user and let the client do the filtering :P
    // if the total number of decks is pretty small, grabbing them all would be fine
});

const PORT = process.env.PORT || 9092;

app.listen(PORT, () => console.log(`Flashcard Fighters backend is operational on Port ${PORT}. Beep boop.`));