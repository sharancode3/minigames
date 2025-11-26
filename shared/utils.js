/** Misc shared utilities */

/** Rectangle collision detection.
 * @param {{x:number,y:number,w:number,h:number}} a
 * @param {{x:number,y:number,w:number,h:number}} b
 * @returns {boolean} true if rectangles overlap
 */
export function rectsCollide(a,b){
  return !(a.x + a.w <= b.x || a.x >= b.x + b.w || a.y + a.h <= b.y || a.y >= b.y + b.h);
}

/** Clamp value into range */
export const clamp = (v,min,max)=> v<min?min: v>max?max: v;

/** Random integer inclusive */
export const randInt = (min,max)=> Math.floor(Math.random()*(max-min+1))+min;

/** Shuffle array in-place */
export function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }

/** Analytics stub - integrate real pipeline later. */
export function sendAnalytics(eventName,payload={}){
  // In production, send via fetch/WebSocket.
  // Here we log for debug visibility.
  console.log('[analytics]', eventName, payload);
}
