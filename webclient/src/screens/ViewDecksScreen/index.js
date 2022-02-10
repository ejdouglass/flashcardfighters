import React, { useState } from 'react';
import axios from 'axios';

export default function ViewDecksScreen({ appState, setAppState, goHome }) {
    const [deckSearch, setDeckSearch] = useState('');
    const [onlineDeckSearch, setOnlineDeckSearch] = useState('');
    const [viewOnlineDecks, setViewOnlineDecks] = useState(false);


    function viewDeck(deckId) {
        return setAppState({...appState, mode: 'editDeck', currentDeckId: deckId});
    }

    function performOnlineSearch(e) {
        e.preventDefault();
        axios.post('/deck/fetch', { deckSearchString: onlineDeckSearch })
            .then(res => {
                alert(`Received response data: ${JSON.stringify(res.data)}`);
            })
            .catch(err => console.log(err));
    }


    return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>

            <div style={{width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2rem'}}>

                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <div>Search for specific decks:</div>
                    <input style={{margin: '0.5rem 0'}} type='text' placeholder={'Search words'} value={deckSearch} onChange={e => setDeckSearch(e.target.value)} />
                </div>


                <div onClick={() => setAppState({...appState, mode: 'createDeck'})} style={{marginBottom: '1rem', color: 'white', fontSize: '1.2rem', fontWeight: '600', boxSizing: 'border-box', padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '150px', height: '90px', backgroundColor: '#0AF', borderRadius: '5%'}}>
                        (+) Create New Deck
                </div>

            </div>

            <div style={{width: '100%', display: 'flex', gap: '0.5rem'}}>
                <button onClick={() => setViewOnlineDecks(false)} style={{backgroundColor: viewOnlineDecks === false ? 'white' : 'gray', fontSize: '1.2rem', fontWeight: '600', alignSelf: 'flex-start', boxSizing: 'border-box', border: '1px solid black', padding: '1rem', borderRadius: '10px 10px 0 0'}}>Your Decks</button>
                <button onClick={() => setViewOnlineDecks(true)} style={{backgroundColor: viewOnlineDecks === true ? 'white' : 'gray', fontSize: '1.2rem', fontWeight: '600', alignSelf: 'flex-start', boxSizing: 'border-box', border: '1px solid black', padding: '1rem', borderRadius: '10px 10px 0 0'}}>Search Public Decks</button>
            </div>

            <div id='decklistcontainer' style={{display: 'flex', width: 'calc(100% - 2rem)', minHeight: '400px', gap: '1rem', flexWrap: 'wrap', padding: '1rem', backgroundColor: 'gray'}}>

                {viewOnlineDecks ? (
                    <>
                        <form onSubmit={performOnlineSearch}>
                            <input type='text' value={onlineDeckSearch} onChange={e => setOnlineDeckSearch(e.target.value)} style={{padding: '0.5rem 1 rem', fontSize: '1rem'}} placeholder={`Enter Search Term(s)`} />
                            <button type='submit'>Search!</button>
                        </form>

                        {/* HERE-ish: a bunch of wide rows with extracted search data with buttons to Add to your own decks */}
                        
                    </>
                ) : (
                    <>
                        {Object.keys(appState.decks).filter(deckID => (appState.decks[deckID].name.toLowerCase().includes(deckSearch))).map((deckID, index) => (
                            <div id="deckPreview" key={index} onClick={() => viewDeck(deckID)} style={{boxSizing: 'border-box', border: appState.decks[deckID].shared ? '3px solid gold' : '2px solid black', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '300px', height: '180px', backgroundColor: '#0AF', borderRadius: '5%'}}>
                                <div>{appState.decks[deckID].name}</div>
                                <div style={{color: 'white', fontSize: '1.2rem', fontWeight: '600'}}>Card Total: {appState.decks[deckID].cards.length}</div>
                            </div>
                            // <div key={index} onClick={() => viewDeck(deckID)} style={{display: 'flex', alignItems: 'center', textAlign: 'center', justifyContent: 'center', width: '150px', height: '250px', border: '1px solid hsl(240,50%,50%)', borderRadius: '6px', boxSizing: 'border-box', padding: '1rem'}}>
                            //     {appState.decks[deckID].name}
                            // </div>
                        ))}                    
                    </>
                )}





            </div>

        </div>        
    )
}