/* eslint-disable require-jsdoc */
const chalk = require('chalk')

let dictionary = {
    THING: 'noun',
    rock: 'noun',
    screw: 'noun',

    the: 'article',

    pick: 'verb',
    get: 'verb',

    quickly: 'adverb',

    red: 'adjective',

    up: 'preposition-adverb-postfix',

    with: 'preposition-phrase-infix',
}

// console.log(dictionary)

function lex(input) {
    let tokens = []
    let char
    let i = 0

    let advance = () => {
        i++
        char = input[i]
        return char
    }

    let addToken = (type, word) => {
        tokens.push({
            type,
            word,
        })
    }

    while (i < input.length) {
        char = input[i]

        if (isWhiteSpace(char)) {
            advance()
        } else if (isPunctuation(char)) {
            addToken(char)
            advance()
        } else if (isDigit(char)) {
            let num = char
            while (isDigit(advance())) {
                num += char
            }
            if (char === '.') {
                do {
                    num += char
                } while (isDigit(advance()))
            }
            num = parseFloat(num)
            if (!isFinite(num)) {
                throw new RangeError('Number is too large or too small for a 64-bit double.')
            }
            addToken('number', num)
        } else if (isLetter(char)) {
            let word = char

            while (isLetter(advance())) {
                word += char
            }

            let type = dictionary[word]

            if (typeof type === 'undefined') {
                throw new Error(`I'm sorry, I don't know the word ${word}`)
            } else if (type !== 'article') {
                addToken(type, word)
            }
        } else {
            throw new Error(`Unrecognized token "${char}"`)
        }

    }

    addToken('(end)')
    return tokens
}

function isOperator(c) {
    return /[+\-*\/\^%=(),]/.test(c)
}

function isPunctuation(c) {
    return /[.]/.test(c)
}

function isDigit(c) {
    return /[0-9]/.test(c)
}

function isWhiteSpace(c) {
    return /\s/.test(c)
}

function isLetter(c) {
    return /[A-z]/.test(c)
    // return typeof c === 'string' && !isOperator(c) && !isDigit(c) && !isWhiteSpace(c) && !isPunctuation(c)
}

/*
parser
*/

function parse(tokens) {

    let symbols = {}
    function symbol(id, nud, lbp, led) {
        let sym = symbols[id] || {}
        symbols[id] = {
            lbp: sym.lbp || lbp,
            nud: sym.nud || nud,
            led: sym.led || led,
        }
    }
    function interpretToken(token) {
        let sym = Object.create(symbols[token.type])
        sym.type = token.type
        sym.word = token.word
        return sym
    }

    let i = 0

    function token() {
        return interpretToken(tokens[i])
    }

    function advance() {
        i++
        return token()
    }

    function expression(rbp) {
        let tok = token()
        advance()

        if (!tok.nud) {
            throw new Error(`Unexpected token1: ${tok.type}`)
        }
        let left = tok.nud(tok)

        while (rbp < token().lbp) {
            tok = token()
            advance()
            if (!tok.led) {
                throw new Error(`Unexpected token:2 ${tok.type}`)
            }
            left = tok.led(left)
        }
        return left
    }

    function infix(id, rbp, lbp, led) {
        lbp = lbp || rbp
        led = led || function(left) {
            return {
                type: id,
                word: this.word,
                direct: left,
                indirect: expression(rbp),
            }
        }
        symbol(id, null, lbp, led)
    }

    function prefix(id, rbp, nud) {
        nud = nud || function() {
            return {
                type: id,
                word: this.word,
                object: expression(rbp),
            }
        }
        symbol(id, nud)
    }

    function postfix(id, lbp, led) {
        led = led || function(left) {
            return {
                type: id,
                word: this.word,
                object: left,
            }
        }
        symbol(id, null, lbp, led)
    }

    function mixfix(id, rbp, lbp, led) {
        led = led || function(left) {
            return {
                type: id,
                word: this.word,
                object: left,
            }
        }
        let nud = function() {
            return {
                type: id,
                word: this.word,
                object: expression(rbp),
            }
        }
        symbol(id, nud, lbp, led)
    }

    function verb(id, rbp) {
        let nud = function() {
            let tok = token()
            if (tok.type === 'preposition-adverb-postfix') {
                advance()
                return tok.led({
                    type: id,
                    word: this.word,
                    object: expression(rbp),
                })
            }

            return {
                type: id,
                word: this.word,
                object: expression(rbp),
            }
        }
        symbol(id, nud)
    }

    verb('verb', 3)

    symbol('noun', noun => noun)
    prefix('adjective', 7)

    symbol('preposition-adverb-postfix', null, 3, function(left) {
        return {
            type: 'preposition-adverb-postfix',
            word: this.word,
            object: left,
        }
    })

    infix('preposition-phrase-infix', 7, 4, function(left) {
        let parent
        let top = left
        while (!/(noun|adjective)/.test(left.type)) {
            parent = left
            left = left.object

            if (typeof left === 'undefined') {
                throw new Error('Expected a lefthand noun.')
            }
        }

        let self = {
            type: 'preposition-phrase-infix',
            word: this.word,
            left: left,
            right: expression(7),
        }

        if (!parent) {
            return self
        }

        parent.object = self
        return top

    })

    mixfix('adverb', 7, 3)

    symbol('.', () => {
        if (token().type !== '(end)') {
            return expression(0)
        }
    })

    symbol('(end)')

    symbol('number', number => number)

    /* eslint-disable no-lone-blocks */
    {
        /*
        postfix('++', 7, (left) => {
            // if (!/number/.test(left.type)) {
            //     throw new Error('Expected number preceding ++')
            // }
            return {
                type: '++',
                left: left,
            }
        })
        symbol('(', () => {
            let word = expression(2)
            if (token().type !== ')') {
                throw new Error('Expected closing parenthesis ")"')
            }
            advance()
            return value
        })

        symbol('identifier', (name) => {
            if (token().type === '(') {
                let args = []
                if (tokens[i + 1].type === ')') {
                    advance()
                } else {
                    do {
                        advance()
                        args.push(expression(2))
                    } while (token().type === ',')
                    if (token().type !== ')') {
                        throw new Error('Expected a closing parenthesis ")"')
                    }
                }
                advance()
                return {
                    type: 'call',
                    args,
                    name: name.value,
                }
            }
            return name
        })

        infix('=', 2, 1, (left) => {
            if (left.type === 'call') {
                for (let i = 0; i < left.args.length; i++) {
                    if (left.args[i].type !== 'identifier') {
                        throw new Error(`Invalid argument name "${left.args[i]}"`)
                    }
                }
                return {
                    type: 'function',
                    name: left.name,
                    args: left.args,
                    value: expression(2),
                }
            } else if (left.type === 'identifier') {
                return {
                    type: 'assign',
                    name: left.value,
                    value: expression(2),
                }
            }
            throw new Error('Invalid lvalue')

        })
        */
    }

    let parseTree = []
    while (token().type !== '(end)') {
        parseTree.push(expression(0))
    }
    return parseTree
}

