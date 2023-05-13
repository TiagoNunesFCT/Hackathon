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
            ( s => inRange(buyerCoords, s.get("coords")))
         ));

      const availableProducts = new Map<string, ProductBuyerView>()

      sellers.forEach( (s) => {
         const distToSeller = haversine(s.get("coords"), buyerCoords)
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


