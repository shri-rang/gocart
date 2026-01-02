import { clerkClient } from "@clerk/nextjs/server";



const authAdmin = async (userId) =>{
    try {
         
        if (!userId) return false;

        const client = 
        await clerkClient();
        //    await clerkClient.users;
        const user = await client.users.getUser(userId);  
          //console.log("email address", process.env.ADMIN_EMAIL.split(',').map( email => email.trim() ) )
          
        // process.env.ADMIN_EMAIL.split(',').includes(user.emailAddresses[0].emailAddress)
      return  process.env.ADMIN_EMAIL.split(',').includes(user.emailAddresses[0].emailAddress);

    } catch (error) {
        console.error(error)
        return false
    }

}


export default authAdmin;