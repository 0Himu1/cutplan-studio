/** Map an undistorted image onto a stock sheet, then take a centered panel crop. */
export function finishMapping(width:number,height:number,imageWidth:number,imageHeight:number,stockWidth=1219.2,stockHeight=2438.4,rotated=false):[number,number,number,number,number,number,number,number,number]{
 const aspect=rotated?imageHeight/imageWidth:imageWidth/imageHeight;
 const sheetWidth=Math.max(stockWidth,stockHeight*aspect),sheetHeight=sheetWidth/aspect;
 const x=width/sheetWidth,y=height/sheetHeight;
 return rotated?[0,y,(1-y)/2,-x,0,(1+x)/2,0,0,1]:[x,0,(1-x)/2,0,y,(1-y)/2,0,0,1];
}
