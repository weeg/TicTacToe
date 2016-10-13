
var FieldModel = function(type, row, column) {
    this.type   = type;
    this.row    = row;
    this.column = column;

    this.$$field  = $$('#field_'+this.row+'_'+this.column);
    this.$$field.html('');

    this.$$svg    = null;
};

FieldModel.prototype = {
    setSvg: function() {
        this.$$field.html(this.svg);

        var that = this;

        // Chaining up animations
        return new Promise(function(resolve, reject) {

            // Not Empty field
            if (that.type != '') {
                that.$$svg = $$('#svg_'+that.row+'_'+that.column)

                // Fire next animation when ended
                that.fadeIn().then(function(e) {
                    resolve(e);
                });
            } else {
                resolve(null);
            }

        });
    },

    animate: function(className) {

        var that = this;

        return new Promise(function(resolve, reject) {

            if (that.type != '') {

                var originalClassNames = that.$$svg.attr('class');

                // Add new class, and wait for animation end
                // .addClass() method does't work on svgs
                that.$$svg.attr('class', that.$$svg.attr('class')+' '+className).animationEnd(function(e) {

                    // Remove lastClass
                    that.$$svg.attr('class', originalClassNames);

                    resolve(e);
                });

            // Empty field
            } else {
                resolve(null);
            }

        });
    },

    fadeIn: function() {
        return this.animate('fade-in');
    },

    fadeOut: function() {
        return this.animate('fade-out');
    },

    blink: function() {
        return this.animate('blink');
    },

    // output for JSON.stringify()
    toJSON: function() {
        return this.type;
    }
};

FieldModel.init = function() {
    FieldModel.gameOver = false;

    FieldModel.first = 'x';

    FieldModel.setDifficulty('easy');

    FieldModel.numberOfGameWon = {x: 0, o: 0};

    FieldModel.fields = {
        1: {1: new Empty(1,1), 2: new Empty(1,2), 3: new Empty(1,3)},
        2: {1: new Empty(2,1), 2: new Empty(2,2), 3: new Empty(2,3)},
        3: {1: new Empty(3,1), 2: new Empty(3,2), 3: new Empty(3,3)}
    };

    FieldModel.steps = [];
};

FieldModel.setDifficulty = function(type) {
    FieldModel.difficulty = DifficultyModel.factory(type);

    // Update difficulty label
    $$('#difficulty_label').text(FieldModel.difficulty.name);
};

FieldModel.setFirst = function(type) {
    FieldModel.first = type;
};

FieldModel.addStep = function(row, column, type) {

    var step = new StepModel(type, row, column);

    FieldModel.steps.push(step);
    FieldModel.saveData();
};

FieldModel.removeEarliestStep = function() {

    // Wait until fadeOut ended
    return new Promise(function(resolve, reject) {

        if (FieldModel.steps.length == 7) {

            // Removes first step
            var step = FieldModel.steps.shift();

            // Wait until field fadesOut
            step.getField().fadeOut().then(function(e) {

                FieldModel.createField(step.row, step.column, '').then(function(e) {
                    resolve(e);
                })
            });

        } else {
            resolve(null);
        }
    });


};

FieldModel.setGameOver = function(gameOver) {
    FieldModel.gameOver = gameOver;
    FieldModel.saveData();
};

FieldModel.isGameOver = function() {
    return FieldModel.gameOver;
};

FieldModel.toJSON = function() {
    return {
        gameOver:        FieldModel.gameOver,
        first:           FieldModel.first,
        numberOfGameWon: FieldModel.numberOfGameWon,
        difficulty:      FieldModel.difficulty,
        fields:          FieldModel.fields,
        steps:           FieldModel.steps
    };
};

FieldModel.resetFields = function() {

    // Row keys
    Object.keys(FieldModel.fields).forEach(function(row) {

        // Column keys
        Object.keys(FieldModel.fields[row]).forEach(function(column) {

            FieldModel.createField(row, column, '');
        });
    });

    FieldModel.setGameOver(false);
    FieldModel.steps = [];
    FieldModel.saveData();
};

FieldModel.hasSavedData = function() {
    return JSON.parse(localStorage.getItem('fields')) !== null;
};


FieldModel.resumeGame = function() {

    if (FieldModel.hasSavedData()) {

        var json = JSON.parse(localStorage.getItem('fields'));

        FieldModel.gameOver = json.gameOver;
        FieldModel.first    = json.first;
        FieldModel.numberOfGameWon = json.numberOfGameWon;
        FieldModel.setDifficulty(json.difficulty);

        // Load steps
        json.steps.forEach(function(data) {

            var step = new StepModel(data.type, data.row, data.column);

            FieldModel.steps.push(step);
        });

        // Load fields
        // Row keys
        Object.keys(json.fields).forEach(function(row) {

            // Column keys
            Object.keys(json.fields[row]).forEach(function(column) {

                FieldModel.createField(row, column, json.fields[row][column]);
            });
        });
    }
};

