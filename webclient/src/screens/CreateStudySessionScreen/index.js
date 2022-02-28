import React, { useState } from 'react';

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
        return setAppState({...appState, sessions: {...newAppSessions}, mode: 'viewStudySessions', alertString: `New study session created. GRIND YOUR INT!`, history: {
            log: [...appState.history.log, newLogItem],
            actions: {...appState.history.actions, sessionsCreated: appState.history.actions.sessionsCreated + 1}
        }});
        // console.log(`New App Sessions looks like this now: ${JSON.stringify(appState.sessions)}`);
        
    }

    // ADD: # of sets, duration amount for non-discretion options
    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start'}}>
            <h1>Create Study Session</h1>
            <input style={{padding: '0.5rem 1rem'}} type='text' value={session.nickname} onChange={e => setSession({...session, nickname: e.target.value})} placeholder={'Session nickname'} />
            <div>{session.deckRefs.length} deck{session.deckRefs.length > 1 ? 's' : ''} selected.</div>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '1rem'}}>
                <div style={{width: '100%', display: 'flex', gap: '1rem'}}>
                    <label>Narrow Down Your Decks: </label>
                    <input type='text' value={deckSearchString} onChange={e => setDeckSearchString(e.target.value)} placeholder={'Search Decks'} />
                </div>
                {Object.keys(appState.decks).filter(deckID => appState.decks[deckID].name.toLowerCase().includes(deckSearchString.toLowerCase()) || appState.decks[deckID].description.toLowerCase().includes(deckSearchString.toLowerCase()) || appState.decks[deckID].tags.toLowerCase().includes(deckSearchString.toLowerCase())).map((deckID, index) => (
                    <div className={'cardlike'} style={{backgroundColor: session.deckRefs.find(el => el === deckID) ? '#0AF' : 'white'}} onClick={() => addDeckToSession(deckID)} key={index}>{appState.decks[deckID].name}</div>
                ))}
            </div>
            <button style={{padding: '0.5rem 1rem', fontWeight: '600'}} onClick={createStudySession}>Create Study Session</button>
            <button style={{padding: '0.5rem 1rem', fontWeight: '600'}} onClick={() => setAppState({...appState, mode: 'viewStudySessions'})}>BACK</button>
            <button style={{padding: '0.5rem 1rem', fontWeight: '600'}} onClick={goHome}>HOME</button>
        </div>        
    )
}
