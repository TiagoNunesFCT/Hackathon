/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { initializeApp } from "firebase-admin/app";

import { getFirestore } from "firebase-admin/firestore";
import { auth, logger, runWith } from "firebase-functions/v1";

import { messaging } from "firebase-admin";

function haversine(pointA: [number, number], pointB: [number, number]): number {
   var radius = 6371; // km     

   //convert latitude and longitude to radians
   const deltaLatitude = (pointB[0] - pointA[0]) * Math.PI / 180;
   const deltaLongitude = (pointB[1] - pointA[1]) * Math.PI / 180;

   const halfChordLength = Math.cos(
       pointA[0] * Math.PI / 180) * Math.cos(pointB[0] * Math.PI / 180) 
       * Math.sin(deltaLongitude/2) * Math.sin(deltaLongitude/2)
       + Math.sin(deltaLatitude/2) * Math.sin(deltaLatitude/2);

   const angularDistance = 2 * Math.atan2(Math.sqrt(halfChordLength), Math.sqrt(1 - halfChordLength));

   return radius * angularDistance;
}



//import haversine = require('haversine');

//import {onRequest} from "firebase-functions/v2/https";
//import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

initializeApp()

export const testUser = runWith({maxInstances : 3})
   .https
   .onRequest((request, response) => {
      response.send(auth.user.name)
   })

const addUser = async (uid : string, type : string) => {
   await getFirestore().collection("users").add({
      uid: uid,
      type: type
   })
}


export const addSeller = runWith({maxInstances : 3})
.https
.onCall((data, context) => {
   const userId = data.mail 
   logger.debug(userId)
   addUser(userId, "seller")
})

export const addBuyer = runWith({maxInstances : 3})
.https
.onCall((data, context) => {
   const userId = data.mail 
   logger.debug(userId)
   addUser(userId, "buyer")
})

const inRange = (coords1 : [number, number], coords2 : [number, number]) : boolean =>
   haversine(coords1, coords2) <= 2000
   
interface ProductBuyerView {
   name : string,
   price : string,
   minDistance : number
}


export const getAllNear = runWith({maxInstances : 3})
   .https
   .onCall(async (data, context) => {
      const buyerCoords : [number, number] = data.coordinates 

      const sellers = await getFirestore().collection("users")
         .where("type", "==", "seller")
         .get()
         .then( (res) => res.docs.filter(
            ( s => inRange(buyerCoords, s.get("coordinates")))
         ));

      const availableProducts = new Map<string, ProductBuyerView>()

      sellers.forEach( (s) => {
         const distToSeller = haversine(s.get("coordinates"), buyerCoords)
         s.get("products").forEach( (p : any) => {
            const name  : string= p.name
            const exi = availableProducts.get(name)
            if( exi == undefined)
               availableProducts.set(name,
                   { name: name,
                     price : p.price,
                     minDistance: distToSeller })
            else if( distToSeller < exi.minDistance )
               exi.minDistance = distToSeller
         })
      })

      return {
         products : [...availableProducts.values()]
      }

   })

   interface ProductBuyerRequest {
      name: string,
      quantity: number
   }

   interface BuyerOrder {
      order : ProductBuyerRequest[],
      id : string,
      status : string,
      timestamp: string
   }

   export const broadcastRequest = runWith({maxInstances : 3})
      .https
      .onCall(async (data, context) => {
      // Receives BuyerCoords and array of buyers Requests   
      
         const buyerCoordinates : [number, number] = data.coordinates

         //Getting buyer id
         const userId = context.auth!.uid
         const currentTS = new Date().getTime().toString()
         //Creating an order id
         const orderId = userId +":"+ currentTS
         const buyerOrder : BuyerOrder = {order : data.requests, id : orderId, status : "pending", timestamp : currentTS}

         const buyer = (await getFirestore().collection("users").where("uid", "==", userId).limit(1).get()).docs[0]

         const reqs = buyer.get("orders")

         buyer.ref.update({
            "orders" : [buyerOrder, ...reqs] 
         })

         //Get Sellers in range
         const sellers = await getFirestore().collection("users")
            .where("type", "==", "seller")
            .get()
            .then( (res) => res.docs.filter(
               ( s => inRange(buyerCoordinates, s.get("coordinates")))
            ));

         //Sort Sellers by distance to buyer
         sellers.sort( (s1, s2) => {
            const s1_dist = haversine(s1.get("coordinates"), buyerCoordinates)
            const s2_dist = haversine(s2.get("coordinates"), buyerCoordinates)
            return s2_dist - s1_dist
         })
         //Return 10 closest sellers

         const closestSellers = sellers.slice(0, 9)

         const message = "If you accept this request, this will be your new recommended route"

         closestSellers.forEach( (s) => {
            const payload = {
               token: s.get("token"),
                notification: {
                    title: 'Additional request proposal',
                    body: message
                },
                data: {
                    body: JSON.stringify(newRoute(s, buyerCoordinates)),
                    orderId: orderId
                }
            }; 
            messaging().send(payload).then((response) => {
               console.log("Successfuly sent message:", response);
               
            })
         })
   })

   const newRoute = (seller: any, coordinates: [number, number]) => 
   {
      return []
   }



