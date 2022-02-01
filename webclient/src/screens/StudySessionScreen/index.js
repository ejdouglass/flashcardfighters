import React, { useState, useEffect, useRef } from 'react';

export default function StudySessionScreen({ fireAlert, goHome, appState, setAppState }) {
    /*
        A study session is just some collection of decks that you drift through giving your explanations for the prompts then comparing to the 'actual' answer.
        - The default for now is just going to be having to CHECK ANSWER before moving to next card, though a SKIP CARD option would be fine
        - Can have indicators for how many times you've gone through the deck and how long you've been studying

        Should we have a 'session history' to go back through immediately after 'finishing' to review given/supposed answers? Probably yes?

        BLOCKIT:
        -- 
        
        
        Stuff to consider adding here:
        -- study time
        -- ?


        -- remember to create a component for these card(s) that honors their cardstock, etc.
    
    */
   const [session, setSession] = useState({
       cards: [],
       cardIndex: 0,
       time: 0,
       finishTime: undefined,
       finishSets: undefined,
       showExplanation: false,
       setsDone: 0,
   });
   const [timer, setTimer] = useState(0);
   const [currentGuess, setCurrentGuess] = useState('');
   const [sessionFinished, setSessionFinished] = useState(false);
   const allDone = useRef(null);
   const guessRef = useRef(null);

    const handleSessionKeyInput = e => {
    // OK, let's quickly decide on some keyinputs we want...
    /*
        ... AND that means advanceSession() will always use wacky-tacky data, whoops
        - MAKE GUESS
        - ADVANCE TO NEXT CARD (assumes guess is made and answer is revealed)
        - REVEAL EXPLANATION (separate from registering guess, I guess :P)
        - SKIP CARD
        - FINISH SESSION


        'Require' an answer to be written for every card
        -- then 1-2-3 for 'easy-eh-onoes' understanding level upon review

        TBD: 
        -- parse study time into something more coherent for hoomans


        e.key options: 
        - Enter, 1, 2, 3
        !MHR - make textarea/input into a div when it's "review mode time"
    */
        // e.preventDefault();
        if (sessionFinished) return;
        switch (e.key) {
            
            case 'Enter': 
                // HERE: if some amount of guess is entered, do the 'reveal' and null the guess input ideally;
                e.preventDefault();
                if (!session.showExplanation && currentGuess.length > 0) return setSession({...session, showExplanation: true});
                // console.log(`ShowExplanation is ${session.showExplanation} and currentGuess length is ${currentGuess.length}`)
                return advanceSession();
            
            // the three below options must ensure we're in the RATE YOUR ANSWER mode
            case '1':
            case '2':
            case '3':
                return;

            default:
                console.log(`Booped the ${e.key} key.`);
        }
        const aZero = 0;
    };

   function shuffleArray(array) {
        // the Fisher-Yates shuffle!
        let localArray = JSON.parse(JSON.stringify(array));
        for (let i = localArray.length - 1; i > 0; i--) {
           let j = Math.floor(Math.random() * (i + 1));
           [localArray[i], localArray[j]] = [localArray[j], localArray[i]];
        }
        return localArray;
    }

    function parseSecondsToHMS(totalSeconds) {
        // THIS: take the given seconds and return a string hh:mm:ss, with no hh and no leading 0 for mm
        // 3600 seconds is 1h
        let hours, minutes, seconds;
        hours = Math.floor(totalSeconds / 3600);
        minutes = Math.floor((totalSeconds - hours * 3600) / 60);
        seconds = Math.floor(totalSeconds - hours * 3600 - minutes * 60);
        return `${hours ? `${hours}:` : ''}${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
        // return '' + hours + 'h' + minutes + 'm' + seconds + 's';
    }

   function advanceSession() {
        let newCardIndex;
        let advanceSets = false;
        if (session.cardIndex + 1 >= session.cards.length) {
            newCardIndex = 0;
            advanceSets = true;
        }
        else newCardIndex = session.cardIndex + 1;

        let newCards = [...session.cards];
        let newCardObj = {...newCards[session.cardIndex]};
        newCardObj.guess = currentGuess;
        newCards[session.cardIndex] = {...newCardObj};
        setCurrentGuess('');
        guessRef.current.focus();
        return setSession({
            ...session,
            cardIndex: newCardIndex,
            showExplanation: false,
            cards: [...newCards],
            setsDone: advanceSets ? session.setsDone + 1 : session.setsDone
        });
    }

    function finishSession() {
        /*
            So, what happens when we finish a session?
            -- oh! the current guess should -absolutely- go into the record, if applicable
            -- record to personal app history
            -- 'review mode' ?
            -- summary 'screen'
            -- ability to return to sessions or home

        */
       allDone.current = true;
       return setSessionFinished(true);
    }

    useEffect(() => {
        let allDeckRefs = [...appState.sessions[appState.currentModeTargetID].deckRefs];
        let allSessionCards = [];
    
        allDeckRefs.forEach(deckID => {
            allSessionCards = [...allSessionCards, ...appState.decks[deckID].cards];
        });

        // HERE: add functionality to eliminate duplicates from allSessionCards
        // May get sliiightly sticky now that I'm thinking of cards that could have same ID but be variants or modified versions...
        // Soooo we may not do duplicate removal, OR we may become super strict on the duplicate concept (prompt === && explanation === ONLY)

        setSession({...session, cards: [...allSessionCards]});

        
    }, []);

    useEffect(() => {
        // ADD: check session.finishTime if applicable to see if we need to 'force' finish the session
        // ref shenanigans sidesteps state and allows a true 'pause'/finish timer fxn
        if (sessionFinished) return;
        let timerOut = setTimeout(() => {
            if (!allDone.current) setTimer(timer => timer + 1);
        }, 1000);
        return () => {
            clearTimeout(timerOut);
        }
    }, [timer]);

    useEffect(() => {
        // ADD: since setsDone has changed, we should check finishSets to see if we're 'done' (NOTE: currently I don't believe we receive proper data to do this)
        if (session.setsDone > 0) return setSession({...session, cards: shuffleArray(session.cards)});
    }, [session.setsDone]);

    useEffect(() => {
        window.addEventListener('keydown', handleSessionKeyInput);

        return () => {
            window.removeEventListener('keydown', handleSessionKeyInput);
        }
    }, [handleSessionKeyInput]);


    if (session.cards.length && !sessionFinished) {
        return (
            <div style={{display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center'}}>
                <h1>Study Session: {appState.sessions[appState.currentModeTargetID].nickname}</h1>
                <div>Study Time: {parseSecondsToHMS(timer)}</div>
                <div>On Round #{session.setsDone + 1} Through these Cards</div>

                <div style={{width: '60%', border: '1px solid hsl(0, 0%, 80%)', justifyContent: 'center'}}>
                    <div style={{display: 'flex', justifyContent: 'center', marginBottom: '2rem', alignItems: 'center', textAlign: 'center', border: '1px solid black', borderRadius: '10px', padding: '1rem'}}>{session.cards[session.cardIndex].prompt}</div>
                    <div style={{display: 'flex', gap: '1rem', height: '30vh'}}>
                        {/* The below probably needs to become a textarea to avoid some funky long-input issues and to match the card aesthetic */}
                        <input type='text' autoFocus={true} ref={guessRef} value={currentGuess} onChange={e => setCurrentGuess(e.target.value)} placeholder={'your explanation'} style={{display: 'flex', fontSize: 'calc(0.5rem + 0.5vw)', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '50vw', border: '1px solid black', padding: '0.5rem 1rem'}} />
                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '50vw', border: '1px solid black', padding: '0.5rem 1rem'}}>{session.showExplanation ? session.cards[session.cardIndex].explanation : '(card explanation hidden)'}</div>
                    </div>

                    {!session.showExplanation && (
                        <div>
                            <button onClick={() => setSession({...session, showExplanation: true})}>Reveal</button>
                            <button onClick={advanceSession}>NEXT!</button>
                            <button onClick={finishSession}>FINISH</button>                            
                        </div>
                    )}
                
                </div>

                

                
                <button>Skip (a later function)</button>

                
            </div>
        )
    }

    if (sessionFinished) return (
        <div>
            <h1>Good job, you're done!</h1>
            <div>You went through all these cards completely {session.setsDone} times.</div>
            <div>You spent {timer} seconds doing this study session.</div>
            <div>Ideally, I'd show you some version of your guesses for you to review across all these cards, huh?</div>
            <div>Likewise, it'd be good to show a 'self-assessed mastery level'... so add self-assessed levels.</div>
            <button onClick={goHome}>Back Home</button>
        </div>
    )
    // it's just for a split-second and is kind of jarring, so maybe refactor this:
    return (
        <div>
            <h1>Loading session...</h1>
        </div>
    )

}