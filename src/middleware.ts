import jwt  from "jsonwebtoken"

const authenticateToken=(req:any,res:any,next:any)=>{
    const authHeader= req.headers("authorization")
    const token = authHeader && authHeader.split(' ')[1]

    if(!token){
        return res.status(401).send("Authorization failed. No access token found")
    }

    jwt.verify(token,process.env.JWT_SECRET||"",(err:any,user:any)=>{
        if(err){
            return res.status(403).send("Could not verify token")
        }
        req.body.userId=user.id
    })

    next()

    

}


export default authenticateToken;  