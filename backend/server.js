const express = require('express');
const app = express();
const mongoose = require('mongoose');
const User = require('./models/User');
const Deck = require('./models/Deck');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

let allPublicDecks = {};

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
    return jwt.sign({ username: username, id: id }, process.env.SECRET, { expiresIn: '7d' });
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
    User.findOne({ username: newUser.username })
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
    // this token login is kind of a weird mechanism right now, since it doesn't really get used anywhere in the current setup
    if (req.body.userToken !== undefined) {
        const { userToken } = req.body;
        console.log(`Receiving request to log in with a JWT. Processing.`);

        // HERE: handle token login
        const decodedToken = jwt.verify(userToken, process.env.SECRET);
        const { username, id } = decodedToken;

        // console.log(`It appears we're searching for a user by the name of ${name} and id ${userID}.`);
        User.findOne({ username: username, id: id })
            .then(searchResult => {
                if (searchResult === null) {
                    // HERE: handle no such character now
                    console.log(`No such user found. 406 error reported.`);
                    res.status(406).json({type: `failure`, echo: `No such username exists yet. You can create them, if you'd like!`});
                } else {
                    // Token worked! Currently we make a brand-new one here to pass down, but we can play with variations on that later
                    const token = craftAccessToken(searchResult.username, searchResult.id);
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
                        const token = craftAccessToken(searchResult.username, searchResult.id);
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
    // THIS: user wants to grab one or more decks to add to their personal decklist
    // we'll set "variant: true" here to indicate they're a 'clone'
    // just realized that lastUpdateTime will change every time the user changes their cloned/borrowed deck, so checking for other-user 'deck updates' becomes tricky
    // ok, just added 'lastPush' Date to the Deck model, and that will serve as the 'backend change timestamp' variable
    // we can decide later if we want users to be able to 'publish' a deck that is variant: true

    // anyway, we'll use the user's token to verify their identity, then we'll need an array of decks' ids
    // because of the 'small-ish' size of the app, we'll try to get away with just sending fresh appData down from the user's backend-modified state 

    

});

/*
    DECK routing sxn

    deck/add
    deck/delete
    deck/update

    all decks have a name (which can change) and an id (which is designed to be unique, though we don't 'guarantee' that yet)
    -- so the id will be the filter/search criterion, and we're good to go


    DECK MODEL REFERENCE:
        const DeckSchema = new Schema({
            name: {type: String, required: true},
            id: {type: String, required: true},
            ownerID: String,
            variant: Boolean,
            shared: Boolean,
            lastUpdateTime: Date,
            lastPush: Date,
            tags: String,
            description: String,
            cards: Array,
            style: Object
        }, { minimize: false });    
*/



app.post('/deck/publish', (req, res, next) => {
    // a user 'publishes' decks to the backend
    // essentially we want to accept an array of decks to add to the DB, updating them as necessary to fit the Deck model as we go
    // ok, we don't define ownerID upon client deck creation, so we'll accept the token to add that here

    // NOTE: we don't currently check for 'variant' to prevent 'redundant deck copy publishing,' since we already check to see if a deck's id already exists
    // we can simply add some a rejection clause ho ho ho if the deck searchResult DOES get a hit and the id doesn't match the ownerID
    // ... if the id DOES match the ownerID, we can just do an update instead, or reject and tell them to do it 'properly,' dagnabit :P


    let { token, decksToAdd } = req.body;
    const decodedToken = jwt.verify(token, process.env.SECRET);
    const { id } = decodedToken;
    let successfulDeckUploadCount = 0;
    let feedbackMessage = ``;

    // res.status(200).json({alertString: 'Received your request.'});
    // return console.log(`Request! Add a Public Deck! Received token: ${JSON.stringify(decodedToken)} ... which belongs to id of ${id} ... and decksToAdd: ${JSON.stringify(decksToAdd)}. That look right?`);

    // ADD HERE: a 'catch' in case we have problematic token and/or decksToAdd array


    // idle thought: should we 'trustingly' add 'shared: true' to decks on the client side under successful axios posting?
    // ... actually, that might be fine; my other thought is to retrieve the User and update their decks and slap the new appData down, but that seems like extra steps
    // there ARE some conditions, such as user uploading a mix of shareable and un-shareable decks, that could cause some issues with this approach
    // we can avoid some/most of those by doing a client-side check and NOT adding 'shared: true' to 'variant: true' decks, and the code below will ignore copy decks

    // ideally, we have an array of decksToAdd, even if the array is length 1, for the forEach below

    decksToAdd.forEach((deckObj, index) => {
        // inquire in gentle fashion @ the DB via model for each deck
        Deck.findOne({ id: deckObj.id })
            .then(searchResult => {
                if (searchResult === null) {
                    console.log(`A new deck is requested to be added to the Database. Does not exist yet, so we can happily add it for the user.`);

                    let newDBDeck = new Deck({
                        ...deckObj,
                        ownerID: id,
                        shared: true,
                        lastPush: new Date()
                    });

                    newDBDeck.save()
                        .then(freshDeck => {
                            console.log(`Successfully saved Deck: ${freshDeck.name}.`);
                            allPublicDecks[freshDeck.id] = freshDeck;
                            successfulDeckUploadCount += 1;
                            console.log(`Successful Deck Upload Count should be plus one from before, and is now ${successfulDeckUploadCount}.`);
                            wrapItUp(index, decksToAdd.length);
                        })
                        .catch(err => {
                            res.json({success: false, alertString: `Something went wrong attempting to save the deck to the public repository: ${JSON.stringify(err)}`});
                        })
                } else {
                    // This deck already exists in the DB! We'll sweepingly reject for now, but later we can do an id check for more specific messaging/next steps
                    // res.json({success: false, alertString: `That Deck has already been uploaded.`, alertType: 'error'});
                    feedbackMessage = `That deck has already been uploaded! Later you can update it, perhaps, if you're the owner.`;
                    console.log(`Someone tried to upload a deck that already exists, so we're ignoring it for now. FeedbackMessage is now: ${feedbackMessage}`);
                    wrapItUp(index, decksToAdd.length);
                    // AMENDED: this section currently can't really do anything meaningful due to being in a loop, potentially sending multiple headers back
                }

                // ah! we can just check to see if we're at the end of the array in question, and then output here, ezpz?

            })
            .catch(err => {
                console.log(err);
                res.json({sucess: false, alertString: JSON.stringify(err)});
            });
    });

    function wrapItUp(index, length) {
        if (index === length - 1) {
            // Should only fire this success header and response when all the async shenanigans are good to go
            res.status(200).json({success: true, alertString: feedbackMessage.length > 0 ? feedbackMessage : `${successfulDeckUploadCount} deck${successfulDeckUploadCount > 1 ? 's' : ''} added to the Public Online Repository!`});
        }        
    }

});

app.post('/deck/update', (req, res, next) => {
    // HERE: handle both the creation and updating of a 'public deck' (private decks live with their user's data)
    // Note that 'update' is used here because the webapp won't 'know' automatically if a deck is shared or not under the current design
    // Deck deletion can, therefore, live here as well, though having one route do three different tasks feels a little clunky
    // Also note that it's likely that the 'shared' attribute is going onto decks soon, which should help disambiguate a bit

    // NOTE that only 'profiles' can upload decks, which also allows us to assign the user profile's id as the deck's ownerID
    // -- this is to allow later deletion of the deck by its 'owner,' as well as other 'associated actions' between creator and deck
    let { token, decksToUpdate } = req.body;
    const decodedToken = jwt.verify(token, process.env.SECRET);
    const { id } = decodedToken;
});

app.post('/deck/fetch', (req, res, next) => {
    // THIS: fetch any/all decks that meet search criteria, OR just turn into a GET and throw ALL the decks at the user and let the client do the filtering :P
    // if the total number of decks is pretty small, grabbing them all would be fine

    // actually, under the new allPublicDecks concept, we could do a pretty quick query style here
    // ok!
    let { deckSearchString } = req.body;
    let deckSearchArray = deckSearchString.split(',').map(searchTerm => searchTerm.trim()).map(trimmedTerm => trimmedTerm.toLowerCase());
    // since we're LISTING the decks in the client, the client can handle 'marking' duplicates/already-'owned' decks for us


    // STEP TWO: we'll keep searches 'basic' for now, only searching deck name, description, and tags
    // remember to disregard letter casing; upper, lower, it's all good
    let deckResults = {};
    Object.keys(allPublicDecks).forEach(deckID => {
        deckSearchArray.forEach(searchTerm => {
            if (allPublicDecks[deckID].name.toLowerCase().includes(searchTerm) || allPublicDecks[deckID].description.toLowerCase().includes(searchTerm) || allPublicDecks[deckID].tags.toLowerCase().includes(searchTerm)) deckResults[deckID] = true;
        });
    });
    // now we have deckResults with a bunch of applicable deckID's we want, ideally, so we can array-ify it for the user
    let deckResultsArray = []; 
    Object.keys(deckResults).forEach(deckID => deckResultsArray.push({
        id: deckID,
        name: allPublicDecks[deckID].name,
        description: allPublicDecks[deckID].description,
        cardTotal: allPublicDecks[deckID].cards.length
    }));

    console.log(`After performing an all-decks search, we have ${deckResultsArray.length} total hits, looking like this: ${JSON.stringify(deckResultsArray)}`);

    // final step: pass down an array of simplified deck objects to the user (id, name, description, tags) for them to interact with
    
});

const PORT = process.env.PORT || 9092;

// HERE: add an additional loading from DB so we can populate allPublicDecks
Deck.find()
    .then(allDecks => {
        // console.log(`The search result for all decks looks like this: ${allDecks}`);
        for (const deckObj in allDecks) {
            allPublicDecks[allDecks[deckObj].id] = allDecks[deckObj];
        }
        // let's see if we got that right...
        // console.log(`After server loading, currently allPublicDecks looks like this: ${JSON.stringify(allPublicDecks)}, with a total of ${Object.keys(allPublicDecks).length} entries.`);
        app.listen(PORT, () => console.log(`Flashcard Fighters backend is operational on Port ${PORT}. Beep boop.`));
    })
    .catch(err => console.log(`Error on initial loading of all decks: ${err}`));