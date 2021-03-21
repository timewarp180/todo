const mysql = require("mysql"),
      express = require("express"),
      app = express(),
      bodyParser = require("body-parser"),
      http = require("http"),
      server = http.createServer(app),
      bcrypt = require('bcrypt')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}))
app.set('view engine','ejs')
app.use( express.static("public"));




var loggedIn = false
var user
var db = mysql.createPool({
        connectionLimit: 10,        
        host:"localhost",
        user:"root",
        password:"",
        database:"tasks"
})

db.getConnection((err)=>{
    if(err){
        throw err
    }else{
        console.log("Connected to Database!")
    }
})

var generateCode = () => {
    let generate = "";
    const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 32;
    for ( var i = 0; i < length; i++ ) {
        generate += char.charAt(Math.floor(Math.random() * char.length));
    }
    return generate;
}

bcrypt.genSalt(11).then(salt =>{
    bcrypt.hash('password', salt).then(hash =>{
        bcrypt.compare('password',hash).then(res=>null)
    })
})  

app.get("/", (req,res) =>{
    res.render("index");
})

app.get("/register", (req,res) =>{
    res.render("create");
})

app.get("/task",(req,res) =>{
    res.render("createTask",{data:user,loggedIn:loggedIn})
})

app.get("/edit",(req,res) =>{
    res.render("editTask",{data:user,loggedIn:loggedIn})
})

app.get("/home",(req,res) =>{

    db.query("select * from task where accountUuid = ?",[user[0].uuid],(err,result)=>{
        if(err){
            throw err
        }else{
            res.render("home",{data:user,tasks: result,loggedIn:loggedIn})
        }
    })

})

app.post("/create", (req,res) =>{
    var data = req.body;
    if(data.password === data.password2){

        bcrypt.genSalt(11).then(salt =>{
            bcrypt.hash(data.password, salt).then(hash =>{
                db.query("INSERT INTO accounts (uuid,username,password,email) VALUES (?,?,?,?)",[generateCode(),data.username,hash,data.email],(err,result)=>{
                    if(err){
                        throw err
                    }else{
                       res.render("index",{status:"account created successfully!"});
                    }
                })
            })
        })  
        
    }else{
        res.render("create", {err: "Passwords do not match!"})
    }
})

app.post("/login", (req,res)=>{
    var data = req.body

    db.query("SELECT username,password,uuid FROM accounts WHERE username = ?",[data.username],(err,results)=>{
        if(err){
            throw err
        }else{
            if(results[0].username === data.username){
                bcrypt.compare(data.password,results[0].password,(err,success)=>{
                    if(success === true){
                        loggedIn = true
                        user=results
                        res.redirect("/home")
                    }else{
                        res.render("index",{err:"Password is incorrect!"})
                    }
                })
            }else{
                res.render("index",{err:"Username not found!"})
            }
        }
    })
})

app.post("/createTask", (req,res)=>{
    var data = req.body
    var date = new Date().toJSON().slice(0, 19).replace(/[-T]/g, ':')
    db.query("insert into task (accountUuid,task,description,status,createdAt) values (?,?,?,?,?)",[data.uuid,data.task,data.desc,"pending",date],(err)=>{
        if(err){
            throw err
        }else{
            res.redirect("/home")
        }
    })
})




app.get("/deleteTask",(req,res)=>{
    db.query("delete from task where id = ?",[req.query.id],(err)=>{
        if(err){
            throw err
        }else{
            res.redirect("/home")
        }
    })
})

app.get("/updateTask",(req,res)=>{
    var date = new Date().toJSON().slice(0, 19).replace(/[-T]/g, ':')
    db.query("update task set status = ?, completedAt = ? where id = ?",['completed',date,req.query.id],(err)=>{
        if(err){
            throw err
        }else{
            res.redirect("/home")
        }
    })
})

app.get("/logout",(req,res)=>{
    loggedIn = false
    user = null
    res.redirect('/')
})


server.listen(8080, () => console.log("8080"))
