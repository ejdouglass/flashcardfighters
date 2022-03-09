const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const User = require('./models/User');
const Deck = require('./models/Deck');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

// app.use((req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });
app.use(cors({
    origin: 'http://localhost:3456'
}));

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

function loadUser(userID) {
    // this function is only intended to return an up-to-date DB object copy of the given User by id
    User.findOne({ id: userID })
    .then(searchResult => {
        if (searchResult === null) {
            return console.log(`No such user found. 406 error reported.`);
        } else {
            // console.log(`fetchUserInfo fxn called for ID ${userID} and found this user: ${JSON.stringify(searchResult)}`);
            searchResult.appData = JSON.parse(searchResult.appData);
            searchResult.token = craftAccessToken(searchResult.username, searchResult.id);
            return JSON.parse(JSON.stringify(searchResult));
        }
    })
    .catch(err => {
        console.log(`Someone had some difficulty logging in with a token: ${err}`);
        res.status(406).json({type: `failure`, echo: `Something went wrong logging in with these credentials.`});
    })
}

function saveUser(user) {
    // this function receives a full User object and updates the DB with that information
    user.appData = JSON.stringify(user.appData);
    const filter = { id: user.id };
    const update = { $set: user };
    const options = { new: true, useFindAndModify: false };
    User.findOneAndUpdate(filter, update, options)
        .then(updatedResult => {
            console.log(`${updatedResult.username} has been saved and updated in the database.`);

        })
        .catch(err => {
            console.log(`We encountered an error saving the user: ${err}.`);
        });
}

function saveDeck(deck) {
    const filter = { id: deck.id };
    const update = { $set: deck };
    const options = { new: true, useFindAndModify: false };
    Deck.findOneAndUpdate(filter, update, options)
        .then(updatedResult => {
            console.log(`${updatedResult.name} deck has been saved and updated in the database.`);

        })
        .catch(err => {
            console.log(`We encountered an error saving the user: ${err}.`);
        });    
}

mongoose.connect(process.env.DB_HOST)
    .then(() => console.log(`Successfully connected to Flashcard Fighters database.`))
    .catch(err => console.log(`Error connecting to Flashcard Fighters database: ${err}`));


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

app.post('/user/update', (req, res, next) => {
    // the 'easiest' way to handle 'duplicate saving' is to do a check down here and ensure there's actually a difference before we save
    const { userAppData } = req.body;
    const { token } = userAppData;
    const decodedToken = jwt.verify(token, process.env.SECRET);
    const { username, id } = decodedToken;
    
    User.findOne({ id: id, username: username })
        .then(foundUser => {
            let updatedUserObject = JSON.parse(JSON.stringify(foundUser));
            console.log(`Attempting to save an updated user.`);
            // this conditional helps us avoid unnecessary extra back-end saves, though the client is still wackadoo
            if (JSON.stringify(userAppData) == updatedUserObject.appData) return;
            console.log(`Not a duplicate entry, looks like there's 'new stuff' to save.`);
            updatedUserObject.appData = userAppData;
            saveUser(updatedUserObject);
            res.status(200).json({success: true});
        })
        .catch(err => {
            console.log(`Error updating user: ${err}`);
            res.status(503).json({success: false});
        });
    // !MHR
});

app.post('/user/add_deck', (req, res, next) => {
    // THIS: user wants to grab one or more decks to add to their personal decklist
    // we'll set "variant: true" here to indicate they're a 'clone'
    // just realized that lastUpdateTime will change every time the user changes their cloned/borrowed deck, so checking for other-user 'deck updates' becomes tricky
    // ok, just added 'lastPush' Date to the Deck model, and that will serve as the 'backend change timestamp' variable
    // we can decide later if we want users to be able to 'publish' a deck that is variant: true
    
    // IF a token is applied, do the proper changes/saving for the user back here; otherwise, just pass back an array of full decks for them, marking them as variants

    const { token, deckID } = req.body;
    let targetDeck = allPublicDecks[deckID];
    targetDeck.variant = true;
    if (token !== undefined) {
        // crack the token open and handle backend user update(s) so deck-adding persists properly
        const decodedToken = jwt.verify(token, process.env.SECRET);
        const { username, id } = decodedToken;

        User.findOne({ username: username, id: id })
        .then(searchResult => {
            if (searchResult === null) {
                return console.log(`No such user found. 406 error reported.`);
            } else {
                let userCopy = JSON.parse(JSON.stringify(searchResult));
                userCopy.appData = JSON.parse(userCopy.appData);
                userCopy.appData.decks[targetDeck.id] = targetDeck;
                saveUser(userCopy);                
            }
        })
        .catch(err => {
            console.log(`Someone had some difficulty logging in with a token: ${err}`);
            res.status(406).json({type: `failure`, echo: `Something went wrong logging in with these credentials.`});
        })        

    }

    res.status(200).json({deck: targetDeck});


});

