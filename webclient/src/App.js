import React, { useState, useEffect, useRef } from 'react';
import Alert from './components/Alert';
import Prompt from './components/Prompt';
import Screen from './components/Screen';
// import './App.css';

export default function App() {
  // consider amending 'currentDeckId' to 'currentModeTargetID' so it generalizes to card viewing, session viewing, etc.
  const [appState, setAppState] = useState({
    username: undefined,
    alertString: ``,
    globalPrompt: undefined,
    cards: {}, // deprecating this
    decks: {},
    sessions: {},
    mode: undefined,
    currentDeckId: undefined,
    currentModeTargetID: undefined,
    schedule: {},
    history: {} // mostly dateKeys, but can ALSO contain accomplishments key, for example
  });
  const firstPaint = useRef(true);


  function clearAlert() {
    setAppState({...appState, alertString: undefined});
  }

  function calcDateKey(date) {
    // Returns MM/DD/YYYY as a string, adding a leading '0' where necessary, e.g. 03/07/2021 ; assumes 'today' if no specific date obj is passed as param
    let dateToKey = date ? date : new Date();
    let monthKey = dateToKey.getMonth() + 1;
    let dateKey = dateToKey.getDate();
    let yearKey = dateToKey.getFullYear();

    return `${(monthKey < 10 ? `0` + monthKey : monthKey)}/${(dateKey < 10 ? `0` + dateKey : dateKey)}/${yearKey}`;
  }  

  function saveApp() {
    // MIGHT have/want to strip off current alertString, globalPrompt
    // depending on when this is called, can also do a backend check to see if we 'want' to have it foist contents upon the API
    //  ... think this one through before implementing, however, as there may be conditions where force-saving could be really unfortunate :P
    //  ... alternatively, can do 'periodic saves' OR 'user-directed saves,' both of which would be safer than this useEffect-hooked saving

    // what if we did NOT strip off the alertString? hmmm
    // setAppState({...appState, alertString: undefined, globalPrompt: undefined});
    let savedAppState = {...appState};
    // savedAppState.alertString = undefined;
    savedAppState.globalPrompt = undefined;
    return localStorage.setItem('flashcardfighterApp', JSON.stringify(savedAppState));
  }

  function returnToHome() {
    // THIS: evaluates what the user is currently doing and returns to mode: undefined
    // ideally, this would 'pause' a current study session rather than null it out
  }


  useEffect(() => {
    // here: app init check
    // NOTE: in case of 'new init requirements' (e.g. when I added sessions, schedule, etc.), can check and init here to plug 'gaps' in old appState versions

    // NOTEMORE: this app happily will live offline, but IF we have a token/username on init, we should consider doing a backend 'check-in' for potential updates

    // AH! We can defunct globalPrompt and alertString *here* as desired. Not in saveApp().
    let appData = localStorage.getItem('flashcardfighterApp');
    if (appData) {
      appData = JSON.parse(appData);
      if (appData.alertString !== undefined) appData.alertString = undefined;
      if (appData.globalPrompt !== undefined) appData.globalPrompt = undefined;
      setAppState(appData);
    }
    console.log(`BOOT UP! globalPrompt is ${JSON.stringify(appState.globalPrompt)}`)
  }, []);

  useEffect(() => {
    // CHAOS SAVING... not a production-worthy approach, but fine for current dev needs
    if (firstPaint.current === true) {
      // console.log(`First render occurring now, NO saving app data`);
      return firstPaint.current = false;
    }

    console.log(`Something save-worthy has changed.`);
    // new Profile creation triggers this useEffect several times almost simultaneously, so maybe building in a lastSave timestamp / check would help
    // may also blunt the effect of 'stripping away' backend-provided alertString/alertType situations

    // console.log(`appState has changed, not first paint currently, so saving app data...`);
    return saveApp();

  }, [appState.decks, appState.mode, appState.sessions, appState.history, appState.historyLog]);

  return (
    <div>
      {/* the 'header' in gloriously messy fashion for now; consider making it a fixed position element */}
      <div style={{borderBottom: '1px solid #07D', position: 'fixed', zIndex: '8', width: '100%', display: 'flex', gap: '1rem', color: 'white', fontSize: '1.5rem', boxSizing: 'border-box', padding: '1rem', backgroundColor: '#0AF', height: '100px'}}>
        <button onClick={() => setAppState({...appState, mode: undefined})} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '1rem', fontWeight: '600', fontSize: '1.5rem', borderRadius: '4px', border: 'none'}}>HOME</button>
        <button onClick={() => setAppState({...appState, mode: 'viewDecks'})} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '1rem', fontWeight: '600', fontSize: '1.5rem', borderRadius: '4px', border: 'none'}}>DECKS</button>
        <button onClick={() => setAppState({...appState, mode: 'viewStudySessions'})} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '1rem', fontWeight: '600', fontSize: '1.5rem', borderRadius: '4px', border: 'none'}}>STUDY</button>
        <div id="userContainer" style={{display: 'flex', justifyContent: 'flex-end', width: '100%', height: '100%', alignItems: 'center'}}>
          <button onClick={() => setAppState({...appState, mode: 'viewProfile'})} style={{boxSizing: 'border-box', display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'auto', height: '50px', border: '2px solid white', padding: '2rem', fontSize: '1.5rem', fontWeight: '600'}}>{appState?.username ? appState.username : 'Profile'}</button>
        </div>
      </div>

      <div style={{boxSizing: 'border-box', position: 'relative', width: '100%', top: '100px', padding: '1rem'}}>
        <Prompt appState={appState} setAppState={setAppState} />
        <Screen appState={appState} setAppState={setAppState} />
        <Alert alertString={appState.alertString} clearAlert={clearAlert} />
      </div>
    </div>
  )
}


