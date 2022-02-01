import React, { useState, useEffect } from 'react';

export default function Prompt({ appState, setAppState }) {
    // const [userInput, setUserInput] = useState(undefined);


    function handlePromptResponse(userInput) {
        switch (appState?.globalPrompt?.event) {
            case 'deleteDeck': {
                if (userInput === 'n') return setAppState({...appState, globalPrompt: undefined});

                let allDecksCopy = {...appState.decks};
                delete allDecksCopy[appState.globalPrompt.target];
                return setAppState({...appState, decks: {...allDecksCopy}, mode: 'viewDecks'});
            }
            default: return;
        }
    }

    
    if (appState?.globalPrompt?.echo?.length > 0) {
        return (
            <div id='screenmask' style={{position: 'fixed', top: '0', left: '0', width: '100vw', height: '100%', backgroundColor: 'hsla(0,0%,10%,0.5)', zIndex: '8'}}>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', position: 'fixed', top: '25vh', left: '30vw', backgroundColor: 'white', zIndex: '99', width: '40vw', height: '20vh', border: '2px solid blue'}}>
                    <div style={{fontSize: '1.5rem'}}>{appState.globalPrompt.echo}</div>
                    <div style={{display: 'flex', gap: '50%', justifyContent: 'center', alignItems: 'center'}}>
                        {appState.globalPrompt.type === 'yn' && (
                            <>
                                <button onClick={() => handlePromptResponse('y')} style={{padding: '0.5rem 1rem', fontSize: '1.2rem', fontWeight: '600'}}>Yup</button>
                                <button onClick={() => handlePromptResponse('n')} style={{padding: '0.5rem 1rem', fontSize: '1.2rem', fontWeight: '600'}}>Nah</button>
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

*/