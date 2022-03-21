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
        setDeckSearch('');
    }, [viewOnlineDecks]);


    return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>

            <div style={{width: '100%', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>


                <button style={{width: '200px', height: '50px', boxSizing: 'border-box', padding: '0.5rem 1rem'}} onClick={() => setAppState({...appState, mode: 'createDeck'})}>
                        + Create New Deck
                </button>

                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    {/* <label style={{height: '30px', margin: '0'}}>Search for specific decks:</label> */}
                    <input ref={searchInputRef} style={{height: '50px', width: '200px', boxSizing: 'border-box'}} type='text' placeholder={'(search decks)'} value={deckSearch} onChange={e => handleSearchInput(e)} />
                </div>


            </div>

            <div style={{width: 'calc(70vw - 2rem)', boxSizing: 'border-box', display: 'flex', gap: '0.5rem'}}>
                <button onClick={() => setViewOnlineDecks(false)} style={{backgroundColor: viewOnlineDecks === false ? 'white' : 'hsl(240,0%,70%)', color: viewOnlineDecks === false ? 'black' : 'hsl(240,10%,30%)', fontWeight: '600', alignSelf: 'flex-start', boxSizing: 'border-box', border: '1px solid #888', borderBottom: '1px solid #CCC', padding: '1rem', borderRadius: '10px 10px 0 0'}}>My Decks</button>
                <button onClick={() => setViewOnlineDecks(true)} style={{backgroundColor: viewOnlineDecks === true ? 'white' : 'hsl(240,0%,70%)', color: viewOnlineDecks === true ? 'black' : 'hsl(240,10%,30%)', fontWeight: '600', alignSelf: 'flex-start', boxSizing: 'border-box', border: '1px solid #888', borderBottom: '1px solid #CCC', padding: '1rem', borderRadius: '10px 10px 0 0'}}>Public Decks</button>
            </div>

            <div id='decklistcontainer' style={{display: 'flex', boxSizing: 'border-box', justifyContent: 'center', width: 'calc(70vw - 2rem)', minHeight: '400px', gap: '1rem', flexWrap: 'wrap', padding: '1rem', backgroundColor: '#CCC'}}>

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

                            {!searchResultsArray.length &&
                                <div>No results found.</div>
                            }
                        </div>

                        {/* HERE-ish: a bunch of wide rows with extracted search data with buttons to Add to your own decks */}
                        
                    </div>
                ) : (
                    <div style={{display: 'flex', flexDirection: 'column', width: '100%', gap: '1rem', boxSizing: 'border-box'}}>
                        {Object.keys(appState?.decks).filter(deckID => (appState.decks[deckID].name.toLowerCase().includes(deckSearch.toLowerCase()))).map((deckID, index) => (
                            <MyDeckResultCard deckItem={appState.decks[deckID]} viewDeck={viewDeck} key={index} />
                            // <div id="deckPreview" key={index} onClick={() => viewDeck(deckID)} style={{boxSizing: 'border-box', border: appState.decks[deckID].published ? '4px solid gold' : '2px solid black', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '300px', height: '180px', backgroundColor: appState.decks[deckID].variant ? '#3DF' : '#0AF', borderRadius: '5%'}}>
                            //     <div>{appState.decks[deckID].name}</div>
                            //     <div style={{color: 'white', fontSize: '1.2rem', fontWeight: '600'}}>Card Total: {appState.decks[deckID].cards.length}</div>
                            // </div>

                            // <div key={index} onClick={() => viewDeck(deckID)} style={{display: 'flex', alignItems: 'center', textAlign: 'center', justifyContent: 'center', width: '150px', height: '250px', border: '1px solid hsl(240,50%,50%)', borderRadius: '6px', boxSizing: 'border-box', padding: '1rem'}}>
                            //     {appState.decks[deckID].name}
                            // </div>
                        ))}                    
                    </div>
                )}





            </div>

        </div>        
    )
}

const PublicDeckResultCard = ({ deckItem, index, addPublicDeck, alreadyOwned }) => {
    // kind of awkwardly double-dipping this for both local deck objects and the returned public search deck objects...
    // it 'works,' but it makes more sense to have a styled-component base for both and have them become separate components
    return (
        <div style={{width: '100%', border: '1px solid hsl(240,80%,40%)', borderRadius: '5px', boxSizing: 'border-box', padding: '1rem', backgroundColor: 'white'}}>
            <h4 style={{margin: '0'}}>{deckItem.name} - {deckItem?.cardTotal || deckItem?.cards?.length} cards</h4>
            <p>{deckItem.description}</p>
            <div style={{display: 'flex', width: '100%'}}>
                {alreadyOwned ? (
                    <>
                        <button disabled={true} style={{padding: '0.5rem 1rem'}}>Already Owned</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => addPublicDeck(deckItem.id)} style={{padding: '0.5rem 1rem'}}>Add to My Decks</button>
                    </>
                )}
                
            </div>
        </div>
    )
}

const MyDeckResultCard = ({ deckItem, viewDeck }) => {
    // kind of awkwardly double-dipping this for both local deck objects and the returned public search deck objects...
    // it 'works,' but it makes more sense to have a styled-component base for both and have them become separate components
    const [deckStatusBorder, setDeckStatusBorder] = useState('1px solid hsl(240,80%,40%)');

    useEffect(() => {
        if (deckItem.variant) return setDeckStatusBorder('2px solid hsl(120,80%,60%)');
        if (deckItem.published) return setDeckStatusBorder('2px solid hsl(40,90%,50%)');
    }, []);

    return (
        <div style={{width: '100%', border: deckStatusBorder, borderRadius: '5px', boxSizing: 'border-box', padding: '1rem', backgroundColor: 'white'}}>
            <h4 style={{margin: '0'}}>{deckItem.name} - {deckItem.cardTotal || deckItem.cards.length} cards</h4>
            <p>{deckItem.description}</p>
            <div style={{display: 'flex', width: '100%'}}>
                <button onClick={() => viewDeck(deckItem.id)}>Edit Deck</button>
                
            </div>
        </div>
    )
}