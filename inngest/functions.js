import { inngest } from "./client";
// import prisma from "@/lib/prisma";
import prisma from "@/lib/prisma";




export const syncUserCreation = inngest.createFunction(
  {id: 'sync-user-create'},
  {event: 'clerk/user.created'},
  async({event})=>{
     const {data} = event
     await prisma.user.create({
      data : {
        id : data.id,
        email: data.email_addresses[0].email_address,
        name: `${data.first_name} ${data.last_name}`,
        image: data.image_url 
      }

     })
  }
)


// Inggest Funtion to update user data in database 


export const syncUserUpdation = inngest.createFunction(
 {id: 'sync-user-update'}, 
 {event: 'clerk/user.updated'},
  async ({ event })=>{
           const {data} = event
           await prisma.user.update(
            {
              where:{id: data.id},
                data : {
                id : data.id,
                email: data.email_addresses[0].email_address,
                name: `${data.first_name} ${data.last_name}`,
                image: data.image_url 
              }

            }
           )

  }

)


// Inggest Funtion to delete user

export const syncUserDeletion = inngest.createFunction(
  {id: 'sync-user-delete'},
  {event: 'clerk/user.deleted'},
   async ({event})=>{

       const {data} = event
           await prisma.user.delete(
            {
              where:{id: data.id},
             })
           
    }
)



// Inngest Function to delelte coupon on expiry

 
export const deleteCouponOnExpiry = inngest.createFunction(
 {id: 'delete-coupon-expiry'},
 {event: 'app/coupon.expired'}, 
 async ({event, step})=>{

  const { data } = event;

   
   if (!data?.expires_at) {
      console.error("expires_at missing:", data);
      return;
    }

    const expiryDate = new Date(data.expires_at);

    if (isNaN(expiryDate.getTime())) {
      console.error("Invalid expires_at:", data.expires_at);
      return;
    }

    // If already expired, delete immediately
    if (expiryDate <= new Date()) {
      await step.run('delete-coupon-immediate', async () => {
        await prisma.coupon.delete({
          where: { code: data.code }
        });
      });
      return;
    }

  await step.sleepUntil('wait-for-expiry', expiryDate)

  await step.run('delete-coupon-from-database' ,async ()=>{
    await prisma.coupon.delete({where : { code : data.code} })
  }  )



  
 }
)