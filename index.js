///client pt mongodb
///bot pt discord.js
/// --addcoll nume_materie adauga materia
/// --delcoll nume_materie sterge materia cand materia este stearsa datele merg intr-o colectie numita Gunoi
/// --cckcoll pentru a verifica materiile care exista
const {MongoClient} = require('mongodb');


const Discord = require('discord.js');

const bot = new Discord.Client();
const config = require('./config.json');
const token =  config.token;
const prefix = config.prefix;
const aprefix = config.aprefix;

async function main(nrOrd, message = null, channel = null, creator = null){
    const uri = "mongodb+srv://<user>:<password>@cluster0.ibtvk.mongodb.net/<db>?retryWrites=true&w=majority";
 

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
 
    try {
        // Connect to the MongoDB cluster
        await client.connect();
 
        // Make the appropriate DB calls
        // Modificari pt baza de date
        message = message.toLowerCase();
        if(nrOrd == -1){
            if(message.startsWith(`addcoll`)){
                message = message.slice(8);
                let qDrop = false, colectii = await client.db("Copiuta").listCollections().toArray();
                for(let i = 0; i < colectii.length && qDrop == false; ++i){
                        if(colectii[i].name == `${message}`)
                            qDrop = true;
                }   

                if(qDrop == true){
                    channel.send("Exista o colectie cu acelasi nume.");
                    /*
                    let data = await client.db("Copiuta").collection(`${message}`).find({}).toArray();
                    await client.db("Copiuta").dropCollection(`${message}`);
                    await client.db("Copiuta").createCollection(`${message}`);
                    channel.send(`A fost creata noua colectie`);
                    //daca exista date sterse le scriu din nou
                    if(data != null)
                        for(let i = 0; i < data.length; ++i){
                            await client.db("Copiuta").collection(`${message}`).insertOne(
                              {"materie":`${message}`, "formula":`${data[i].formula}`}
                            );

                        channel.send(`Datele existente anterior au fost salvate in noua colectie`);
                        }*/
                }
                else {
                    await client.db("Copiuta").createCollection(`${message}`);
                    channel.send(`A fost creata noua colectie`);
                }
            }
            else if(message.startsWith(`delcoll`)){
                message = message.slice(8);

                let qDrop = false, colectii = await client.db("Copiuta").listCollections().toArray();

                for(let i = 0; i < colectii.length && qDrop == false; ++i){
                        if(colectii[i].name == `${message}`)
                            qDrop = true;
                }   

                if(qDrop == false){
                    channel.send(`Nu exista aceasta colectie`);
                }
                else  {
                    let profile = await client.db("Copiuta").collection(`${message}`).find({}).toArray();
                 if(profile != null){
                        for(let i = 0; i < profile.length; ++i){
                        await client.db("Copiuta").collection(`Gunoi`).insertOne(
                             {"materie": `${profile[i].materie}`, "formula": `${profile[i].formula}`, "numeFormula": `${profile[i].numeFormula}`, "lastUpdateMadeBy":`${profile[i].lastUpdateMadeBy}`}
                        );
                     }
                    }
                    await client.db("Copiuta").dropCollection(`${message}`);
                    channel.send(`Colectia a fost stearsa`);
                }
            }
            else if(message == `cckcoll`){
                let data = await client.db("Copiuta").listCollections().toArray();
                for(let i = 0; i < data.length; ++i){
                    channel.send(data[i].name);
                }
            }
            else if(message == `delete`){
                await client.db("Copiuta").dropCollection('Gunoi');
                await client.db("Copiuta").createCollection(`Gunoi`);
                channel.send(`Gunoiul a fost aruncat!`);
            }
        }
        //comanda help
        else if(nrOrd == 0){
            channel.send(`Comenzile care pot fi folosite sunt: \n${prefix}help - pentru a vedea comenzile \n${prefix}add nume_materie nume_formula formula \n${prefix}up nume_materie nume_formula formula noua - pentru a schimba continutul unei materii\n${prefix}nume_materie nume_formula - pentru a afla formula cautata \n${prefix}all nume_materie - pentru a vedea toate formulele disponibile pentru acea formula(comanda este inceata si probabil va fi scoasa) \nNumele unei materii repr primele 3 litere din numele complet. De ex: rom - Romana, mat - Mate, spo - Sport`);
            if(channel == `311383202885271563`)
            channel.send(`Comenzile bonus sunt: \n${aprefix}addcoll nume_colectie - pentru a adauga o colectie noua \n${aprefix}delcoll nume_colectie - pentru a sterge o colectie \n${aprefix}cckcoll - pentru a vedea toate colectiile valabile(comanda este inceata) \n${aprefix}delete - pentru a sterge cosul de gunoi`);
        }
        //comanda de adaugare
        else if(nrOrd == 1){
            ///message va fi formula
            let i = 0, materie = '', nume_formula = '';
            while(message[i] != ' ' && i < message.length) ++i;
            materie = message.substr(0, i);
            message = message.substr(i+1);
            nume_formula = message;
            i = 0;
            while(message[i] != ' ' && i < message.length) ++i;
            nume_formula = nume_formula.substr(0, i);
            message = message.substr(i+1);
            ///verific daca exista materia
            let collections = await client.db("Copiuta").listCollections().toArray(), exist = false;
            for(let i = 0; i < collections.length && exist == false; ++i){
                if(materie == collections[i].name)
                    exist = true;
            }

            if(exist == false){
                channel.send(`Nu exista materia ${materie}`);
                return ;
            }
                
            ///verific daca exista formula
            let verif = await client.db("Copiuta").collection(`${materie}`).findOne(
                {materie: `${materie}`, numeFormula: `${nume_formula}`}
            );

            if(verif != null){
                channel.send(`Formula ${nume_formula} exista deja pentru materia ${materie}`);
                return ;
            }

            await client.db("Copiuta").collection(`${materie}`).insertOne(
                {"materie": `${materie}`, "formula":`${message}`, "numeFormula":`${nume_formula}`, "lastUpdateMadeBy":`${creator}`}
            );
            channel.send(`Formula ${nume_formula}: ${message} a fost adaugata cu succes pentru materia ${materie} de catre ${creator}`);
        }
        //comanda de afisare totalitate formule
        else if(nrOrd == 2){
            ///message va fi materia
            ///verific daca exista materia
            let collections = await client.db("Copiuta").listCollections().toArray(), exist = false;
            for(let i = 0; i < collections.length && exist == false; ++i){
                if(message == collections[i].name)
                    exist = true;
            }

            if(exist == false){
                channel.send(`Nu exista materia ${message}`);
                return ;
            }
            else {
                let data = await client.db("Copiuta").collection(`${message}`).find({}).toArray();
                channel.send(`Formulele pt materia ${message} sunt:`)
                for(let i = 0; i < data.length; ++i){
                    channel.send(`Nume Formula: ${data[i].numeFormula} Formula: ${data[i].formula}`);
                }
            }
        }
        ///comanda de afisare formula specifica
        else if(nrOrd == 3){
            //console.log(message);
            ///message va fi nume_formula
            let i = 0, materie = '';
            while(message[i] != ' ' && i < message.length) ++i;
            materie = message.substr(0, i);
            message = message.substr(i+1);
            
            ///verific daca exista materia

            let exist = false, colectii = await client.db("Copiuta").listCollections().toArray();
            for(let i = 0; i < colectii.length && exist == false; ++i){
                    if(colectii[i].name == materie)
                        exist = true;
            }   
            
            if(exist == false){
                channel.send(`Nu exista materia ${materie}`);
                return;
            }
            else {
                ///verific daca exista formula
                let data = await client.db("Copiuta").collection(`${materie}`).findOne(
                    {"numeFormula":`${message}`}
                );
            

                //daca exista formula o  afisez
                if(data != null)
                    channel.send(`Formula ${message} este ${data.formula}`);
                else channel.send(`Nu exista formula ${message} pentru materia ${materie}`);
            }
        }
        ///formula de update
        else if(nrOrd == 4){
            ///message va fi formula noua
            let i = 0, materie = '', nume_formula = '';
            while(message[i] != ' ' && i < message.length) ++i;
            materie = message.substr(0, i);
            nume_formula = message.substr(i+1);
            message = message.substr(i+1);
            
            i = 0;
            while(message[i] != ' ' && i < message.length) ++i;
            nume_formula = nume_formula.substr(0, i);
            message = message.substr(i+1);
            
            ///verific daca exista materia
            let exist = false, colectii = await client.db("Copiuta").listCollections().toArray();
            for(let i = 0; i < colectii.length && exist == false; ++i){
                    if(colectii[i].name == materie)
                        exist = true;
            }   

            if(exist == false){
                channel.send(`Nu exista materia ${materie}`);
                return;
            }
            else {
                ///verific daca exista formula
                let data = await client.db("Copiuta").collection(`${materie}`).findOne(
                    {"numeFormula":`${nume_formula}`}
                );
            
                //daca exista formula fac update-ul
                if(data != null){
                    await client.db("Copiuta").collection(`Gunoi`).insertOne(
                        {"materie": `${data.materie}`, "formula": `${data.formula}`, "numeFormula": `${data.numeFormula}`, "lastUpdateMadeBy": `${data.lastUpdateMadeBy}`}
                    );
                    await client.db("Copiuta").collection(`${materie}`).updateOne(
                        {"numeFormula": `${nume_formula}`},
                        {$set: {"formula": `${message}`, "lastUpdateMadeBy": `${creator}`}}
                    );
                    channel.send(`Formula ${nume_formula} a fost schimbata cu succes!`);
                }
                else channel.send(`Nu exista formula ${nume_formula} pentru materia ${materie}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

bot.once(`ready`, () => {
    console.log("Ready!");
});

bot.on("message", (message) => {
    //console.log(message.author, message.content);
    if(message.author.bot)
        return;
    else if(message.author == `311383202885271563` && message.content.startsWith(`${aprefix}`)){
        main(-1, message.content.slice(2), message.author);
    }
    else if(message.content == `${prefix}help`)
        main(0, message.content, message.author);
    else if(message.content.startsWith(`${prefix}add`))
        main(1, message.content.slice(6), message.channel, message.author.tag);
    else if(message.content.startsWith(`${prefix}all`))
        main(2, message.content.slice(6), message.author);
    else if(message.cleanContent.startsWith(`${prefix}up`))
        main(4, message.content.slice(5), message.channel);
    else if(message.content.startsWith(`${prefix}`))
        main(3, message.content.slice(2), message.channel), message.author.tag;
})

bot.login(token);
