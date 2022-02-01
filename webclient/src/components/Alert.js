import React, { useState, useEffect } from 'react';

export default function Alert({ alertString, clearAlert}) {
    const [alertTime, setAlertTime] = useState(undefined);
    const [currentAlert, setCurrentAlert] = useState(undefined);

    useEffect(() => {
        // ADD: how to handle getting a 'new' alert; currently new alerts just kind of bounce imperviously off the bulletproof hide of the previous alert :P
          
        if (alertString) {
            // can we RETURN in here? ... worth a go, removing the if-return currently living near the bottom
            setAlertTime(5000);
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
                setAlertTime(alertTime - 1000);
            }, 1000);
        }

        return () => {
            clearTimeout(timer);
        }
    }, [alertTime]);

    if (alertString) {
        return (
            <div style={{display: currentAlert ? 'inline-block' : 'none', backgroundColor: 'white', position: 'fixed', width: 'calc(400px + 10vw)', height: '150px', border: '1px solid black', left: 'calc(45vw - 200px)', bottom: '2rem'}}>
                <h1>ALERT (for {alertTime / 1000}s): {currentAlert}</h1>
            </div>
        )
    }

    return null;

}