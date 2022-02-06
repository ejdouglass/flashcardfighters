import React, { useState, useEffect, useRef, useCallback } from 'react';
import ViewSingleDeckScreen from '../screens/ViewSingleDeckScreen';
import StudySessionScreen from '../screens/StudySessionScreen';
import CreateDeckScreen from '../screens/CreateDeckScreen';
import ViewDecksScreen from '../screens/ViewDecksScreen';
import ViewProfileScreen from '../screens/ViewProfileScreen';
import HomeScreen from '../screens/HomeScreen';

export default function Screen({ appState, setAppState }) {
    const [newCard, setNewCard] = useState({
        prompt: '',
        explanation: '',
        tags: '',
        cardstock: undefined,
        icon: undefined,
        decks: undefined
    });
    const [newDeck, setNewDeck] = useState({
        name: '',
        tags: '',
        description: '',
        cardRefs: {},
        deckRefs: {}
    });
    const cardPromptRef = useRef(null);

    function fireAlert(alertString, alertType) {
        // no support for 'alertType' currently, but it should be safe to start passing it as a variable (or not)
        setAppState({...appState, alertString: alertString ? alertString : `RANDOM ALARUM, RANDOM ALARUM!`, alertType: alertType || undefined});
    }

    function createPrompt() {
        setAppState({...appState, prompt: `Unga bunga??`});
    }

    function goHome(navTarget) {
        return setAppState({...appState, mode: undefined});
    }

    // Hm, for the below two functions, we might be able to reconfigure as 'addToDeck' and 'removeFromDeck' and allow either card OR deck to be passed in
    function addCardToDeck(cardId) {
        let newDeckItems = {...newDeck};
        newDeckItems.cardRefs[cardId] = true;
        return setNewDeck({...newDeckItems});
    }

    function removeCardFromDeck(cardId) {
        let newDeckItems = {...newDeck};
        delete newDeckItems.cardRefs[cardId];
        return setNewDeck({...newDeckItems});
    }

    function createNewDeck(e) {
        e.preventDefault();
        if (!newDeck.name) {
            return fireAlert(`Please give the deck a name of some sort.`);
        }
        if (!Object.keys(newDeck.cardRefs).length) {
            return fireAlert(`You need at least one card to consider something a 'deck.'`);
        }
        let completedDeck = {...newDeck};
        completedDeck.id = generateRandomID();
        let newAppDecks = {...appState.decks};
        newAppDecks[completedDeck.id] = completedDeck;
        setNewDeck({
            name: '',
            tags: '',
            description: '',
            cardRefs: {},
            deckRefs: {}
        });
        return setAppState({...appState, decks: newAppDecks, mode: 'viewDecks'});

    }

    function generateRandomID() {
        let dateSeed = new Date();
        let randomSeed = Math.random().toString(36).replace('0.', '');
        return dateSeed.getMonth() + '' + dateSeed.getDate() + '' + dateSeed.getHours() + '' + dateSeed.getMinutes() + '' + dateSeed.getSeconds() + '' + randomSeed;
    }

    function createNewCard(e) {
        e.preventDefault();
        /*
            THIS: checks newCard variables for validity, creates the card if valid and resets the 'form' where applicable, alerts the user as to result

            HERE:
            -- check to see if new card variables are valid
            -- if valid, add the card to relevant deck(s) and save new app state
            -- if saved OR if invalid, Alert the user accordingly
        */
       
        if (newCard.prompt && newCard.explanation) {
           // HERE: for now, 'good to go' achieved, so create new ID, save new card to appState.cards (@ ID key), any applicable decks, and saveApp()
           let completedCard = {...newCard};
           completedCard.id = generateRandomID();
           let appCards = {...appState.cards};
           appCards[completedCard.id] = completedCard;
           setNewCard({
            ...newCard,
            prompt: '',
            explanation: '',
            icon: undefined,
            decks: undefined               
           });
           cardPromptRef.current.focus();
           return setAppState({...appState, cards: appCards});
        }

        // Probably should reconfigure to have alert 'types' such as error, info, etc.
        return fireAlert(`Please input a prompt and explanation.`);
    }

    // Busy inline clutter for the time being; extrapolate out to separate components later
    switch (appState.mode) {
        case 'createCard': {
            /*
                CREATE CARD SCREEN COMPONENT
                Each card has:
                -- id (hidden)
                -- prompt
                -- explanation
                -- tags
                -- cardstock
                -- icon

                Include:
                -- creation of 'all cards' "deck" when >0 cards exist

                Consider:
                -- how to establish 'pre-existing tags'

                TODO:
                -- define card attributes
                -- make card fxn: validates and then throws the card into the 'all cards' deck

                TODO PLUS:
                -- quick way to add new cards to specific deck(s)?
            
            */
            return (
                <div>
                    <h3>I AM CREATE CARD SCREEN</h3>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem'}}>
                        <form style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', border: '1px solid blue', padding: '1rem'}} onSubmit={createNewCard}>
                        <input ref={cardPromptRef} type='text' placeholder={'Card Prompt'} value={newCard.prompt} onChange={e => setNewCard({...newCard, prompt: e.target.value})}></input>
                        <input type='text' placeholder={'Card Explanation'} value={newCard.explanation} onChange={e => setNewCard({...newCard, explanation: e.target.value})}></input>
                        <input type='text' placeholder={'Card Tags'} value={newCard.tags} onChange={e => setNewCard({...newCard, tags: e.target.value})}></input>
                        <button type='button'>Default Cardstock</button>
                        <button type='button'>Red Cardstock</button>
                        <button type='button'>Blue Cardstock</button>
                        <button type='button'>Green Cardstock</button>
                        <button type='submit' onClick={createNewCard}>Create New Card</button>
                        </form>

                        <button onClick={goHome}>HOME</button>
                    </div>
                </div>
            )
        }

        case 'viewDecks': {
            /*
                Overall fine. Kinda unattractive, mostly. Needs to fit a more central theme of shape and color, but gets the job done.
            
            */
            return (
                <ViewDecksScreen appState={appState} setAppState={setAppState} goHome={goHome} />
            )
        }

        case 'editDeck': {
            /*
                Nav by deck ID
            */
           return (
               <CreateDeckScreen appState={appState} setAppState={setAppState} generateRandomID={generateRandomID} editingDeck={true} />
           )
        }

        case 'viewStudySessions': {
            return (
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    <h1>Here lie your study sessions:</h1>
                    <div onClick={() => setAppState({...appState, mode: 'createStudySession'})} style={{border: '1px solid green', borderRadius: '1rem', width: '200px', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>+ Create New Session</div>
                    {Object.keys(appState.sessions).map((sessionID, index) => (
                        <div onClick={() => setAppState({...appState, mode: 'studySession', currentModeTargetID: sessionID})} key={index} style={{border: '1px solid green', borderRadius: '1rem', width: '200px', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>{appState.sessions[sessionID].nickname}</div>
                    ))}
                </div>
            )
        }

        case 'createDeck': {
            return <CreateDeckScreen appState={appState} setAppState={setAppState} generateRandomID={generateRandomID} />
        }

        case 'createStudySession': {
            return (
                <CreateStudySessionScreen fireAlert={fireAlert} generateRandomID={generateRandomID} goHome={goHome} appState={appState} setAppState={setAppState} />
            )
        }

        case 'createSchedule': {
            return (
                <div>
                    <h1>Create Schedule</h1>
                    <button onClick={goHome}>HOME</button>
                </div>
            )
        }

        case 'editCards': {
            return (
                <EditCardScreen goHome={goHome} />
            )
        }

        case 'studySession': {
            return (
                <StudySessionScreen fireAlert={fireAlert} appState={appState} setAppState={setAppState} goHome={goHome} />
            )
        }

        case 'viewNotes': {
            /*
                
                -- ok, so we're hitting an issue where I can't square component logic with dynamic input setting/saving logic
                -- there may be a way, but within a React setup? Hm...

                -- anyway, now we can think of it as a component with contentString and type (title, paragraph, etc.)
                -- we can use array and index shenanigans, matched with keyboard inputs, and maybe a 'watcher' set of variables?, to make a dynamic text editor
            
            */

            function NoteEle ({ contentString, type }) {
                const [content, setContent] = useState(contentString);
                let styling = {
                    border: 0,
                    width: 'auto',
                    outline: 'none'
                };
                switch (type) {
                    case 'title': {
                        styling = {
                            ...styling,
                            fontSize: '2rem',
                            fontWeight: '600'
                        }
                        break;
                    }
                    default: break;
                }

                return <div><input type='text' style={styling} value={content} onChange={e => setContent(e.target.value)} /></div>
            }
            
            return (
                <div>
                    <h1>Notes!</h1>
                    <NoteEle contentString={'I am Here'} type={'title'} />
                    <button onClick={goHome} style={{padding: '0.5rem 1rem'}}>HOME</button>
                </div>
            )
        }

        case 'viewProfile': {
            /*
                This should be a handy place to CREATE a profile (later, with ICON!), UDPATE profile, LOG INTO profile, or DELETE profile.

                If CREATING a profile, should have a way to do username and create password (x2). 
                If UPDATING, keep low-key track of any changes and enable UPDATE action when applicable.
                If DELETING, use a prompt to confirm.
                If LOGGING IN, username and password, plz&ty.

                ... can use 'context clues' of appState to conceivably 'know' when to prompt LOGIN vs CREATION?

                States: 
                - NOT LOGGED IN
                - LOGGED IN :P
                - how to tell? appState.username is undefined
            */
            
            return (
                <ViewProfileScreen appState={appState} setAppState={setAppState} fireAlert={fireAlert} />
            )
        }

        case 'homeScreen':
        default: {
            /*
                Home Screen
            
            */
            return <HomeScreen appState={appState} setAppState={setAppState} />
        }
    }

}



const EditCardScreen = ({ goHome }) => {
    /*

    */
    return (
        <div>
            <h1>Edit Card(s)</h1>
            <button>Confirm Change(s)</button>
            <button onClick={goHome}>Cancel</button>
        </div>
    )
}



const CreateStudySessionScreen = ({ fireAlert, generateRandomID, goHome, appState, setAppState }) => {
    /*

        LATEST, POST-DECK-FIRST-META:
        ...reconfiguring a bit.
        -- so, if we honor the concept of the deck-first, then we go with deckRefs, just an array of IDs for decks we 'own.'
        -- when the study session actually launches, the session grabs all the cards from each deck, ideally eliminates duplicates, and shuffled array-ifies them nicely

        -- Basically, now we just want each studySession to be a collection of deckRefs ONLY. The cards in each deck are grabbed at session start.

        Add:
        RULES!
        -- ENDPOINT: study for length of time OR study for # of times through OR user says done
            - duration, sets, discretion
        -- TIMER: always enabled for now


        ARRAY SEARCHING METHODS:
        -- arr.find(el => el.key === 'whatever') ... this will give the first element in the array that matches the criteria (can && it as well)
        -- arr.indexOf(el => el.key === 'whatever') ... gives index of the searchTarget found, or -1 if not found, instead of element itself

    */
    const [session, setSession] = useState({
        nickname: '',
        id: undefined,
        deckRefs: [],
        endRule: 'discretion'
    });

    function addDeckToSession(deckID) {
        return session.deckRefs.indexOf(deckID) > -1 ? setSession({...session, deckRefs: [...session.deckRefs].filter(deck => deck !== deckID)}) : setSession({...session, deckRefs: [...session.deckRefs, deckID]});
    }

    function createStudySession() {
        // HERE: 
        // check for validity of session (nickname, at least one deck, rules selected [eh have defaults for these])
        // if INVALID, fire off an alert for the user indicating this
        // if VALID, create ID, save to appState, 
        if (session.nickname.length < 1) return fireAlert(`Please enter a nickname for this session.`);
        if (session.deckRefs.length < 1) return fireAlert(`Please select at least one deck to use for the study session.`);
        let newAppSessions = {...appState.sessions} || {};
        console.log(`NEWAPPSESSIONS UPON INIT IS NOW: ${JSON.stringify(newAppSessions)}`);
        let newSessionID = generateRandomID();
        newAppSessions[newSessionID] = {...session, id: newSessionID};
        console.log(`FINAL FORM OF NEWAPPSESSIONS SHOULD BE: ${JSON.stringify(newAppSessions)}`)
        return setAppState({...appState, sessions: {...newAppSessions}, mode: undefined, alertString: `Woo wee new session is LIVE my friends!`});
        // console.log(`New App Sessions looks like this now: ${JSON.stringify(appState.sessions)}`);
        
    }

    // ADD: # of sets, duration amount for non-discretion options
    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start'}}>
            <h1>Create Study Session</h1>
            <input style={{padding: '0.5rem 1rem'}} type='text' value={session.nickname} onChange={e => setSession({...session, nickname: e.target.value})} placeholder={'Session nickname'} />
            <div>{session.deckRefs.length} deck{session.deckRefs.length > 1 ? 's' : ''} selected.</div>
            <div>Decks to choose from:</div>
            {Object.keys(appState.decks).map((deckID, index) => (
                <div onClick={() => addDeckToSession(deckID)} style={{border: '1px solid black', backgroundColor: session.deckRefs.indexOf(deckID) > -1 ? '#0AF' : 'white', width: '200px', boxSizing: 'border-box', padding: '0.5rem 1rem', borderRadius: '0.2rem'}} key={index}>{appState.decks[deckID].name}</div>
            ))}
            <div>Study Session Ending Rule:</div>
            <div style={{display: 'flex', gap: '1rem'}}>
                <button style={{backgroundColor: session.endRule === 'discretion' ? '#0AF' : '#ddd', padding: '0.5rem 1rem', fontWeight: '500', fontSize: '1.2rem'}} onClick={() => setSession({...session, endRule: 'discretion'})}>Discretion</button>
                <button style={{backgroundColor: session.endRule === 'sets' ? '#0AF' : '#ddd', padding: '0.5rem 1rem', fontWeight: '500', fontSize: '1.2rem'}} onClick={() => setSession({...session, endRule: 'sets'})}>Sets</button>
                <button style={{backgroundColor: session.endRule === 'duration' ? '#0AF' : '#ddd', padding: '0.5rem 1rem', fontWeight: '500', fontSize: '1.2rem'}} onClick={() => setSession({...session, endRule: 'duration'})}>Duration</button>
            </div>
            <button style={{padding: '0.5rem 1rem', fontWeight: '600'}} onClick={createStudySession}>Create Study Session</button>
            <button style={{padding: '0.5rem 1rem', fontWeight: '600'}} onClick={() => setAppState({...appState, mode: 'viewStudySessions'})}>BACK</button>
            <button style={{padding: '0.5rem 1rem', fontWeight: '600'}} onClick={goHome}>HOME</button>
        </div>        
    )
}



