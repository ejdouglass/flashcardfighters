import React, { useState, useEffect, useRef } from 'react';

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
        tags: '', // for later online searching; add when convenient; can also 'derive' from card content, potentially
        description: '',
        shared: false,
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

    function saveNewDeck() {
        // THIS: for now, we just want the deck to be saved (with placeholder name if necessary) to appState, changing appState.mode back to viewing decks
        // IF this deck already exists, we want to override with the new version; if it does NOT exist, we give it a new ID, ensure uniqueness, and plop it into existence
        let newDeckFinalized = {...newDeck};
        if (!newDeckFinalized.name) newDeckFinalized.name = `Nameless Deck #${Object.keys(appState.decks).length + 1}`;
        let appStateCopy = JSON.parse(JSON.stringify(appState));
        appStateCopy.decks[newDeckFinalized.id] = newDeckFinalized;
        return setAppState(appStateCopy);

        // WHOOPS: we're in a save-loop where changing even the deck name calls a new setDeck which calls the side effect of saving which calls this and so on...
        // How can we avoid that eternal loop? 
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
        // THIS: gonna 'save' the deck on any substantive change, using saveNewDeck(); replaces save button
        // BEWARE WILD FIRST-PAINT SAVES; we only want the fxn called when the user -actually- changes something intentionally
        // while we could use a ref to calculate first paint as elsewhere, I think we're better off hax-ing newDeck.name
        // IF there is no name, we just don't save
        // in the long term, it'd be wiser to develop a more nuanced solution, however
        if (newDeck.name.length > 0) return saveNewDeck();
    }, [newDeck]);


    return (
        
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', boxSizing: 'border-box'}}>



            <div id="deckStuffHolder" style={{display: 'flex', flexDirection: 'column', width: '100%'}}>

                <div style={{display: 'flex', width: '100%', fontSize: '1.4rem', fontWeight: '600'}}>
                    Deck Summary
                </div>

                <div style={{display: 'flex', flexDirection: 'row', gap: '1rem'}}>
                    <div id="deckPreview" style={{boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '330px', height: '198px', backgroundColor: '#0AF', borderRadius: '5%'}}>
                        <input type='text' value={newDeck.name} style={{fontSize: '1rem', textAlign: 'center'}} autoFocus={newDeck.name.length === 0} placeholder={`Nameless Deck #${Object.keys(appState.decks).length + 1}`} onChange={e => setNewDeck({...newDeck, name: e.target.value})} />
                        <div style={{color: 'white', fontSize: '1.2rem', fontWeight: '600'}}>Card Total: {newDeck.cards.length}</div>
                    </div>

                    <div style={{display: 'flex', gap: '1rem'}}>                
                        <textarea type='text' rows={5} placeholder={'Deck Description'} style={{boxSizing: 'border-box', resize: 'none', fontSize: '1.2rem', padding: '0.5rem 1rem', width: '300px', fontFamily: 'sans-serif'}} value={newDeck.description} onChange={e => setNewDeck({...newDeck, description: e.target.value})} />
                    </div>

                    <div id="deckButtonsOne" style={{display: 'flex', flexDirection: 'column'}}>
                        <button onClick={deleteDeck} style={{padding: '0.5rem 1rem', height: '100px', alignSelf: 'center', fontSize: '1.2rem', fontWeight: '600', backgroundColor: 'hsl(350,90%,60%)', color: "white"}}>DELETE THIS DECK</button>
                    </div>
                    
                </div>

            </div>



            <div id="deckActionsContainer" style={{display: 'flex', flexDirection: 'column', width: '80vw', minHeight: '50vh'}}>

                <div style={{display: 'flex', flexDirection: 'column', width: '100%', justifyContent: 'center', alignItems: 'center', gap: '1rem'}}>
                        
                        <div id='newCardSingle' style={{width: '500px', height: '300px', display: 'flex', flexDirection: 'column', borderRadius: '10px', backgroundColor: '#0AF'}}>
                            <div id='topOfNewCard' style={{border: '1px solid black', boxSizing: 'border-box', height: '30%', width: '100%', textAlign: 'center', backgroundColor: '#07D', color: 'white', borderRadius: '10px 10px 0 0'}}>
                                <textarea ref={promptRef} type='text' style={{boxSizing: 'border-box', color: 'white', width: '100%', outline: 'none', border: 'none', backgroundColor: 'transparent', textAlign: 'center', padding: '0.5rem 1rem', fontFamily: 'sans-serif', resize: 'none', fontSize: '1.2rem'}} ref={promptRef} value={newCard.prompt} onChange={e => setNewCard({...newCard, prompt: e.target.value})} placeholder={'Card Front/Prompt'} />
                            </div>

                            <div id='bottomOfNewCard' style={{width: '100%', textAlign: 'center'}}>
                                <textarea type='text' rows={3 + Math.floor(newCard.explanation.length / 50)} style={{paddingTop: '0.5rem', color: 'white', outline: 'none', border: 'none', backgroundColor: 'transparent', textAlign: 'center', padding: '0.5rem 1rem', fontFamily: 'sans-serif', resize: 'none', fontSize: '1.2rem'}} value={newCard.explanation} onChange={e => setNewCard({...newCard, explanation: e.target.value})} placeholder={'Card Back/Explanation'} />
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