
import express,{Request,Response} from "express";
import jwt, { sign } from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import cors from 'cors'
import dotenv from 'dotenv'
import authenticateToken from "./middleware";


dotenv.config()

const app= express()
app.use(cors())
app.use(express.json())
const prisma = new PrismaClient()


const port = 3000
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;






app.post("/api/v1/signup",async(req:Request,res:Response):Promise<any>=>{
    const {email,username,password} =  req.body;

    try{
         if(!email||!password){
                return res.status(400).json({
                    message:"Username or password is not defined"
                })
            }


            if (!PASSWORD_REGEX.test(password)) {
                return res.status(400).json({
                message: "Password must be 8-20 characters and include lowercase, uppercase, number, and special character.",
                });
            }


            const user = await prisma.user.create({
                data:{
                    email:email,
                    username:username,
                    password:password
                }
            }) 
            
        

            const token = jwt.sign(
                {
                id:user.id,
                },
                process.env.JWT_SECRET||""
            );

            return res.status(201).json({
                message:"User created Successfully",
                token
            })

    }catch(e){

        console.log(e);
        return res.status(500).json({
            message:"Error while creating user"
        })

    }

})

app.post("/api/v1/signin",async(req,res):Promise<any>=>{

    const {email,password}= req.body;

    try{
        if(!email||!password){
            return res.status(400).json({
                message:"Username or password is not defined"
            })
        }

        const user =  await prisma.user.findFirst({
            where:{
                email,
                password
            }
        })
        if(!user){
            return res.status(404).json({
                message:"Email or Password is incorrect"
            })
        }


        const token= jwt.sign({id:user.id},
            process.env.JWT_SECRET||""
        )

        return res.status(200).json({
            message:"User is Logged in successfuly",
            token
        })
    }catch(e){
        console.log(e);
        res.status(500).json({
            message:"Error while signin"
        })
    }

})

app.post("/api/v1/content",authenticateToken,async(req,res):Promise<any>=>{

    const{link,tags,title,type}=req.body
    const {userId}= req.body

    try{

        const content= await prisma.content.create({
            data:{
                link,
                title,
                type,
                userId,
                tags:{
                    connect:tags.map((tagId:number)=>({id:tagId})),
                }

            }
        })

        return res.status(200).json({
            message:"Content is created successfully",
            content
        })

    }catch(e){
        console.log(e)
        res.status(500).json("Error while creating the content")
    }


})

app.get("/api/v1/content",authenticateToken,async(req,res):Promise<any>=>{

    try{

        const content = await prisma.content.findMany({
            
        })

    }catch(e){
        console.log(e)
        return res.status(500).json({
            message:"Error while fetching contents"
        })
    }

})

app.delete("/api/v1/content",(req,res)=>{

})

app.post("/api/v1/brain/share",(req,res)=>{

})

app.get("/api/v1/brain/:shareLink",(req,res)=>{

})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })







