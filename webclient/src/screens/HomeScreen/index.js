import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function HomeScreen({ appState, setAppState }) {
    const [userCredentials, setUserCredentials] = useState({
        username: '',
        password: ''
    });
    const [derivedActivityLog, setDerivedActivityLog] = useState(['Bork']);
    const [activityLogPage, setActivityLogPage] = useState(undefined);
    const activityLogRef = useRef(null);


    function logIn(e) {
        e.preventDefault();
        if (userCredentials.username.length < 4 || userCredentials.password.length < 1) return alert(`WEE OO gotta enter your username and password, champ!`);
        axios.post('/user/login', { userCredentials: userCredentials })
            .then(res => {
                return setAppState(res.data.appData);
            })
            .catch(err => alert(`ERROR LOGGING IN: ${err}`));
    }

    function handlePageChange(amount) {
        if (activityLogPage + amount > Math.floor(appState.history.log.length / 10)) amount = Math.ceil(appState.history.log.length / 10);
        if (activityLogPage + amount < 0) amount = 0;
        setActivityLogPage(activityLogPage + amount);
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


    return (
        <div id="appScreen" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'}}>
            <h1>Flashcard Fighters - the APP!</h1>
            {appState?.username ? (
                <div>
                    <div>Logged in! But, uh, you probably knew that already. Upper Right! :-D</div>
                    <div style={{padding: '1rem', display: 'flex', width: '100%', height: '50vh', overflow: 'scroll', boxSizing: 'border-box', flexDirection: 'column', border: '1px solid black', borderRadius: '5px'}}>
                        {derivedActivityLog.map((historyItem, index) => (
                            <div key={index} style={{display: 'flex', flexWrap: 'wrap', height: 'auto', margin: '1rem', color: 'white', padding: '1rem', boxSizing: 'border-box', backgroundColor: '#0AF'}}>{index}:{historyItem.echo}</div>
                        ))}
                        <div ref={activityLogRef} />
                    </div>
                    <button onClick={() => setActivityLogPage(Math.floor(appState.history.log.length / 10))}>BOOP</button>
                    <button onClick={() => handlePageChange(-1)}>Page LESS</button> 
                    <button onClick={() => handlePageChange(1)}>Page MOAR</button>
                    
                </div>
            ) : (
                <div>
                    <div>NOT logged in... prime opportunity to say "GET STARTED" or "LOG IN!"</div>
                    <div>Alternatively or also, can begin the 'tutorial' process here. Tuts tuts tuts</div>

                    <form onSubmit={logIn} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1rem', gap: '1rem'}}>
                        <input type='text' value={userCredentials.username} onChange={e => setUserCredentials({...userCredentials, username: e.target.value})} placeholder='Username' />
                        <input type='text' value={userCredentials.password} onChange={e => setUserCredentials({...userCredentials, password: e.target.value})} placeholder='Password' />
                        <button onClick={logIn} type='submit' style={{padding: '0.5rem 1rem', fontSize: '1.1rem', fontWeight: '600'}}>Log In!</button>
                    </form>

                </div>
            )}




            {/* <button style={{width: '200px', padding: '0.5rem', marginTop: '1rem'}} onClick={() => setAppState({...appState, mode: 'viewNotes'})}>Review Notes</button>
            <br /> */}
            {/* <button style={{width: '200px', padding: '0.5rem', marginTop: '1rem'}} onClick={() => setAppState({...appState, mode: 'studySession'})}>STUDY TIME!</button>
            <br /> 
            ... this option will go to live in the 'view sessions' screen by default
            ... we'll map out all expected favorites/scheduled sessions somewhere around here instead for the home screen
            */}
            {/* <button style={{width: '200px', padding: '0.5rem', marginTop: '1rem'}} onClick={() => setAppState({...appState, mode: 'createSchedule'})}>Create Study Schedule</button> */}
        </div>        
    )
}