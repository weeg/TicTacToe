var app = new Framework7({
    animateNavBackIcon: true,
    material: true
});

var mainView = app.addView('.view-main', {
    domCache: true //enable inline pages
});

var $$ = Dom7;


var StepModel = function(type, row, column) {
    this.type   = type;
    this.row    = row;
    this.column = column;
};

StepModel.prototype = {
    getField: function() {
        return FieldModel.fields[this.row][this.column];
    },

    // output for JSON.stringify()
    toJSON: function() {
        return {type:this.type, row:this.row, column:this.column};
    }
};


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
    return FieldModel.difficulty.getNexStep();
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
Easy.prototype.getNexStep = function(){
    return DifficultyModel.getRandomEmptyField();
};


var Medium = function() {
    DifficultyModel.call(this, 'Medium', 'medium', 4);
};

Medium.prototype = Object.create(DifficultyModel.prototype);
Medium.prototype.constructor = Medium;

Medium.prototype.getNexStep = function(){

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

Hard.prototype.getNexStep = function(){

    // We have a bigger chance to win if we start from the middle
    if (FieldModel.isFieldEmpty(2,2)) {

        return {row:2, column:2};

    } else {
        return DifficultyModel.getRandomEmptyField();
    }
};

// TODO: var Friend = ....









var TTTController = {

    timer: null,
    timeRemained: 0,

    init: function() {

        FieldModel.init();

        // Resume Game
        if (FieldModel.hasSavedData()) {
            FieldModel.resumeGame();

            this._setMessage('resume');

            // Check winner
            if (FieldModel.isGameOver()) {

                if (FieldModel.getWinnerType() == 'x') {
                    //this._blinkStipedFields('x');
                    this._setMessage('win');

                } else {
                    //this._blinkStipedFields('o');
                    this._setMessage('lose');
                }
            }

            // Opponent starts
            if (FieldModel.getNextType() == 'o') {
                this._opponentClicked();
            }

        // First time
        } else {
            this._setMessage('first_time');
        }

        $$('#won_games_x').text(FieldModel.numberOfGameWon['x']);
        $$('#won_games_o').text(FieldModel.numberOfGameWon['o']);
    },

    openPopup: function(popup) {

        // Close popover
        app.closeModal();
        app.popup($$('#'+popup+'_popup'));
    },

    setDifficulty: function(type) {

        FieldModel.init();
        FieldModel.setDifficulty(type);
        this._setMessage('start');

        // Close popover
        app.closeModal();
    },

    resume: function() {
        this._startTimer(FieldModel.getNextType());
        this._setMessage('');
    },

    retry: function() {
        FieldModel.resetFields();

        this._setMessage('');
        this._startTimer(FieldModel.first);

        // Opponent starts
        if (FieldModel.first == 'o') {
            this._opponentClicked();
        }
    },

    newGame: function() {

        FieldModel.clearData();

        var difficulty = FieldModel.difficulty.type;

        this.init();

        // Store original difficulty
        this.setDifficulty(difficulty);

        this._setMessage('start');
    },

    userClicked: function(row, column) {

        if (FieldModel.isFieldEmpty(row, column) && !FieldModel.isGameOver()) {

            this._stopTimer();
            var that = this;

            // Wait until fadeIn animation ends
            FieldModel.createField(row, column, 'x').then(function(e) {

                FieldModel.addStep(row, column, 'x');

                // User Win
                if (FieldModel.hasStrike('x')) {

                    that._blinkStipedFields('x');
                    that._setWinner('x');
                    that._setMessage('win');

                // No winner yet
                } else {

                    // Wait until step removed
                    FieldModel.removeEarliestStep().then(function() {
                        that._startTimer('o');
                        that._setMessage('');
                        that._opponentClicked();
                    });

                }

            });

        }
    },

    _opponentClicked: function() {

        this._stopTimer();

        // Valsszon egy random helyet
        var field = FieldModel.getNextStep();
        var that  = this;

        // Wait until fadeIn animation ends
        FieldModel.createField(field.row, field.column, 'o').then(function(e) {

            FieldModel.addStep(field.row, field.column, 'o');

            // User Lose
            if (FieldModel.hasStrike('o')) {

                that._blinkStipedFields('o');
                that._setWinner('o');
                that._setMessage('lose');

            // No winner yet
            } else {

                FieldModel.removeEarliestStep().then(function() {
                    that._startTimer('x');
                });
            }
        })
    },

    _blinkStipedFields: function(type) {

        var fields = [];
        FieldModel.getStrikedFields(type).forEach(function(field) {
            fields.push(field.blink());
        });

        // Wait until blinking finished
        return Promise.all(fields);
    },

    _startTimer: function(type) {

        var maxTime = FieldModel.difficulty.getTime();

        this._stopTimer();

        // Run at first
        this._updateTime(maxTime);

        // Indicate user by color
        $$('#timer')
            .removeClass('color-red')
            .removeClass('color-green')
            .addClass(type == 'o' ? 'color-red' : 'color-green');

        this.timeRemained = maxTime;
        this.timer = setInterval(function() {

            // Game over
            if (TTTController.timeRemained <= 0) {

                TTTController._stopTimer();
                TTTController._setWinner(type);

                var winner = type == 'x' ? 'o' : 'x';

                if (winner == 'x') {
                    TTTController._setMessage('win');
                } else {
                    TTTController._setMessage('lose');
                }

            // Count Down
            } else {

                TTTController.timeRemained -= 0.1;
                TTTController._updateTime(TTTController.timeRemained);
            }

        }, 100);
    },

    _stopTimer: function() {
        clearInterval(this.timer);
        this.timeRemained = 0;
    },

    _updateTime: function(timeRemained) {
        var maxTime = FieldModel.difficulty.getTime();
        var percent = ((maxTime - timeRemained) / maxTime) * 100;

        app.setProgressbar($$('#timer'), percent);
    },

    _setMessage: function(type) {

        var message = '';

        switch(type) {

            case 'first_time':

                message  = '<button class="button button-raised color-green" onClick="TTTController.retry()">Start</button>';
                message += '<button class="button button-raised color-green" onClick="TTTController.openPopup(\'rules\')">Rules</button>';

                break;

            case 'start':

                message = '<button class="button button-raised color-green" onClick="TTTController.retry()">Start</button>';

                break;

            case 'resume':

                message = '<button class="button button-raised color-green" onClick="TTTController.resume()">Resume</button>';

                break;

            case 'win':

                message  = 'You Win!';
                message += ' <button class="button button-raised color-green" onClick="TTTController.retry()">Retry</button>';

                break;

            case 'lose':

                message  = 'You Lose!';
                message += ' <button class="button button-raised color-green" onClick="TTTController.retry()">Retry</button>';

                break;
        }

        $$('#message').html(message);
    },

    _setWinner: function(type) {
        var numberOfGameWon = ++FieldModel.numberOfGameWon[type];

        $$('#won_games_'+type).text(numberOfGameWon);

        // The Loser starts the next round
        var first = type == 'x' ? 'o' : 'x';

        FieldModel.setFirst(first);
        FieldModel.setGameOver(true);
        FieldModel.saveData();
    }
};

TTTController.init();