FieldModel.createField = function(row, column, type) {

    var field = new Empty(row, column);

    // X
    if (type == 'x') {
        field = new X(row, column);

    // O
    } else if (type == 'o') {
        field = new O(row, column);
    }


    // Felhasznalt mezok eltarolasa
    FieldModel.fields[row][column] = field;

    // Mezo frissitese
    return field.setSvg();
};

// Save data to localStorage
FieldModel.saveData = function() {
    localStorage.setItem('fields', JSON.stringify(FieldModel));
};

FieldModel.clearData = function() {
    localStorage.removeItem('fields');

    FieldModel.init();
};

FieldModel.isFieldEmpty = function(row, column) {
    return FieldModel.fields[row][column].type == '';
};

FieldModel.hasEmptyField = function() {
    return FieldModel.getNextStep() != null;
};

FieldModel.getLastStep = function() {

    if (FieldModel.steps.length == 0) {
        return null;
    }

    return FieldModel.steps[FieldModel.steps.length - 1];
};

FieldModel.getNextStep = function() {
    return FieldModel.difficulty.getNextStep();
};

FieldModel.getWinnerType = function() {

    if (FieldModel.isGameOver()) {
        return FieldModel.getLastStep() ? FieldModel.getLastStep().type : '';
    }

    return '';
};

FieldModel.hasStrike = function(type) {
    return FieldModel.getStrikedFields(type).length != 0;
};

FieldModel.getStrikedFields = function(type) {
    var f = FieldModel.fields;

    // 1. row
    if (f[1][1].type == type && f[1][2].type == type && f[1][3].type == type) {
        return [f[1][1], f[1][2], f[1][3]];
    }

    // 2. row
    if (f[2][1].type == type && f[2][2].type == type && f[2][3].type == type) {
        return [f[2][1], f[2][2], f[2][3]];
    }

    // 3. row
    if (f[3][1].type == type && f[3][2].type == type && f[3][3].type == type) {
        return [f[3][1], f[3][2], f[3][3]];
    }

    // 1. column
    if (f[1][1].type == type && f[2][1].type == type && f[3][1].type == type) {
        return [f[1][1], f[2][1], f[3][1]];
    }

    // 2. column
    if (f[1][2].type == type &&  f[2][2].type == type && f[3][2].type == type) {
        return [f[1][2], f[2][2], f[3][2]];
    }

    // 3. column
    if (f[1][3].type == type && f[2][3].type == type && f[3][3].type == type) {
        return [f[1][3], f[2][3], f[3][3]];
    }

    // Left cross
    if (f[1][1].type == type && f[2][2].type == type && f[3][3].type == type) {
        return [f[1][1], f[2][2], f[3][3]];
    }

    // Right cross
    if (f[1][3].type == type && f[2][2].type == type && f[3][1].type == type) {
        return [f[1][3], f[2][2], f[3][1]];
    }

    return [];
};

// It returns the next player type
FieldModel.getNextType = function() {

    // If game is over, no next step
    if (FieldModel.isGameOver()) {

        return '';

    // Get first step
    } else if (FieldModel.steps.length == 0) {

        return FieldModel.first;

    // If paused, then get the next by steps
    } else {

        var lastType = FieldModel.steps[FieldModel.steps.length - 1];

        return lastType.type == 'x' ? 'o' : 'x';
    }
};

// X
var X = function(row, column) {

    FieldModel.call(this, 'x', row, column);

    this.svg = '<svg id="svg_'+row+'_'+column+'" class="x" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">'+
                    '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>'+
                    '<path d="M0 0h24v24H0z" fill="none"/>'+
                '</svg>';
};

X.prototype = Object.create(FieldModel.prototype);
X.prototype.constructor = X;

// O
var O = function(row, column) {

    FieldModel.call(this, 'o', row, column);

    this.svg = '<svg id="svg_'+row+'_'+column+'" class="o" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">'+
                    '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>'+
                    '<path d="M0 0h24v24H0z" fill="none"/>'+
                '</svg>';
};

O.prototype = Object.create(FieldModel.prototype);
O.prototype.constructor = O;

// O
var Empty = function(row, column) {
    FieldModel.call(this, '', row, column);

    this.svg = '';
};

Empty.prototype = Object.create(FieldModel.prototype);
Empty.prototype.constructor = Empty;