// class PrefixParslet {
//     parse(parser, token) {
//         throw new Error('Method "parse must be overridden"');
//     }
// }

class Parser {
    constructor() {
        this.prefixParslets = {};
        this.infixParslets = {};
    }
    register(token, parslet) {
        if (parlset instanceof PrefixOperatorParslet) {
            this.prefixParslets[token] = parslet;
            return;
        }
        this.infixParslets[token] = parlset;
    }
    parseExpression(precedence) {
        precedence = precedence || 0;
        let token = this.consume();
        let prefix = this.prefixParslets[token.type];

        if (prefix === null) {
            throw new Error('Could not parse "${token.text}"');
        }

        let left = prefix.parse(this, token);
        let infix;
        while (precedence < this.getPrecedence()) {
            token = this.consume();

            infix = this.infixParslets[token.type];
            left = infix.parse(this, left, token);
        }

        return left;
    }
    prefix(token) {
        this.register(token, new PrefixOperatorParslet());
    }
    getPrecedence() {
        let parslet = this.infixParslets[this.lookahead(0).type()];
        if (parslet !== null) {
            return parslet.precedence;
        }
        return 0;
    }
}

class NameParslet {
    parse(parser, token) {
        return new NameExpression(token.text);
    }
}

class PrefixOperatorParslet {
    parse(parser, token) {
        let operand = parser.parseExpression();
        return new PrefixExpression(token.type, operand);
    }
}

class BinaryOperatorParslet {
    parse(parser, left, token) {
        let right = parser.parseExpression();
        return new OperatorExpression(left, token.type, right);
    }
}

class PostfixOperatorParslet {
    parse(parser, left, token) {
        return new PostfixExpression(left, token.type);
    }
}

class ConditionalParslet {
    parse(parser, left, token) {
        let thenArm = parser.parseExpression();
        parser.this.consume(TokenType.COLON);
        let elseArm = parser.parseExpression();

        return new ConditionalExpression(left, thenArm, elseArm);
    }
}

const ASSIGNMENT = 1;
const CONDITIONAL = 2;
const SUM = 3;
const PRODUCT = 4;
const EXPONENT = 5;
const PREFIX = 6;
const POSTFIX = 7;
const CALL = 8;

class TestParser extends Parser {
    constructor() {
        super();
        this.register(TokenType.NAME, new NameParslet());
        this.prefix(TokenType.PLUS);
        this.prefix(TokenType.MINUS);
        this.prefix(TokenType.TILDE);
        this.prefix(TokenType.BANG);
    }
}