app.post('/user/delete', (req, res, next) => {
    // THIS: delete the user's account
    /*
        Assuming the client double-checks with the user that they're absolutely certain, we adjust the DB to remove the entry, then
            send down a JSON response that prompts the client to delete the associated localStorage and 'reset' the app for that client

        We can also generate periodic 'backups' for safety and recovery purposes, although that's not as critical here
    */
    // 
    let { token } = req.body;
    const decodedToken = jwt.verify(token, process.env.SECRET);
    const { username, id } = decodedToken;
    User.findOneAndDelete({ id: id })
        .then(result => {
            console.log(`Deleted the user ${username}. BLOOP.`);
            return res.status(200).json({success: true});
        })
        .catch(err => console.log(`Error deleting a user: ${err}`));
});

// app.post('/server/test', (req, res, next) => {
//     console.log(`Most basic test. Just logging that we received the request at this point.`);
//     res.json({echo: `ECHO. ECHO. Echo echo echo~`});
// });


app.post('/deck/publish', (req, res, next) => {
    // a user 'publishes' decks to the backend
    // essentially we want to accept an array of decks to add to the DB, updating them as necessary to fit the Deck model as we go
    // ok, we don't define ownerID upon client deck creation, so we'll accept the token to add that here

    // NOTE: we don't currently check for 'variant' to prevent 'redundant deck copy publishing,' since we already check to see if a deck's id already exists
    // we can simply add some a rejection clause ho ho ho if the deck searchResult DOES get a hit and the id doesn't match the ownerID
    // ... if the id DOES match the ownerID, we can just do an update instead, or reject and tell them to do it 'properly,' dagnabit :P
    console.log(`REQUEST TO PUBLISH RECEIVED.`);

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

    // HERE: we'll fetch the requesting User, and then when all's done, the wrapUp can save them and then we pass down their new 'self'
    // ensure we're on the correct 'mode' so it doesn't feel weird on the client side
    // let publishingUserCopy = loadUser(id);
    // publishingUserCopy.token = token;
    // console.log(`HOI! Did a loadUser fxn call. We now have this individual: ${JSON.stringify(publishingUserCopy)}`);

    User.findOne({ id: id })
        .then(userSearchResult => {
            if (userSearchResult === null) {
                return console.log(`No such user found. 406 error reported.`);
            } else {
                // console.log(`fetchUserInfo fxn called for ID ${userID} and found this user: ${JSON.stringify(userSearchResult)}`);
                let publishingUserCopy = JSON.parse(JSON.stringify(userSearchResult));
                publishingUserCopy.appData = JSON.parse(publishingUserCopy.appData);
                // NOTE: this is not the best way to create a 'new' token for the user; revisit
                publishingUserCopy.appData.token = craftAccessToken(publishingUserCopy.username, publishingUserCopy.id);


                decksToAdd.forEach((deckObj, index) => {
                    // inquire in gentle fashion @ the DB via model for each deck
                    Deck.findOne({ id: deckObj.id })
                        .then(searchResult => {
                            if (searchResult === null) {
                                console.log(`A new deck is requested to be added to the Database. Does not exist yet, so we can happily add it for the user.`);
            
                                // ADD: updating user's decks to add 'shared: true'
            
                                let newDBDeck = new Deck({
                                    ...deckObj,
                                    ownerID: publishingUserCopy.id,
                                    lastPush: new Date()
                                });
            
                                newDBDeck.save()
                                    .then(freshDeck => {
                                        successfulDeckUploadCount += 1;
                                        publishingUserCopy.appData.decks[freshDeck.id] = freshDeck;
                                        publishingUserCopy.appData.decks[freshDeck.id].published = true;
                                        // ok, so the above reads as true, that's a good start
                                        publishingUserCopy.appData.alertString = `${successfulDeckUploadCount} deck${successfulDeckUploadCount > 1 ? 's' : ''} added to the Public Online Repository!`
                                        allPublicDecks[freshDeck.id] = freshDeck;
                                        wrapItUp(index, decksToAdd.length, publishingUserCopy);
                                    })
                                    .catch(err => {
                                        // we get this error on the REGULAR. HRM.
                                        res.json({success: false, alertString: `Something went wrong attempting to save the deck to the public repository: ${JSON.stringify(err)}`});
                                    })
                            } else {
                                publishingUserCopy.appData.alertString = `That deck has already been uploaded! Later you can update it, perhaps, if you're the owner.`;
                                console.log(`Someone tried to upload a deck that already exists, so we're ignoring it for now. FeedbackMessage is now: ${feedbackMessage}`);
                                wrapItUp(index, decksToAdd.length, publishingUserCopy);
                                // AMENDED: this section currently can't really do anything meaningful due to being in a loop, potentially sending multiple headers back
                            }
            
                            // ah! we can just check to see if we're at the end of the array in question, and then output here, ezpz?
            
                        })
                        .catch(err => {
                            console.log(err);
                            res.json({sucess: false, alertString: JSON.stringify(err)});
                        });
                });


            }
        })
        .catch(err => {
            console.log(`Someone had some difficulty logging in with a token: ${err}`);
            res.status(406).json({type: `failure`, echo: `Something went wrong logging in with these credentials.`});
        })



    function wrapItUp(index, length, user) {
        if (index === length - 1) {
            // Should only fire this success header and response when all the async shenanigans are good to go
            // HERE: final userSave, then pass down to client for updating
            user.appData.mode = 'viewDecks';
            user.appData.username = user.username;
            // console.log(`Let's just look at the decks as we pass back the new overwriting userData: ${JSON.stringify(user.appData.decks)}`)
            // turns out the userData object is attached 
            res.status(200).json({success: true, userData: user.appData, alertString: user.appData.alertString});
            return saveUser(user);
        }        
    }

});

