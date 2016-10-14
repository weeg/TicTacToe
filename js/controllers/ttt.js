
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

        app.setProgressbar($$('#timer'), 0);
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

                message  = '<button class="button button-raised bg-green color-black" onClick="TTTController.retry()">Start</button>';
                message += '<button class="button button-raised bg-red color-black" onClick="TTTController.openPopup(\'rules\')">Rules</button>';

                break;

            case 'start':

                message = '<button class="button button-raised bg-green color-black" onClick="TTTController.retry()">Start</button>';

                break;

            case 'resume':

                message = '<button class="button button-raised bg-green color-black" onClick="TTTController.resume()">Resume</button>';

                break;

            case 'win':

                message  = 'You Win!';
                message += ' <button class="button button-raised bg-green color-black" onClick="TTTController.retry()">Retry</button>';

                break;

            case 'lose':

                message  = 'You Lose!';
                message += ' <button class="button button-raised bg-green color-black" onClick="TTTController.retry()">Retry</button>';

                break;
        }

        $$('#message').html(message);

        // Hide content
        if (message == '') {
            $$('#result_message').css('display','none').removeClass('fade-in');

        // Show content
        } else {
            this._stopTimer();
            $$('#result_message').css('display','table').addClass('fade-in');
        }
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