
// Difficulty selector
var DifficultyModel = function(name, type, time) {
    this.name   = name;
    this.type   = type;
    this.time   = time;
};

DifficultyModel.prototype = {

    getTime: function() {
        return this.time;
    },

    // output for JSON.stringify()
    toJSON: function() {
        return this.type;
    }
};

DifficultyModel.factory = function(type) {
    switch (type) {

        case 'easy':
            return new Easy();

        case 'medium':
            return new Medium();

        case 'hard':
            return new Hard();

        default:
            return null;
    }
};

DifficultyModel.getRandomEmptyField = function() {
    var emptyFields = [];

    // Row keys
    Object.keys(FieldModel.fields).forEach(function(row) {

        // Column keys
        Object.keys(FieldModel.fields[row]).forEach(function(column) {

            // Store empty field
            if (FieldModel.isFieldEmpty(row, column)) {
                emptyFields.push({row:row, column:column});
            }
        });
    });

    // No more empty fields
    if (emptyFields.length == 0) {
        return null;
    }

    // Return a random field
    return emptyFields[Math.floor(Math.random() * emptyFields.length)];
};

var Easy = function() {
    DifficultyModel.call(this, 'Easy', 'easy', 10);
};

Easy.prototype = Object.create(DifficultyModel.prototype);
Easy.prototype.constructor = Easy;

// It gets a random position
Easy.prototype.getNextStep = function(){
    return DifficultyModel.getRandomEmptyField();
};


var Medium = function() {
    DifficultyModel.call(this, 'Medium', 'medium', 4);
};

Medium.prototype = Object.create(DifficultyModel.prototype);
Medium.prototype.constructor = Medium;

Medium.prototype.getNextStep = function(){

    // We have a bigger chance to win if we start from the middle
    if (FieldModel.isFieldEmpty(2,2)) {

        return {row:2, column:2};

    } else {
        return DifficultyModel.getRandomEmptyField();
    }
};

var Hard = function() {
    DifficultyModel.call(this, 'Hard', 'hard', 2);
};

Hard.prototype = Object.create(DifficultyModel.prototype);
Hard.prototype.constructor = Hard;

Hard.prototype.getAlmostStripedFields = function(type) {

    var f     = FieldModel.fields;
    var field = null

    // 1. row
    if (field = this.getEmptyFieldOfRow(1, type)) {
        return field;
    }

    // 2. row
    if (field = this.getEmptyFieldOfRow(2, type)) {
        return field;
    }

    // 3. row
    if (field = this.getEmptyFieldOfRow(3, type)) {
        return field;
    }

    // 1. column
    if (field = this.getEmptyFieldOfColumn(1, type)) {
        return field;
    }

    // 2. column
    if (field = this.getEmptyFieldOfColumn(2, type)) {
        return field;
    }

    // 3. column
    if (field = this.getEmptyFieldOfColumn(3, type)) {
        return field;
    }

    // Crosses
    if (field = this.getEmptyFieldOfCrosses(type)) {
        return field;
    }

    return null;
};

Hard.prototype.getEmptyFieldOfRow = function(row, type) {

    var f = FieldModel.fields;

    // _xx
    if (f[row][1].type == '' &&  f[row][2].type == type && f[row][3].type == type) {
        return {row:row, column:1};
    }

    // x_x
    if (f[row][1].type == type && f[row][2].type == '' && f[row][3].type == type) {
        return {row:row, column:2};
    }

    // xx_
    if (f[row][1].type == type && f[row][2].type == type && f[row][3].type == '') {
        return {row:row, column:3};
    }


    return null;
};

Hard.prototype.getEmptyFieldOfColumn = function(column, type) {

    var f = FieldModel.fields;


    // _
    // x
    // x
    if (f[1][column].type == '' && f[2][column].type == type && f[3][column].type == type) {
        return {row:1, column:column};
    }

    // x
    // _
    // x
    if (f[1][column].type == type && f[2][column].type == '' && f[3][column].type == type) {
        return {row:2, column:column};
    }

    // x
    // x
    // _
    if (f[1][column].type == type && f[2][column].type == type && f[3][column].type == '') {
        return {row:3, column:column};
    }


    return null;
};

Hard.prototype.getEmptyFieldOfCrosses = function(type) {

    var f = FieldModel.fields;

    // _
    //  x
    //   x
    if (f[1][1].type == '' && f[2][2].type == type && f[3][3].type == type) {
        return {row:1, column:1};
    }

    // x
    //  _
    //   x
    if (f[1][1].type == type && f[2][2].type == '' && f[3][3].type == type) {
        return {row:2, column:2};
    }

    // x
    //  x
    //   _
    if (f[1][1].type == type && f[2][2].type == type && f[3][3].type == '') {
        return {row:3, column:3};
    }

    //   _
    //  x
    // x
    if (f[1][3].type == '' && f[2][2].type == type && f[3][1].type == type) {
        return {row:1, column:3};
    }

    //   x
    //  _
    // x
    if (f[1][3].type == type && f[2][2].type == '' && f[3][1].type == type) {
        return {row:2, column:2};
    }

    //   x
    //  x
    // _
    if (f[1][3].type == type && f[2][2].type == type && f[3][1].type == '') {
        return {row:3, column:1};
    }

    return null;
};


Hard.prototype.getNextStep = function(){

    // We have a bigger chance to win if we start from the middle
    if (FieldModel.isFieldEmpty(2,2)) {

        return {row: 2, column: 2};

    // Ony one field is missing, so complete it
    } else if (field = this.getAlmostStripedFields('o')) {

        return field;

    // The user has one empty field to complete the row
    } else if (field = this.getAlmostStripedFields('x')) {

        return field;

    // Choose a random empty field
    } else {
        return DifficultyModel.getRandomEmptyField();
    }
};

// TODO: var Friend = ....