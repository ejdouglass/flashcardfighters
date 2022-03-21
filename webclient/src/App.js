import React, { useState, useEffect, useRef } from 'react';
import Alert from './components/Alert';
import Prompt from './components/Prompt';
import Screen from './components/Screen';
import axios from 'axios';
// import './App.css';

export default function App() {
  const [appState, setAppState] = useState({
    username: undefined,
    alertString: ``,
    globalPrompt: undefined,
    decks: {},
    sessions: {},
    mode: undefined,
    currentDeckId: undefined,
    currentModeTargetID: undefined,
    schedule: {},
    history: {
      log: [],
      actions: {
        decksCreated: 0,
        decksDeleted: 0,
        decksDownloaded: 0,
        decksPublished: 0,
        decksUnpublished: 0,
        sessionsCreated: 0,
        sessionsStudied: 0        
      }
    }
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


    let savedAppState = {...appState};
    savedAppState.globalPrompt = undefined;
    return localStorage.setItem('flashcardfighterApp', JSON.stringify(savedAppState));
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

      // we can also 'proper-populate' any 'new' adjustments here, such as history.log
      // 'initial load appState variable fixing'
      if (!appData?.history?.log) {
        appData.history.log = [];
      }
      if (!appData?.history?.actions) appData.history.actions = {
        decksCreated: 0,
        decksDeleted: 0,
        decksDownloaded: 0,
        decksPublished: 0,
        decksUnpublished: 0,
        decksUpdated: 0,
        sessionsCreated: 0,
        sessionsStudied: 0
      }

      setAppState(appData);
    }
    return firstPaint.current = false;

  }, []);

  useEffect(() => {
    // console.log(`firstPaint.current is ${firstPaint.current}`);
    if (firstPaint.current) return;
    // NOTE: this is part of a delicate ecosystem of interlocking side effects and the firstPaint ref, so be very careful about moving any of these pieces

    if (appState.username && appState.token && appState.history.log.length) {

      // HERE: analyze and collapse log items
      /*
            let newLogItem = {
                echo: `You began assembling a new Deck called ${newDeck.name}.`,
                timestamp: new Date(),
                event: 'deck_creation',
                subject: newDeck.id
            }      
      */
      
      // we'll for now assume we 'only' need to check the previous two log items for 'sameness' and then overwrite if so
      if (appState.history.log[appState.history.log.length - 1].event === appState.history?.log[appState.history.log.length - 2]?.event && appState.history.log[appState.history.log.length - 1].subject === appState.history?.log[appState.history.log.length - 2]?.subject) {
        // event and subject is the same, so we're going to assume these can be 'collapsed'
      
        // right now we just take the 'latest version,' but at least in the case of creating decks, it makes sense to keep OG timestamp and new name
        // it's not a critical or even likely highly noticeable difference for now; may adjust later, but keep an eye on other history items itm
        let collapsedHistoryLog = [...appState.history.log];
        collapsedHistoryLog.splice(collapsedHistoryLog.length - 2, 1);
        // console.log(`Just collapsing some history here, don't mind me.`);
        return setAppState({...appState, history: {...appState.history, log: collapsedHistoryLog}});
      }

      // can add further collapsing functionality, such as deck editing (adding cards), etc. in the future


      // The below is quarantined for general app safety. :P 
      // return axios.post('/user/update', { userAppData: appState })
      //   .then(() => {
      //     // currently not expecting a response here :P
      //     return console.log(`User update pushed to back-end.`);
      //   })
      //   .catch(err => console.log(`Error updating user: `, err));
    }
  }, [appState.history.log]);

  useEffect(() => {
    if (firstPaint.current === true) return;

    // firstPaint ref is woefully under-equipped to handle our latest shenanigans here :P

    // console.log(`I am called upon to SAVE, with appState:`, appState);
    return saveApp();

    // tentative: removed appState.history from the dependency array below
  }, [appState.decks, appState.mode, appState.sessions]);


  return (
    <div>

      <div style={{borderBottom: '1px solid #07D', width: '100%', display: 'flex', gap: '1rem', color: 'white', boxSizing: 'border-box', padding: '1rem', backgroundColor: '#0AF', minHeight: '100px', flexWrap: 'wrap'}}>
       
        <div id="userContainer" style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
          <button onClick={() => setAppState({...appState, mode: undefined})} style={{fontSize: 'calc(0.8rem + 0.4vw)', boxSizing: 'border-box', display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'auto', height: '50px', border: appState.mode === undefined ? '2px solid blue' : '2px solid white', padding: '2rem', borderRadius: '5px', fontWeight: '600'}}>{appState?.username ? appState.username : 'Profile'}</button>
        </div>
        <div id="headerButtons" style={{display: 'flex', gap: '1rem'}}>
          <button onClick={() => setAppState({...appState, mode: 'viewDecks'})} style={{fontSize: 'calc(0.8rem + 0.4vw)', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '1rem', fontWeight: '600', borderRadius: '4px', border: appState.mode === 'viewDecks' ? '2px solid blue' : '2px solid white'}}>DECKS</button>
          <button onClick={() => setAppState({...appState, mode: 'viewStudySessions'})} style={{fontSize: 'calc(0.8rem + 0.4vw)', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '1rem', fontWeight: '600', borderRadius: '4px', border: appState.mode === 'viewStudySessions' ? '2px solid blue' : '2px solid white'}}>STUDY</button>          
        </div>    

      </div>

      <div style={{boxSizing: 'border-box', position: 'relative', width: '100%', padding: '1rem'}}>
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
[_] Prettify (alerts, prompts, styling, etc.), including responsiveness considerations across mobile formats & final folio page layout concerns
  [x] basic responsiveness 1: single-column for narrow views, can have inner divs of certain width, use flex-wrap where applicable
  [x] basic responsiveness 2: fontsizing @ calc rems + vw
  [x] history/activity homepage container: add timestamp parsing, 'older' 'newer' buttons (with 'Newest' displayed when at cap)
  [x] Denote favorite sessions as being favorite sessions rather than funny mystery buttons :P
  [x] cardfix - allow card styling to scale to contents better, far less padding, figure out how to let overflow stretch card
  [x] Flesh out the Alert and Prompt to be less aggressively hideous
  [x] Failure to log in alert through alertString (may be others; adjust as found)
  [x] Highlight HOME, DECKS, and STUDY when they're currently in use
  [x] Add notations and/or visual guides to which decks are PUBLISHED (published), ONLINE-SOURCED (variant), etc.
  [x] Add placeholder history/activity for when there is none
  [x] Logging in is slower now -- add a visual "attempting to log in..." note when that process begins
  [x] Card creation cleanup (explanation)
  [_] Final responsiveness concerns (mostly keeping buttons where they're accessible on phone screens, ESPECIALLY for creating cards)
    -- also for sessions (box sizing is a little weird)
  [_] Final (grayscale) visual hierarchy adjustments

[_] Re-introduce user/update functionality (essentially, make sure the user is being properly updated both client-side and server-side when a substantial change occurs)
  NOTE: any of the below can be X'd if the backend already does a save and pushes new user data
  [_] Substantial deck change (each new card added; little card fixes are trickier, however)
  [x] New study session created
  [x] Study session completed
  [x] Deck published
  [x] Deck update
  [x] Deck unpublished
  [_] Deck deleted (found in Prompt)
  [_] Logout (sort of a handy catch-all, not as critical if all others are correctly applied)


[_] Basic (new) user guidance
  [_] "?" button in corner on all engagement pages, front-page "How To Cardfight" (new prompt type: informational or info)
  [_] Finish WELCOME MESSAGE (basic for now)


[_] prioritized fixes & adjustments skim + address


[_] Publish both webclient and backend to Heroku


[_] Final 'walkthrough' with fresh app online -- create, log out, log in, use every part of the app and make sure it works as expected
..


FIXES & ADJUSTMENTS:
[_] Ongoing self-grade seems... completely wrong? :P (at least for a single-card deck)
[_] "Offline Mode"... just firing up the app, what happens when a logged-in user temporarily (for any reason) has no server access?
  -- I think a big part of it will be just making sure auto-save situations do NOT alert the user if there's an error (aside maybe from a little "X" somewhere to indicate unsync)
[_] If a deck is displayed in own search results, does NOT give proper outline for published decks
[_] New account publishing a deck does NOT update history.log? In fact, creating a new deck didn't do anything, either. Hm.
[_] Whoops: "Little History" such as "creating a new deck" is NUKED INTO OBLIVION when then going to publish that deck
  -- a new user just doodling along with their own little log does NOT pass their current "minor action" item such as deck creation to the backend before
    it gets replaced when a deck is, say, published
[_] Getting "Last Publish: null" sometimes/often on booping into previously published decks
[_] Autoscroll can be a little annoying on the activity log, particularly in narrower windows (scrolls the menu bar out of reach automatically)
[_] "History log collapsing" means that studying the same session twice in a row, no matter how long or how long in between, will "collapse" into the latest.
[x] Logging out appears to totally wipe all extant sessions out of existence. Same with history log. Probably due to lack of user/update calls... :P
[_] Kicking to DECKS screen when publishing seems a little silly
[_] Starting a new study session causes a very brief but visible screen flicker/hiccup/render cascade ("Loading session...")
[_] Consider and test the case where user starts making cards BEFORE naming the deck, etc.
[_] Public searching is a little wonky? Test the public deck searching behavior.
  -- Also, it's slow now that it's on a remote server; for now, just letting the user know a new search is occuring might be best ("Searching decks...")
[_] Token is used quite a bit on the backend, but currently there is no proper token refresh mechanism
[_] Consider a mechanism where reshuffling doesn't risk showing the same card twice (finish a set with one card, having it reshuffle to index 0 for next round)
[_] Better handling of attempting to Publish someone else's deck... or just making the option vanish (variant: true?)
[_] If the user attempts to publish something that's already published and not update-worthy, kick out before running deck-adding code in server
[_] Don't kick to 'decks' screen upon publishing, ESPECIALLY for cases where it's already published and nothing happens :P
[_] we should probably NOT allow empty decks to be published :P
[_] axios error handling is currently pretty clumsy in all cases
[_] forms where appropriate; offhand, 'create new profile' doesn't respond to [Enter/Return] properly
[_] Local deletion of decks does NOT properly let the backend know... this is particularly pertinent for Variant Decks
[_] Ensure all history.log items match 1-to-1 with any alerts the user receives, so alerts disappearing doesn't just mean "whoopsie might have missed that one"
..



PENDING RELEASE CONCEPTS:
[_] Better handling of deck editing/card creation/card editing for history log purposes
  -- rather than 'on the fly editing' we can change it to 'confirm changes' mixed with if user tries to nav away with unattended changes we Prompt 'em
[_] Rejigger deck description to not be a big ol' chunk of real estate, particularly in deck editing, and double particularly in mobile sizes
[_] Default 'ALL MY CARDS' study session?
[_] Study session deletion. :P
[_] basic palette implementation, including cardstocks and such
[_] Public sharing of sessions (slightly trickier as it would require more deck-checking)
[_] App periodically checking for cloned deck updates, showing a "!" or somesuch when applicable
[_] Animations/transitions (and likely simple implementation of styled-components file alongside that)
[_] More details on the study sessions (most basic level would be decks included, later on maybe descriptions/tags/meta-data)
[_] Upgraded tutorial engagement
  [_] Define 'phases' of app engagement in linear fashion to begin with
    - total first-time in app: Welcome! This App is about X. To get started, head over to Decks tab!
    - how to implement tutorialTracking? Hmmm... 
  [_] "?" button concept... unobtrusive corner buttons, OR dootdootdoot pop-ups
  [_] Glowing button highlight for "go here, dummy"
  -- "Global"/tracking tutorials are probably for 'next release' after testing on Heroku first. Homescreen only for now, but build with page-by-page in mind.
  -- Also maybe a 'tuts scroll' type concept when there's no pressing/particular suggestion (linear basics covered already).
..




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