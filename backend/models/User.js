const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {type: String, required: true},
    id: {type: String, required: true},
    salt: {type: String, required: true},
    hash: {type: String, required: true},
    appData: {type: String}
}, { minimize: false });

module.exports = mongoose.model('User', UserSchema);

/*
    Rejiggering for FCF.

    What sort of models should we have for FCF?
    -- the User, a stringified translation of the local day-to-day data a user saves/loads directly into the app
    -- the Deck, which should pretty much be a 1-to-1 reflection of the deck as it appears in the webclient app
    -- later on, maybe Collections/other 'study aids' or curricula
    -- for now, I think that's it! 
*/