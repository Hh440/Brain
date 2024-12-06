
import express,{Request,Response} from "express";
import jwt, { sign } from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import cors from 'cors'
import dotenv from 'dotenv'
import authenticateToken from "./middleware";
import crypto from 'crypto'


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
                    message:"email or password is not defined"
                })
            }


            // if (!PASSWORD_REGEX.test(password)) {
            //     return res.status(400).json({
            //     message: "Password must be 8-20 characters and include lowercase, uppercase, number, and special character.",
            //     });
            // }


            const user = await prisma.user.create({
                data:{
                    email:email,
                    username:username,
                    password:password
                }
            }) 

        const token= jwt.sign({id:user.id},
            process.env.JWT_SECRET||""
        )

           
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
                message:"Incorrect Credentials"
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
        
        const tagIds= await Promise.all(
            tags.map(async (tagName:string)=>{
                const existingtags = await prisma.tags.findUnique({
                    where:{
                        title:tagName
                    }
                })

                if(existingtags){
                    return existingtags.id;
                }

                const newTag = await prisma.tags.create({ data: { title: tagName } });
               return newTag.id;
            }
        )
        )

        const content= await prisma.content.create({
            data:{
                link,
                title,
                type,
                userId,
                tags:{
                    connect:tagIds.map((id:number)=>({id})),
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

    const {userId}=req.body

    try{

        const content = await prisma.content.findMany({
            where:{
                userId
            },
            select:{
                id:true,
                title:true,
                link:true,
                type:true,
                tags:{
                    select:{
                        id:true,
                        title:true
                    }
                }

            }
            
        })

        return res.json({
          // message:"Content Loaded Successfully",
            content
        })

    }catch(e){
        console.log(e)
        return res.status(500).json({
            message:"Error while fetching contents"
        })
    }

})

app.delete("/api/v1/content",authenticateToken,async(req,res):Promise<any>=>{

    const {id}= req.query

    try{

        const contentId= parseInt(id as string,10)

        const content= await prisma.content.delete({
            where:{
                id:contentId
            }
        })


        return res.status(200).json({
            message:"Deletion successfully"
        })


    }catch(e){
        console.log(e)

        return res.status(500).json({
            message:"Error while deleting"
        })
    }

})

app.get("/api/v1/tags",async(req,res):Promise<any>=>{
    
    try {
        const tags = await prisma.tags.findMany({
            select: {
                title: true,
            },
        });

        if (!tags || tags.length === 0) {
            return res.status(404).json({
                message: "No tags found",
                tags: [],
            });
        }

        return res.status(200).json({
            message: "All tags fetched successfully",
            tags, 
        });
    } catch (error) {
        console.error("Error fetching tags:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }

})

app.post("/api/v1/brain/share",authenticateToken,async(req,res):Promise<any>=>{

  //  const {contentId,userId}=req.body
    const {share,userId}= req.body

    try{

        if(share){
        // const content= await prisma.content.findFirst({
        //     where:{
                
        //         userId
        //     }
        // })

        // if(!content){
        //     return res.status(401).json({
        //         message:"Content is not present with the associated user"
        //     })
        // }


        const existingLink = await prisma.link.findFirst({
            where:{

                userId:userId

            }
            
        })

        if(existingLink){
            return res.status(200).json({
                message:"You have already shared your content",
                hash:existingLink.hash


            })
        }

        const shareLink=crypto.randomBytes(16).toString('hex')

        const share=  await prisma.link.create({
            data:{
                hash:shareLink,
                userId
            }
        })


        return res.status(200).json({
            message:"Successfuly generated share link",
            hash:share.hash
        })

       
    }else{
        const share=  await prisma.link.delete({
            where:{
                userId
            }
        })
        return res.status(200).json({
            message:"Removed Link successfully"
        })

    }

    


    }catch(e){
        console.log(e)

        return res.status(401).json({
            message:"Error while creating the share Link"
        })
    }

})

app.get("/api/v1/brain/:shareLink",async(req,res):Promise<any>=>{
   const shareLink=req.params.shareLink

   try{

    const link=  await prisma.link.findUnique({
        where:{
            hash:shareLink
        },
    })

    if(!link){
        return res.status(401).json({
            message:"Share Link is not valid"
        })
    }

    const content= await prisma.content.findMany({
        where:{
            userId:link.userId
        }
    })

    if(!content){
        return res.status(401).json({
            message:"No Conetn is assocaited"
        })
    }

    const user= await prisma.user.findFirst({
        where:{
            id:link.userId
        }
    })

    if(!user){
        return res.status(401).json({
            message:"user not found"
        })
    }

    return res.status(200).json({
        username:user.username,
        content:content
    })

   }catch(e){
    console.log(e)
    return res.status(401).json({
        message:"Error while accessing the share link"
    })
   }

})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })







