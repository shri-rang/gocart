


// Add new rating

import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request){
     
    try {
      
         const {userId} = getAuth(request)

         const  {orderId, productId, rating, review } = await request.json()

         const order = await prisma.order.findUnique(
            {  where: { id: orderId, userId }  }
         )


       

          if (!order) {
             return NextResponse.json({ message: "Order not found" }, { status: 404 });
          }


           
          const isAlreadyRated = await prisma.rating.findFirst({
            where : { orderId, productId }
          })

          if(isAlreadyRated){
            return NextResponse.json({ message : "Product already rated for this order" }, { status: 400 });
          }


          const res = await prisma.rating.create({
             data : {
                userId,
                productId,    
                rating,
                review,
                orderId,
             }
          })


            return NextResponse.json({ message : "Rating added successfully", rating : res })



        
    } catch (error) {
        
        console.error(error)
        return NextResponse.json({ message : error.code || error.message }, {status:400})
    }
  
}



export async function GET(request){

  try {
    const {userId} = getAuth(request)



     if (!userId) {
         return NextResponse.json({ message: "not authorized" }, { status: 401 });
     }

    const ratings = await prisma.rating.findMany({
        where : { userId },

    })

    return NextResponse.json({ ratings })

  } catch (error) {
            console.error(error)
        return NextResponse.json({ message : error.code || error.message }, {status:400})
    
  }

}