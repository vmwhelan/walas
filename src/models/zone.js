import mongoose from 'mongoose';

// Define Schema
const Schema = mongoose.Schema;

export const ZoneSchema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    zoneName: {
        type: String,
        required: true
    },
    is_on: Boolean,
    is_muted: Boolean,
    volume: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    }
});

// Virtual for Zone name
ZoneSchema
.virtual('name')
.get(function(){
    return this.zoneName;
});

ZoneSchema
.virtual('vol')
.get(function(){
    return this.volume;
});

// Virtual for Zone URL
ZoneSchema
.virtual('url')
.get(function(){
    return '/zone/'+this._id;
});

// Compile model from Schema
//var Zone = mongoose.model('Zone', ZoneSchema);
// Export function to create 'Zone' model class
module.exports = mongoose.model('Zone', ZoneSchema );
