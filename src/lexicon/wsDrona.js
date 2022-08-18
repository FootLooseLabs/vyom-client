const AtomLexeme = require("atom").Lexeme;

class DronaHmiRequest extends AtomLexeme {

    static schema = {
        interface: null,
        request: {},
        token: {},
        operator: {},
        sender: {}
    }

    static inflection(_info) {
        var auth = false;
        try {
            console.log("Inflecting Lexeme info = ", _info);
            var infoJson = JSON.parse(_info);
            auth = true;
        } catch (e) {
            console.log("Error: inflecting DronaHmiRequest - ", e);
            return auth;
        }

        if(auth){
            return infoJson;
        }
        return auth;
    }
}

class DronaHmiResponse extends AtomLexeme {
    static schema = {
        label: "",
        data: null,
        status: null,
        error: null,
        message: ""
    };
}

export { DronaHmiRequest, DronaHmiResponse };