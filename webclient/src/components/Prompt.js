import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Prompt({ appState, setAppState }) {
    // const [userInput, setUserInput] = useState(undefined);


    function handlePromptResponse(userInput) {
        switch (appState?.globalPrompt?.event) {
            case 'deleteDeck': {
                if (userInput === 'n') return setAppState({...appState, globalPrompt: undefined});

                // let allDecksCopy = {...appState.decks};
                let appStateCopy = JSON.parse(JSON.stringify(appState));
                let newLogItem = {
                    echo: `You deleted the Deck called ${appState.decks[appState.globalPrompt.target].name}.`,
                    timestamp: new Date(),
                    event: 'deck_deletion',
                    subject: appState.globalPrompt.target
                }
                appStateCopy.history.log.push(newLogItem);              
                delete appStateCopy.decks[appState.globalPrompt.target];
                appStateCopy.history.actions.decksDeleted += 1;

                axios.post('/user/update', { userAppData: appState })
                    .then(res => {
                        if (res.data.success) {
                            console.log(`Backend update of deck deletion was successful.`);
                            return setAppState({...appStateCopy, mode: 'viewDecks', globalPrompt: undefined});
                        }
                    })
                    .catch(err => setAppState({...appState, alertString: `Error deleting deck: ${err}`}));

                break;

                // return setAppState({...appState, decks: {...allDecksCopy}, mode: 'viewDecks', globalPrompt: undefined});
            }
            

            case 'deleteProfile': {
                // axios time! we're expected to pass the token back for this
                if (userInput === 'n') return setAppState({...appState, globalPrompt: undefined});

                axios.post('/user/delete', { token: appState.token })
                    .then(() => {
                        localStorage.removeItem('flashcardfighterApp');
                        setAppState({
                            username: undefined,
                            alertString: `You have successfully deleted your User Profile.`,
                            globalPrompt: undefined,
                            decks: {},
                            sessions: {},
                            mode: undefined,
                            currentDeckId: undefined,
                            currentModeTargetID: undefined,
                            schedule: {},
                            history: {}            
                        });                        
                    })
                    .catch(err => alert(`Deletion attempt received an error: ${err}`));
                break;
            }

            default: return;
        }
    }

    
    if (appState?.globalPrompt?.echo?.length > 0) {
        return (
            <div id='screenmask' style={{position: 'fixed', top: '0', left: '0', width: '100vw', height: '100%', backgroundColor: 'hsla(0,0%,10%,0.5)', zIndex: '8'}}>
                <div style={{display: 'flex', flexWrap: 'wrap', padding: '0.5rem 1rem', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', position: 'fixed', top: '25vh', boxSizing: 'border-box', left: 'calc(45vw - 100px)', backgroundColor: 'white', zIndex: '99', width: 'calc(200px + 10vw)', height: '20vh', border: '2px solid #06C', borderRadius: '5px'}}>
                    <div style={{fontSize: 'calc(0.8rem + 0.4vw)'}}>{appState.globalPrompt.echo}</div>
                    <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center'}}>
                        {appState.globalPrompt.type === 'yn' && (
                            <>
                                <button onClick={() => handlePromptResponse('y')} style={{}}>Yes</button>
                                <button onClick={() => handlePromptResponse('n')} style={{}}>No</button>
                            </>
                        )}

                    </div>
                </div>
            </div>
        )
    }

    return null;
}

/*
    PROMPTS!
    Prompts are, in fact, OBJECTS! Shock!

    prompt: {
        echo: ``,
        type: ``,
        event: ``,
        target: ``,
        resolved: ``,
        userInput: ``
    }
    - ECHO is the text that appears to the user in the PROMPT BOX
    - TYPE is assumed to be default of yn ('Yes' or 'No')
    - EVENT is (poorly worded?) what the prompt is FOR; this is the reference to what should be changed based on the prompt
    - TARGET is the target of the event (such as deletion or change); when paired with EVENT, we should have enough information to enact the user's intention
        note that we can have an event of DeleteDeck and a separate event of DeleteMultipleDecks, which would have a string ID and array of string IDs as target(s), respectively
    - RESOLVED is true/false, defaults to false; upon changing to TRUE, upon user's successful input, prompt resolves



    ... idle thought, but we could have TYPE include 'multiple_choice'/'mc' and then have a separate variable 'inputOptions' as an array
        - that would require some deeper thought on the handling of potentially amorphous inputOption values and results, but would be pretty handy

*/