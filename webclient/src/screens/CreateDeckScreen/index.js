import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// maaay want to rename to EditDeckScreen so we can readily double-duty as creation/editing page (since all our functionality lives here anyway)
export default function CreateDeckScreen({ appState, setAppState , generateRandomID, editingDeck }) {
    /*

        COMPONENT NOTES:
        -- for web, probably a left-side deck summary column, right side create-card/browse-cards section (make it clear what's happening where :P)
            -> for mobile, maybe collapse deck summary details/features, leave just deck name, single-column hide-able card creation, card search/edit scroll


        if receiving editingDeck request, can also get a new timestamp going and compare lastUpdateTime of the deck against it to know if something's changed
        -- note that this will require some eyes on the name, description, and STYLE, as well
    */
    const [newDeck, setNewDeck] = useState({
        id: undefined,
        variant: false,
        lastUpdateTime: undefined,
        name: '',
        tags: '',
        description: '',
        published: false,
        cards: [],
        style: {}
    });
    const [newCard, setNewCard] = useState({
        id: undefined,
        prompt: '',
        explanation: '',
        style: {
            cardstock: undefined,
            penColor: undefined
        }
    });
    const [deckScreenMode, setDeckScreenMode] = useState(newDeck.cards.length > 0 ? 'browseCards' : 'createCards');
    const [cardViewMode, setCardViewMode] = useState('prompt');
    const [cardSearch, setCardSearch] = useState('');
    const promptRef = useRef(null);
    const explanationRef = useRef(null);
    const lastPushRef = useRef(null);

    function createNewCard(e) {
        // HERE: check to see if new card is valid, and if so, create and ALERT accordingly
        // NOTE: need to import the fireAlert fxn for this
        e.preventDefault();
        if (newCard.prompt.length > 0 && newCard.explanation.length > 0) {
            let newCardFinalized = {...newCard, id: generateRandomID()};
            let newestDeck = {...newDeck};
            newestDeck.cards.push(newCardFinalized);
            promptRef.current.focus();
            setNewDeck({...newestDeck, lastUpdateTime: new Date()});
            return setNewCard({id: undefined, prompt: '', explanation: '', style: {...newCard.style}});
        }
        return alert(`BEEP BOOP. Need a prompt and explanation, please.`);
    }

    function publishDeck() {
        // This function should only be callable if the user has an appState.token; 
        
        if (appState.token === undefined) return setAppState({...appState, alertString: `Gotta create a Profile before you can publish decks online.`});
        
        // Since this is through a single-deck-editing screen, we can cheerfully only worry about the one deck present here for all uploading/updating considerations
        // NOTE: id may not be defined yet, which... causes issues, it seems? Maybe? Maybe not? Testing...
        axios.post('/deck/publish', { token: appState.token, decksToAdd: [{...newDeck}] })
            .then(res => {
                
                // successful response handling here:
                // console.log(`DECK PUBLISH DATA RETURN FROM API: ${JSON.stringify(res.data)}`);
                if (res.data.success) {
                    let newLogItem = {
                        echo: `You published ${newDeck.name} to the Great Online Repository of Good and Lovely and Also Helpful Decks.`,
                        timestamp: new Date(),
                        event: 'deck_publish',
                        subject: newDeck.id
                    }
                   
                    return setAppState({...res.data.userData, history: {
                        ...appState.history,
                        log: [...appState.history.log, newLogItem],
                        actions: {...appState.history.actions, decksPublished: appState.history.actions.decksPublished + 1}
                    }});
                } else {
                    if (res.data?.alertString) return setAppState({...appState, alertString: res.data.alertString});
                }
            })
            .catch(err => alert(`Welp, THAT didn't work, because: ${err}`));
    }

    function updateDeck() {
        axios.post('/deck/update', { token: appState.token, decksToUpdate: [{...newDeck}] })
            .then(res => {
                // have to make sure lastPush 'saves' properly on the backend for the user, as well, hrm
                setAppState(res.data.newAppState);
                return setNewDeck({...newDeck, lastPush: res.data.timestamp});
            })
            .catch(err => alert(`ERROR UPDATING DECK: ${err}`));
    }

    function unpublishDeck() {
        axios.post('/deck/unpublish', { token: appState?.token, deckID: newDeck.id })
            .then(res => {
                if (res.data.success) {
                    let newLogItem = {
                        echo: `You unpublished ${newDeck.name}, removing it from the Great Online Repository.`,
                        timestamp: new Date(),
                        event: 'deck_creation',
                        subject: newDeck.id
                    }
                    
                    setAppState({...appState, alertString: `You have successfully unpublished this deck. It is no longer shared online.`, history: {
                        log: [...appState.history.log, newLogItem],
                        actions: {...appState.history.actions, decksUnpublished: appState.history.decksUnpublished + 1}
                    }});
                    return setNewDeck({...newDeck, published: false, lastPush: undefined});
                }
            })
            .catch(err => console.log(`Error unpublishing this deck: ${err}`))
    }

    function saveNewDeck() {
        // This fxn is currently called on EVERY change to the deck, assuming a deck name has been created
        // That does mildly complicate our attempts to do a 'proper history action'... hm.

        if (!newDeck.name) return setNewDeck({...newDeck, name: `Nameless Deck #${Object.keys(appState.decks).length + 1}`});

        let newDeckFinalized = {...newDeck};
        // if (!newDeckFinalized.name) newDeckFinalized.name = `Nameless Deck #${Object.keys(appState.decks).length + 1}`;
        let appStateCopy = JSON.parse(JSON.stringify(appState));

        if (!editingDeck) {
            let newLogItem = {
                echo: `You began assembling a new Deck called ${newDeck.name}.`,
                timestamp: new Date(),
                event: 'deck_creation',
                subject: newDeck.id
            }
            appStateCopy.history.log.push(newLogItem);
            if (!appState.decks[newDeck.id]) {
                appStateCopy.history.actions.decksCreated += 1;
                console.log(`Updating decksCreated in history. Current total is ${appStateCopy.history.actions.decksCreated}`);
            }
            editingDeck = true;
        }

 
        appStateCopy.decks[newDeckFinalized.id] = newDeckFinalized;
        return setAppState(appStateCopy);
    }

    function handleCardUpdate(index, newString, target) {
        // be sure to consider the cardViewMode of prompt vs explanation
        let allCardsCopy = [...newDeck.cards];
        allCardsCopy[index][target] = newString;
        return setNewDeck({...newDeck, cards: allCardsCopy});
    }

    function deleteDeck() {
        setAppState({...appState, globalPrompt: {
            resolved: false,
            echo: `Do you wish to delete this deck (${newDeck.name})?`,
            type: 'yn',
            event: 'deleteDeck',
            target: newDeck.id,
            userInput: undefined
        }});
    }


    useEffect(() => {
        if (editingDeck) {
            setNewDeck(appState.decks[appState.currentDeckId]);
        } else {
            setNewDeck({...newDeck, id: generateRandomID()});
        }
        if (newDeck.name.length > 0) promptRef.current.focus();
    }, []);

    useEffect(() => {
        // CHAOS SAVING: we're gonna try to amend it so that it only saves assuming that we have at least one card made instead of a name
        if (newDeck.cards.length > 0) return saveNewDeck();
        // if (newDeck.name.length > 0) return saveNewDeck();
    }, [newDeck]);

    useEffect(() => {
        if (!lastPushRef.current && newDeck?.published) {
            let dateSource = new Date(newDeck.lastPush);
            let daysRefArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            lastPushRef.current = `${daysRefArr[dateSource.getDay(dateSource)]} ${dateSource.getMonth() + 1}/${dateSource.getDate()} `;
            let dateDifference = Math.floor((new Date().getTime() - dateSource.getTime()) / (1000 * 3600 * 24));
            let finalString = dateDifference === 0 ? `(today)` : `(${dateDifference} days ago)`;
            lastPushRef.current += finalString;
        }
    }, [newDeck.published]);


    return (
        
        <div style={{display: 'flex', flexWrap: 'wrap', flexDirection: 'column', alignItems: 'center', gap: '1rem', boxSizing: 'border-box'}}>



            <div id="deckStuffHolder" style={{display: 'flex', flexWrap: 'wrap', flexDirection: 'column', width: '100%'}}>

                <div style={{display: 'flex', width: '100%', fontSize: '1.4rem', fontWeight: '600'}}>
                    Deck Summary
                </div>

                <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '1rem'}}>

                    <div id="deckPreview" style={{boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', textAlign: 'center', height: '198px', backgroundColor: '#0AF', borderRadius: '5%'}}>
                        <input type='text' value={newDeck.name} style={{fontSize: '1rem', textAlign: 'center'}} autoFocus={newDeck.name.length === 0} placeholder={`Nameless Deck #${Object.keys(appState.decks).length + 1}`} onChange={e => setNewDeck({...newDeck, name: e.target.value})} />
                        <div style={{color: 'white', fontSize: '1.2rem', fontWeight: '600'}}>Card Total: {newDeck.cards.length}</div>
                    </div>

                    <div style={{display: 'flex', gap: '1rem'}}>                
                        <textarea type='text' rows={5} placeholder={'Deck Description'} style={{boxSizing: 'border-box', resize: 'none', fontSize: '1.2rem', padding: '0.5rem 1rem', fontFamily: 'sans-serif'}} value={newDeck.description} onChange={e => setNewDeck({...newDeck, description: e.target.value})} />
                    </div>

                    <div id="deckButtonsOne" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                        <button onClick={deleteDeck}>DELETE THIS DECK</button>
                        {newDeck.published ? (
                            <button onClick={updateDeck} disabled={!appState.username}>UPDATE THIS DECK</button>
                        ) : (
                            <button onClick={() => publishDeck()} disabled={!appState.username}>PUBLISH THIS DECK</button>
                        )}
                        
                    </div>

                    {newDeck?.published &&
                        <div>
                            <h3>{newDeck?.published ? `Last Publish: ${lastPushRef.current}` : ''}</h3>
                            <button onClick={unpublishDeck}>Unpublish Deck</button>
                        </div>
                    }

                    
                </div>

            </div>



            <div id="deckActionsContainer" style={{display: 'flex', flexDirection: 'column', width: '80vw', minHeight: '50vh'}}>

                <div style={{display: 'flex', flexDirection: 'column', width: '100%', justifyContent: 'center', alignItems: 'center', gap: '1rem'}}>
                        
                        {/* Aha! Finally got the right combination of factors to allow card-resizing. Hoo boy. Ensure a max-width so the horizontal swelling is bounded. */}
                        <div id='newCardSingle' style={{minHeight: '300px', width: 'calc(150px + 30vw)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', borderRadius: '10px', backgroundColor: '#0AF'}}>
                            
                            <div id='topOfNewCard' style={{border: '1px solid black', boxSizing: 'border-box', minHeight: '30%', width: '100%', textAlign: 'center', backgroundColor: '#07D', color: 'white', borderRadius: '10px 10px 0 0'}}>
                                <textarea ref={promptRef} type='text' style={{boxSizing: 'border-box', color: 'white', width: '100%', outline: 'none', border: 'none', backgroundColor: 'transparent', textAlign: 'center', padding: '0.5rem 1rem', fontFamily: 'sans-serif', resize: 'none', fontSize: '1.2rem'}} ref={promptRef} value={newCard.prompt} onChange={e => setNewCard({...newCard, prompt: e.target.value})} placeholder={'Card Front/Prompt'} />
                            </div>

                            <div id='bottomOfNewCard' onClick={() => explanationRef.current.focus()} style={{display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', boxSizing: 'border-box', width: '100%', color: 'white', fontSize: '1rem', minHeight: '150px', fontWeight: '600', position: 'relative'}}>
                                <p style={{resize: 'none', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', color: 'white', fontSize: '1rem', fontWeight: '600', boxSizing: 'border-box', height: '100%', width: '100%', padding: '0', margin: '0', backgroundColor: 'black', zIndex: '9'}} >{newCard.explanation}</p>
                                <input ref={explanationRef} onChange={e => setNewCard({...newCard, explanation: e.target.value})} type='text' style={{opacity: '0', position: 'absolute', resize: 'none', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', color: 'white', fontSize: '1rem', fontWeight: '600', boxSizing: 'border-box', height: '100%', width: '100%', padding: '0', margin: '0', background: 'transparent'}} />
                                {/* <textarea type='text' ref={explanationRef} style={{position: 'absolute', width: '100%', height: '100%', background: 'transparent', border: 'none', resize: 'none'}} value={''} onKeyDown={e => doShenanigans(e)} />
                                <div style={{position: 'absolute', width: '100%', minHeight: '100px', border: '1px solid red'}}>{newCard.explanation || `Card Back/Explanation`}</div> */}
                            </div>

                        </div>

                        <button style={{padding: '0.5rem 1rem', fontSize: '1.2rem', fontWeight: '600'}} onClick={createNewCard}>Create Card</button>

                        {newDeck.cards.length > 0 ? (
                            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', width: '100%'}}>
                                <div style={{display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center'}}>
                                    <input type='text' style={{padding: '0.5rem 1rem', width: '200px'}} placeholder={'Search Cards'} value={cardSearch} onChange={e => setCardSearch(e.target.value)} />
                                </div>
                                {newDeck.cards.filter(card => cardSearch.length > 0 ? (card.prompt.includes(cardSearch) || card.explanation.includes(cardSearch)) : card).map((card, index) => (
                                    // this is prooooobably getting nuanced enough to warrant its own component in the near future (and can read the cardstock/etc.)
                                    <div key={index} style={{borderRadius: '10px', display: 'flex', flexDirection: 'column', width: '330px', height: '198px', backgroundColor: '#0AF', color: 'white'}}>
                                        <textarea style={{outline: 'none', height: '35%', borderRadius: '10px 10px 0 0', paddingTop: '0.5rem', color: 'white', background: '#07D', border: '1px solid black', fontSize: '1.2rem', fontWeight: '600', letterSpacing: '0.5px', textAlign: 'center', resize: 'none', fontFamily: 'sans-serif'}} onChange={(e) => handleCardUpdate(index, e.target.value, 'prompt')} value={card.prompt} />
                                        <textarea style={{outline: 'none', paddingTop: '0.5rem', borderRadius: '0 0 10px 10px', height: '100%', color: 'white', background: 'transparent', border: 'none', fontSize: '1.2rem', fontWeight: '500', textAlign: 'center', resize: 'none', fontFamily: 'sans-serif'}} onChange={(e) => handleCardUpdate(index, e.target.value, 'explanation')} value={card.explanation} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <h1>This Deck Currently Has No Cards</h1>
                        )}                        

                </div>

{/* 
                {deckScreenMode === 'createCards' &&

                    <div style={{display: 'flex', flexDirection: 'column', width: '100%', justifyContent: 'center', alignItems: 'center', gap: '1rem', border: '1px solid purple'}}>


                        <div id="newCardSidesContainer" style={{display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', gap: '1rem'}}>
                            <div id="cardFront" style={{display: 'flex', gap: '1rem', flexDirection: 'column', justifyContent: 'center', borderRadius: '5%', width: '500px', height: '300px', backgroundColor: 'hsl(60,30%,95%)'}}>
                                <textarea type='text' style={{outline: 'none', border: 'none', backgroundColor: 'transparent', textAlign: 'center', padding: '0.5rem 1rem', fontFamily: 'sans-serif', resize: 'none', fontSize: '1.2rem'}} ref={promptRef} value={newCard.prompt} onChange={e => setNewCard({...newCard, prompt: e.target.value})} placeholder={'Card Front/Prompt'} />
                            </div>

                            <div id="cardBack" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRadius: '5%', width: '500px', height: '300px', backgroundColor: 'hsl(60,30%,95%)'}}>
                                <textarea type='text' rows={3 + Math.floor(newCard.explanation.length / 50)} style={{outline: 'none', border: 'none', backgroundColor: 'transparent', textAlign: 'center', padding: '0.5rem 1rem', fontFamily: 'sans-serif', resize: 'none', fontSize: '1.2rem'}} value={newCard.explanation} onChange={e => setNewCard({...newCard, explanation: e.target.value})} placeholder={'Card Back/Explanation'} />
                            </div>                        
                        </div>

                        

                        <button onClick={createNewCard} style={{padding: '0.5rem 1rem', fontWeight: '600', fontSize: '1rem', width: '20%'}}>Create New Card</button>


                    </div>                
                }

                {deckScreenMode === 'browseCards' &&
                    <div ref={promptRef} style={{display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: '1rem', padding: '1rem', border: '1px solid purple'}}>
                        {newDeck.cards.length > 0 ? (
                            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', width: '100%'}}>
                                <div style={{display: 'flex', gap: '1rem', width: '100%'}}>
                                    <input type='text' style={{padding: '0.5rem 1rem', width: '200px'}} placeholder={'Search Cards'} value={cardSearch} onChange={e => setCardSearch(e.target.value)} />
                                    <button style={{padding: '0.5rem 1rem', backgroundColor: cardViewMode === 'prompt' ? 'hsl(150,80%,70%)' : '#DDD'}} onClick={() => setCardViewMode('prompt')}>Prompt</button>
                                    <button style={{padding: '0.5rem 1rem', backgroundColor: cardViewMode === 'explanation' ? 'hsl(150,80%,70%)' : '#DDD'}} onClick={() => setCardViewMode('explanation')}>Explanation</button>
                                </div>
                                {newDeck.cards.filter(card => cardSearch.length > 0 ? (card.prompt.includes(cardSearch) || card.explanation.includes(cardSearch)) : card).map((card, index) => (
                                    // this is prooooobably getting nuanced enough to warrant its own component in the near future (and can read the cardstock/etc.)
                                    <div key={index} style={{borderRadius: '10px', display: 'flex', flexDirection: 'column', width: '300px', height: '180px', backgroundColor: '#0AF', color: 'white'}}>
                                        <textarea style={{outline: 'none', borderRadius: '10px 10px 0 0', paddingTop: '0.5rem', color: 'white', background: '#07D', border: '1px solid black', fontSize: '1.2rem', fontWeight: '600', letterSpacing: '0.5px', textAlign: 'center', resize: 'none', fontFamily: 'sans-serif'}} onChange={(e) => handleCardUpdate(index, e.target.value, 'prompt')} value={card.prompt} />
                                        <textarea style={{outline: 'none', borderRadius: '0 0 10px 10px', height: '100%', color: 'white', background: 'transparent', border: 'none', fontSize: '1.2rem', fontWeight: '500', textAlign: 'center', resize: 'none', fontFamily: 'sans-serif'}} onChange={(e) => handleCardUpdate(index, e.target.value, 'explanation')} value={card.explanation} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <h1>NO CARDS YET</h1>
                        )}
                    </div>
                }
                 */}

            </div>

        </div>
    )
}




/*
    -- PUBLISH THIS DECK button should be obviously boopable or not, and should change to UPDATE THIS DECK (or similar) once it is successfully shared: true

*/