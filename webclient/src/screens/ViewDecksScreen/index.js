import React, { useState } from 'react';

export default function ViewDecksScreen({ appState, setAppState, goHome }) {
    const [deckSearch, setDeckSearch] = useState('');

    function viewDeck(deckId) {
        return setAppState({...appState, mode: 'editDeck', currentDeckId: deckId});
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <h3>LOOKIT ALL YOUR DECKS</h3>

            <div>Search for specific decks:</div>
            <input style={{margin: '0.5rem 0'}} type='text' placeholder={'Search words'} value={deckSearch} onChange={e => setDeckSearch(e.target.value)} />

            <div onClick={() => setAppState({...appState, mode: 'createDeck'})} style={{marginBottom: '1rem', color: 'white', fontSize: '1.2rem', fontWeight: '600', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '300px', height: '180px', backgroundColor: '#0AF', borderRadius: '5%'}}>
                    (+) Create New Deck
            </div>

            <div id='decklistcontainer' style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>



                {/* <div onClick={() => viewDeck(0)} style={{display: 'flex', alignItems: 'center', textAlign: 'center', justifyContent: 'center', width: '150px', height: '250px', border: '1px solid hsl(240,50%,50%)', borderRadius: '6px', boxSizing: 'border-box', padding: '1rem'}}>
                    All Cards
                </div> */}

                {/* HERE: .map version of all other decks */}
                {Object.keys(appState.decks).filter(deckID => (appState.decks[deckID].name.toLowerCase().includes(deckSearch))).map((deckID, index) => (
                    <div id="deckPreview" key={index} onClick={() => viewDeck(deckID)} style={{boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '300px', height: '180px', backgroundColor: '#0AF', borderRadius: '5%'}}>
                        <div>{appState.decks[deckID].name}</div>
                        <div style={{color: 'white', fontSize: '1.2rem', fontWeight: '600'}}>Card Total: {appState.decks[deckID].cards.length}</div>
                    </div>
                    // <div key={index} onClick={() => viewDeck(deckID)} style={{display: 'flex', alignItems: 'center', textAlign: 'center', justifyContent: 'center', width: '150px', height: '250px', border: '1px solid hsl(240,50%,50%)', borderRadius: '6px', boxSizing: 'border-box', padding: '1rem'}}>
                    //     {appState.decks[deckID].name}
                    // </div>
                ))}



            </div>

        </div>        
    )
}