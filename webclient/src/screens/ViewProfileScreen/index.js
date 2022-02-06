import React, { useState } from 'react';
import axios from 'axios';

export default function ViewProfileScreen({ appState, setAppState, fireAlert }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmedPassword, setConfirmedPassword] = useState('');

    function createNewProfile() {
        // axios ahoooooy
        // THIS: confirm everything is ok with the input fields: 1) usernamne is ok, 2) password is ok, 3) passwords match
        let errorMessage = ``;
        if (username.length < 4 || username.length > 10) errorMessage += `Please choose a Profile Name that is between 4 and 10 characters in length. `;
        if (password.length < 1) errorMessage += `Kindly enter a Password you would like to use. `;
        if (password.length >= 1 && confirmedPassword.length < 1) errorMessage += `Kindly re-enter your password choice. For science! `;
        if (password !== confirmedPassword) errorMessage += `Your passwords don't match; please double-check your password entry. `;
        if (errorMessage) return fireAlert(errorMessage);
        
        // if we get to this point, it's presumably AXIOS TIME! axios.post('/user/create')
        console.log(`I shall attempt to create this User Profile. Wish me luck!`);
        let newUser = {
            username: username,
            password: password,
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
                return setAppState(res.data.appData); // no whammies no whammies no whammies...

            })
            .catch(err => console.log(`Error creating new user: ${err}`));
    }

    function logOut() {
        // clear localStorage, reset appState
        localStorage.removeItem('flashcardfighterApp');
        setAppState({
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
            history: {}            
        });
    }

    return (
        <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'}}>

            {appState.username === undefined ? (

                <>
                    <h3 style={{margin: '0'}}>Create a Profile. If you want to Log In, go back HOME.</h3>
                    <h3 style={{margin: '0'}}>(I should also give some useful information about what creating a profile does. Check back Soon.)</h3>
                    <input type='text' value={username} onChange={e => setUsername(e.target.value)} placeholder={'Username'} />
                    <input type='password' value={password} onChange={e => setPassword(e.target.value)} placeholder={'Password'} />
                    <input type='password' value={confirmedPassword} onChange={e => setConfirmedPassword(e.target.value)} placeholder={'Confirm Password'} />
                    <button onClick={createNewProfile} style={{padding: '0.5rem 1rem', fontSize: '1rem'}}>BOOP make new profile</button>
                </>

            ) : (

                <>
                    <h3 style={{margin: '0'}}>Oh! You are logged in. Welcome to your Profile Page, {appState?.username}.</h3>
                    <h3 style={{margin: '0'}}>Here is where we can customize some Profile Specs, Soon.</h3>
                    <h3 style={{margin: '0'}}>Redoing password and such comes to mind. :P</h3>
                    <button onClick={logOut} style={{padding: '0.5rem 1rem', fontSize: '1.1rem', fontWeight: '600'}}>Log On Out</button>
                    
                </>

            )}
            
        </div>        
    )
}

/*
    HM. To add to logged-in Profile Page:
    - log out
    - change password

    Also, the token currently doesn't have any particular use in the backend logic. Non-creation routes should come to use the token shortly, ideally.


*/