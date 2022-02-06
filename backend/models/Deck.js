const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DeckSchema = new Schema({
    name: {type: String, required: true},
    id: {type: String, required: true},
    ownerID: String,
    variant: Boolean,
    shared: Boolean,
    lastUpdateTime: Date,
    tags: String,
    description: String,
    cards: Array,
    style: Object
}, { minimize: false });

module.exports = mongoose.model('User', UserSchema);

/*
    Deck should reflect the webclient app's decks for easy portability
    ... this should allow a pretty easy 'deck fetch' for users to add 'online' decks to their own

    For reference, the current objectification of decks in the webapp looks like this:
    const [newDeck, setNewDeck] = useState({
        id: undefined,
        variant: false,
        lastUpdateTime: undefined,
        name: '',
        tags: '', 
        description: '',
        cards: [],
        style: {}
    });
*/