import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Get store info and store product





export async function GET(request){
 
    try {

        // Get store username from query parameter
       
         const { searchparams } = new URL( request.url)
         const username = searchparams.get('username').toLowerCase();

            if(!username){
             return NextResponse.json({ error : "missing username" },  { status:400})
             }

          
         // Get store info and inStock with ratings 
         
         const store = await prisma.store.findUnique(
            { where: {username, isActive: true }, 
             include :{ product: { include: { rating : true} } } 
        })

        if(!store){

         return NextResponse.json({ error : "store not found" },  { status:400})
       
        }

         return NextResponse.json({store})

          

        
    } catch (error) {

        console.error(error)
        return NextResponse.json({ error : error.code || error.message }, {status:400})
 
        
    }
 

}