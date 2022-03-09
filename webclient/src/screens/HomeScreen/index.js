import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function HomeScreen({ appState, setAppState }) {
    const [userCredentials, setUserCredentials] = useState({
        username: '',
        password: ''
    });
    const [derivedActivityLog, setDerivedActivityLog] = useState([]);
    const [activityLogPage, setActivityLogPage] = useState(undefined);
    const activityLogRef = useRef(null);


    function logIn(e) {
        e.preventDefault();
        if (userCredentials.username.length < 4 || userCredentials.password.length < 1) return alert(`WEE OO gotta enter your username and password, champ!`);
        axios.post('/user/login', { userCredentials: userCredentials })
            .then(res => {
                setAppState(res.data.appData);
                return setActivityLogPage(0);
            })
            .catch(err => alert(`ERROR LOGGING IN: ${err}`));
    }

    function createNewProfile() {
        // THIS: confirm everything is ok with the input fields: 1) username is ok, 2) password is ok, 3) passwords match
        let errorMessage = ``;
        if (userCredentials.username.length < 4 || userCredentials.username.length > 10) errorMessage += `Please choose a Profile Name that is between 4 and 10 characters in length. `;
        if (userCredentials.password.length < 1) errorMessage += `Kindly enter a Password you would like to use. `;
        // if (password.length >= 1 && confirmedPassword.length < 1) errorMessage += `Kindly re-enter your password choice. For science! `;
        // if (password !== confirmedPassword) errorMessage += `Your passwords don't match; please double-check your password entry. `;
        if (errorMessage) return setAppState({...appState, alertString: errorMessage});
        
        // if we get to this point, it's presumably AXIOS TIME! axios.post('/user/create')
        console.log(`I shall attempt to create this User Profile. Wish me luck!`);
        let newUser = {
            username: userCredentials.username,
            password: userCredentials.password,
            appData: appState
        };
        axios.post('/user/create', { newUser: newUser })
            .then(res => {
                // HERE: console.log, possible setAppState to trigger save, possible fireAlert to let user know what's going on
                // upon further review, setAppState should absolutely trigger - we need to save our JWT!
                // res.data.payload.token :P ... taking out the 'payload' bit for this app, so res.data.token, orrrrr...
                // yeah, let's try bundling token into appData -> appState
                console.log(`Received the following data from the backend: ${JSON.stringify(res.data)}`);
                // we should be getting res.data.alertString, res.data.alertType, and...
                // actually, they can come 'bundled' in this case, res.data.appData will have the alertString and alertType appeneded, as well as token
                // for 'failure cases' we won't have appData, so they will be necessarily handled a bit differently
                return setAppState(res.data.appData);

            })
            .catch(err => console.log(`Error creating new user: ${err}`));
    }    

    function handlePageChange(amount) {
        if (activityLogPage + amount > Math.floor(appState.history.log.length / 10)) return;
        if (activityLogPage + amount < 0) amount = 0;
        setActivityLogPage(activityLogPage + amount);
    }

    function logout() {
        localStorage.removeItem('flashcardfighterApp');
        setAppState({
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
          return setActivityLogPage(undefined);
    }

    function parseTimestamp(timestamp) {
        // THIS: given a possibly wonky Date()-like object, parse it into local time (2:53pm), or "Yesterday 9:26am", or "Feb 24 8:31pm," etc.
        let dayArray = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Satuday'];
        let monthArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        let now = new Date();
        timestamp = new Date(timestamp);
        let dateBit;
        if (now.getFullYear() === timestamp.getFullYear() && now.getMonth() === timestamp.getMonth() && now.getDate() === timestamp.getDate()) dateBit = 'Today'
        else dateBit = `${dayArray[timestamp.getDay()]} ${monthArray[timestamp.getMonth()]} ${timestamp.getDate()}`;
        let hour = timestamp.getHours();
        if (hour === 0) hour = 12;
        let ampm = hour < 12 ? 'am' : 'pm';
        hour = hour > 12 ? hour - 12 : hour;
        let minute = timestamp.getMinutes();
        minute = minute < 10 ? `0${minute}` : minute;

        return `${dateBit} - ${hour}:${minute}${ampm}`;
    }


    useEffect(() => {
        activityLogRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    useEffect(() => {
        let reversedArray = [...appState.history.log].reverse();
        let targetIndex = activityLogPage * 10;
        return setDerivedActivityLog(reversedArray.slice(targetIndex, targetIndex + 11).reverse());
        
    }, [activityLogPage]);

    useEffect(() => {
        setActivityLogPage(0);
    }, []);

    function serverTest() {
        axios.post('/server/test', {})
            .then(res => {
                console.log(`Server response: `, res);
            })
            .catch(err => console.log(`Server response ERROR: `, err));
    }


    return (
        <div id="appScreen" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'}}>
            <div style={{display: 'flex', width: '100%', justifyContent: 'flex-end'}}>
                <button style={{}} onClick={logout}>Log Out</button>
                <button onClick={serverTest}>Server Boop</button>
            </div>
            
            <div style={{display: 'flex'}}>
                <div style={{fontSize: 'calc(1rem + 0.3vw)', fontWeight: '600', margin: '0.5rem', textAlign: 'center'}}>{appState?.username && `${appState?.username}'s`} Cardfighter</div>
            </div>
            

            {appState?.username ? (
                // HERE: login/out, create/delete
                <div>
                    
                    {/* <button onClick={() => setAppState({...appState, alertString: `Baby Shark doo doo doo doo doo doo`})}>Alert</button> */}
                </div>
            ) : (
                <form onSubmit={logIn} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1rem', gap: '1rem'}}>
                    <input type='text' value={userCredentials.username} onChange={e => setUserCredentials({...userCredentials, username: e.target.value})} placeholder='Username' />
                    <input type='text' value={userCredentials.password} onChange={e => setUserCredentials({...userCredentials, password: e.target.value})} placeholder='Password' />
                    <button onClick={logIn} type='button' style={{padding: '0.5rem 1rem', fontSize: '1.1rem', fontWeight: '600'}}>Log In!</button>
                    <button onClick={createNewProfile} type='button' style={{padding: '0.5rem 1rem', fontSize: '1.1rem', fontWeight: '600'}}>New? Create Account!</button>
                </form>
            )}

            {Object.keys(appState.sessions).filter(sessionID => appState.sessions[sessionID]?.favorite).length > 0 &&
                <div>Favorite Sessions</div>
            }
            <div style={{display: 'flex', justifyContent: 'center', width: '100%', gap: '1rem'}}>
                {Object.keys(appState.sessions).filter(sessionID => appState.sessions[sessionID]?.favorite).map((sessionID, index) => (
                    <button key={index} onClick={() => setAppState({...appState, mode: 'studySession', currentModeTargetID: sessionID})}>{appState.sessions[sessionID].nickname}</button>
                ))}
            </div>

            <div id="tuts_and_history" style={{display: 'flex', flexDirection: 'column', boxSizing: 'border-box', alignItems: 'center', width: '100%', justifyContent: 'center', gap: '5%', flexWrap: 'wrap'}}>

                <div id="tut" style={{display: 'flex', paddingTop: '1rem', lineHeight: '1.5', width: '100%', minWidth: '250px', justifyContent: 'center', textAlign: 'center'}}>
                    THE WELCOME & BASIC TUTORIAL SECTION
                </div>

                <div style={{padding: '1rem', display: derivedActivityLog.length ? 'flex' : 'none', width: '40%', minWidth: '250px', height: '50vh', overflow: 'scroll', boxSizing: 'border-box', flexDirection: 'column', border: '1px solid #DDD', borderRadius: '5px'}}>
                    {derivedActivityLog.map((historyItem, index) => (
                        <div key={index}  style={{display: 'flex', flexWrap: 'wrap', height: 'auto', margin: '1rem', color: 'white', padding: '1rem', boxSizing: 'border-box', backgroundColor: '#0AF'}}>
                            <div style={{width: '100%', fontSize: 'calc(0.6rem + 0.4vw)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'flex-end'}}>{parseTimestamp(historyItem.timestamp)}</div>
                            <div style={{lineHeight: '1.5'}}>{historyItem.echo}</div>
                        </div>
                    ))}
                    <div ref={activityLogRef} />


                </div>
                <div style={{display: 'flex', width: '40%', minWidth: '250px', justifyContent: 'flex-end', gap: '1rem'}}>
                    <button onClick={() => handlePageChange(1)}>{'< '}Older</button>
                    <button disabled={!activityLogPage} onClick={() => handlePageChange(-1)}>{activityLogPage ? `Newer >` : `(Newest)`}</button>
                </div>

            </div>

        </div>        
    )
}