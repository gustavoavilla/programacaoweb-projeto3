let express = require('express'),
    app = express(),
    path = require('path'),
    http = require('http'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    multer  = require('multer');
var upname,
    aux = 0;
let Mongoclient = require('mongodb').MongoClient;//conexão com o banco de dados
let config = require('./MongoDb');  //configuracoes do mongo/heroku
Mongoclient.connect(config.uri, config.options, (err, client) => {
    if (err) return console.log(err);
    db = client.db(config.db);
    let porta = process.env.PORT || 3000; //porta para heroku ou 3000 para local
    http.createServer(app).listen(porta, () => {
        console.log('Servidor na porta ' + porta + '...');
    });
});
app.use('/style', express.static(__dirname + '/style'));
app.use('/images', express.static(__dirname + '/images'));
app.use('/public', express.static(__dirname + '/public'));
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ //responsavel pela verificacao da sessão/cookies
    secret: 'Sessao',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false}
}));
app.get('/', (req, res) => { //volta para o menu principal
    if (req.session && req.session.username) {
        res.redirect('/tela_busca');
        return;
    } else {
        res.render("index.ejs"); //se nao tiver cookie volta para o menu inicial
    }
});
app.route('/cadastro_usuario')  //responsavel pelo cadastro do usuario no db
.get((req, res) => {
    if(req.cookies && req.cookies.data && req.cookies.mensagem){
        data_aux = req.cookies.data;
        mensagem_aux = req.cookies.mensagem;
        res.clearCookie('data');
        res.clearCookie('mensagem');
        res.render("cadastro_usuario.ejs", { data: data_aux, mensagem: mensagem_aux });

    }else{
        res.render("cadastro_usuario.ejs", { data: "", mensagem: "" });
    }
})
.post((req, res) => {
    let dados_preenchidos = req.body;
    res.render("cadastro_usuario.ejs", { data: dados_preenchidos, mensagem: "" });
});
app.post('/get_usuario', (req, res) => { //verificacoes de usuario
    let User = new require('./user'),
        user_info = new User(req.body),
        mensagem  = User.verificaCampos(user_info);
        console.log(mensagem);
        if(mensagem==="right"){
            db.collection('user').insertOne(user_info, (err, result) => {
                if (err){
                    res.cookie('data', user_info);
                    res.cookie('mensagem', "Nome de usuário ou senha existentes!");
                    res.redirect('/cadastro_usuario'); //se for existentes
                    return console.log(err);
                }else{
                    console.log(result);
                    res.redirect('/login');
                }
            });
        }else{
            res.cookie('data', req.body);
            res.cookie('mensagem', mensagem);
            res.redirect('/cadastro_usuario');
        }
});
app.get("/login", (req, res, next) =>{
    if (req.cookies && req.cookies.loginfail) {
        res.clearCookie('loginfail');
        res.render('tela_login', {message: "Usuário ou senha incorretas!"});
    }else{                          //se dados forem incorretos
        res.render('tela_login', { message: "" });
    }

});
app.post('/login', function(req, res, next){  //tela de login
    let username = req.body.username,
        password = req.body.password;
    db.collection('user').findOne({username: username, password : password}, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send();
        }else if(!result) {
            res.cookie('loginfail');
            res.redirect('/login');
        }else{
            req.session.username = result.username;
            req.session.aux = 0;
            res.redirect('/tela_busca');
            return ;
        }
    });
});
app.get("/logout", (req, res, next) => {
    req.session.destroy();    //se selecionar logout, apaga o cookie
    res.redirect('/login');
});
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/upload')
    },
    filename: function (req, file, cb) {
        req.session.upname = file.originalname;
        cb(null, file.originalname)
    }
  })
var upload = multer({ storage: storage }) //responsavel pelo upload
app.post('/files', upload.single('uploadfile'), function(req, res, next)
{
    if (req.session && req.session.username) {
        console.log(req.file);
        if (req.file == null)
        {
            req.session.aux = 2;
            res.redirect('/tela_publicacao');
        }
        else {
            let upload = new require('./upload'),
                upload_info,
                tipo,
                upname = req.session.upname,
                privacidade = req.body.privacidade,
                date = new Date();
            if(!privacidade) privacidade = "Private";
            tipo = upname.substring(upname.lastIndexOf(".") + 1, upname.length);
            upname = upname.substring(0, upname.lastIndexOf("."));
            upload_info = new upload(upname, req.session.username, tipo, privacidade, date)
            db.collection('upload').insertOne(upload_info, (err, result) =>
            {
                if (err) {
                    req.session.aux = 1;
                    res.redirect('/tela_publicacao');
                    return console.log(err);
                }
                else {
                    console.log(result);
                    res.redirect('/tela_busca');
                }
            });
        }
    }
});
app.get('/tela_publicacao', (req, res) => //tela de publicacao
{
    if (req.session && req.session.username) {
        if (req.session.aux === 1){
            req.session.aux = 0;
            res.render('tela_publicacao.ejs', { username: req.session.username, message: "Existem arquivos com o mesmo nome"});
        }
        else if (req.session.aux === 2){
            req.session.aux = 0;
            res.render('tela_publicacao.ejs', { username: req.session.username, message: "Nenhum arquivo selecionado"});
        }
        else{
            res.render('tela_publicacao.ejs', { username: req.session.username, message: ""});
        }
        return;
    } else {
        res.redirect('/login');
    }
});
app.get('/tela_busca', (req, res, next) =>    //tela de busca
{
    if (req.session && req.session.username){
        db.collection('upload').find({ username: req.session.username }).toArray((err, results) => {
            console.log(results);
            res.render('tela_busca.ejs', { data: results, username: req.session.username, message: ""});
        });
        return ;
    }else{
        res.redirect('/login');
    }
});
app.post('/busca', (req, res) =>  //busca de conteudo
{
    if (req.session && req.session.username) {
        let data = req.body;
        if (data.busca != "") {
            db.collection('upload').find({ name: data.busca }).toArray((err, results) => {
                let messageBusca;
                if (results == "") messageBusca = "Não encontrado.";
                else messageBusca = "";
                if (!err) res.render('tela_busca.ejs', { data: results, username: req.session.username, message: messageBusca });
                else console.log("ERRO");
            });
        }
        else res.redirect('/tela_busca');
    }
});


app.get('/livesearch_private/:busca_parametro', (req, res) => {
    if (req.session && req.session.username) {
        let busca = req.params.busca_parametro;
        let stringJson = '[';
        db.collection('upload').find({username: req.session.username , name: { $regex: busca, $options: 'i' }}).toArray((err, results) => {
            if (results != null) {
                results.forEach((result, index) => {
                    if(index==0){
                        stringJson += '{"name":"' + result.name + '"}';
                    }else{
                        stringJson += ', {"name":"' + result.name + '"}';
                    }
                });
                stringJson += ']';
            }
            console.log(stringJson);
            res.end(stringJson);
        });
    }
});
