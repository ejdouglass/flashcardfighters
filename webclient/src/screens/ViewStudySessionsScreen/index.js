import React from 'react';

export default function ViewStudySessionsScreen({ appState, setAppState }) {

    function toggleFavorite(id) {
        let modifiedSessionCopy = {...appState.sessions};
        modifiedSessionCopy[id].favorite = modifiedSessionCopy[id]?.favorite === undefined ? true : !modifiedSessionCopy[id].favorite;
        return setAppState({...appState, sessions: {...modifiedSessionCopy}});
    }


    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', flexWrap: 'wrap'}}>
                
                <div style={{width: '100%', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>

                <button style={{width: '200px', height: '50px', boxSizing: 'border-box', padding: '0.5rem 1rem'}} onClick={() => setAppState({...appState, mode: 'createStudySession'})}>+ Create New Session</button>
                </div>

                

                <div id='sessionsContainer' style={{display: 'flex', alignItems: 'flex-start', boxSizing: 'border-box', justifyContent: 'center', width: 'calc(70vw - 2rem)', minHeight: '50vh', gap: '1rem', flexWrap: 'wrap', padding: '1rem', backgroundColor: '#CCC'}}>
                    
                    {Object.keys(appState.sessions).map((sessionID, index) => (
                        <div key={index} style={{gap: '1rem', flexDirection: 'column', backgroundColor: '#FEFEFE', border: '1px solid hsl(240,80%,40%)', borderRadius: '1rem', width: '100%', display: 'flex', flexWrap: 'wrap', boxSizing: 'border-box', padding: '1rem'}}>
                            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', flexDirection: 'row'}}>
                                <button style={{height: '50px', width: '50px'}} onClick={() => toggleFavorite(sessionID)}>{appState.sessions[sessionID].favorite ? '!!' : '??'}</button>
                                <div style={{fontWeight: '600', fontSize: 'calc(0.8rem + 0.5vw)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center'}}>{appState.sessions[sessionID].nickname}</div>
                            </div>
                            
                            <button style={{height: '50px', width: '100px'}} onClick={() => setAppState({...appState, mode: 'studySession', currentModeTargetID: sessionID})}>Study!</button>
                        </div>
                    ))}

                </div>

            </div>
        </div>
    )    
}

const SessionPreviewRow = () => {
    // probably go with a container column-style with carefully-wide rows of content
    // Top Row: fixed-width nickname (that, if clipped by shrinking horizontal, can dootdootdoot) and STAR OF FAVORITISM
    return (
        <div>

        </div>
    )
}

/*
    Implementing favoriting mechanism...
    ... ugly but works. :P Currently not really limiting them to ~5, though that's probably an upcoming intention.

        <div style={{width: '100%', border: '1px solid green', boxSizing: 'border-box', padding: '1rem', backgroundColor: 'white'}}>
            <h4 style={{margin: '0'}}>{deckItem.name} - {deckItem.cardTotal || deckItem.cards.length} cards</h4>
            <p>{deckItem.description}</p>
            <div style={{display: 'flex', width: '100%'}}>
                <button onClick={() => viewDeck(deckItem.id)}>Edit Deck</button>
                
            </div>
        </div>

*/