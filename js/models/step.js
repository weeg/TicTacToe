
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