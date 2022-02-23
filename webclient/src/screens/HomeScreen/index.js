import React, { useState } from 'react';
import axios from 'axios';

export default function HomeScreen({ appState, setAppState }) {
    const [userCredentials, setUserCredentials] = useState({
        username: '',
        password: ''
    });


    function logIn(e) {
        e.preventDefault();
        if (userCredentials.username.length < 4 || userCredentials.password.length < 1) return alert(`WEE OO gotta enter your username and password, champ!`);
        axios.post('/user/login', { userCredentials: userCredentials })
            .then(res => {
                return setAppState(res.data.appData);
            })
            .catch(err => alert(`ERROR LOGGING IN: ${err}`));
    }


    return (
        <div id="appScreen" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'}}>
            <h1>Flashcard Fighters - the APP!</h1>
            {appState?.username ? (
                <div>
                    <div>Logged in! But, uh, you probably knew that already. Upper Right! :-D</div>
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

            <div>
                Hi! This area is reserved for history items. Let's test the power of HISTORY!
            </div>

            {/* HOME SCREEN MAIN ON: whatchu doin here? */}

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