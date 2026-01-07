import prisma from "@/lib/prisma";


const authSeller = async(userId)=> {
 
     try {
         console.log("user id",userId)
         const user = await prisma.user.findUnique({
             where: { id: userId },
             include: {store: true }
        } )
         
         console.log("store status ", user.store );
        if (user.store) {
             if (user.store.status === 'approved' ) {
                console.log("store id ", user.store.id );
                 return user.store.id;
             }
        }else{
            return false
        }

     } catch (error) { 
        console.error("errr i nconsole loggg",error)
        return false
        
     }


}


export default authSeller;