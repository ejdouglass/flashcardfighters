import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function StudySessionScreen({ goHome, appState, setAppState }) {
    /*
        add list:
            - styling and responsiveness at each step of the process:
                > session overview sxn, semi-gridlike
                > standardize/colorize 1-2-3


        No more woof. It's no longer super clunky! It works pretty well, it's just a little rough around the edges. Great.


        

        STRETCH:
        -- it'd be neat to have a 'session set progress bar' that 'fills' as you go
            -> double bonus for dynamic animated fill
            -> triple bonus for animations, both here and for booping the 123
        -- research what oddities may occur upon page refresh during a session :P
            -> consider also 'session pausing' mechanisms
            -> can also do a 'current session saving' in this app's whatDo equivalent in case of interruption or what have you  
        -- consider having the 1-2-3 be within easy-tapping range on a phone (tamp them to the bottom of the display)          



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
       cardsDone: 0,
       masteryTotal: 0,
       latestGrade: undefined,
       setMastery: []
   });
   const [timer, setTimer] = useState(0);
   const [timerVisible, setTimerVisible] = useState(false);
   const [currentGuess, setCurrentGuess] = useState('');
   const [sessionFinished, setSessionFinished] = useState(false);
   const allDone = useRef(null);
   const guessRef = useRef(null);

    const handleSessionKeyInput = e => {
    // OK, let's quickly decide on some keyinputs we want...
        // e.preventDefault();
        if (sessionFinished) return;
        switch (e.key) {
            case 'Enter': {
                // HERE: if some amount of guess is entered, do the 'reveal' and null the guess input ideally;
                e.preventDefault();
                // if (!session.showExplanation && currentGuess.length > 0) return setSession({...session, showExplanation: true});
                // console.log(`ShowExplanation is ${session.showExplanation} and currentGuess length is ${currentGuess.length}`)
                if (session.showExplanation || !currentGuess.length) return;
                if (!session.showExplanation && currentGuess.length) return advanceSession();
                return advanceSession();
            }


            case 'Escape': {
                if (!session.showExplanation && !currentGuess.length) return advanceSession(0);
            }
            
            // the three below options must ensure we're in the RATE YOUR ANSWER mode
            // currently they just disable the user from putting in 1, 2, or 3 in their typing :P
            case '1':{
                if (session.showExplanation) {
                    e.preventDefault();
                    return advanceSession(3);
                }

            }
                
            case '2': {
                if (session.showExplanation) {
                    e.preventDefault();
                    return advanceSession(2);
                }

            }
                
            case '3': {
                if (session.showExplanation) {
                    e.preventDefault();
                    return advanceSession(1);
                }

            }
                

            default:
                // console.log(`Booped the ${e.key} key.`);
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

    function parseMasteryIntoGrade(masteryLevel, raw) {
        // note that with only a 3-point 'grading system,' it's REALLY easy to have low-skewed scores, as even "I kinda get it!" is already a 66% :P
        // with that in mind, it's likely meaningful to go ahead and adjust based on 3 = 100%, 2 = 85%, 3 = lower, etc.
        // ... try to keep it simple, though, as I believe we could get pretty easily in the weeds on the math here
        let gradePoint = masteryLevel / 3 * 100;
        if (raw) return gradePoint.toFixed(2);
        if (gradePoint === 100) return 'S';
        if (gradePoint < 100 && gradePoint >= 90) return 'A';
        if (gradePoint < 90 && gradePoint >= 80) return 'B';
        if (gradePoint < 80 && gradePoint >= 70) return 'C';
        if (gradePoint < 70 && gradePoint >= 60) return 'D';
        if (gradePoint < 60) return 'F';
    }

    function parseSecondsToHMS(totalSeconds, verbose) {
        let hours, minutes, seconds;
        hours = Math.floor(totalSeconds / 3600);
        minutes = Math.floor((totalSeconds - hours * 3600) / 60);
        seconds = Math.floor(totalSeconds - hours * 3600 - minutes * 60);
        return verbose ? `${hours ? `${hours} hours,` : ''} ${minutes ? `${minutes} minutes` : ``} ${minutes && seconds ? ' and ' : ''} ${seconds ?  `${seconds} seconds` : ''}` : `${hours ? `${hours}:` : ''}${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    }

   function advanceSession(masteryLevel) {
       // FIX: 'skip' should show the explanation before we move on, but keep the mastery at 0
       // add logic that goes through and tallies the total mastery level if it's time to bump setsDone
       // ... also add logic that puts that total mastery level somewhere for our consideration :P

       // just added session.masteryTotal # and session.setMastery []
       // masteryTotal can increment each time and we can compute vs cardsDone at the end for ALL cards/session mastery
       // setMastery is an array of per-set mastery average; can loop through upon setsDone change to grab that set's
       // we'll assume for now all we 'care' about is first set mastery, final completed set mastery, and maaaaybe just the trend in between
        if (!currentGuess.length) masteryLevel = 0;
        if (!session.showExplanation && currentGuess.length > 0) {
            guessRef.current.disabled = true;
            return setSession({...session, showExplanation: true});
        }
        let newCardIndex;
        let advanceSets = false;
        let setMasteryAverage = 0;


        let newCards = [...session.cards];
        let newCardObj = {...newCards[session.cardIndex]};
        newCardObj.guess = currentGuess;
        newCardObj.masteryLevel = masteryLevel;
        newCards[session.cardIndex] = {...newCardObj};
        setCurrentGuess('');
        

        // setSession occurs AFTER this computation, meaning the CURRENT data is completely ignored on the first time through
        // so, for the forEach, we need to manually have the current masteryLevel slip in to get the correct result
        if (session.cardIndex + 1 >= session.cards.length) {
            newCardIndex = 0;
            advanceSets = true;
            // HERE: compute setMastery[] for this completed set (all the cards involved will have current masteryLevel)
            let setMasteryTotal = 0;
            session.cards.forEach(card => {
                setMasteryTotal += card.masteryLevel || masteryLevel;
            });
            
            setMasteryAverage = parseFloat((setMasteryTotal / session.cards.length).toFixed(2));
        }
        else newCardIndex = session.cardIndex + 1;
        guessRef.current.disabled = false;
        guessRef.current.focus();
        return setSession({
            ...session,
            cardIndex: newCardIndex,
            showExplanation: false,
            cards: [...newCards],
            setsDone: advanceSets ? session.setsDone + 1 : session.setsDone,
            setMastery: advanceSets ? [...session.setMastery, setMasteryAverage] : session.setMastery,
            cardsDone: session.cardsDone + 1,
            masteryTotal: session.masteryTotal + masteryLevel,
            latestGrade: advanceSets ? parseMasteryIntoGrade(setMasteryAverage) : session.latestGrade
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
       // NOTE: we need to inherit the nickname and id of the session in question to properly create this particular log item.
       let newLogItem = {
        echo: `You wrapped up a study session after mightily fighting cards for ${parseSecondsToHMS(timer, true)}.`,
        timestamp: new Date(),
        event: 'session_studied',
        subject: 'studyness'
        }
        let newAppState = ({...appState, history: {
            log: [...appState.history.log, newLogItem],
            actions: {...appState.history.actions, sessionsCreated: appState.history.actions.sessionsStudied + 1}
        }});
        axios.post('/user/update', { userAppData: newAppState })
        .then(res => {
            if (res.data.success) console.log(`Word from the server is that the user was successfully updated!`)
            else console.log(`Client heard back from the server, but apparently did not achieve success in user updating.`);
        })
        .catch(err => console.log(`Error updating user: `, err));           
        setAppState(newAppState);
        return setSessionFinished(true);
    }

    useEffect(() => {
        let allDeckRefs = [...appState.sessions[appState.currentModeTargetID].deckRefs];
        let allSessionCards = [];
    
        allDeckRefs.forEach(deckID => {
            allSessionCards = [...allSessionCards, ...appState.decks[deckID].cards];
        });

        allSessionCards = shuffleArray(allSessionCards);

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
                <div style={{fontWeight: '600', fontSize: 'calc(0.9rem + 0.4vw)', marginBottom: '0.5rem'}}>Studying - {appState.sessions[appState.currentModeTargetID].nickname}</div>
                

                

                
                {/* <div>{session.latestGrade ? `Current Mastery Grade: ${session.latestGrade}` : null}</div> */}
                

                <div style={{width: '80%', border: '1px solid hsl(0, 0%, 80%)', justifyContent: 'center'}}>
                    <div style={{display: 'flex', justifyContent: 'center', marginBottom: '2rem', alignItems: 'center', textAlign: 'center', border: '1px solid black', borderRadius: '10px', padding: '1rem'}}>{session.cards[session.cardIndex].prompt}</div>
                    <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', height: '30vh'}}>
                        <div style={{display: 'flex', width: 'calc(200px + 30%)'}}>
                            <textarea autoFocus={true} ref={guessRef} value={currentGuess} onChange={e => setCurrentGuess(e.target.value)} placeholder={'your explanation'} style={{display: 'flex', width: '100%', fontFamily: 'arial', fontSize: 'calc(0.8rem + 0.3vw)', justifyContent: 'center', alignItems: 'center', textAlign: 'center', border: '1px solid black', resize: 'none', padding: '1.5rem 1rem'}} />
                        </div>
                        <div style={{display: 'flex', justifyContent: 'center', textAlign: 'center', width: 'calc(200px + 30%)', border: '1px solid black', fontSize: 'calc(0.8rem + 0.3vw)', padding: '1.5rem 1rem'}}>{session.showExplanation ? session.cards[session.cardIndex].explanation : '(card explanation hidden)'}</div>
                    </div>

                    {session.showExplanation ? (
                        <div style={{width: '100%', display: 'flex', justifyContent: 'center', gap: '1rem'}}>
                            <button onClick={() => advanceSession(3)}>NAILED it</button>
                            <button onClick={() => advanceSession(2)}>KINDA got it</button>
                            <button onClick={() => advanceSession(1)}>Woof, that's rough</button>
                        </div>
                    ) : (
                        <div style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
                            <button onClick={advanceSession}>{currentGuess.length ? `GUESS` : `SKIP!`}</button>
                        </div>
                    )}

                    
                
                </div>

                <div style={{width: '100%', display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem'}}>
                    <button onClick={() => setTimerVisible(!timerVisible)}>{timerVisible ? parseSecondsToHMS(timer) : `(Show Study Time)`}</button>
                </div>
                <div>Session Set #{session.setsDone + 1}</div>
                <div>{session.cardsDone} total cards conquered this session</div>
                <button onClick={finishSession}>FINISH</button>
                
            </div>
        )
    }

    // can create a separate 'sessionFinished' component that can cheerfully receive and/or extrapolate info such as 'final score difference vs starting score'
    if (sessionFinished) return (
        <div style={{display: 'flex', width: '100%', minHeight: '100%', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem'}}>
            <h1>Good job, you're done!</h1>
            <div>Cards Fought: {session.cardsDone}</div>
            <div>Sets Completed: {session.setsDone}</div>
            <div>Total Session Time: {parseSecondsToHMS(timer, true)}</div>
            <div>{session.setMastery[0] !== undefined ? `Your self-grade for your first run through this session was ${parseMasteryIntoGrade(session.setMastery[0])}.` : ``}</div>
            {session.setMastery.length > 1 && 
            <div>
                    Your self-grade for your final run through was {parseMasteryIntoGrade(session.setMastery[session.setsDone - 1])}.
            </div>
            }
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