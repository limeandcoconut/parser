/* eslint-disable require-jsdoc */
function lex(input) {
    let tokens = []
    let char
    let i = 0

    let advance = () => {
        i++
        char = input[i]
        return char
    }

    let addToken = (type, value) => {
        tokens.push({
            type,
            value,
        })
    }

    while (i < input.length) {
        char = input[i]

        if (isWhiteSpace(char)) {
            advance()
        } else if (isOperator(char)) {
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
        } else if (isIdentifier(char)) {
            let identifier = char
            while (isIdentifier(advance())) {
                identifier += char
            }
            addToken('identifier', identifier)
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

function isDigit(c) {
    return /[0-9]/.test(c)
}

function isWhiteSpace(c) {
    return /\s/.test(c)
}

function isIdentifier(c) {
    return typeof c === 'string' && !isOperator(c) && !isDigit(c) && !isWhiteSpace(c)
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
        sym.value = token.value
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
            throw new Error(`Unexpected token: ${tok.type}`)
        }

        let left = tok.nud(tok)

        while (rbp < token().lbp) {
            tok = token()
            advance()
            if (!tok.led) {
                throw new Error(`Unexpected token: ${tok.type}`)
            }
            left = tok.led(left)
        }
        return left
    }

    function infix(id, lbp, rbp, led) {
        rbp = rbp || lbp
        led = led || function(left) {
            return {
                type: id,
                left,
                right: expression(rbp),
            }
        }
        symbol(id, null, lbp, led)
    }

    function prefix(id, rbp) {
        symbol(id, () => {
            return {
                type: id,
                right: expression(rbp),
            }
        })
    }

    prefix('-', 7)
    infix('^', 6, 5)
    infix('*', 4)
    infix('/', 4)
    infix('%', 4)
    infix('+', 3)
    infix('-', 3)

    symbol(',')
    symbol(')')
    symbol('(end)')

    symbol('(', () => {
        let value = expression(2)
        if (token().type !== ')') {
            throw new Error('Expected closing parenthesis ")"')
        }
        advance()
        return value
    })

    // symbol('p', (thisToken) => {
    //     let left = expression(2)
    //     let endToken = token()
    //     if (endToken.type === 'u') {

    //         return {
    //             type: thisToken.id + endToken.id,
    //             left,
    //             right: expression(rbp),
    //         }
    //     } else {

    //     }
    // })

    symbol('number', number => number)

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

    infix('=', 1, 2, (left) => {
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

    let parseTree = []
    while (token().type !== '(end)') {
        parseTree.push(expression(0))
    }
    return parseTree
}

/*

evaluator

*/
let you

function evaluate(parseTree) {

    let operators = {
        '+': (a, b) => a + b,
        '-': (a, b) => (typeof b === 'undefined') ? -a : a - b,
        '*': (a, b) => a * b,
        '/': (a, b) => a / b,
        '%': (a, b) => a % b,
        '^': (a, b) => Math.pow(a, b),
    }

    let variables = {
        pi: Math.PI,
        e: Math.E,
    }

    you = {
        inventory: {},
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
        get: function(item) {
            console.log(item)
            you.inventory[item.type] = item
        },
    }

    let args = {}

    function parseNode(node) {
        if (node.type === 'number') {
            return node.value
        } else if (operators[node.type]) {
            if (node.left) {
                return operators[node.type](parseNode(node.left), parseNode(node.right))
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

function calculate(input) {
    try {
        let tokens = lex(input)
        console.log(tokens)
        let parseTree = parse(tokens)
        console.log()
        console.log()
        console.log(parseTree)
        let output = evaluate(parseTree)
        return output
    } catch (e) {
        return e
    }
}

console.log(calculate(`
(1 + 3)
`
))

// console.log(calculate(`
// thing = 4
// get(thing)
// `
// ))

console.log(you.inventory)
// console.log(calculate(`
//     sixty = 60
//     secondsInMin = sixty
//     minInHour = secondsInMin
//     hoursInDay = 24
//     daysInWeek = 7
//     minsInWeek(weeks) = weeks * minInHour * hoursInDay * daysInWeek
//     minsInWeek(4)

//     minsInWeek(1) / 15

//     0
//     0

//     100^0
//     `
// ))
