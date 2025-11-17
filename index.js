const express = require('express')
const bodyParse = require('body-parser')
const cors = require("cors")
const mysql = require("promise-mysql")
const app = express()

app.use(bodyParse.urlencoded({
    extended: true
}))
app.use(bodyParse.json({
    inflate:true
}))
app.use(cors({
    methods:"*",
    origin:"*",
    credentials:true,
}))

const conn = async () =>{
    return await mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"psychpath"
    });
}

async function updateTally(id,survey){
    save_rate = (await conn()).query(`UPDATE tbl_pre_survey SET ${survey} = ${survey} + 1 WHERE question_id = ${id}`)
}

async function updateTallyPost(id,survey){
    save_rate = (await conn()).query(`UPDATE tbl_post_survey SET ${survey} = ${survey} + 1 WHERE question_id = ${id}`)
}

app.post("/api/registration",async (req,res)=>{
    addAccount = (await conn()).query(
        `INSERT INTO tbl_account (id,acc_username,acc_password,acc_name,acc_age,acc_section,acc_gender) `+
        `VALUES(null,'${req.body.username}','${req.body.password}','${req.body.name}','${req.body.age}','${req.body.section}','${req.body.gender}')`);

    return res.json({code:200,message:"Accepted"})
})

app.post("/api/login",async (req,res)=>{
    loginAccount = (await conn()).query(`SELECT * FROM tbl_account WHERE 
        acc_username LIKE '${req.body.username}' AND 
        acc_password LIKE '${req.body.password}'`)
    account = await loginAccount

    if(account.length > 0 ){
        return res.json({code:200,message:"Accepted!",id:account[0].id});
    }else{
        return res.json({code:500,message:"Rejected!"});
    }
})

app.post("/api/level/one/save",async (req,res)=>{
    find = (await conn()).query(`SELECT * FROM tbl_lvl_one WHERE acc_id = ${req.body.id}`)
    length = await find
    if(length.length > 0){
        update= (await conn()).query(`
            UPDATE tbl_lvl_one SET res_clinical = '${Math.round((req.body.count.A/18) * 50)}',
            res_industrial = '${Math.round((req.body.count.B/18) * 50)}',
            res_educational = '${Math.round((req.body.count.C/18) * 50)}' WHERE acc_id = '${req.body.id}'
            `);
    }else{
        save = (await conn()).query(`INSERT INTO tbl_lvl_one (id,acc_id,res_clinical,res_industrial,res_educational	) 
        VALUES(null,'${req.body.id}','${Math.round((req.body.count.A/18) * 50)}','${Math.round((req.body.count.B/18) * 50)}','${Math.round((req.body.count.C/18) * 50)}')`);
    }
    return res.json({code:200,message:"Accepted!"})
})

app.post("/api/level/two/save",async(req,res)=>{
    find = (await conn()).query(`SELECT * FROM tbl_lvl_two WHERE acc_id = ${req.body.id}`)
    length = await find
    if(length.length > 0){
        update = (await conn()).query(`UPDATE tbl_lvl_two SET res_clinical = '${Math.round((req.body.Clinical/5) * 50)}',
        res_educational = '${Math.round((req.body.Educational/5) * 50)}',
        res_industrial = '${Math.round((req.body.Industrial/5) * 50)}' WHERE acc_id = ${req.body.id}`)
    }else{
        save = (await conn()).query(`INSERT INTO tbl_lvl_two (id,acc_id,res_clinical,res_educational,res_industrial) 
        VALUES(null,'${req.body.id}','${Math.round((req.body.Clinical/5) * 50)}','${Math.round((req.body.Educational/5) * 50)}','${Math.round((req.body.Industrial/5) * 50)}')`)
    }
    return res.json({code:200,message:"Accepted!"})
})

app.post("/api/survey/pre",async (req,res)=>{
    const data = req.body.data
    var percentage_set_A = 0;
    var percentage_set_B = 0;
    var percentage_set_C = 0;
    
    for (let index = 0; index < data.length; index++) {
        if(data[index].rate == '1'){
            const survey = 'survey_rate_1';
            await updateTally(data[index].id,survey)
        }
        if(data[index].rate == '2'){
            const survey = 'survey_rate_2';
            await updateTally(data[index].id,survey)
        }
        if(data[index].rate == '3'){
            const survey = 'survey_rate_3';
            await updateTally(data[index].id,survey)
        }
        if(data[index].rate == '4'){
            const survey = 'survey_rate_4';
            await updateTally(data[index].id,survey)
        }
    }

    /* GETTING PERCENTAGE PER SET */
    for (let index = 0; index < req.body.data.length; index++) {
        if(data[index].key == 'A'){
            percentage_set_A = percentage_set_A + Number.parseInt(data[index].score)
        }
        if(data[index].key == 'B'){
            percentage_set_B = percentage_set_B + Number.parseInt(data[index].score)
        }
        if(data[index].key == 'C'){
            percentage_set_C = percentage_set_C + Number.parseInt(data[index].score)
        }
    }
    find_interest = (await conn()).query(`SELECT * FROM tbl_career_interest WHERE acc_id = ${req.body.id}`)
    find_attitude = (await conn()).query(`SELECT * FROM tbl_career_attitude WHERE acc_id = ${req.body.id}`)
    find_skills = (await conn()).query(`SELECT * FROM tbl_career_skills WHERE acc_id = ${req.body.id}`)
    length_i = await find_interest
    length_a = await find_attitude
    length_s = await find_skills
    if(length_i.length > 0){
        update = (await conn()).query(`UPDATE tbl_career_interest SET score = '${Math.round(percentage_set_A/4)}' 
        WHERE acc_id = '${req.body.id}'`)
    }else{
        save_interest = (await conn()).query(`INSERT INTO tbl_career_interest (id,acc_id,score) 
        VALUES(null,'${req.body.id}','${Math.round(percentage_set_A/4)}')`);
    }
    
    if(length_a.length > 0){
        update = (await conn()).query(`UPDATE tbl_career_attitude SET score = '${Math.round(percentage_set_B/5)}' 
        WHERE acc_id = '${req.body.id}'`)
    }else{
        save_attitude = (await conn()).query(`INSERT INTO tbl_career_attitude (id,acc_id,score) 
        VALUES(null,'${req.body.id}','${Math.round(percentage_set_B/5)}')`)
    }

    if(length_s.length > 0){
        update = (await conn()).query(`UPDATE tbl_career_skills SET score = '${Math.round(percentage_set_C/6)}' 
        WHERE acc_id = '${req.body.id}'`)
    }else{
        save_skills = (await conn()).query(`INSERT INTO tbl_career_skills (id,acc_id,score) 
        VALUES(null,'${req.body.id}','${Math.round(percentage_set_C/6)}')`)
    }
    

    return res.json({A:percentage_set_A/4,B:percentage_set_B/5,C:percentage_set_C/6})
})