app.post('/deck/update', (req, res, next) => {
    // THIS: overwrite the 'old' version of the deck with the new proposed version, via the owner's intention
    // though we have some support for multiple deck updates, the newLogItem concept below does NOT currently accurately reflect this scenario
    // same for decksUpdated near the bottom
    let { token, decksToUpdate } = req.body;
    const decodedToken = jwt.verify(token, process.env.SECRET);
    const { id } = decodedToken;
    const newPushTimestamp = new Date();
    let userObj;
    User.findOne({ id: id })
        .then(foundUser => {
            userObj = JSON.parse(JSON.stringify(foundUser));
            userObj.appData = JSON.parse(userObj.appData);

            let newLogItem;
            decksToUpdate.forEach(deckObj => {
                allPublicDecks[deckObj.id] = {...deckObj};
                allPublicDecks[deckObj.id].lastPush = newPushTimestamp;
                userObj.appData.decks[deckObj.id] = {...allPublicDecks[deckObj.id]};
                newLogItem = {
                    echo: `You re-published ${deckObj.name} with your current version.`,
                    timestamp: newPushTimestamp,
                    event: 'deck_update',
                    subject: deckObj.id
                };  
                saveDeck(allPublicDecks[deckObj.id]);
            });

    
            let newAppState = ({...userObj.appData, alertString: `The online version of this deck has been successfully updated!`, history: {
                log: [...userObj.appData.history.log, newLogItem],
                actions: {...userObj.appData.history.actions, decksUpdated: userObj.appData.history.actions.decksUpdated + 1}
            }});
            
            saveUser(userObj);
        })
        .catch(err => console.log(`Error loading user from DB while updating a deck; error message: ${err}`));

    res.status(200).json({success: true, timestamp: newPushTimestamp, newAppState: newAppState});

});

app.post('/deck/unpublish', (req, res, next) => {
    const { token, deckID } = req.body;
    const decodedToken = jwt.verify(token, process.env.SECRET);
    const { id: userID } = decodedToken;

    // basically, we have to remove this deck from allPublicDecks, from the DB, and then set the user's data of this deck's PUBLISHED to false all around
    Deck.findOneAndDelete({ id: deckID })
        .then(result => {
            console.log(`Here's the result that passes in from deletion of a deck, for reference: ${result}`);
            delete allPublicDecks[deckID];

            User.findOne({ id: userID })
                .then(foundUser => {
                    let userCopy = JSON.parse(JSON.stringify(foundUser));
                    userCopy.appData = JSON.parse(userCopy.appData);
                    userCopy.appData.decks[deckID].published = false;
                    userCopy.appData.decks[deckID].lastPush = undefined;

                    saveUser(userCopy);
                    res.status(200).json({success: true});
                })
                .catch(err => console.log(`Error found during deck unpublishing, user-fetch portion: ${err}`));
        })
        .catch(err => console.log(`Error occurred during a deck unpublish: ${err}`));
});

app.post('/deck/fetch', (req, res, next) => {
    // THIS: fetch any/all decks that meet search criteria, OR just turn into a GET and throw ALL the decks at the user and let the client do the filtering :P
    // if the total number of decks is pretty small, grabbing them all would be fine

    // actually, under the new allPublicDecks concept, we could do a pretty quick query style here
    // ok!
    let { deckSearchString } = req.body;

    if (deckSearchString.trim() === '*') {
        // semi-secret shenanigans to grab all current public decks
        let allTheDecks = [];
        Object.keys(allPublicDecks).forEach(deckID => allTheDecks.push({
            id: deckID,
            name: allPublicDecks[deckID].name,
            description: allPublicDecks[deckID].description,
            cardTotal: allPublicDecks[deckID].cards.length
        }));
        return res.status(200).json({success: true, deckResultsArray: allTheDecks});
    }

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
    // we can consider 'crediting' the author, as well, and then listing the author in the client as well
    Object.keys(deckResults).forEach(deckID => deckResultsArray.push({
        id: deckID,
        name: allPublicDecks[deckID].name,
        description: allPublicDecks[deckID].description,
        cardTotal: allPublicDecks[deckID].cards.length,
        lastPush: allPublicDecks[deckID].lastPush
    }));

    // console.log(`After performing an all-decks search, we have ${deckResultsArray.length} total hits, looking like this: ${JSON.stringify(deckResultsArray)}`);

    // final step: pass down an array of simplified deck objects to the user (id, name, description, tags) for them to interact with
    res.status(200).json({success: true, deckResultsArray: deckResultsArray});
    
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