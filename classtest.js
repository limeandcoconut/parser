class Foo {
    nud() {}
    led() {}
}

class Bar {
    nud() {}
    led() {}
}

let key = {
    a: Foo,
    b: Bar,
};

function baz(k) {
    return class extends key[k] {};
}

console.log(baz('a'));
console.log(baz('b'));