app.post("/api/survey/post",async(req,res)=>{
    const data = req.body.data
    
    for (let index = 0; index < data.length; index++) {
        if(data[index].rate == '1'){
            const survey = 'survey_rate_1';
            await updateTallyPost(data[index].id,survey)
        }
        if(data[index].rate == '2'){
            const survey = 'survey_rate_2';
            await updateTallyPost(data[index].id,survey)
        }
        if(data[index].rate == '3'){
            const survey = 'survey_rate_3';
            await updateTallyPost(data[index].id,survey)
        }
        if(data[index].rate == '4'){
            const survey = 'survey_rate_4';
            await updateTallyPost(data[index].id,survey)
        }
    }
    return res.json({code:200,message:"Accepted!"})
})

app.post("/api/percentage",async (req,res)=>{
    level_one_percentage = (await conn()).query(`SELECT * FROM tbl_lvl_one WHERE acc_id = ${req.body.id}`)
    level_two_percentage = (await conn()).query(`SELECT * FROM tbl_lvl_two WHERE acc_id = ${req.body.id}`)

    skills = (await conn()).query(`SELECT * FROM tbl_career_skills WHERE acc_id = ${req.body.id}`)
    interest = (await conn()).query(`SELECT * FROM tbl_career_interest WHERE acc_id = ${req.body.id}`)
    attitude = (await conn()).query(`SELECT * FROM tbl_career_attitude WHERE acc_id = ${req.body.id}`)

    await level_one_percentage
    await level_two_percentage
    await skills
    await interest
    await attitude

    return res.json({LevelOne:level_one_percentage,LevelTwo:level_two_percentage,skills:skills,interest:interest,attitude:attitude})
})

app.post("/api/level/three/save",async(req,res)=>{
    find = (await conn()).query(`SELECT * FROM tbl_lvl_two WHERE acc_id = ${req.body.id}`)
    length = await find
    if(length.length > 0){
        update = (await conn()).query(`UPDATE tbl_lvl_three SET mode = '${req.body.fields}', score = '${req.body.score}' 
            WHERE acc_id = '${req.body.id}'`)
    }else{
    save = (await conn()).query(`INSERT INTO tbl_lvl_three (id,acc_id,mode,score) 
        VALUES(null,'${req.body.id}','${req.body.fields}','${req.body.score}')`);
    }

    return res.json({code:200,message:"Accepted!"})
})

app.post("/api/leaderboard",async(req,res)=>{
    overall = (await conn()).query("SELECT * FROM `tbl_lvl_three` INNER JOIN `tbl_account` ON `tbl_account`.`id` = `tbl_lvl_three`.`acc_id` ORDER BY `tbl_lvl_three`.`score` DESC")
    clinical = (await conn()).query("SELECT * FROM `tbl_lvl_three` INNER JOIN `tbl_account` ON `tbl_account`.`id` = `tbl_lvl_three`.`acc_id`  WHERE mode='clinical' ORDER BY `tbl_lvl_three`.`score`  DESC")
    educational = (await conn()).query("SELECT * FROM `tbl_lvl_three` INNER JOIN `tbl_account` ON `tbl_account`.`id` = `tbl_lvl_three`.`acc_id`  WHERE mode='educational' ORDER BY `tbl_lvl_three`.`score`  DESC")
    industrial = (await conn()).query("SELECT * FROM `tbl_lvl_three` INNER JOIN `tbl_account` ON `tbl_account`.`id` = `tbl_lvl_three`.`acc_id`  WHERE mode='industrial' ORDER BY `tbl_lvl_three`.`score`  DESC")
    await overall
    await clinical
    await educational
    await industrial
    return res.json({overall:overall,clinical:clinical,educational:educational,industrial:industrial})
})

app.get("/",(req,res)=>{
    return res.send("Server Working!")
})

app.listen(2030,()=>{
    console.log("Listening on Port "+2030);
})