/*
evaluator
*/

function evaluate(parseTree) {

    let operators = {
        '+': (a, b) => a + b,
        '-': (a, b) => (typeof b === 'undefined') ? -a : a - b,
        '*': (a, b) => a * b,
        '/': (a, b) => a / b,
        '%': (a, b) => a % b,
        '^': (a, b) => Math.pow(a, b),
        '++': (a) => a + 1,
    }

    let variables = {
        pi: Math.PI,
        e: Math.E,
    }

    let functions = {
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan, // WAT?
        asin: Math.asin,
        acos: Math.acos,
        atan: Math.atan,
        abs: Math.abs,
        round: Math.round,
        ceil: Math.ceil,
        floor: Math.floor,
        log: Math.log,
        exp: Math.exp,
        sqrt: Math.sqrt,
        max: Math.max,
        min: Math.min,
        random: Math.random,
        pow: Math.pow,
    }

    let args = {}

    function parseNode(node) {
        if (node.type === 'number') {
            return node.value
        } else if (operators[node.type]) {
            if (node.left && node.right) {
                return operators[node.type](parseNode(node.left), parseNode(node.right))
            } else if (node.left) {
                return operators[node.type](parseNode(node.left))
            }
            return operators[node.type](parseNode(node.right))
        } else if (node.type === 'identifier') {
            let value = Object.prototype.hasOwnProperty.call(args, node.value) ?
                args[node.value] :
                variables[node.value]

            if (typeof value === 'undefined') {
                throw new Error(`${node.value} is undefined`)
            }
            return value
        } else if (node.type === 'assign') {
            variables[node.name] = parseNode(node.value)
        } else if (node.type === 'call') {
            for (let i = 0; i < node.args.length; i++) {
                node.args[i] = parseNode(node.args[i])
            }

            // console.log(functions)
            // console.log(node)
            return functions[node.name].apply(null, node.args)
        } else if (node.type === 'function') {
            // Must not an be arrow function so that 'arguments' is generated.
            functions[node.name] = function() {
                for (var i = 0; i < node.args.length; i++) {
                    args[node.args[i].value] = arguments[i]
                }
                var ret = parseNode(node.value)
                args = {}
                return ret
            }
        }
    }

    let output = ''
    for (let i = 0; i < parseTree.length; i++) {
        let value = parseNode(parseTree[i])
        if (typeof value !== 'undefined') {
            output += value + '\n'
        }
    }
    return output
}

/*

calculate

*/

function prettyLog(object, short = 4) {
    object = JSON.stringify(object, null, short)
    object = object.replace(/("type":\s*")([\w-]+)(")/g, `$1${chalk.green('$2')}$3`)
    object = object.replace(/("value":\s*")([\w-]+)(")/g, `$1${chalk.red('$2')}$3`)
    // object = object.replace(/("(left)|(right)":\s*{)(.*)(})/g, `$1\n\t$4\n$5`)
    // object = object.replace(/("right":\s*{)([^}]*)(})/g, `$1\n\t$2\n$3`)
    object = object.replace(/(},)({)/g, `$1\n $2`)
    console.log(object)
}

function calculate(input) {
    try {
        let tokens = lex(input)
        console.log(tokens)
        console.log()
        let parseTree = parse(tokens)
        console.log()
        prettyLog(parseTree)
        // console.log()
        // let output = evaluate(parseTree)
        // return output
    } catch (e) {
        return e
    }
}

// pick the rock up quickly with the screw.
let error = calculate(`

pick the rock quickly up with the red THING.

`

)

if (error) {
    console.log(error)
}
