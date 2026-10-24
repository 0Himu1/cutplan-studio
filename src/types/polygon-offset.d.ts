declare module 'polygon-offset' {
 export default class Offset {
  data(points:number[][]):this;
  margin(distance:number):number[][][];
  padding(distance:number):number[][][];
 }
}
