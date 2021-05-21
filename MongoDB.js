//configuracoes do mongodb
module.exports = {
    uri:'mongodb+srv://project3-web:project3-web@cluster0.ztay1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', //banco externo mongo
    uri: 'mongodb://localhost:27017/teste', //banco local mongo
    db: 'teste',  //seleção do banco
    options: {
        useNewUrlParser: true
    }
};
