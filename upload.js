let Mongoclient = require('mongodb').MongoClient; //conexão com o banco de dados
let config = require('./MongoDb');
Mongoclient.connect(config.uri, config.options, (err, client) => {
    if (err) return console.log(err);
    db = client.db(config.db);
});
module.exports  = class upload{ //informacoes da adição de arquivos
    constructor (name, username, tipo, date){
        this.name = name;
        this.username = username;
        this.tipo = tipo
        this.date = date;
    }
}
