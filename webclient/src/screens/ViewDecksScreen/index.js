import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function ViewDecksScreen({ appState, setAppState, goHome }) {
    const [deckSearch, setDeckSearch] = useState('');
    const [viewOnlineDecks, setViewOnlineDecks] = useState(false);
    const [searchResultsArray, setSearchResultsArray] = useState([]);
    const searchInputRef = useRef(null);

    // Hm. Can either consolidate the two searches into a single bar, or... actually, yep, let's do that.
    // Then add a ref.focus on it whenever we switch tabs.


    function viewDeck(deckId) {
        return setAppState({...appState, mode: 'editDeck', currentDeckId: deckId});
    }

    function handleSearchInput(e) {
        e.preventDefault();
        // consider resetting online results to blank when deleting search string (owned decks currently behave as expected already)
        if (viewOnlineDecks) {
            axios.post('/deck/fetch', { deckSearchString: deckSearch })
            .then(res => {
                setSearchResultsArray(res.data.deckResultsArray);
            })
            .catch(err => console.log(err));            
        }
        return setDeckSearch(e.target.value);
    }

    function addPublicDeck(id) {
        /*
            ADDITIONAL CONSIDERATIONS:
            -- if the user already has the deck in their collection
            -- what if the user wants to UPDATE their decks?
            -- hm, maybe a separate UPDATE CHECK functionality from the Decks screen
        */
        // hm, names can change; we should check id
        if (appState?.decks[id]?.name) return alert(`You already have that deck in your collection. Although maybe it needs an update? We should have a warning for that.`);
        axios.post('/user/add_deck', { token: appState?.token, deckID: id })
            .then(res => {
                let allDecksCopy = {...appState.decks};
                allDecksCopy[id] = res.data.deck;
                let newLogItem = {
                    echo: `You downloaded your very own personal copy of the public Deck known as ${res.data.deck.name}.`,
                    timestamp: new Date(),
                    event: 'deck_download',
                    subject: res.data.deck.id
                }

                setAppState({...appState, decks: allDecksCopy, history: {
                    ...appState.history,
                    log: [...appState.history.log, newLogItem],
                    actions: {...appState.history.actions, decksDownloaded: appState.history.actions.decksDownloaded + 1}
                }, alertString: `Successfully added ${res.data.deck.name} to your decks!`});
            })
            .catch(err => console.log(`An error in retrieving a public deck has occurred: ${err}`));
    }


    useEffect(() => {
        searchInputRef.current.focus();
    }, [viewOnlineDecks]);


    return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>

            <div style={{width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2rem'}}>

                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <div>Search for specific decks:</div>
                    <input ref={searchInputRef} style={{margin: '0.5rem 0'}} type='text' placeholder={'Search words'} value={deckSearch} onChange={e => handleSearchInput(e)} />
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
                    <div style={{display: 'flex', flexDirection: 'column', width: '100%', gap: '1rem', boxSizing: 'border-box'}}>
                        {/* <form style={{display: 'flex', gap: '1rem'}} onSubmit={performOnlineSearch}>
                            <input type='text' value={onlineDeckSearch} onChange={e => setOnlineDeckSearch(e.target.value)} style={{padding: '0.5rem 1 rem', fontSize: '1rem'}} placeholder={`Enter Search Term(s)`} />
                            <button type='submit'>Search!</button>
                        </form> */}
                        <div style={{display: 'flex', width: '100%', flexDirection: 'column', gap: '1rem'}}>
                            {searchResultsArray.map((deckItem, index) => (
                                <PublicDeckResultCard deckItem={deckItem} index={index} key={index} addPublicDeck={addPublicDeck} alreadyOwned={appState?.decks[deckItem.id] !== undefined ? true: false} />
                            ))}
                        </div>

                        {/* HERE-ish: a bunch of wide rows with extracted search data with buttons to Add to your own decks */}
                        
                    </div>
                ) : (
                    <>
                        {Object.keys(appState?.decks).filter(deckID => (appState.decks[deckID].name.toLowerCase().includes(deckSearch.toLowerCase()))).map((deckID, index) => (
                            <div id="deckPreview" key={index} onClick={() => viewDeck(deckID)} style={{boxSizing: 'border-box', border: appState.decks[deckID].published ? '4px solid gold' : '2px solid black', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '300px', height: '180px', backgroundColor: appState.decks[deckID].variant ? '#3DF' : '#0AF', borderRadius: '5%'}}>
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

const PublicDeckResultCard = ({ deckItem, index, addPublicDeck, alreadyOwned }) => {
    return (
        <div style={{width: '100%', border: '1px solid green', boxSizing: 'border-box', padding: '1rem', backgroundColor: 'white'}}>
            <h4 style={{margin: '0'}}>{deckItem.name} - {deckItem.cardTotal} cards</h4>
            <p>{deckItem.description}</p>
            <div style={{display: 'flex', width: '100%'}}>
                {alreadyOwned ? (
                    <>
                        <button disabled={true} style={{padding: '0.5rem 1rem', fontSize: '1.1rem', fontWeight: '600'}}>Already Owned</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => addPublicDeck(deckItem.id)} style={{padding: '0.5rem 1rem', fontSize: '1.1rem', fontWeight: '600'}}>Add to My Decks</button>
                    </>
                )}
                
            </div>
        </div>
    )
}