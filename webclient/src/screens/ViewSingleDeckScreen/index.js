import { useState, useEffect } from 'react';

export default function ViewSingleDeckScreen({ deck, allCards, appState, setAppState }) {
    // quick access: appState, setAppState
    // nuanced access: deck obj, this deck's cards (which can also include the cards referenced from other decks in deckRefs)
    const [deckSearch, setDeckSearch] = useState('');
    const [cards, setCards] = useState(deck?.id !== undefined ? allCards.filter(card => deck.cardRefs[card.id] !== undefined) : allCards);
    const [selectedCards, setSelectedCards] = useState({});

    /*
        adjust to receive:
        -- the specific deck we're interested in (initial value)
        
        state to add:
        -- newName, etc. (to check for changes and prompt 'Save Changes')
        -- deckSearch

        TO FIX:
        -- currently still reliant on 'appState' direct feed for 'All Cards' scenario
    
    */

    function searchDeck(e) {
        e.preventDefault();
    }

    function selectCard(cardID) {
        let newSelection = {...selectedCards};
        newSelection[cardID] = !newSelection[cardID];
        setSelectedCards({...newSelection});
    }

    function selectVisibleCards() {
        let newSelection = {...selectedCards};
        cards.forEach(card => newSelection[card.id] = true);
        setSelectedCards({...newSelection});
    }

    function initSelectedCards() {
        let protoSelectedCards = {};
        cards.forEach(card => protoSelectedCards[card.id] = false);
        setSelectedCards({...protoSelectedCards});
    }

    useEffect(() => {
        // console.log(`allCards is: ${JSON.stringify(allCards)}`);
        return initSelectedCards();
    }, []);

    useEffect(() => {
        if (!deckSearch) return setCards(deck?.id !== undefined ? allCards.filter(card => deck.cardRefs[card.id] !== undefined) : allCards);
        return setCards(cards.filter(card => card.prompt.includes(deckSearch) || card.explanation.includes(deckSearch)));
    }, [deckSearch]);

    return (
        <div>
            <h1>{deck?.name || 'All Cards'}</h1>
            <h2>{appState?.currentDeckId === 0 ? Object.keys(appState.cards).length : Object.keys(appState?.decks[appState?.currentDeckId]?.cardRefs).length} Cards in This Deck</h2>
            <h3>{cards.length} Cards Currently Viewed</h3>
            <h3>{Object.keys(selectedCards).filter(cardID => selectedCards[cardID] === true).length} Selected</h3>
            {/* 
                 Deck stats: # of cards, # of sub-decks, # of sessions included in? 
            */}

            <div>
                <input type='text' style={{margin: '0 1rem 1rem 0', padding: '0.5rem'}} value={deckSearch} onChange={e => setDeckSearch(e.target.value)} placeholder={'Search this deck'} />
                <button onClick={() => setDeckSearch('')} style={{padding: '0.5rem 1rem'}}>Clear Search</button>
                <button onClick={selectVisibleCards} style={{padding: '0.5rem 1rem', marginLeft: '1rem'}}>Select All Visible Cards</button>
                <button onClick={initSelectedCards} style={{padding: '0.5rem 1rem', marginLeft: '1rem'}}>De-Select All</button>
            </div>

            <div id='singleDecksCardsContainer' style={{display: 'flex', gap: '1rem'}}>
                {appState?.currentDeckId === 0 ? (
                     <>
                         {Object.keys(appState.cards).map((cardID, index) => (
                             <CardPreviewCard selectCard={selectCard} key={index} card={appState.cards[cardID]} selected={selectedCards[cardID]} ></CardPreviewCard>
                         ))}
                     </>
                ) : (
                    //  <>
                    //      {Object.keys(appState?.decks[appState.currentDeckId].cardRefs).map((cardID, index) => (
                    //          <CardPreviewCard key={index} card={appState.cards[cardID]} className="singleCardCard"></CardPreviewCard>
                    //      ))}
                    //  </>

                    <>
                        {cards.map((card, index) => (
                            <CardPreviewCard selectCard={selectCard} card={card} key={index} selected={selectedCards[card.id]} />
                        ))}
                    </>
                )}
            </div>

            <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                <button>Edit Card{Object.keys(selectedCards).filter(cardID => selectedCards[cardID] === true).length > 1 ? 's' : ''}</button>
                <button onClick={() => setAppState({...appState, mode: 'viewDecks'})}>GO BACK</button>
            </div>

        </div>
    )
}

const CardPreviewCard = ({ card, selected, selectCard }) => {
    return (
        <div onClick={() => selectCard(card.id)} style={{display: 'flex', flexDirection: 'column', width: '160px', height: '240px', border: selected ? '3px solid green' : '1px solid black', borderRadius: '3px', boxSizing: 'border-box'}}>
            
            <div className='cardHeader' style={{width: 'calc(100% - 1rem)', height: '20px', backgroundColor: '#0AF', color: 'white', fontWeight: '600', padding: '0.5rem'}}>
                {card.prompt}
            </div>

            <div className='cardBody' style={{width: '100%', padding: '1rem', boxSizing: 'border-box'}}>
                {card.explanation}
            </div>

        </div>
    )
}