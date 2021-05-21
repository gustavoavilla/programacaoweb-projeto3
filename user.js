let Mongoclient = require('mongodb').MongoClient; //conexão com o banco de dados
let config = require('./MongoDb');
Mongoclient.connect(config.uri, config.options, (err, client) => {
    if (err) return console.log(err);
    db = client.db(config.db);
    db.collection('user').createIndex({ username: 1 }, { unique: true });
    db.collection('user').createIndex({email: 1 },{ unique: true});
});
module.exports  = class User{
    constructor(data) {
        this.username = data.username;
        this.email = data.email;
        this.password = data.password;
    }
    static verificaCampos(User){  //veriica os campos de username, email e senha
        if(User.username === ""){
            return "Preencha o usuário";
        }
        if (User.email === "") {
            return "Preencha o e-mail";
        }
        if (User.password === "") {
            return "Preencha a senha";
        }
        return "right";
    }
}
