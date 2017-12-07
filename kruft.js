// // import AbstractConstructError from 'abstract-class-error';
// // let symbolTable = {};
// //
// // class OriginalSymbol {
// //     constructor() {
// //         if (new.target === OriginalSymbol) {
// //             throw new AbstractConstructError('Cannot construct class "OriginalSymbol" instances directly');
// //         }
// //
// //         if (this.nud === OriginalSymbol.prototype.nud) {
// //             throw new AbstractConstructError('Method "nud" in class "OriginalSymbol" must be overridden');
// //         }
// //
// //         if (this.led === OriginalSymbol.prototype.led) {
// //             throw new AbstractConstructError('Method "led" in class "OriginalSymbol" must be overridden');
// //         }
// //     }
// //
// //     nud() {
// //         throw new Error('Undefined');
// //     }
// //
// //     led(/* left */) {
// //         throw new Error('Missing operator');
// //     }
// // }
//
//
// let symbolTable = {};
//
// class OriginalSymbol {
//     nud() {
//         throw new Error('Undefined');
//     }
//
//     led(/* left */) {
//         throw new Error('Missing operator');
//     }
// }
//
// class SyntaxSymbol extends OriginalSymbol {
//     constructor(id, bp) {
//         super();
//         this.id = id;
//         this.value = id;
//         this.lbp = bp;
//     }
// }
//
// function symbol(id, bp) {
//     let symbol = symbolTable[id];
//     bp = bp || 0;
//
//     if (symbol) {
//         if (bp >= symbol.lbp) {
//             symbol.lbp = bp;
//         }
//     } else {
//         symbol = new SyntaxSymbol(id, bp);
//         symbolTable[id] = symbol;
//     }
//
//     return symbol;
// }
//
// symbol(':');
// symbol(';');
// symbol(',');
// symbol(')');
// symbol(']');
// symbol('}');
//
// symbol('(end)');
// symbol('(name)');
//
// let token;
// let tokenNr;
//
// function advance(id) {
//     let arity;
//     let object;
//     let tok;
//     let value;
//
//     if (id && token.id !== id) {
//         throw new Error(`Expected ${id}`);
//     }
//
//     if (tokenNr >= tokens.length) {
//         token = symbolTable['(end)'];
//         return;
//     }
//
//     tok = tokens[tokenNr];
//     tokenNr++;
//     value = tok.value;
//     arity = tok.type;
//
//     if (arity === 'name') {
//         object = scope.find(value);
//     } else if (arity === 'operator') {
//         object = symbolTable[value];
//         if (!object) {
//             throw new Error('Unknown operator');
//         }
//     } else if (arity === 'string' || arity === 'number') {
//         arity = 'literal';
//         object = symbolTable['(literal)'];
//     } else {
//         throw new Error('Unexpected token');
//     }
//
//     token = Object.create(object);
//     token.value = value;
//     token.arity = arity;
//     return token;
// }
//