/*

CURRENTLY: building out backend
Final Checklist:
[_] 0123 session logic, session ending/review
  - change session creation to put us INTO the session potentially, OR into the session-creation page, NOT homepage
  - session ending: add total cards gone through
  - rejigger process so it intuitively lets you either SKIP or ANSWER (reveal), then rate-answer if non-skipped
  
  x session creation: deck search would be great, rather than just ALL THE DECKS in a super-awkward single-column unto oblivion
  x scoot CreateStudySessionScreen into its own happy area


[_] Eh, eliminate study session params for finishing, just discretionary only
[_] Add history object... define 'history moments,' as well as achievements key (or whatever we want to call it)
[_] Rejigger responsiveness and scalability, especially in the cards themselves, to allow longer-form content
[_] Basic tuts/guides/how-to-use info, maximum user FRIENDLINESS
[_] Prettify, including responsiveness considerations across mobile formats (alerts, prompts, styling)
..
[x] Build out all projected endpoints for API (user create, user login, user delete, user add deck(s) from backend; deck add/update/fetch/unpublish)


LIL FIXES/ADJUSTMENTS:
[_] Better handling of attempting to Publish someone else's deck... or just making the option vanish (variant: true?)
[_] If the user attempts to publish something that's already published and not update-worthy, kick out before running deck-adding code in server
[_] Don't kick to 'decks' screen upon publishing, ESPECIALLY for cases where it's already published and nothing happens :P
[_] consolidate the 'search for decks' bar on the Decks page
[_] should add a 'Publish Changes' button to decks, so that 'shared decks' can update properly but NOT on-the-fly like they do in the client
[_] we should probably NOT allow empty decks to be published :P
[_] axios error handling is currently pretty clumsy in all cases
[_] forms where appropriate; offhand, 'create new profile' doesn't respond to [Enter/Return] properly
[_] Search Public Decks should autoFocus on the search field when selected


RUH ROH?
[_] Local deletion of decks does NOT properly let the backend know... this is particularly pertinent for Variant Decks
[_] 'downloaded from public' deck are getting the 'shared' flag automatically set, but it's likely being misapplied, since that user didn't necessarily share it
  - probably have to take a look at the logic of 'shared: true' and ensure it ONLY applies to the client, not as a deck variable
[_] 'Delete This Deck' probably should NOT appear before the deck is actually created :P
..
[x] deck.published doesn't show properly for user to indicate proper ownership/published status?



... ERROR, SORT OF: there's no mechanism whereby 'shared' decks are reset properly if I, say, use my ADMIN POWERS to wipe the DB decks after sharing :P
  -> possible fix: on app load, pull out all decks into a live server variable; upon login or other 'refresh,' can do a quick check against allDecks obj
  -> this would require that both the allDecks obj AND the DB are updated properly in all cases, so be mindful of that if changing in that direction
  -> note this would somewhat simplify 'browse backend decks,' since we'd be able to just parse that object for our searches
  -> ok, this is starting to sound pretty solid, gonna add it above

... NOTE: 'once you put a deck online, you can remove it, but anyone that grabbed a copy gets to keep that copy'
... make sure lastUpdateTime and such for decks is live
... for 'publish decks,' can add a 'multi-deck selection' on Decks screen where user can DELETE or, if logged in, PUBLISH


... I've forgotten how I've set SESSIONS up. Just deckRefs, right? So it looks for whatever the current version of various decks are and goes from there.

... later on, it'd be neat to be able to pop onto others' profiles to see all their shared decks, maybe their activity, write comments, etc.
... this would be great for lessons/curricula/etc.

... I appear to mostly be using tokens as a quick-and-dirty way to pass username and id to the backend, rather than actual auth-relevant actions. :P



February Begins. Almost there!
BUILD PRIORITY OVERVIEW:
-- building a basic server would be great to work alongside 'save account'
  - username, password ; save cookie in localStorage ; add functionality to history, add window-wide event listener to check on peekaboo for updates if >5min?
  - alongside user creation, add top-right indication of user (default Guest?)
  - most basic version of 'uploading' and sharing decks (backend modeling required, set up a Mongo)
-- finalized session logic: 0/1/2/3, session stats, session review
-- basic tutorial (prompts?), home screen linked to known history, actual history activity to reference
-- easy multi-deck deletion?
-- minor aesthetic overhaul (only a few main pages, so should be 'easy')
  - good time to integrate styled-components
-- getting it all onto Heroku would be fantastic, then we can test it as a mobile concept as well



REACH:
-- see if we can dynamically resize the relative spaces of prompt/explanation on cards so everything fits gracefully
-- super fancy history merging: studying/app-ing offline, make some changes such as additions, separate additions on browser, intelligent 'merge' of both
-- can add 'fancy tutorial time' prompts on the [] useEffect()s of major components that check for whatever and TUTORIAL WILDLY if the user would like
  - examples: first deck creation, first session creation, first study session (explaining 1-2-3-0)



CURRENT META:
Meta refresh! MHR note for now:
-- get it online, fuss less about how it looks until after it works (you can fuss a TINY bit, though; good styling really improves the groove of putting it all together)
-- NOW: deck creation/editing needs to have a way to toggle into VIEW ALL CARDS from MAKE NEW CARDS
  -> related: rejigger the page to economize space and relationships of related concepts better

NASCENT IDEA:
-- Put ALL the stuff on the cardfront, with a short space for 'notes' on the back if you WANT to flip and have a quick jot there
-- Can 'collect' notes after a study session for investigation?


And attend to:
-- being able to edit study session(s)
-- sshistory and implemenation

-- HM. Is there a way to 'detect' how many returns are in a textarea? Or any other way to 'sense' when we should add rows/etc.?
  -> https://css-tricks.com/auto-growing-inputs-textareas/
  -> https://codepen.io/shshaw/pen/bGNJJBE (specifically)



What's the 'out the door already' goalset?
-- can use it to study, can easily pop into it from your phone or computer (or both without screwing everything up :P)
-- github it, heroku it by end of week
-- make it work, then make it pretty :P (spend some time thinking and sketching out simple aesthetics... dip into Erik Kennedy)

NOTE: we're going to "demand" the FLASHCARD STYLE of learning for now; some degree of note-reading (battle prep) and MC quizzing perhaps later

... mildly waffling on going back to DECK-FIRST again :P
... it makes sense, though. Building everything around decks.
... we can then 'append' battle prep and study sequences to a given deck or collection of decks as its own deck-centric variable
... oof. Ok. Can we make this 'rework' a quick one? Hm.

DECK-CENTRIC REWORK LOGISTICS
-- Currently CARDS are their own entity that are REFERENCED in decks. No more! NO MOOOOORE
-- Instead, 'create deck' is a single page concept where you can just keep adding cards.
-- "Global Deck Card Search" -can- be used to grab card(s) from another deck, but they are deep copied.
  -> Keep original ID but then get a unique 'variant' property, in case we ever want to reference the 'original' to check for changes.
  -> NO. Deck-centric, sir. DECK centric means we can check the DECK against the online/'official' version and decide how to handle merging/updating.
-- SO, the Deck object will have its ID, as well as a 'variant' property (false for original, true for variant) and lastUpdateTime 
  -> can have a deckHistory array that acts as a changelog ('added a new card,' 'edited a card,' etc.)
  -> whenever the app detects a desync, can have a little "dooty boi" exclamation mark to go in and have option to see changelog and accept/reject
  -> if reject new changes, get rid of dooty boi by setting the lastUpdateTime === to backend version to stop the check from causing a flag


ADDIFY:
-- the ability to properly update lastUpdateTime on decks (and pooooossibly user details, but that can just kind of... force latest without too much trouble, I think)


... 'ongoing sessions' or history ref to really hit 'less understood' cards more or harder? Hm




APPNOTE: currently, ONLY cardRefs go into decks; consider whether to save persistent 'deckRefs' OR just do a one-off at time of creation or keep records for updating

TOO MANY WORD, now LESS WORD VERSION
BLOCKS TO DO
[x] MAKE STUDY SESSION
[x] DO STUDY SESSION
-- MAKE NOTE TAKING (+ quick cardmaking prompt)
-- MAKE LINKS TO RESRCS
-- MAKE STUDY SCHEDULE
-- MAKE ACCOUNT/BROWSE UPLOADED DECKS/SESSIONS
-- MAKE ... collections? Lessons? Basically, pages of notes bundled with links and decks
-- then polish to a nice shine:
 - add styling
 - upgraded deck creation (more powerful card searching/filtering, grab-by-tags, deck-orations, etc.)
 - add alert typing (default to error?)
 - edit cards/decks/sessions (view/edit mode overlapping mechanics)
 - tutorial/prompt bell+whistle (tutorial stuff could be based on appState.history)
 - add proper behavior for handling when a card or deck is deleted
 - ... and add the ability to delete cards and decks :P


WHOOPS:
[_] Neither the 'deck search' nor the 'card search' work in terms of changing the displays


BLITZ:
[_] CARD EDIT: from any deck view, edit single/multiple cards
[_] SET UP SCAFFOLDING FOR ALL PAGES - Notes, Links, __
[_] COMPONENTALIZING: transform all pages into separate components, with sub-components; refactor prop drilling and app state comms accordingly
[_] NAV TWEAK: new 'navigation' function to replace goHome ('Home' is default result), and 'resets' values where applicable
[_] DECK EDIT: [ remove card(s) from deck ] - [ rename deck ] - [ on-the-fly/prompt-based card creation for deck ]
[_] ADD DECKS TO DECKS: initial creation and during deck edit above
[_] NOTES TO SELF 'screen' operational
[_] LINKS/RESOURCES 'screen' operational
[_] CREATE STUDY SESSION - define the parameters of a study session for ongoing use
[_] DO STUDY/LEARNING SESSION - within its parameters; establish basic session history? (include 'user explanations' for examination afterwards?)
[_] QUICK SESSION - grab some combination of deck(s) and go nuts on the fly
[_] TEST - can just be a study session but with single-exposure to each 'card' and recorded answers for self/others to look back at
[_] SCHEDULING/HISTORY - set up an ongoing study session plan on a schedule, record 
[_] VIEW DECKS with [ filter/search options ]

[_] 'Account creation' basics (set up username, id, etc. so that backend stuff becomes possible)
  - can set up a series of triggers for a prompt "Hey looks like you're using this a bit now consider creating an account just so you can save stuff"
[_] (Backend) Set up skeleton for server.js
[_] (Backend) Establish core routing for managing app data


LESSONS LEARNT:
-- when setting up a 'page' or screen, comment/set up what data flow/access looks like (e.g. what fxns/comms it needs with higher/app state)



So! Final concept:
-- investigate avenues of curiousity and learning, making cards up as you go, easy-peasy sorting of cards into decks
-- cards not physical copies, so "ALL CARDS" will always hold a copy of every card
-- cards can be individualized, definitely with a "paper color" and possibly other goodies ('stickers' or icons)
-- important to be able to bounce from note-taking/question-making to carding
-- attributes of CARD for quick searching (separated by commas?); the 'memory' of the previous card attributes should remain (likely make several cards in one vein)
  -> same for cardstock (one of HSL presets for now)
-- 'free notes' ... the previous 'jots' concept kind of lives on here
-- topic notes (all cards created while taking 'topic notes' will automatically inherit the 'main tags' of that topic)
  -> I was gonna write something here but left it overnight aaaaand I forget


Bits and pieces:
-- cards
-- decks (which can contain individual cards)
-- lessons?
-- curricula?
-- notes
-- goals/scheduling
-- links/resources


Features:
-- 'study mode' / training mode (basically without answer prompts, but can behave same as flashcard mode)
-- flashcard mode : write out your answers
-- during any deck-delving, buttons to "add inquiry" or "add notes" (like notes in a notebook) should be supported


Logistics
-- full app data lives in localStorage; *can* also live on backend
  -> be sure to make sure 'syncing' is done appropriately to avoid accidentally overwriting data improperly/unexpectedly
  -> maybe a window.onFocus() concept to do a backend check?
    - NOTE: this does NOT work in a vanilla fashion, as in Chrome (and maybe other browsers) onFocus() fires infinitely.


Ok! Let's define appState.history and appState.historyLog.
-- history can be the 'usual' dateKey style
  - contains, at minimum, a 'log' key that is an array of everything done on that particular day
  - 'fully populates' day-of, when 'planned sessions' come into play

-- historyLog is literally just an array of everything 'substantial' the user does, but should probably be "collapsed" as every card created is... a lot :P
  - it might be possible to derive historyLog, now that I think on it...
  - this would require history[dateKey].log to exist in the sequential format I was considering for historyLog's global version
  - but given that, we can just have a self-contained happy little component that's in charge of figuring out and sharing the last X relevant actions





*/