import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";


export async function POST(request) {
    try {
        const {userId, has} = getAuth(request)
            console.log(" authorized ", userId)
        
         if(!userId){
            console.log("not authorized ")
            return NextResponse.json({ error: "not authorized " }, {status:401})
         }

         // Proceed with order creation logic here

         const { addressId, items, couponCode, paymentMethod } = await request.json();


             console.log(`addressId: ${addressId}, items: ${items}, couponCode: ${couponCode}, paymentMethod: ${paymentMethod}`);
         if(!addressId || !items  || !Array.isArray(items)  || !items.length === 0 || !paymentMethod){
             
             return NextResponse.json({ error: "missing order details" },   {status:401})
         }

        let coupon = null;

          if(couponCode){
                   coupon =  await prisma.coupon.findUnique({
            where : { code: couponCode.toUpperCase(), 
        }});

         if(!coupon){
            return NextResponse.json({ error: " Coupon not found " }, {status:404})
          }

             
          }

      

             // Check if coupon is applicable for new users

           if(couponCode &&  coupon.forNewUser ){

            const userOrders = await prisma.order.findMany({ where : { userId } })

              if(userOrders.length > 0){
                return NextResponse.json({ error:"Coupon valid for new users only " }, {status:400})
              } 
            }

           const isPlusPlan =  has({plan:'plus'})

         if ( isPlusPlan  && coupon.forMember) {
          
               if(!isPlusPlan){
                 console.log("User does not have plus plan");
                return NextResponse.json({ message: "Coupon valid for plus members only" } ,{status:400} )
                // NextResponse.json({ error:"Coupon valid for plus members only " }, {status:400})
               }



  
         }


         // Group orders by storeId using a Map 
         
         const ordersByStore = new Map()

         for( const item of items){

             const product = await prisma.product.findUnique({
                where : { id : item.id },
             })

             const storeId = product.storeId;

             if(!ordersByStore.has(storeId)){
                ordersByStore.set(storeId, [])

             }
          
   
             ordersByStore.get(storeId).push({...item, price: product.price  })
                           
         }
         let orderIds= []
         let fullAmount = 0;
         
         let isShippingFeeAdded = false;


         // Create orders for each seller

            
          for(const [storeId, sellerItems ] of ordersByStore.entries() ){
             
            let total = sellerItems.reduce( (acc ,item) => acc + (item.price + item.quantity),0)
               
             if(couponCode){
                
                total -= (total * coupon.discount ) /100;
             }

             if(!isPlusPlan && !isShippingFeeAdded){
               total += 5;
               isShippingFeeAdded = true;
             }

             fullAmount += parseFloat(total.toFixed(2))
           
                const order = await prisma.order.create({
                    data: {
                        userId,
                        storeId,
                        addressId,
                        total: parseFloat(total.toFixed(2)),
                        paymentMethod,
                        isCouponUsed : coupon ? true : false,
                        coupon : coupon ? coupon : {},
                        orderItems: {
                            create : sellerItems.map( item => ({ 
                                productId: item.id,
                                quantity: item.quantity,
                                price: item.price,
                                
                            }) ) 
                        } 

                       
                    }

                })

                orderIds.push(order.id)


          }
          if (paymentMethod === "STRIPE") {

            const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
            const origin = await request.headers.get('origin')
          
             const session = await stripe.checkout.sessions.create(
                {
                 payment_method_types: ['card'],
                 line_items: [{
                    price_data : {
                        currency: 'usd',
                        product_data: {
                         name: "Order"
                        },
                        unit_amount: Math.round(fullAmount*100),
                                            

                    },
                      quantity: 1  
                 }],
                 expires_at: Math.floor(Date.now() /1000 )+ 30 * 60, // current time plus 30 min
                 mode:'payment',
                 success_url: `${origin}/loading?nextUrl=orders`,
                 cancel_url: `${origin}/cart`,
                 metadata: {
                    orderIds : orderIds.join(','),
                    userId,
                    appId:'gocart'
                 }
                }
             )

             return NextResponse.json({session})

            
          }

        

          // clear the cart

     
            await prisma.user.update({
            where : { id : userId },
            data : { cart : {} }
         })
            return NextResponse.json({ message: "Order(s) created successfully " })

    } catch (error) {
         console.error(error)
        return NextResponse.json({ error: error.message || error.code }, {status:400})
    }
}

export async function GET(request) {

    try {
        const {userId} = getAuth(request)

        const orders = await prisma.order.findMany({
            where: { userId, OR: [
                {paymentMethod: PaymentMethod.COD},
                {AND: [ { paymentMethod: PaymentMethod.COD },{ isPaid: true } ]}
            ]},
            include : {
                orderItems : { include : {product:true}},
                address: true
            },
            orderBy : { createdAt : 'desc' }

        })


        return NextResponse.json({ orders })
       
        

    } catch (error) {
               console.error(error)
              return NextResponse.json({ message: error.message || error.code }, {status:400})
    }

}