/*
Version with class syntax
Can't work because tokens can have each other as prototypes;

let symbolTable = {};

class OriginalSymbol {
    nud() {
        throw new Error('Undefined');
    }

    led() {
        throw new Error('Missing operator');
    }
}

function symbol(id, bp) {
    let symbol = symbolTable[id];
    bp = bp || 0;

    if (symbol) {
        if (bp >= symbol.lbp) {
            symbol.lbp = bp;
        }
    } else {
        symbol = class extends OriginalSymbol {
            constructor(value, arity) {
                super();
                this.value = value;
                this.arity = arity;
            }
        }
        symbol.prototype.value = id;
        symbol.prototypevalue = id;
        symbol.prototype.lbp = bp;

        symbolTable[id] = symbol;
    }

    return symbol;
}

symbol(':');
symbol(';');
symbol(',');
symbol(')');
symbol(']');
symbol('}');

symbol('(end)');
symbol('(name)');

let token;
let tokenNr;

function advance(id) {
    let arity;
    let object;
    let tok;
    let value;

    if (id && token.id !== id) {
        throw new Error(`Expected ${id}`);
    }

    if (tokenNr >= tokens.length) {
        token = symbolTable['(end)'];
        return;
    }

    tok = tokens[tokenNr];
    tokenNr++;
    value = tok.value;
    arity = tok.type;

    if (arity === 'name') {
        object = scope.find(value);
    } else if (arity === 'operator') {
        object = symbolTable[value];
        if (!object) {
            throw new Error('Unknown operator');
        }
    } else if (arity === 'string' || arity === 'number') {
        arity = 'literal';
        object = symbolTable['(literal)'];
    } else {
        throw new Error('Unexpected token');
    }

    token = Object.create(object);
    token.value = value;
    token.arity = arity;
    return token;
}

 */

 //
 // // Enter JavaScript code in this box and then click the "Evaluate" button.
 // // Any variable you assign to "this" will be graphed below.
 // // Try the presets above for more examples!
 //
 // // Example:
 // this.o_s = {
 // nud: function(){},
 // led: function(){}
 // };
 // this.s = Object.create(this.o_s);
 // this.s.id = 'id';
 // this.s.lbp = 'lbp';
 // this.t = Object.create(this.s);
 // this.t.v = 'v';
 // this.t.a = 'a';
 // //this.tid = this.t.id;
 // //this.tled = this.t.led;
 // //this.tled.foo = 'foo';
 //
 //
 //
 // this.S = class S {
 // nud(){}
 // led(){}
 // };
 // this.SI = class SI extends this.S {
 //    // constructor() {
 //          //this.v = 'v';
 //         //this.a = 'a';
 //    // }
 // };
 // this.SI.prototype.id = 'id';
 // this.SI.prototype.lbp = 'lbp';
 // //this.F = class F {};
 // //this.f = new this.F();
 // this.T = new this.SI();
 // this.TID = this.T.id;
 // this.TLED = this.T.led;
 // //this.tt = function() {let SI = this.SI; return new SI()};
 // //this.tt.SI = this.SI;
 // //this.T = this.tt();
 //

 /*

Possible version with old prototypal inheritance

 let symbolTable = {};

 let originalSymbol = {
     nud() {
         throw new Error('Undefined');
     },
     led() {
         throw new Error('Missing operator');
     }
 };

 function symbol(id, bp) {
     let symbol = symbolTable[id];
     bp = bp || 0;

     if (symbol) {
         if (bp >= symbol.lbp) {
             symbol.lbp = bp;
         }
     } else {
         symbol = function(value, arity) {
             super();
             this.value = value;
             this.arity = arity;
         }
         symbol.prototype = Object.create(originalSymbol);
         symbol.prototype.value = id;
         symbol.prototype.value = id;
         symbol.prototype.lbp = bp;

         symbolTable[id] = symbol;
     }

     return symbol;
 }

 symbol(':');
 symbol(';');
 symbol(',');
 symbol(')');
 symbol(']');
 symbol('}');

 symbol('(end)');
 symbol('(name)');

 let token;
 let tokenNr;

 function advance(id) {
     let arity;
     let object;
     let tok;
     let value;

     if (id && token.id !== id) {
         throw new Error(`Expected ${id}`);
     }

     if (tokenNr >= tokens.length) {
         token = symbolTable['(end)'];
         return;
     }

     tok = tokens[tokenNr];
     tokenNr++;
     value = tok.value;
     arity = tok.type;

     if (arity === 'name') {
         object = scope.find(value);
     } else if (arity === 'operator') {
         object = symbolTable[value];
         if (!object) {
             throw new Error('Unknown operator');
         }
     } else if (arity === 'string' || arity === 'number') {
         arity = 'literal';
         object = symbolTable['(literal)'];
     } else {
         throw new Error('Unexpected token');
     }

     token = Object.create(object);
     token.value = value;
     token.arity = arity;
     return token;
 }

  */
