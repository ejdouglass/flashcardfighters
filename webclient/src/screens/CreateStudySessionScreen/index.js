import React, { useState } from 'react';
import axios from 'axios';

export default function CreateStudySessionScreen({ fireAlert, generateRandomID, goHome, appState, setAppState }) {
    /*

        ARRAY SEARCHING METHODS:
        -- arr.find(el => el.key === 'whatever') ... this will give the first element in the array that matches the criteria (can && it as well), 
            returns 'undefined' if not found
        -- arr.indexOf(el => el.key === 'whatever') ... gives index of the searchTarget found, or -1 if not found, instead of element itself

    */
    const [session, setSession] = useState({
        nickname: '',
        id: undefined,
        deckRefs: [],
        endRule: 'discretion'
    });
    const [deckSearchString, setDeckSearchString] = useState('');

    function addDeckToSession(deckID) {
        return session.deckRefs.indexOf(deckID) > -1 ? setSession({...session, deckRefs: [...session.deckRefs].filter(deck => deck !== deckID)}) : setSession({...session, deckRefs: [...session.deckRefs, deckID]});
    }

    function createStudySession() {
        if (session.nickname.length < 1) return fireAlert(`Please enter a nickname for this session.`);
        if (session.deckRefs.length < 1) return fireAlert(`Please select at least one deck to use for the study session.`);
        let newAppSessions = {...appState.sessions} || {};
        // console.log(`NEWAPPSESSIONS UPON INIT IS NOW: ${JSON.stringify(newAppSessions)}`);
        let newSessionID = generateRandomID();
        newAppSessions[newSessionID] = {...session, id: newSessionID};
        // console.log(`FINAL FORM OF NEWAPPSESSIONS SHOULD BE: ${JSON.stringify(newAppSessions)}`)
        let newLogItem = {
            echo: `You created a new study session entitled ${session.nickname}. May it guide your personal growth effectively.`,
            timestamp: new Date(),
            event: 'session_creation',
            subject: newSessionID
        }
        let newAppState = ({...appState, sessions: {...newAppSessions}, mode: 'viewStudySessions', alertString: `New study session created. GRIND YOUR INT!`, history: {
            log: [...appState.history.log, newLogItem],
            actions: {...appState.history.actions, sessionsCreated: appState.history.actions.sessionsCreated + 1}
        }});
        axios.post('/user/update', { userAppData: newAppState })
        .then(() => {
          // currently not expecting a response here :P ... though the lack of a response does mean the client is quite in the dark here
          console.log(`User update pushed to back-end.`);
        })
        .catch(err => console.log(`Error updating user: `, err));           
        return setAppState(newAppState);
     
        // console.log(`New App Sessions looks like this now: ${JSON.stringify(appState.sessions)}`);
        
    }


    // ADD: # of sets, duration amount for non-discretion options
    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start'}}>
            <div style={{fontSize: 'calc(1rem + 0.5vw)', fontWeight: '600'}}>Create Study Session</div>
            <input autoFocus={true} style={{padding: '0.5rem 1rem'}} type='text' value={session.nickname} onChange={e => setSession({...session, nickname: e.target.value})} placeholder={'(session nickname)'} />
            <button style={{padding: '0.5rem 1rem', fontWeight: '600'}} onClick={createStudySession}>Create Study Session</button>
            <div>{session.deckRefs.length} deck{session.deckRefs.length > 1 || session.deckRefs.length === 0 ? 's' : ''} selected.</div>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '1rem'}}>
                <div style={{width: '100%', display: 'flex', gap: '1rem', alignItems: 'center'}}>
                    <label>Narrow Down Your Decks: </label>
                    <input type='text' value={deckSearchString} onChange={e => setDeckSearchString(e.target.value)} placeholder={'(deck filter terms)'} />
                </div>
                <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem'}}>
                {Object.keys(appState.decks).filter(deckID => appState.decks[deckID].name.toLowerCase().includes(deckSearchString.toLowerCase()) || appState.decks[deckID].description.toLowerCase().includes(deckSearchString.toLowerCase()) || appState.decks[deckID].tags.toLowerCase().includes(deckSearchString.toLowerCase())).map((deckID, index) => (
                    <div style={{display: 'flex', fontSize: 'calc(0.6rem + 0.6vw)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', border: '1px solid hsl(240,80%,20%)', width: 'calc(150px + 5vw)', height: '5rem', justifyContent: 'center', alignItems: 'center', borderRadius: '5px', boxSizing: 'border-box',  backgroundColor: session.deckRefs.find(el => el === deckID) ? '#0AF' : 'white'}} onClick={() => addDeckToSession(deckID)} key={index}>{appState.decks[deckID].name}</div>
                ))}
                </div>
            </div>
            
        </div>        
    )
}


/*

Probably reset the session display to be screenwide-ish, with lil' helpful buttons inside and descriptiond displayed.
-- oop! Nevermind. Currently we're not sharing sessions, so there are no descriptions. :P

*/