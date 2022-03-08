import React, { useState, useEffect } from 'react';

export default function Alert({ alertString, clearAlert}) {
    const [alertTime, setAlertTime] = useState(undefined);
    const [currentAlert, setCurrentAlert] = useState(undefined);


    function dismissAlert() {
        setAlertTime(0);
    }


    useEffect(() => {
        // ADD: how to handle getting a 'new' alert; currently new alerts just kind of bounce imperviously off the bulletproof hide of the previous alert :P
          
        if (alertString) {
            // can we RETURN in here? ... worth a go, removing the if-return currently living near the bottom
            setAlertTime(10000);
            setCurrentAlert(alertString);
        }
        if (!alertString) setAlertTime(undefined);
    }, [alertString]);

    useEffect(() => {
        if (alertTime <= 0) {
            setCurrentAlert(undefined);
            clearAlert();
        }

        // ADD: check for alertTime <= 0
        let timer;
        if (alertTime) {
            timer = setTimeout(() => {
                setAlertTime(alertTime - 100);
            }, 100);
        }

        return () => {
            clearTimeout(timer);
        }
    }, [alertTime]);

    if (alertString) {
        return (
            <div style={{display: currentAlert ? 'flex' : 'none', position: 'relative', borderRadius: '3px', opacity: `${0.50 + (alertTime / 2000) * 0.50}`, flexDirection: 'column', boxSizing: 'border-box', backgroundColor: 'white', position: 'fixed', width: 'calc(150px + 30vw)', height: '150px', border: '2px solid hsl(240,80%,20%)', left: 'calc(35vw - 75px)', bottom: '2rem'}}>
                <div style={{color: 'hsl(225, 90%, 20%)', fontWeight: '600', letterSpacing: '0.5px', width: '100%', display: 'flex', boxSizing: 'border-box', padding: '0.5rem'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>ALERT</div>
                    <div style={{width: '100%', display: 'flex', justifyContent: 'flex-end'}}>
                        <button onClick={dismissAlert} style={{padding: '0.25rem 0.5rem'}}>X</button>
                    </div>
                </div>
                <div style={{width: '100%', height: '100%', backgroundColor: 'lavender', padding: '0.5rem', boxSizing: 'border-box'}}>{currentAlert}</div>
            </div>
        )
    }

    return null;

}